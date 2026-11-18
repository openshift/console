package olm

import (
	"context"
	"slices"
	"testing"
	"time"

	"github.com/operator-framework/library-olm/migration/pkg/migration"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	authv1 "k8s.io/api/authentication/v1"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/interceptor"
)

// TestMigrationCredentialsAreBoundedAndCannotBeRenewed verifies native expiry, object binding, and the absence of backend token-minting permissions.
func TestMigrationCredentialsAreBoundedAndCannotBeRenewed(t *testing.T) {
	ctx := context.Background()
	account := &corev1.ServiceAccount{ObjectMeta: metav1.ObjectMeta{Name: migrationJobStateName, Namespace: "job"}}
	state := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: migrationJobStateName, Namespace: "job", UID: "state-uid"}}
	issued := time.Now().Add(migrationCredentialsLifetime).UTC()
	requests := 0
	kubeClient := interceptor.NewClient(newMigrationTestClient(t).(client.WithWatch), interceptor.Funcs{
		SubResourceCreate: func(ctx context.Context, cl client.Client, subresource string, object client.Object, body client.Object, options ...client.SubResourceCreateOption) error {
			requests++
			assert.Equal(t, "token", subresource)
			assert.Equal(t, account, object)
			request := body.(*authv1.TokenRequest)
			assert.Equal(t, int64(migrationCredentialsLifetime/time.Second), *request.Spec.ExpirationSeconds)
			assert.Equal(t, &authv1.BoundObjectReference{APIVersion: "v1", Kind: "Secret", Name: state.Name, UID: state.UID}, request.Spec.BoundObjectRef)
			request.Status = authv1.TokenRequestStatus{Token: "bounded-token", ExpirationTimestamp: metav1.NewTime(issued)}
			return nil
		},
	})
	expires, err := createMigrationCredentials(ctx, kubeClient, account, state)
	require.NoError(t, err)
	assert.Equal(t, issued, expires)
	assert.Equal(t, 1, requests)
	var saved corev1.Secret
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKey{Name: migrationCredentialsSecretName, Namespace: "job"}, &saved))
	assert.Equal(t, "bounded-token", string(saved.Data["token"]))
	backend := rbacv1.Subject{Kind: rbacv1.ServiceAccountKind, Name: "custom-console", Namespace: "custom-namespace"}
	for _, object := range migrationBackendPermissions("job", backend) {
		switch object := object.(type) {
		case *rbacv1.Role:
			for _, rule := range object.Rules {
				assert.NotContains(t, rule.Resources, "serviceaccounts/token")
				if slices.Contains(rule.Resources, "secrets") {
					assert.NotContains(t, rule.Verbs, "create")
				}
			}
		case *rbacv1.RoleBinding:
			assert.Equal(t, []rbacv1.Subject{backend}, object.Subjects)
		case *rbacv1.ClusterRoleBinding:
			assert.Equal(t, []rbacv1.Subject{backend}, object.Subjects)
		}
	}
}

// TestMigrationCredentialsFailClosed covers missing legacy credentials, expired tokens, and malformed saved authorization.
func TestMigrationCredentialsFailClosed(t *testing.T) {
	for _, tt := range []struct {
		name, token, expires string
		missing              bool
	}{
		{name: "legacy job without credentials", missing: true},
		{name: "expired credential", token: "old", expires: time.Now().Add(-time.Hour).Format(time.RFC3339Nano)},
		{name: "missing token", expires: time.Now().Add(time.Hour).Format(time.RFC3339Nano)},
		{name: "invalid expiration", token: "old", expires: "invalid"},
	} {
		t.Run(tt.name, func(t *testing.T) {
			kubeClient := newMigrationTestClient(t)
			if !tt.missing {
				require.NoError(t, kubeClient.Create(context.Background(), &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: migrationCredentialsSecretName, Namespace: "job"}, Data: map[string][]byte{"token": []byte(tt.token), "expires": []byte(tt.expires)}}))
			}
			c := &migrationCoordinator{client: kubeClient, config: &rest.Config{Host: "https://unused.invalid"}}
			_, err := c.executionConfig("job")
			require.ErrorIs(t, err, errMigrationCredentialsExpired)
		})
	}
}

// TestExpiredMigrationRetainsRecoveryAndRevokesAccount verifies abandoned jobs finish without mutating operator resources or renewing credentials.
func TestExpiredMigrationRetainsRecoveryAndRevokesAccount(t *testing.T) {
	for _, phase := range []string{"", "checkpoint", "prepare", "cos", "recovery", "done"} {
		t.Run("phase "+phase, func(t *testing.T) {
			ctx := context.Background()
			kubeClient := newMigrationTestClient(t)
			job, err := newMigrationJobStore().create("alice", operatorMigrationBulkRequest{Operators: []operatorMigrationOptionsRequest{{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo"}}})
			require.NoError(t, err)
			job.Items[0].Status = "Migrating"
			namespace := seedDurableMigrationJob(t, kubeClient, "alice", job)
			account := &corev1.ServiceAccount{ObjectMeta: metav1.ObjectMeta{Name: migrationJobStateName, Namespace: namespace}}
			require.NoError(t, kubeClient.Create(ctx, account))
			c := &migrationCoordinator{client: kubeClient, identity: "replacement", ctx: ctx}
			if phase != "" {
				_, err := c.claim(ctx, namespace)
				require.NoError(t, err)
				require.NoError(t, c.saveJournal(ctx, namespace, &migrationJournal{JobID: job.ID, Phase: phase, Options: migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators"}}))
			}
			// Seeded jobs have no authorization expiry, as with the former renewable-token implementation.
			require.NoError(t, c.resume(job.ID, "alice"))
			record, _, err := loadDurableMigrationJob(ctx, kubeClient, namespace)
			require.NoError(t, err)
			if phase == "done" {
				assert.Equal(t, "Succeeded", record.Snapshot.Status)
			} else {
				assert.Equal(t, "Failed", record.Snapshot.Status)
			}
			assert.NotNil(t, record.Snapshot.FinishedAt)
			item := record.Snapshot.Items[0]
			assert.Equal(t, phase != "" && phase != "done", item.RecoveryRequired)
			assert.False(t, item.RollbackAttempted)
			if phase == "done" {
				assert.Equal(t, "Succeeded", item.Status)
			} else {
				assert.Equal(t, "Failed", item.Status)
			}
			assert.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKeyFromObject(account), &corev1.ServiceAccount{})))
			if phase != "" {
				journal, err := c.loadJournal(ctx, namespace, "operators", "demo")
				require.NoError(t, err)
				assert.Equal(t, phase, journal.Phase)
			}
		})
	}
}

// TestMigrationRejectsUnboundedCredentials ensures the API cannot silently extend the requested authorization window.
func TestMigrationRejectsUnboundedCredentials(t *testing.T) {
	for _, tt := range []struct {
		name, token string
		expires     time.Time
	}{
		{name: "non-expiring response", token: "token"},
		{name: "already expired", token: "token", expires: time.Now().Add(-time.Minute)},
		{name: "extended expiry", token: "token", expires: time.Now().Add(24 * time.Hour)},
		{name: "missing token", expires: time.Now().Add(time.Hour)},
	} {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			kubeClient := interceptor.NewClient(newMigrationTestClient(t).(client.WithWatch), interceptor.Funcs{
				SubResourceCreate: func(ctx context.Context, cl client.Client, subresource string, object client.Object, body client.Object, options ...client.SubResourceCreateOption) error {
					body.(*authv1.TokenRequest).Status = authv1.TokenRequestStatus{Token: tt.token, ExpirationTimestamp: metav1.NewTime(tt.expires)}
					return nil
				},
			})
			_, err := createMigrationCredentials(ctx, kubeClient, &corev1.ServiceAccount{ObjectMeta: metav1.ObjectMeta{Name: "migration", Namespace: "job"}}, &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: "migration", Namespace: "job", UID: "state-uid"}})
			require.ErrorContains(t, err, "invalid bounded migration credentials")
			assert.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKey{Name: migrationCredentialsSecretName, Namespace: "job"}, &corev1.Secret{})))
		})
	}
}
