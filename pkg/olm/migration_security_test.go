package olm

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	operatorsv1 "github.com/operator-framework/api/pkg/operators/v1"
	operatorsv1alpha1 "github.com/operator-framework/api/pkg/operators/v1alpha1"
	"github.com/operator-framework/library-olm/migration/pkg/migration"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/interceptor"
)

// TestMigrationRequestRejectsTrailingJSON enforces a single bounded JSON document rather than ignoring appended data.
func TestMigrationRequestRejectsTrailingJSON(t *testing.T) {
	for _, tt := range []struct {
		name, suffix string
		valid        bool
	}{
		{name: "one document", valid: true},
		{name: "whitespace", suffix: " \n\t", valid: true},
		{name: "second object", suffix: `{}`},
		{name: "second value", suffix: ` true`},
		{name: "trailing junk", suffix: ` invalid`},
		{name: "truncated document", suffix: ` {`},
	} {
		t.Run(tt.name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"allEligible":true}`+tt.suffix))
			var body operatorMigrationBulkRequest
			err := decodeOperatorMigrationRequest(httptest.NewRecorder(), request, &body)
			if tt.valid {
				require.NoError(t, err)
				assert.True(t, body.AllEligible)
			} else {
				require.ErrorContains(t, err, "exactly one JSON document")
			}
		})
	}
}

// TestMigrationCancellationRechecksConcurrentChanges prevents a retry from cancelling a replaced, finished, or reassigned job.
func TestMigrationCancellationRechecksConcurrentChanges(t *testing.T) {
	for _, change := range []string{"namespace owner", "record owner", "record ID", "finished", "rollback"} {
		t.Run(change, func(t *testing.T) {
			ctx := context.Background()
			base := newMigrationTestClient(t)
			job, err := newMigrationJobStore().create("alice", operatorMigrationBulkRequest{})
			require.NoError(t, err)
			namespace := seedDurableMigrationJob(t, base, "alice", job)
			attempts := 0
			checked := interceptor.NewClient(base.(client.WithWatch), interceptor.Funcs{Update: func(ctx context.Context, c client.WithWatch, object client.Object, opts ...client.UpdateOption) error {
				attempts++
				if attempts != 1 {
					return c.Update(ctx, object, opts...)
				}
				record, state, err := loadDurableMigrationJob(ctx, c, namespace)
				require.NoError(t, err)
				switch change {
				case "namespace owner":
					var ns corev1.Namespace
					require.NoError(t, c.Get(ctx, client.ObjectKey{Name: namespace}, &ns))
					ns.Annotations[migrationJobOwnerAnnotation] = "bob"
					require.NoError(t, c.Update(ctx, &ns))
				case "record owner":
					record.Owner = "bob"
				case "record ID":
					record.Snapshot.ID = "different"
				case "finished":
					now := time.Now()
					record.Snapshot.FinishedAt = &now
				case "rollback":
					record.Request.Rollback = &operatorMigrationRollbackJob{}
				}
				state.Data[migrationJobRecordKey], err = encodeMigrationState(record)
				require.NoError(t, err)
				require.NoError(t, c.Update(ctx, state))
				return apierrors.NewConflict(corev1.Resource("secrets"), state.Name, errors.New("concurrent state change"))
			}})
			require.Error(t, requestDurableMigrationCancellation(ctx, checked, job.ID, "alice"))
			assert.Equal(t, 1, attempts)
			_, saved, err := loadDurableMigrationJob(ctx, base, namespace)
			require.NoError(t, err)
			assert.Empty(t, saved.Data[migrationJobCancelKey])
		})
	}
}

// TestDelegatedCollectionFailsBeforeSourceMutation detects required reads that the library's optional collectors ignore.
func TestDelegatedCollectionFailsBeforeSourceMutation(t *testing.T) {
	ctx := context.Background()
	csv := &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1", Namespace: "source", UID: "csv-uid"}, Spec: operatorsv1alpha1.ClusterServiceVersionSpec{InstallModes: []operatorsv1alpha1.InstallMode{{Type: operatorsv1alpha1.InstallModeTypeAllNamespaces, Supported: true}}}, Status: operatorsv1alpha1.ClusterServiceVersionStatus{Phase: operatorsv1alpha1.CSVPhaseSucceeded, Reason: operatorsv1alpha1.CSVReasonInstallSuccessful}}
	subscription := &operatorsv1alpha1.Subscription{ObjectMeta: metav1.ObjectMeta{Name: "demo", Namespace: "source", UID: "subscription-uid"}, Spec: &operatorsv1alpha1.SubscriptionSpec{Package: "demo", CatalogSource: "source", CatalogSourceNamespace: "catalog"}, Status: operatorsv1alpha1.SubscriptionStatus{InstalledCSV: csv.Name, State: operatorsv1alpha1.SubscriptionStateAtLatest}}
	secret := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: "controller-config", Namespace: "source", Labels: map[string]string{"olm.owner": csv.Name}}}
	base := newMigrationTestClient(t, csv, subscription, secret,
		&operatorsv1.OperatorGroup{ObjectMeta: metav1.ObjectMeta{Name: "all", Namespace: "source"}},
		&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "source"}},
		&operatorsv1alpha1.CatalogSource{ObjectMeta: metav1.ObjectMeta{Name: "source", Namespace: "catalog"}, Spec: operatorsv1alpha1.CatalogSourceSpec{SourceType: operatorsv1alpha1.SourceTypeGrpc, Image: "example.test/catalog:fixture"}},
		&apiextensionsv1.CustomResourceDefinition{ObjectMeta: metav1.ObjectMeta{Name: "clusterobjectsets.olm.operatorframework.io"}, Status: apiextensionsv1.CustomResourceDefinitionStatus{Conditions: []apiextensionsv1.CustomResourceDefinitionCondition{{Type: apiextensionsv1.Established, Status: apiextensionsv1.ConditionTrue}}}},
	)
	mapper := base.RESTMapper().(*meta.DefaultRESTMapper)
	mapper.Add(corev1.SchemeGroupVersion.WithKind("Secret"), meta.RESTScopeNamespace)
	mapper.Add(apiextensionsv1.SchemeGroupVersion.WithKind("CustomResourceDefinition"), meta.RESTScopeRoot)
	denied := apierrors.NewForbidden(corev1.Resource("secrets"), "", errors.New("delegated grant removed"))
	writes := 0
	scoped := interceptor.NewClient(base.(client.WithWatch), interceptor.Funcs{
		List: func(ctx context.Context, c client.WithWatch, list client.ObjectList, options ...client.ListOption) error {
			if objects, ok := list.(*unstructured.UnstructuredList); ok && objects.GroupVersionKind().Kind == "SecretList" {
				return denied
			}
			return c.List(ctx, list, options...)
		},
		Create: func(context.Context, client.WithWatch, client.Object, ...client.CreateOption) error {
			writes++
			return errors.New("unexpected mutation")
		},
		Update: func(context.Context, client.WithWatch, client.Object, ...client.UpdateOption) error {
			writes++
			return errors.New("unexpected mutation")
		},
		Delete: func(context.Context, client.WithWatch, client.Object, ...client.DeleteOption) error {
			writes++
			return errors.New("unexpected mutation")
		},
	})
	permissions := map[string][]schema.GroupResource{"source": {{Resource: "secrets"}}}
	collector := &migrationCollectionClient{Client: scoped, namespaces: []string{"source"}, expected: permissions}
	migrator := migration.NewMigrator(collector, nil)
	options := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "source", InstallNamespace: "target", SystemNamespace: "operator-controller", AcknowledgeNamespaceDelete: true}
	// Gather itself ignores this required Secret-list failure.
	_, err := migrator.Gather(ctx, options)
	require.NoError(t, err)
	require.ErrorIs(t, collector.collectionError(), denied)
	coordinator := &migrationCoordinator{client: base, identity: "backend"}
	_, err = coordinator.prepareJournal(ctx, migrator, "execution", options)
	require.ErrorIs(t, err, denied)
	assert.Zero(t, writes)
	assert.NoError(t, base.Get(ctx, client.ObjectKeyFromObject(subscription), &operatorsv1alpha1.Subscription{}))
	assert.NoError(t, base.Get(ctx, client.ObjectKeyFromObject(csv), &operatorsv1alpha1.ClusterServiceVersion{}))
	assert.NoError(t, base.Get(ctx, client.ObjectKeyFromObject(secret), &corev1.Secret{}))
}

// TestPersistenceFailureResumesWithoutRestart verifies the sticky live-store failure stops execution but does not freeze the coordinator.
func TestPersistenceFailureResumesWithoutRestart(t *testing.T) {
	ctx := context.Background()
	base := newMigrationTestClient(t)
	job, err := newMigrationJobStore().create("alice", operatorMigrationBulkRequest{Operators: []operatorMigrationOptionsRequest{{SubscriptionName: "demo", SubscriptionNamespace: "source"}}})
	require.NoError(t, err)
	namespace := seedDurableMigrationJob(t, base, "alice", job)
	record, state, err := loadDurableMigrationJob(ctx, base, namespace)
	require.NoError(t, err)
	expires := time.Now().Add(time.Hour)
	record.AuthorizationExpiresAt = &expires
	state.Data[migrationJobRecordKey], err = encodeMigrationState(record)
	require.NoError(t, err)
	require.NoError(t, base.Update(ctx, state))
	require.NoError(t, base.Create(ctx, &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: migrationCredentialsSecretName, Namespace: namespace}, Data: map[string][]byte{"token": []byte("delegated-token"), "expires": []byte(expires.UTC().Format(time.RFC3339Nano))}}))
	coordinator := &migrationCoordinator{client: base, identity: "backend", ctx: ctx, config: &rest.Config{Host: "http://unused.invalid"}}
	_, err = coordinator.claim(ctx, namespace)
	require.NoError(t, err)
	require.NoError(t, coordinator.saveJournal(ctx, namespace, &migrationJournal{JobID: job.ID, Phase: "done", Options: migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "source"}}))
	failure := errors.New("temporary state storage outage")
	interrupted := false
	coordinator.client = interceptor.NewClient(base.(client.WithWatch), interceptor.Funcs{Update: func(ctx context.Context, c client.WithWatch, object client.Object, options ...client.UpdateOption) error {
		if _, secret := object.(*corev1.Secret); secret && object.GetName() == migrationJobStateName && !interrupted {
			interrupted = true
			return failure
		}
		return c.Update(ctx, object, options...)
	}})
	require.ErrorIs(t, coordinator.resume(job.ID, "alice"), failure)
	require.True(t, interrupted)
	require.NoError(t, coordinator.resume(job.ID, "alice"))
	completed, _, err := loadDurableMigrationJob(ctx, base, namespace)
	require.NoError(t, err)
	assert.Equal(t, "Succeeded", completed.Snapshot.Status)
	require.NotNil(t, completed.Snapshot.FinishedAt)
}

// TestDelegatedCollectionSkipsDeletedBatchNamespaces permits later items after an earlier source namespace was removed.
func TestDelegatedCollectionSkipsDeletedBatchNamespaces(t *testing.T) {
	base := newMigrationTestClient(t)
	base.RESTMapper().(*meta.DefaultRESTMapper).Add(corev1.SchemeGroupVersion.WithKind("Secret"), meta.RESTScopeNamespace)
	denied := interceptor.NewClient(base.(client.WithWatch), interceptor.Funcs{List: func(context.Context, client.WithWatch, client.ObjectList, ...client.ListOption) error {
		return apierrors.NewForbidden(corev1.Resource("secrets"), "", errors.New("source RoleBinding no longer exists"))
	}})
	collector := &migrationCollectionClient{Client: denied, namespaces: []string{"deleted"}, expected: map[string][]schema.GroupResource{"deleted": {{Resource: "secrets"}}}}
	var resources unstructured.UnstructuredList
	resources.SetGroupVersionKind(corev1.SchemeGroupVersion.WithKind("SecretList"))
	require.NoError(t, collector.List(context.Background(), &resources))
	assert.Empty(t, resources.Items)
	assert.NoError(t, collector.collectionError())
}
