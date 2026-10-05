package olm

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"time"

	authv1 "k8s.io/api/authentication/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/util/retry"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

const migrationCredentialsSecretName = "credentials"
const migrationCredentialsLifetime = 3 * time.Hour

var errMigrationCredentialsExpired = errors.New("migration authorization expired; recovery checkpoints were retained")

// createMigrationCredentials uses the initiating user's authorization to issue one bounded token, never renewable by the backend.
func createMigrationCredentials(ctx context.Context, kubeClient client.Client, account *corev1.ServiceAccount, state *corev1.Secret) (time.Time, error) {
	if state.UID == "" {
		return time.Time{}, fmt.Errorf("migration state has no UID for credential binding")
	}
	seconds := int64(migrationCredentialsLifetime / time.Second)
	request := &authv1.TokenRequest{Spec: authv1.TokenRequestSpec{
		ExpirationSeconds: &seconds,
		BoundObjectRef:    &authv1.BoundObjectReference{APIVersion: "v1", Kind: "Secret", Name: state.Name, UID: state.UID},
	}}
	if err := kubeClient.SubResource("token").Create(ctx, account, request); err != nil {
		return time.Time{}, fmt.Errorf("authorize migration execution: %w", err)
	}
	expires := request.Status.ExpirationTimestamp.Time
	if request.Status.Token == "" || !expires.After(time.Now()) || expires.After(time.Now().Add(migrationCredentialsLifetime+time.Minute)) {
		return time.Time{}, fmt.Errorf("Kubernetes returned invalid bounded migration credentials")
	}
	secret := &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{Name: migrationCredentialsSecretName, Namespace: account.Namespace, OwnerReferences: state.OwnerReferences},
		Data:       map[string][]byte{"token": []byte(request.Status.Token), "expires": []byte(expires.UTC().Format(time.RFC3339Nano))},
	}
	if err := kubeClient.Create(ctx, secret); err != nil {
		return time.Time{}, fmt.Errorf("save bounded migration credentials: %w", err)
	}
	return expires, nil
}

// expireAuthorization revokes stale execution credentials and reports retained recovery work without touching operator resources.
func (c *migrationCoordinator) expireAuthorization(ctx context.Context, namespace string) error {
	if err := c.ownsLease(ctx, namespace); err != nil {
		return err
	}
	if err := client.IgnoreNotFound(c.client.Delete(ctx, &corev1.ServiceAccount{ObjectMeta: metav1.ObjectMeta{Name: migrationJobStateName, Namespace: namespace}})); err != nil {
		return err
	}
	return retry.RetryOnConflict(retry.DefaultBackoff, func() error {
		if err := c.ownsLease(ctx, namespace); err != nil {
			return err
		}
		record, state, err := loadDurableMigrationJob(ctx, c.client, namespace)
		if err != nil || record.Snapshot.FinishedAt != nil {
			return err
		}
		for i := range record.Snapshot.Items {
			item := &record.Snapshot.Items[i]
			if item.Status == "Succeeded" || item.Status == "Failed" || item.Status == "Skipped" {
				continue
			}
			item.Status, item.Error, item.ProgressEvent = "Failed", errMigrationCredentialsExpired.Error(), nil
			journal, err := c.loadJournal(ctx, namespace, item.SubscriptionNamespace, item.SubscriptionName)
			if err != nil && !apierrors.IsNotFound(err) {
				return err
			}
			if record.Request.Rollback != nil {
				item.RecoveryRequired = true
				continue
			}
			if journal == nil {
				continue
			}
			if journal.JobID != record.Snapshot.ID || journal.Options.SubscriptionNamespace != item.SubscriptionNamespace || journal.Options.SubscriptionName != item.SubscriptionName {
				return fmt.Errorf("migration journal ownership does not match its job")
			}
			if journal.Phase == "done" {
				item.Error = ""
				item.Status = "Succeeded"
				if err := journal.result(); err != nil {
					item.Status, item.Error = "Failed", err.Error()
				}
				item.RollbackAttempted, item.RolledBack = journal.RollbackAttempted, journal.RolledBack
			} else {
				// Even the checkpoint phase may have created its recovery Secret
				// before the next phase could be journaled. Preserve access to
				// confirmed recovery using fresh user authorization.
				item.RecoveryRequired = true
			}
		}
		now := time.Now().UTC()
		record.Snapshot.Status, record.Snapshot.Message = "Failed", errMigrationCredentialsExpired.Error()
		if !slices.ContainsFunc(record.Snapshot.Items, func(item operatorMigrationJobItem) bool { return item.Status == "Failed" }) {
			// A completed journal can precede the last snapshot write. Expired
			// authorization must not turn an already completed migration into a failure.
			record.Snapshot.Status, record.Snapshot.Message = "Succeeded", "Migration job completed"
		}
		record.Snapshot.FinishedAt, record.Snapshot.UpdatedAt, record.Snapshot.ProgressEvent = &now, now, nil
		state.Data[migrationJobRecordKey], err = encodeMigrationState(record)
		if err != nil {
			return err
		}
		return c.client.Update(ctx, state)
	})
}
