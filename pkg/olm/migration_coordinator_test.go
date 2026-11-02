package olm

import (
	"context"
	"testing"
	"time"

	"github.com/operator-framework/library-olm/migration/pkg/migration"
	"k8s.io/client-go/rest"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/interceptor"
)

// TestMigrationCoordinatorStopsWithBackendContext verifies shutdown cancels discovery and preserves durable state for the replacement backend.
func TestMigrationCoordinatorStopsWithBackendContext(t *testing.T) {
	kubeClient := newMigrationTestClient(t)
	job, err := newMigrationJobStore().create("alice", operatorMigrationBulkRequest{Operators: []operatorMigrationOptionsRequest{{SubscriptionNamespace: "operators", SubscriptionName: "demo"}}})
	require.NoError(t, err)
	namespace := seedDurableMigrationJob(t, kubeClient, "alice", job)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	started, stopped := make(chan struct{}), make(chan struct{})
	c := &migrationCoordinator{ctx: ctx, wakeup: make(chan struct{}, 1), client: interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{
		List: func(ctx context.Context, cl client.WithWatch, list client.ObjectList, options ...client.ListOption) error {
			close(started)
			<-ctx.Done()
			return ctx.Err()
		},
	})}
	go func() { defer close(stopped); c.run() }()
	select {
	case <-started:
	case <-time.After(time.Second):
		t.Fatal("coordinator did not start discovery")
	}
	cancel()
	select {
	case <-stopped:
	case <-time.After(time.Second):
		t.Fatal("coordinator did not stop on backend shutdown")
	}
	record, _, err := loadDurableMigrationJob(context.Background(), kubeClient, namespace)
	require.NoError(t, err)
	assert.Equal(t, "Queued", record.Snapshot.Status)
	assert.Nil(t, record.Snapshot.FinishedAt)
}

// TestMigrationJournalPlaceholderIsNotAnExecution treats pre-created opaque storage as unstarted until the journal has been written.
func TestMigrationJournalPlaceholderIsNotAnExecution(t *testing.T) {
	ctx := context.Background()
	name := migrationJournalName("operators", "demo")
	kubeClient := newMigrationTestClient(t, &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: "job"}, Type: corev1.SecretTypeOpaque})
	c := &migrationCoordinator{client: kubeClient}
	_, err := c.loadJournal(ctx, "job", "operators", "demo")
	assert.True(t, apierrors.IsNotFound(err))
}

// TestMigrationCheckpointCancellationPersistsWithLiveContext prevents cancellation from repeatedly suspending before any source mutation.
func TestMigrationCheckpointCancellationPersistsWithLiveContext(t *testing.T) {
	ctx := context.Background()
	kubeClient := newMigrationTestClient(t)
	job, err := newMigrationJobStore().create("alice", operatorMigrationBulkRequest{Operators: []operatorMigrationOptionsRequest{{SubscriptionNamespace: "operators", SubscriptionName: "demo"}}})
	require.NoError(t, err)
	namespace := seedDurableMigrationJob(t, kubeClient, "alice", job)
	record, state, err := loadDurableMigrationJob(ctx, kubeClient, namespace)
	require.NoError(t, err)
	expires := time.Now().Add(time.Hour)
	record.AuthorizationExpiresAt = &expires
	state.Data[migrationJobRecordKey], err = encodeMigrationState(record)
	require.NoError(t, err)
	state.Data[migrationJobCancelKey] = []byte("true")
	require.NoError(t, kubeClient.Update(ctx, state))
	require.NoError(t, kubeClient.Create(ctx, &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: migrationCredentialsSecretName, Namespace: namespace}, Data: map[string][]byte{"token": []byte("delegated-token"), "expires": []byte(expires.UTC().Format(time.RFC3339Nano))}}))
	// The fake client otherwise accepts expired contexts, unlike a real API call.
	checked := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{
		Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, opts ...client.GetOption) error {
			if err := ctx.Err(); err != nil {
				return err
			}
			return cl.Get(ctx, key, object, opts...)
		},
		Update: func(ctx context.Context, cl client.WithWatch, object client.Object, opts ...client.UpdateOption) error {
			if err := ctx.Err(); err != nil {
				return err
			}
			return cl.Update(ctx, object, opts...)
		},
	})
	c := &migrationCoordinator{client: checked, identity: "replacement", ctx: ctx, config: &rest.Config{Host: "http://unused.invalid"}}
	_, err = c.claim(ctx, namespace)
	require.NoError(t, err)
	require.NoError(t, c.saveJournal(ctx, namespace, &migrationJournal{JobID: job.ID, Phase: "checkpoint", Options: migration.Options{SubscriptionNamespace: "operators", SubscriptionName: "demo"}}))
	for i := 0; i < 2; i++ {
		require.NoError(t, c.resume(job.ID, "alice"))
		journal, err := c.loadJournal(ctx, namespace, "operators", "demo")
		require.NoError(t, err)
		assert.Equal(t, "done", journal.Phase)
	}
	completed, _, err := loadDurableMigrationJob(ctx, kubeClient, namespace)
	require.NoError(t, err)
	assert.Equal(t, "Cancelled", completed.Snapshot.Status)
	require.NotNil(t, completed.Snapshot.FinishedAt)
	assert.False(t, completed.Snapshot.Items[0].RollbackAttempted)
}

// TestMigrationRecoveryMetadataOutlivesResults retains unresolved recovery while revoking execution credentials on completion.
func TestMigrationRecoveryMetadataOutlivesResults(t *testing.T) {
	for _, tt := range []struct {
		name   string
		item   operatorMigrationJobItem
		retain bool
	}{
		{name: "failed automatic rollback", item: operatorMigrationJobItem{Status: "Failed", RollbackAttempted: true}, retain: true},
		{name: "expired authorization", item: operatorMigrationJobItem{Status: "Failed", RecoveryRequired: true}, retain: true},
		{name: "successful rollback", item: operatorMigrationJobItem{Status: "Failed", RollbackAttempted: true, RolledBack: true}},
		{name: "failed before mutation", item: operatorMigrationJobItem{Status: "Failed"}},
		{name: "successful migration", item: operatorMigrationJobItem{Status: "Succeeded"}},
	} {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			kubeClient := newMigrationTestClient(t)
			job, err := newMigrationJobStore().create("alice", operatorMigrationBulkRequest{Operators: []operatorMigrationOptionsRequest{{SubscriptionNamespace: "operators", SubscriptionName: "demo"}}})
			require.NoError(t, err)
			finished := time.Now().Add(-25 * time.Hour)
			job.FinishedAt, job.Items[0] = &finished, tt.item
			namespace := seedDurableMigrationJob(t, kubeClient, "alice", job)
			require.NoError(t, kubeClient.Create(ctx, &corev1.ServiceAccount{ObjectMeta: metav1.ObjectMeta{Name: migrationJobStateName, Namespace: namespace}}))
			c := &migrationCoordinator{client: kubeClient, identity: "cleanup", ctx: ctx}
			require.NoError(t, c.resume(job.ID, "alice"))
			assert.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKey{Namespace: namespace, Name: migrationJobStateName}, &corev1.ServiceAccount{})))
			err = kubeClient.Get(ctx, client.ObjectKey{Name: namespace}, &corev1.Namespace{})
			if tt.retain {
				require.NoError(t, err)
				record, err := readDurableMigrationJob(ctx, kubeClient, job.ID, "alice")
				require.NoError(t, err)
				require.NotNil(t, record)
				assert.Equal(t, tt.item, record.Snapshot.Items[0])
			} else {
				assert.True(t, apierrors.IsNotFound(err))
			}
		})
	}
}

// TestCompletedRollbackResumesSourceMetadata allows cleanup after a restart between saving rollback success and updating its source job.
func TestCompletedRollbackResumesSourceMetadata(t *testing.T) {
	ctx := context.Background()
	kubeClient, source, checkpoint, snapshot := seedFailedRollback(t)
	old := time.Now().Add(-25 * time.Hour)
	source.FinishedAt = &old
	namespace, err := migrationJobNamespace(source.ID)
	require.NoError(t, err)
	record, state, err := loadDurableMigrationJob(ctx, kubeClient, namespace)
	require.NoError(t, err)
	record.Snapshot = source.operatorMigrationJobSnapshot
	state.Data[migrationJobRecordKey], err = encodeMigrationState(record)
	require.NoError(t, err)
	require.NoError(t, kubeClient.Update(ctx, state))
	request := operatorMigrationBulkRequest{Operators: source.candidates, Rollback: &operatorMigrationRollbackJob{SourceJobID: source.ID, CheckpointName: checkpoint.Name, CheckpointNamespace: checkpoint.Namespace, CheckpointUID: checkpoint.UID, Snapshot: *snapshot, Restored: true}}
	job, err := newMigrationJobStore().create("alice", request)
	require.NoError(t, err)
	now := time.Now().UTC()
	job.Status, job.FinishedAt = "Succeeded", &now
	rollbackNamespace := seedDurableMigrationJob(t, kubeClient, "alice", job)
	recovery, recoveryState, err := loadDurableMigrationJob(ctx, kubeClient, rollbackNamespace)
	require.NoError(t, err)
	recovery.Request = request
	recoveryState.Data[migrationJobRecordKey], err = encodeMigrationState(recovery)
	require.NoError(t, err)
	require.NoError(t, kubeClient.Update(ctx, recoveryState))
	c := &migrationCoordinator{client: kubeClient, identity: "replacement", ctx: ctx}
	// The source survives before the completed recovery is rediscovered.
	require.NoError(t, c.resume(source.ID, "alice"))
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKey{Name: namespace}, &corev1.Namespace{}))
	require.NoError(t, c.resume(job.ID, "alice"))
	resolved, _, err := loadDurableMigrationJob(ctx, kubeClient, namespace)
	require.NoError(t, err)
	assert.True(t, resolved.Snapshot.Items[0].RolledBack)
	assert.False(t, migrationJobNeedsRecovery(resolved))
	require.NoError(t, c.resume(source.ID, "alice"))
	require.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKey{Name: namespace}, &corev1.Namespace{})))
	// Fake clients do not garbage-collect namespaced Secrets.
	require.NoError(t, kubeClient.Delete(ctx, state))
	require.NoError(t, c.resume(job.ID, "alice"))
}
