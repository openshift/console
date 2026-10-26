package olm

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	operatorsv1alpha1 "github.com/operator-framework/api/pkg/operators/v1alpha1"
	"github.com/operator-framework/library-olm/migration/pkg/migration"
	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/interceptor"

	"github.com/openshift/console/pkg/auth"
)

func TestRollbackResumesControllerRevisionCleanupUsingRetainedTargetUID(t *testing.T) {
	ctx := context.Background()
	kubeClient, job, checkpoint, snapshot := seedFailedRollback(t)
	snapshot.InstalledCSV, snapshot.InstalledCSVUID = "demo.v1", "csv-uid"
	extension := &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "extension-uid", Annotations: map[string]string{
		migrationExecutionAnnotation: job.ID, migration.MigratedFromSubscriptionAnnotation: snapshot.SubscriptionRef,
	}}}
	revision := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-2", UID: "revision-uid", Labels: map[string]string{migration.LabelOwnerName: "demo"}, OwnerReferences: []metav1.OwnerReference{*metav1.NewControllerRef(extension, ocv1.GroupVersion.WithKind("ClusterExtension"))}}}
	reference := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: "demo-2-ref", Namespace: checkpoint.Namespace, UID: "reference-uid", Labels: map[string]string{migration.LabelOwnerName: "demo", migration.LabelRevisionName: revision.Name}, OwnerReferences: []metav1.OwnerReference{*metav1.NewControllerRef(revision, ocv1.GroupVersion.WithKind("ClusterObjectSet"))}}, Type: corev1.SecretType(migration.SecretTypeObjectData)}
	require.NoError(t, kubeClient.Create(ctx, extension))
	require.NoError(t, kubeClient.Create(ctx, revision))
	require.NoError(t, kubeClient.Create(ctx, reference))
	require.NoError(t, kubeClient.Create(ctx, &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1", Namespace: "operators", UID: "csv-uid"}, Status: operatorsv1alpha1.ClusterServiceVersionStatus{Phase: operatorsv1alpha1.CSVPhaseSucceeded}}))
	rollback := &operatorMigrationRollbackJob{SourceJobID: job.ID, CheckpointName: checkpoint.Name, CheckpointNamespace: checkpoint.Namespace, CheckpointUID: checkpoint.UID, Snapshot: *snapshot}
	guard := rollbackTestGuard(t, kubeClient, job.ID)
	guard.Client = interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Delete: func(ctx context.Context, cl client.WithWatch, obj client.Object, options ...client.DeleteOption) error {
		if obj.GetName() == "demo-2" {
			return errors.New("revision deletion interrupted")
		}
		if err := cl.Delete(ctx, obj, options...); err != nil {
			return err
		}
		if _, ok := obj.(*ocv1.ClusterExtension); ok {
			// Fake clients do not implement garbage collection. Orphan deletion
			// removes the extension's owner reference from its surviving revisions.
			var orphan ocv1.ClusterObjectSet
			if err := cl.Get(ctx, client.ObjectKeyFromObject(revision), &orphan); err != nil {
				return err
			}
			orphan.OwnerReferences = nil
			return cl.Update(ctx, &orphan)
		}
		return nil
	}})
	err := executeRollback(ctx, guard, rollback, func() error { t.Fatal("must not mark unfinished recovery restored"); return nil })
	require.ErrorContains(t, err, "revision deletion interrupted")
	require.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKey{Name: "demo"}, &ocv1.ClusterExtension{})))
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(checkpoint), checkpoint))
	assert.Equal(t, "extension-uid", checkpoint.Annotations[rollbackTargetUIDAnnotation])
	assert.JSONEq(t, `{"demo-2":"revision-uid"}`, checkpoint.Annotations[rollbackRevisionUIDsAnnotation])
	assert.JSONEq(t, `{"operator-controller/demo-2-ref":"reference-uid"}`, checkpoint.Annotations[rollbackReferenceUIDsAnnotation])
	var orphan ocv1.ClusterObjectSet
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(revision), &orphan))
	assert.Empty(t, orphan.OwnerReferences)
	assert.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKey{Name: "demo", Namespace: "operators"}, &operatorsv1alpha1.Subscription{})))
	// A new recovery job starts after the extension has gone. Its checkpoint binds
	// controller-created revisions to the original UID without an execution annotation.
	rollback.TargetUID = ""
	replacement := rollbackTestGuard(t, kubeClient, job.ID)
	replacement.Client = interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Delete: func(ctx context.Context, cl client.WithWatch, obj client.Object, options ...client.DeleteOption) error {
		if obj.GetName() == reference.Name {
			return errors.New("reference deletion interrupted")
		}
		if err := cl.Delete(ctx, obj, options...); err != nil {
			return err
		}
		if _, ok := obj.(*ocv1.ClusterObjectSet); ok {
			var orphan corev1.Secret
			if err := cl.Get(ctx, client.ObjectKeyFromObject(reference), &orphan); err != nil {
				return err
			}
			orphan.OwnerReferences = nil
			return cl.Update(ctx, &orphan)
		}
		return nil
	}})
	require.ErrorContains(t, executeRollback(ctx, replacement, rollback, func() error { t.Fatal("reference cleanup unfinished"); return nil }), "reference deletion interrupted")
	assert.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKey{Name: "demo-2"}, &ocv1.ClusterObjectSet{})))
	var orphanReference corev1.Secret
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(reference), &orphanReference))
	assert.Empty(t, orphanReference.OwnerReferences)
	assert.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKey{Name: "demo", Namespace: "operators"}, &operatorsv1alpha1.Subscription{})))
	// Resume even after both the extension and revision have disappeared.
	require.NoError(t, executeRollback(ctx, rollbackTestGuard(t, kubeClient, job.ID), rollback, func() error { return nil }))
	assert.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKeyFromObject(reference), &corev1.Secret{})))
	assert.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKeyFromObject(checkpoint), &corev1.Secret{})))
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKey{Name: "demo", Namespace: "operators"}, &operatorsv1alpha1.Subscription{}))
}

func TestRollbackRejectsUnrelatedControllerRevisions(t *testing.T) {
	for _, tt := range []struct {
		name, ownerName, label, execution string
		uid                               types.UID
		controller                        bool
		orphan                            bool
		capturedUID                       types.UID
	}{
		{name: "different target UID", ownerName: "demo", label: "demo", uid: "foreign", controller: true},
		{name: "different target name", ownerName: "foreign", label: "demo", uid: "target", controller: true},
		{name: "different owner label", ownerName: "demo", label: "foreign", uid: "target", controller: true},
		{name: "not a controller reference", ownerName: "demo", label: "demo", uid: "target"},
		{name: "another execution", ownerName: "demo", label: "demo", uid: "target", controller: true, execution: "foreign"},
		{name: "unverified orphan", label: "demo", orphan: true},
		{name: "replaced orphan", label: "demo", orphan: true, capturedUID: "previous-revision"},
	} {
		t.Run(tt.name, func(t *testing.T) {
			kubeClient := newMigrationTestClient(t)
			guard := rollbackTestGuard(t, kubeClient, "source-job")
			guard.rollbackTargetName, guard.rollbackTargetUID = "demo", "target"
			guard.rollbackRevisionUIDs = map[string]types.UID{"demo-2": tt.capturedUID}
			revision := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-2", UID: "revision", Labels: map[string]string{migration.LabelOwnerName: tt.label}, Annotations: map[string]string{migrationExecutionAnnotation: tt.execution}, OwnerReferences: []metav1.OwnerReference{{APIVersion: ocv1.GroupVersion.String(), Kind: "ClusterExtension", Name: tt.ownerName, UID: tt.uid, Controller: &tt.controller}}}}
			if tt.orphan {
				revision.OwnerReferences = nil
			}
			require.NoError(t, kubeClient.Create(context.Background(), revision))
			assert.True(t, apierrors.IsConflict(guard.Delete(context.Background(), revision)))
			assert.NoError(t, kubeClient.Get(context.Background(), client.ObjectKeyFromObject(revision), &ocv1.ClusterObjectSet{}))
		})
	}
}

func TestRollbackRejectsUnrelatedReferenceSecrets(t *testing.T) {
	for _, tt := range []struct {
		name   string
		change func(*corev1.Secret)
	}{
		{name: "different revision UID", change: func(s *corev1.Secret) { s.OwnerReferences[0].UID = "other-revision" }},
		{name: "different revision name", change: func(s *corev1.Secret) { s.OwnerReferences[0].Name = "other-revision" }},
		{name: "different revision label", change: func(s *corev1.Secret) { s.Labels[migration.LabelRevisionName] = "other-revision" }},
		{name: "different target", change: func(s *corev1.Secret) { s.Labels[migration.LabelOwnerName] = "other-target" }},
		{name: "different execution", change: func(s *corev1.Secret) { s.Annotations = map[string]string{migrationExecutionAnnotation: "other-job"} }},
		{name: "unexpected type", change: func(s *corev1.Secret) { s.Type = corev1.SecretTypeOpaque }},
		{name: "not a controller reference", change: func(s *corev1.Secret) { controller := false; s.OwnerReferences[0].Controller = &controller }},
		{name: "different owner kind", change: func(s *corev1.Secret) { s.OwnerReferences[0].Kind = "ClusterExtension" }},
		{name: "different owner API", change: func(s *corev1.Secret) { s.OwnerReferences[0].APIVersion = "other/v1" }},
		{name: "unverified orphan", change: func(s *corev1.Secret) { s.OwnerReferences = nil; s.Name = "unknown-ref" }},
		{name: "replaced orphan", change: func(s *corev1.Secret) { s.OwnerReferences = nil; s.UID = "replacement-uid" }},
		{name: "different orphan namespace", change: func(s *corev1.Secret) { s.OwnerReferences = nil; s.Namespace = "other-namespace" }},
	} {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			reference := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: "demo-ref", Namespace: "system", UID: "secret-uid", Labels: map[string]string{migration.LabelOwnerName: "demo", migration.LabelRevisionName: "demo-2"}, OwnerReferences: []metav1.OwnerReference{*metav1.NewControllerRef(&ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-2", UID: "revision-uid"}}, ocv1.GroupVersion.WithKind("ClusterObjectSet"))}}, Type: corev1.SecretType(migration.SecretTypeObjectData)}
			tt.change(reference)
			kubeClient := newMigrationTestClient(t, reference)
			guard := rollbackTestGuard(t, kubeClient, "source-job")
			guard.rollbackTargetName, guard.rollbackTargetUID = "demo", "target-uid"
			guard.rollbackRevisionUIDs = map[string]types.UID{"demo-2": "revision-uid"}
			guard.rollbackReferenceUIDs = map[string]types.UID{"system/demo-ref": "secret-uid"}
			assert.True(t, apierrors.IsConflict(guard.Delete(ctx, reference)))
			assert.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(reference), &corev1.Secret{}))
		})
	}
}

func seedFailedRollback(t *testing.T) (client.Client, *operatorMigrationJob, *corev1.Secret, *operatorMigrationRecoverySnapshot) {
	t.Helper()
	snapshot := &operatorMigrationRecoverySnapshot{
		ClusterExtensionName: "demo", ClusterObjectSetName: "demo-1", SubscriptionRef: "operators/demo",
		SubscriptionSpec: migrationTestSubscriptionSpec(), Namespace: operatorMigrationNamespaceBackup{Name: "operators"},
	}
	checkpoint := newTestOperatorMigrationCheckpoint(t, snapshot)
	checkpoint.UID = "backup-uid"
	checkpoint.Data[operatorMigrationCheckpointStateKey] = []byte(operatorMigrationCheckpointRequired)
	kubeClient := newMigrationTestClient(t, checkpoint)
	job, err := newMigrationJobStore().create("alice", operatorMigrationBulkRequest{Operators: []operatorMigrationOptionsRequest{{SubscriptionNamespace: "operators", SubscriptionName: "demo", ClusterExtensionName: "demo"}}})
	require.NoError(t, err)
	now := time.Now().UTC()
	job.FinishedAt, job.Status = &now, "CompletedWithErrors"
	job.Items[0].Status, job.Items[0].RollbackAttempted = "Failed", true
	checkpoint.Annotations = map[string]string{migrationExecutionAnnotation: job.ID}
	require.NoError(t, kubeClient.Update(context.Background(), checkpoint))
	seedDurableMigrationJob(t, kubeClient, "alice", job)
	return kubeClient, job, checkpoint, snapshot
}

func TestRollbackOnlyQueuesAcknowledgedOwnedFailedMigration(t *testing.T) {
	for _, tt := range []struct {
		name            string
		owner           string
		acknowledge     bool
		change          func(*operatorMigrationJob)
		checkpointOwner string
		checkpointState string
		reinstalled     bool
		code            int
	}{
		{name: "accepted", owner: "alice", acknowledge: true, code: http.StatusAccepted},
		{name: "reinstalled operator checkpoint", owner: "alice", acknowledge: true, reinstalled: true, code: http.StatusAccepted},
		{name: "expired execution requires fresh authorization", owner: "alice", acknowledge: true, checkpointState: operatorMigrationCheckpointInProgress, change: func(job *operatorMigrationJob) {
			job.Items[0].RollbackAttempted = false
			job.Items[0].RecoveryRequired = true
		}, code: http.StatusAccepted},
		{name: "in-progress checkpoint without expired authorization", owner: "alice", acknowledge: true, checkpointState: operatorMigrationCheckpointInProgress, code: http.StatusConflict},
		{name: "expired authorization does not own new checkpoint", owner: "alice", acknowledge: true, checkpointState: operatorMigrationCheckpointInProgress, checkpointOwner: "different-job", change: func(job *operatorMigrationJob) {
			job.Items[0].RollbackAttempted = false
			job.Items[0].RecoveryRequired = true
		}, code: http.StatusConflict},
		{name: "no acknowledgement", owner: "alice", code: http.StatusBadRequest},
		{name: "another owner", owner: "bob", acknowledge: true, code: http.StatusNotFound},
		{name: "batch still running", owner: "alice", acknowledge: true, change: func(job *operatorMigrationJob) { job.FinishedAt = nil }, code: http.StatusConflict},
		{name: "successful item", owner: "alice", acknowledge: true, change: func(job *operatorMigrationJob) { job.Items[0].Status = "Succeeded" }, code: http.StatusConflict},
		{name: "already restored", owner: "alice", acknowledge: true, change: func(job *operatorMigrationJob) { job.Items[0].RolledBack = true }, code: http.StatusConflict},
		{name: "new checkpoint", owner: "alice", acknowledge: true, checkpointOwner: "different-job", code: http.StatusConflict},
	} {
		t.Run(tt.name, func(t *testing.T) {
			kubeClient, job, checkpoint, _ := seedFailedRollback(t)
			if tt.reinstalled {
				desired := checkpoint.DeepCopy()
				desired.ResourceVersion, desired.UID = "", ""
				desired.Data[operatorMigrationCheckpointStateKey] = []byte(operatorMigrationCheckpointInProgress)
				checkpoint.Annotations[migrationExecutionAnnotation] = "previous-execution"
				checkpoint.Data[operatorMigrationCheckpointStateKey] = []byte(operatorMigrationCheckpointMigrated)
				require.NoError(t, kubeClient.Update(context.Background(), checkpoint))
				guard := rollbackTestGuard(t, kubeClient, "")
				guard.id = job.ID
				require.NoError(t, guard.Create(context.Background(), desired))
				require.NoError(t, markOperatorMigrationRecoveryRequired(context.Background(), guard, desired))
			}
			if tt.change != nil {
				tt.change(job)
				ns, _ := migrationJobNamespace(job.ID)
				record, state, err := loadDurableMigrationJob(context.Background(), kubeClient, ns)
				require.NoError(t, err)
				record.Snapshot = job.operatorMigrationJobSnapshot
				state.Data[migrationJobRecordKey], err = encodeMigrationState(record)
				require.NoError(t, err)
				require.NoError(t, kubeClient.Update(context.Background(), state))
			}
			if tt.checkpointState != "" {
				checkpoint.Data[operatorMigrationCheckpointStateKey] = []byte(tt.checkpointState)
				require.NoError(t, kubeClient.Update(context.Background(), checkpoint))
			}
			if tt.checkpointOwner != "" {
				checkpoint.Annotations[migrationExecutionAnnotation] = tt.checkpointOwner
				require.NoError(t, kubeClient.Update(context.Background(), checkpoint))
			}
			body, err := json.Marshal(operatorMigrationRollbackRequest{JobID: job.ID, ClusterExtensionName: "demo", AcknowledgeInstalled: tt.acknowledge})
			require.NoError(t, err)
			ctx, cancel := context.WithCancel(context.WithValue(context.Background(), auth.UserContextKey, &auth.User{ID: tt.owner}))
			defer cancel()
			request := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(string(body))).WithContext(ctx)
			response := httptest.NewRecorder()
			newMigrationTestHandler(kubeClient).migrationRollbackHandler(response, request)
			require.Equal(t, tt.code, response.Code, response.Body.String())
			if tt.code == http.StatusAccepted {
				cancel() // Disconnecting the initiating request does not remove the queued recovery.
				var result struct {
					JobID string `json:"jobID"`
				}
				require.NoError(t, json.Unmarshal(response.Body.Bytes(), &result))
				record, err := readDurableMigrationJob(context.Background(), kubeClient, result.JobID, "alice")
				require.NoError(t, err)
				require.NotNil(t, record)
				assert.Equal(t, "Rollback", record.Snapshot.Operation)
				require.NotNil(t, record.AuthorizationExpiresAt)
				assert.True(t, record.AuthorizationExpiresAt.After(time.Now()))
				assert.Equal(t, job.ID, record.Snapshot.SourceJobID)
				assert.Equal(t, checkpoint.UID, record.Request.Rollback.CheckpointUID)
				assert.Equal(t, checkpoint.Name, record.Request.Rollback.CheckpointName)
				assert.Error(t, requestDurableMigrationCancellation(context.Background(), kubeClient, result.JobID, "alice"))
			}
			var sub operatorsv1alpha1.Subscription
			assert.True(t, apierrors.IsNotFound(kubeClient.Get(context.Background(), client.ObjectKey{Name: "demo", Namespace: "operators"}, &sub)))
		})
	}
}

func rollbackTestGuard(t *testing.T, kubeClient client.Client, sourceID string) *migrationExecutionClient {
	t.Helper()
	coordinator := &migrationCoordinator{client: kubeClient, identity: "backend"}
	claimed, err := coordinator.claim(context.Background(), "rollback-job")
	require.NoError(t, err)
	require.True(t, claimed)
	return &migrationExecutionClient{Client: kubeClient, coordinator: coordinator, namespace: "rollback-job", id: "recovery-job", rollbackSourceID: sourceID, retainCheckpoint: true}
}

func TestExplicitRollbackPreservesCheckpointUntilDurablyRestored(t *testing.T) {
	kubeClient, job, checkpoint, snapshot := seedFailedRollback(t)
	objectSet := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", UID: "target-uid", Labels: map[string]string{migration.LabelOwnerName: "demo"}, Annotations: map[string]string{migrationExecutionAnnotation: job.ID}}}
	require.NoError(t, kubeClient.Create(context.Background(), objectSet))
	// A surviving CSV can be associated with the restored Subscription.
	snapshot.InstalledCSV, snapshot.InstalledCSVUID = "demo.v1", "csv-uid"
	require.NoError(t, kubeClient.Create(context.Background(), &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1", Namespace: "operators", UID: "csv-uid"}, Status: operatorsv1alpha1.ClusterServiceVersionStatus{Phase: operatorsv1alpha1.CSVPhaseSucceeded}}))
	rollback := &operatorMigrationRollbackJob{SourceJobID: job.ID, CheckpointName: checkpoint.Name, CheckpointNamespace: checkpoint.Namespace, CheckpointUID: checkpoint.UID, Snapshot: *snapshot}
	guard := rollbackTestGuard(t, kubeClient, job.ID)
	err := executeRollback(context.Background(), guard, rollback, func() error { return errors.New("persistence unavailable") })
	require.ErrorIs(t, err, errMigrationSuspended)
	var retained corev1.Secret
	require.NoError(t, kubeClient.Get(context.Background(), client.ObjectKeyFromObject(checkpoint), &retained))
	// A replacement execution resumes from the existing Subscription rather than creating another controller.
	replacement := rollbackTestGuard(t, kubeClient, job.ID)
	require.NoError(t, executeRollback(context.Background(), replacement, rollback, func() error { rollback.Restored = true; return nil }))
	assert.True(t, apierrors.IsNotFound(kubeClient.Get(context.Background(), client.ObjectKeyFromObject(checkpoint), &retained)))
	// A restart after checkpoint deletion, before the final result write, is also idempotent.
	require.NoError(t, executeRollback(context.Background(), replacement, rollback, func() error { t.Fatal("already restored"); return nil }))
}

func TestRollbackDoesNotRestoreSourceWhileTargetDeletionIsPending(t *testing.T) {
	kubeClient, job, checkpoint, snapshot := seedFailedRollback(t)
	objectSet := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", UID: "target-uid", Labels: map[string]string{migration.LabelOwnerName: "demo"}, Annotations: map[string]string{migrationExecutionAnnotation: job.ID}}}
	require.NoError(t, kubeClient.Create(context.Background(), objectSet))
	blocked := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Delete: func(ctx context.Context, c client.WithWatch, obj client.Object, opts ...client.DeleteOption) error {
		if _, ok := obj.(*ocv1.ClusterObjectSet); ok {
			return nil
		} // Accepted deletion still awaiting a finalizer.
		return c.Delete(ctx, obj, opts...)
	}})
	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()
	err := (&OLMHandler{}).rollbackFromOperatorMigrationCheckpoint(ctx, blocked, checkpoint, snapshot, true)
	require.ErrorIs(t, err, context.DeadlineExceeded)
	var sub operatorsv1alpha1.Subscription
	assert.True(t, apierrors.IsNotFound(kubeClient.Get(context.Background(), client.ObjectKey{Name: "demo", Namespace: "operators"}, &sub)))
	var retained corev1.Secret
	assert.NoError(t, kubeClient.Get(context.Background(), client.ObjectKeyFromObject(checkpoint), &retained))
}

func TestRollbackRejectsReplacedTargetsAndCheckpoint(t *testing.T) {
	for _, replaceCheckpoint := range []bool{false, true} {
		t.Run(map[bool]string{false: "target", true: "checkpoint"}[replaceCheckpoint], func(t *testing.T) {
			kubeClient, job, checkpoint, snapshot := seedFailedRollback(t)
			objectSet := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", UID: "new-target", Labels: map[string]string{migration.LabelOwnerName: "demo"}, Annotations: map[string]string{migrationExecutionAnnotation: "another-job"}}}
			require.NoError(t, kubeClient.Create(context.Background(), objectSet))
			rollback := &operatorMigrationRollbackJob{SourceJobID: job.ID, CheckpointName: checkpoint.Name, CheckpointNamespace: checkpoint.Namespace, CheckpointUID: checkpoint.UID, Snapshot: *snapshot}
			if replaceCheckpoint {
				rollback.CheckpointUID = "old-backup"
			}
			err := executeRollback(context.Background(), rollbackTestGuard(t, kubeClient, job.ID), rollback, func() error { t.Fatal("must not persist restoration"); return nil })
			require.Error(t, err)
			var retained corev1.Secret
			assert.NoError(t, kubeClient.Get(context.Background(), client.ObjectKeyFromObject(checkpoint), &retained))
			var sub operatorsv1alpha1.Subscription
			assert.True(t, apierrors.IsNotFound(kubeClient.Get(context.Background(), client.ObjectKey{Name: "demo", Namespace: "operators"}, &sub)))
		})
	}
}

func TestRollbackLeaseSerializesDifferentRecoveryJobsOnSameBackend(t *testing.T) {
	kubeClient := newMigrationTestClient(t)
	key := client.ObjectKey{Namespace: "operator-controller", Name: "console-rollback-demo"}
	claimed, err := claimMigrationLease(context.Background(), kubeClient, key, "backend/job-one")
	require.NoError(t, err)
	require.True(t, claimed)
	claimed, err = claimMigrationLease(context.Background(), kubeClient, key, "backend/job-two")
	require.NoError(t, err)
	require.False(t, claimed)
}

func TestRollbackRunnerPersistsRecoveryAndRetainsFailedBackups(t *testing.T) {
	for _, failDeletion := range []bool{false, true} {
		t.Run(map[bool]string{false: "restored", true: "deletion denied"}[failDeletion], func(t *testing.T) {
			kubeClient, source, checkpoint, snapshot := seedFailedRollback(t)
			snapshot.InstalledCSV, snapshot.InstalledCSVUID = "demo.v1", "csv-uid"
			require.NoError(t, kubeClient.Create(context.Background(), &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1", Namespace: "operators", UID: "csv-uid"}, Status: operatorsv1alpha1.ClusterServiceVersionStatus{Phase: operatorsv1alpha1.CSVPhaseSucceeded}}))
			require.NoError(t, kubeClient.Create(context.Background(), &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", Labels: map[string]string{migration.LabelOwnerName: "demo"}, Annotations: map[string]string{migrationExecutionAnnotation: source.ID}}}))
			require.NoError(t, kubeClient.Create(context.Background(), &ocv1.ClusterExtension{
				ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "extension-uid", Annotations: map[string]string{migrationExecutionAnnotation: source.ID, migration.MigratedFromSubscriptionAnnotation: snapshot.SubscriptionRef}},
				Status:     ocv1.ClusterExtensionStatus{Conditions: []metav1.Condition{{Type: ocv1.TypeInstalled, Status: metav1.ConditionTrue}}},
			}))
			executionClient := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Delete: func(ctx context.Context, c client.WithWatch, obj client.Object, opts ...client.DeleteOption) error {
				if _, ok := obj.(*ocv1.ClusterObjectSet); ok {
					var extension ocv1.ClusterExtension
					require.True(t, apierrors.IsNotFound(c.Get(ctx, client.ObjectKey{Name: "demo"}, &extension)), "stop extension reconciliation before deleting target revisions")
				}
				if _, ok := obj.(*ocv1.ClusterObjectSet); ok && failDeletion {
					return apierrors.NewForbidden(ocv1.GroupVersion.WithResource("clusterobjectsets").GroupResource(), obj.GetName(), errors.New("denied"))
				}
				return c.Delete(ctx, obj, opts...)
			}})
			request := operatorMigrationBulkRequest{Operators: source.candidates, Rollback: &operatorMigrationRollbackJob{SourceJobID: source.ID, CheckpointName: checkpoint.Name, CheckpointNamespace: checkpoint.Namespace, CheckpointUID: checkpoint.UID, Snapshot: *snapshot}}
			store := newMigrationJobStore()
			job, err := store.create("alice", request)
			require.NoError(t, err)
			job.Operation, job.SourceJobID = "Rollback", source.ID
			record := &durableMigrationJob{Owner: "alice", Request: request, Snapshot: job.operatorMigrationJobSnapshot}
			var durableState []byte
			store.persist = func(snapshot operatorMigrationJobSnapshot) error {
				record.Snapshot = snapshot
				var err error
				durableState, err = encodeMigrationState(record)
				return err
			}
			ctx, stop := context.WithCancel(context.Background())
			defer stop()
			coordinator := &migrationCoordinator{client: kubeClient, identity: "backend"}
			namespace, _ := migrationJobNamespace(job.ID)
			claimed, err := coordinator.claim(ctx, namespace)
			require.NoError(t, err)
			require.True(t, claimed)
			require.NoError(t, coordinator.runRollbackJob(ctx, stop, namespace, record, store, migration.NewMigrator(executionClient, nil)))
			var persisted durableMigrationJob
			require.NoError(t, decodeMigrationState(durableState, &persisted))
			require.NotNil(t, persisted.Snapshot.FinishedAt)
			sourceRecord, err := readDurableMigrationJob(context.Background(), kubeClient, source.ID, "alice")
			require.NoError(t, err)
			require.NotNil(t, sourceRecord)
			assert.Equal(t, !failDeletion, sourceRecord.Snapshot.Items[0].RolledBack)
			assert.Equal(t, failDeletion, migrationJobNeedsRecovery(sourceRecord))
			var backup corev1.Secret
			if failDeletion {
				assert.Equal(t, "Failed", persisted.Snapshot.Status)
				assert.True(t, persisted.Snapshot.Items[0].RollbackAttempted)
				assert.False(t, persisted.Request.Rollback.Restored)
				assert.NoError(t, kubeClient.Get(context.Background(), client.ObjectKeyFromObject(checkpoint), &backup))
			} else {
				assert.Equal(t, "Succeeded", persisted.Snapshot.Status)
				assert.True(t, persisted.Snapshot.Items[0].RolledBack)
				assert.True(t, persisted.Request.Rollback.Restored)
				assert.True(t, apierrors.IsNotFound(kubeClient.Get(context.Background(), client.ObjectKeyFromObject(checkpoint), &backup)))
			}
		})
	}
}

func TestRollbackResumesReferenceCleanupAfterTargetDeletion(t *testing.T) {
	kubeClient, source, checkpoint, snapshot := seedFailedRollback(t)
	objectSet := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", Labels: map[string]string{migration.LabelOwnerName: "demo"}, Annotations: map[string]string{migrationExecutionAnnotation: source.ID}}}
	refSecret := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: "demo-ref", Namespace: checkpoint.Namespace, Labels: map[string]string{migration.LabelOwnerName: "demo", migration.LabelRevisionName: "demo-1"}, Annotations: map[string]string{migrationExecutionAnnotation: source.ID}}}
	require.NoError(t, kubeClient.Create(context.Background(), objectSet))
	require.NoError(t, kubeClient.Create(context.Background(), refSecret))
	blocked := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Delete: func(ctx context.Context, c client.WithWatch, obj client.Object, opts ...client.DeleteOption) error {
		if obj.GetName() == refSecret.Name {
			return errors.New("reference cleanup unavailable")
		}
		return c.Delete(ctx, obj, opts...)
	}})
	handler := &OLMHandler{}
	require.ErrorContains(t, handler.rollbackFromOperatorMigrationCheckpoint(context.Background(), rollbackTestGuard(t, blocked, source.ID), checkpoint, snapshot, true), "reference cleanup unavailable")
	// The original target has gone, but its reference Secret still needs cleanup.
	var deleted ocv1.ClusterObjectSet
	assert.True(t, apierrors.IsNotFound(kubeClient.Get(context.Background(), client.ObjectKeyFromObject(objectSet), &deleted)))
	require.NoError(t, handler.rollbackFromOperatorMigrationCheckpoint(context.Background(), rollbackTestGuard(t, kubeClient, source.ID), checkpoint, snapshot, true))
	var remaining corev1.Secret
	assert.True(t, apierrors.IsNotFound(kubeClient.Get(context.Background(), client.ObjectKeyFromObject(refSecret), &remaining)))
}
