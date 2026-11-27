package olm

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	operatorsv1alpha1 "github.com/operator-framework/api/pkg/operators/v1alpha1"
	"github.com/operator-framework/library-olm/migration/pkg/migration"
	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	coordinationv1 "k8s.io/api/coordination/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
	"sigs.k8s.io/controller-runtime/pkg/client/interceptor"

	"github.com/openshift/console/pkg/auth"
)

func seedDurableMigrationJob(t *testing.T, kubeClient client.Client, owner string, job *operatorMigrationJob) string {
	t.Helper()
	namespace, namespaceErr := migrationJobNamespace(job.ID)
	require.NoError(t, namespaceErr)
	record := durableMigrationJob{Owner: owner, Request: operatorMigrationBulkRequest{Operators: job.candidates}, Snapshot: job.operatorMigrationJobSnapshot}
	encoded, err := encodeMigrationState(record)
	require.NoError(t, err)
	require.NoError(t, kubeClient.Create(context.Background(), &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: namespace, Labels: map[string]string{migrationJobLabel: "true", migrationJobOwnerLabel: migrationUserLabel(owner)}, Annotations: map[string]string{migrationJobOwnerAnnotation: owner}}}))
	require.NoError(t, kubeClient.Create(context.Background(), &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: migrationJobStateName, Namespace: namespace}, Data: map[string][]byte{migrationJobRecordKey: encoded}}))
	require.NoError(t, kubeClient.Create(context.Background(), &corev1.ConfigMap{ObjectMeta: metav1.ObjectMeta{Name: namespace, Namespace: migrationIndexNamespace, Labels: map[string]string{migrationJobLabel: "true", migrationJobOwnerLabel: migrationUserLabel(owner)}, Annotations: map[string]string{migrationJobOwnerAnnotation: owner}}}))
	return namespace
}

func TestMigrationJobsSurviveBackendReplacementAndTokenChanges(t *testing.T) {
	ctx := context.Background()
	kubeClient := newMigrationTestClient(t)
	store := newMigrationJobStore()
	job, err := store.create("alice", operatorMigrationBulkRequest{Operators: []operatorMigrationOptionsRequest{{SubscriptionNamespace: "operators", SubscriptionName: "demo"}}})
	require.NoError(t, err)
	job.Status = "Running"
	job.Items[0].Status = "Migrating"
	job.ProgressEvent = &operatorMigrationProgress{Step: migration.ProgressStepCreate, Status: migration.ProgressWaiting, Target: "operators/demo", Message: "Waiting for ClusterExtension demo to reach Installed=True..."}
	job.Items[0].ProgressEvent = job.ProgressEvent
	seedDurableMigrationJob(t, kubeClient, "alice", job)
	// No process-memory store is transferred to this replacement backend.
	replacement := newMigrationTestHandler(kubeClient)
	request := httptest.NewRequest(http.MethodGet, "/", nil).WithContext(context.WithValue(ctx, auth.UserContextKey, &auth.User{ID: "alice", Token: "new-login-token"}))
	response := httptest.NewRecorder()
	replacement.migrationJobsHandler(response, request)
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	var jobs []operatorMigrationJobSnapshot
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &jobs))
	require.Len(t, jobs, 1)
	assert.Equal(t, job.ID, jobs[0].ID)
	assert.Equal(t, "Migrating", jobs[0].Items[0].Status)
	assert.Equal(t, job.ProgressEvent, jobs[0].ProgressEvent)
	assert.Equal(t, job.Items[0].ProgressEvent, jobs[0].Items[0].ProgressEvent)
	assert.NotContains(t, response.Body.String(), "new-login-token")

	request = request.WithContext(context.WithValue(ctx, auth.UserContextKey, &auth.User{ID: "bob", Token: "another-token"}))
	response = httptest.NewRecorder()
	replacement.migrationJobsHandler(response, request)
	require.Equal(t, http.StatusOK, response.Code)
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &jobs))
	assert.Empty(t, jobs)
}

func TestMigrationLeasePreventsConcurrentBackendsAndCanBeReclaimed(t *testing.T) {
	ctx := context.Background()
	kubeClient := newMigrationTestClient(t)
	first := &migrationCoordinator{client: kubeClient, identity: "first"}
	second := &migrationCoordinator{client: kubeClient, identity: "second"}
	claimed, err := first.claim(ctx, "migration")
	require.NoError(t, err)
	require.True(t, claimed)
	claimed, err = second.claim(ctx, "migration")
	require.NoError(t, err)
	require.False(t, claimed)
	var lease coordinationv1.Lease
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKey{Name: migrationJobStateName, Namespace: "migration"}, &lease))
	expired := metav1.NewMicroTime(time.Now().Add(-migrationLeaseDuration - time.Second))
	lease.Spec.RenewTime = &expired
	require.NoError(t, kubeClient.Update(ctx, &lease))
	claimed, err = second.claim(ctx, "migration")
	require.NoError(t, err)
	require.True(t, claimed)
	assert.ErrorIs(t, first.ownsLease(ctx, "migration"), errMigrationSuspended)
	assert.NoError(t, second.ownsLease(ctx, "migration"))
}

func TestResumingHandoffUsesExistingClusterObjectSetAndExtension(t *testing.T) {
	ctx := context.Background()
	for _, phase := range []string{"cos", "ce", "cleanup", "done"} {
		t.Run(phase, func(t *testing.T) {
			id := "0123456789abcdef0123456789abcdef"
			opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators", SystemNamespace: "operator-controller"}
			annotations := map[string]string{migrationExecutionAnnotation: id, migration.MigratedFromSubscriptionAnnotation: "operators/demo"}
			cos := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", Annotations: annotations}, Status: ocv1.ClusterObjectSetStatus{CompletedAt: metav1.Now(), Conditions: []metav1.Condition{{Type: ocv1.ClusterObjectSetTypeReady, Status: metav1.ConditionTrue}}}}
			extension := &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", Annotations: annotations}, Status: ocv1.ClusterExtensionStatus{Conditions: []metav1.Condition{{Type: ocv1.ClusterExtensionTypeInstalled, Status: metav1.ConditionTrue}}}}
			checkpoint := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: operatorMigrationCheckpointSecretName("demo"), Namespace: "operator-controller", Annotations: annotations}, Data: map[string][]byte{operatorMigrationCheckpointStateKey: []byte(operatorMigrationCheckpointInProgress)}}
			base := newMigrationTestClient(t, cos, extension, checkpoint)
			// The journal predates the deployment API; the cluster never served it.
			kubeClient := interceptor.NewClient(base.(client.WithWatch), interceptor.Funcs{Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
				if _, ok := object.(*ocv1.ClusterObjectDeployment); ok {
					return &meta.NoKindMatchError{GroupKind: schema.GroupKind{Group: ocv1.GroupVersion.Group, Kind: ocv1.ClusterObjectDeploymentKind}}
				}
				return cl.Get(ctx, key, object, options...)
			}})
			c := &migrationCoordinator{client: kubeClient, identity: "replacement"}
			namespace, namespaceErr := migrationJobNamespace(id)
			require.NoError(t, namespaceErr)
			claimed, err := c.claim(ctx, namespace)
			require.NoError(t, err)
			require.True(t, claimed)
			journal := &migrationJournal{JobID: id, Phase: phase, Options: opts, Info: migration.MigrationInfo{PackageName: "demo"}}
			// Source Subscription/CSV are already gone. The saved backup remains authoritative.
			journal.Backup.ClusterServiceVersion = &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1.0.0", Namespace: "operators"}}
			guard := &migrationExecutionClient{Client: kubeClient, coordinator: c, namespace: namespace, id: id}
			require.NoError(t, c.advanceJournal(ctx, migration.NewMigrator(guard, nil), namespace, journal))
			assert.Equal(t, "done", journal.Phase)
			var objectSets ocv1.ClusterObjectSetList
			require.NoError(t, kubeClient.List(ctx, &objectSets))
			assert.Len(t, objectSets.Items, 1)
			var extensions ocv1.ClusterExtensionList
			require.NoError(t, kubeClient.List(ctx, &extensions))
			assert.Len(t, extensions.Items, 1)
		})
	}
}

// TestResumingExtensionPhaseCompletesDeploymentHandoff verifies a deployment staged by an earlier
// library version is protected and adopted before the ClusterExtension phase resumes, including
// journals whose snapshot still records the direct-revision manager.
func TestResumingExtensionPhaseCompletesDeploymentHandoff(t *testing.T) {
	for _, legacyFlag := range []bool{false, true} {
		name := "deployment-manager journal"
		if legacyFlag {
			name = "direct-revision journal"
		}
		t.Run(name, func(t *testing.T) {
			ctx := context.Background()
			id := "0123456789abcdef0123456789abcdef"
			opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators", SystemNamespace: "operator-controller"}
			annotations := map[string]string{migrationExecutionAnnotation: id, migration.MigratedFromSubscriptionAnnotation: "operators/demo"}
			deployment := &ocv1.ClusterObjectDeployment{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "deployment-uid", Generation: 2, Annotations: annotations, Labels: map[string]string{"apps.kubernetes.io/managed-by": "operator-controller"}}, Spec: ocv1.ClusterObjectDeploymentSpec{Template: ocv1.ClusterObjectDeploymentTemplate{Spec: ocv1.ClusterObjectDeploymentTemplateSpec{ClusterObjectSetContent: ocv1.ClusterObjectSetContent{CollisionProtection: ocv1.CollisionProtectionNone}}}}, Status: migrationDeploymentStatus(2)}
			checkpoint := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: operatorMigrationCheckpointSecretName("demo"), Namespace: "operator-controller", Annotations: annotations}, Data: map[string][]byte{operatorMigrationCheckpointStateKey: []byte(operatorMigrationCheckpointInProgress)}}
			kubeClient := newMigrationTestClient(t, deployment, checkpoint)
			runner := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Create: func(ctx context.Context, cl client.WithWatch, object client.Object, options ...client.CreateOption) error {
				extension, ok := object.(*ocv1.ClusterExtension)
				if !ok {
					return cl.Create(ctx, object, options...)
				}
				// The extension is created only after the deployment is protected and adopted.
				var staged ocv1.ClusterObjectDeployment
				require.NoError(t, cl.Get(ctx, client.ObjectKey{Name: "demo"}, &staged))
				assert.Equal(t, ocv1.CollisionProtectionPrevent, staged.Spec.Template.Spec.CollisionProtection)
				assert.Equal(t, migrationDeploymentManagedByValue, staged.Labels[migrationDeploymentManagedByLabel])
				if err := cl.Create(ctx, object, options...); err != nil {
					return err
				}
				extension.Status = ocv1.ClusterExtensionStatus{Conditions: []metav1.Condition{{Type: ocv1.ClusterExtensionTypeInstalled, Status: metav1.ConditionTrue}}}
				return cl.Update(ctx, object)
			}})
			c := &migrationCoordinator{client: kubeClient, identity: "replacement"}
			namespace, namespaceErr := migrationJobNamespace(id)
			require.NoError(t, namespaceErr)
			claimed, err := c.claim(ctx, namespace)
			require.NoError(t, err)
			require.True(t, claimed)
			journal := &migrationJournal{JobID: id, Phase: "ce", Options: opts, Info: migration.MigrationInfo{PackageName: "demo"}, Recovery: operatorMigrationRecoverySnapshot{UseClusterObjectDeployment: !legacyFlag, ClusterExtensionName: "demo", ClusterObjectSetName: "demo-1", SubscriptionRef: "operators/demo"}}
			journal.Backup.ClusterServiceVersion = &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1.0.0", Namespace: "operators"}}
			guard := &migrationExecutionClient{Client: runner, coordinator: c, namespace: namespace, id: id}
			require.NoError(t, c.advanceJournal(ctx, migration.NewMigrator(guard, nil), namespace, journal))
			assert.Equal(t, "done", journal.Phase)
			assert.True(t, journal.Recovery.UseClusterObjectDeployment)
			require.NoError(t, kubeClient.Get(ctx, client.ObjectKey{Name: "demo"}, deployment))
			assert.Equal(t, ocv1.CollisionProtectionPrevent, deployment.Spec.Template.Spec.CollisionProtection)
			assert.Equal(t, migrationDeploymentManagedByValue, deployment.Labels[migrationDeploymentManagedByLabel])
		})
	}
}

// TestResumeMigrationDeploymentCompletesAdoptedUnavailableTarget verifies the cos phase completes
// a fully staged deployment whose availability has flapped, at both journal phases.
func TestResumeMigrationDeploymentCompletesAdoptedUnavailableTarget(t *testing.T) {
	for _, phase := range []string{"cos", "ce"} {
		t.Run(phase, func(t *testing.T) {
			// Protected and adopted, but the migrated operator's pods are currently unready.
			deployment := &ocv1.ClusterObjectDeployment{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "deployment-uid", Generation: 2, Annotations: map[string]string{
				migrationExecutionAnnotation: "job", migration.MigratedFromSubscriptionAnnotation: "operators/demo",
			}, Labels: map[string]string{migration.LabelOwnerName: "demo", migrationDeploymentManagedByLabel: migrationDeploymentManagedByValue}}, Spec: ocv1.ClusterObjectDeploymentSpec{Template: ocv1.ClusterObjectDeploymentTemplate{Spec: ocv1.ClusterObjectDeploymentTemplateSpec{ClusterObjectSetContent: ocv1.ClusterObjectSetContent{CollisionProtection: ocv1.CollisionProtectionPrevent}}}}, Status: ocv1.ClusterObjectDeploymentStatus{Conditions: []metav1.Condition{
				{Type: ocv1.ClusterObjectDeploymentTypeProgressing, Status: metav1.ConditionFalse, Reason: ocv1.ClusterObjectDeploymentReasonNewClusterObjectSetProgressed, ObservedGeneration: 2},
				{Type: ocv1.ClusterObjectDeploymentTypeAvailable, Status: metav1.ConditionFalse, ObservedGeneration: 2},
			}}}
			kubeClient := newMigrationTestClient(t, deployment)
			journal := &migrationJournal{JobID: "job", Phase: phase, Options: migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo"}, Recovery: operatorMigrationRecoverySnapshot{UseClusterObjectDeployment: true}}
			ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
			defer cancel()
			if phase == "ce" {
				require.NoError(t, ensureMigrationDeploymentAdopted(ctx, migration.NewMigrator(kubeClient, nil), journal))
			} else {
				require.NoError(t, resumeMigrationRevision(ctx, migration.NewMigrator(kubeClient, nil), journal))
			}
			assert.True(t, journal.Recovery.UseClusterObjectDeployment)
		})
	}
}

// TestResumeMigrationDeploymentWaitsThroughCompletedHandoffFlap verifies the rollout wait
// accepts a completed handoff whose availability flapped, even when the first read missed it.
func TestResumeMigrationDeploymentWaitsThroughCompletedHandoffFlap(t *testing.T) {
	// Protected and adopted with a completed rollout, but unavailable; the
	// first read misses the label, so the completed-handoff shortcut does not fire.
	deployment := &ocv1.ClusterObjectDeployment{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "deployment-uid", Generation: 2, Annotations: map[string]string{
		migrationExecutionAnnotation: "job", migration.MigratedFromSubscriptionAnnotation: "operators/demo",
	}, Labels: map[string]string{migration.LabelOwnerName: "demo", migrationDeploymentManagedByLabel: migrationDeploymentManagedByValue}}, Spec: ocv1.ClusterObjectDeploymentSpec{Template: ocv1.ClusterObjectDeploymentTemplate{Spec: ocv1.ClusterObjectDeploymentTemplateSpec{ClusterObjectSetContent: ocv1.ClusterObjectSetContent{CollisionProtection: ocv1.CollisionProtectionPrevent}}}}, Status: ocv1.ClusterObjectDeploymentStatus{Conditions: []metav1.Condition{
		{Type: ocv1.ClusterObjectDeploymentTypeProgressing, Status: metav1.ConditionFalse, Reason: ocv1.ClusterObjectDeploymentReasonNewClusterObjectSetProgressed, ObservedGeneration: 2},
		{Type: ocv1.ClusterObjectDeploymentTypeAvailable, Status: metav1.ConditionFalse, ObservedGeneration: 2},
	}}}
	base := newMigrationTestClient(t, deployment)
	reads := 0
	kubeClient := interceptor.NewClient(base.(client.WithWatch), interceptor.Funcs{Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
		if err := cl.Get(ctx, key, object, options...); err != nil {
			return err
		}
		if cod, ok := object.(*ocv1.ClusterObjectDeployment); ok && cod.Name == "demo" {
			reads++
			if reads == 1 {
				delete(cod.Labels, migrationDeploymentManagedByLabel)
			}
		}
		return nil
	}})
	journal := &migrationJournal{JobID: "job", Phase: "cos", Options: migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo"}, Recovery: operatorMigrationRecoverySnapshot{UseClusterObjectDeployment: true}}
	ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
	defer cancel()
	require.NoError(t, resumeMigrationRevision(ctx, migration.NewMigrator(kubeClient, nil), journal))
	assert.True(t, journal.Recovery.UseClusterObjectDeployment)
	assert.Greater(t, reads, 1)
}

// TestExtensionPhaseCreatesLegacyExtensionOnUnservedCluster verifies a legacy journal at ce
// creates its extension when the cluster never served the deployment API and no target exists.
func TestExtensionPhaseCreatesLegacyExtensionOnUnservedCluster(t *testing.T) {
	ctx := context.Background()
	id := "0123456789abcdef0123456789abcdef"
	opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators", SystemNamespace: "operator-controller"}
	annotations := map[string]string{migrationExecutionAnnotation: id, migration.MigratedFromSubscriptionAnnotation: "operators/demo"}
	cos := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", Annotations: annotations}, Status: ocv1.ClusterObjectSetStatus{CompletedAt: metav1.Now(), Conditions: []metav1.Condition{{Type: ocv1.ClusterObjectSetTypeReady, Status: metav1.ConditionTrue}}}}
	checkpoint := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: operatorMigrationCheckpointSecretName("demo"), Namespace: "operator-controller", Annotations: annotations}, Data: map[string][]byte{operatorMigrationCheckpointStateKey: []byte(operatorMigrationCheckpointInProgress)}}
	base := newMigrationTestClient(t, cos, checkpoint)
	// The cluster never served the deployment API, so the ce probe and the
	// create guard both keep the legacy path.
	kubeClient := interceptor.NewClient(base.(client.WithWatch), interceptor.Funcs{Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
		if _, ok := object.(*ocv1.ClusterObjectDeployment); ok {
			return &meta.NoKindMatchError{GroupKind: schema.GroupKind{Group: ocv1.GroupVersion.Group, Kind: ocv1.ClusterObjectDeploymentKind}}
		}
		if err := cl.Get(ctx, key, object, options...); err != nil {
			return err
		}
		if ce, ok := object.(*ocv1.ClusterExtension); ok && ce.Name == "demo" {
			// The created extension finishes installing while the phase waits.
			ce.Status = ocv1.ClusterExtensionStatus{Conditions: []metav1.Condition{{Type: ocv1.ClusterExtensionTypeInstalled, Status: metav1.ConditionTrue}}}
		}
		return nil
	}})
	c := &migrationCoordinator{client: kubeClient, identity: "replacement"}
	namespace, namespaceErr := migrationJobNamespace(id)
	require.NoError(t, namespaceErr)
	claimed, err := c.claim(ctx, namespace)
	require.NoError(t, err)
	require.True(t, claimed)
	journal := &migrationJournal{JobID: id, Phase: "ce", Options: opts, Info: migration.MigrationInfo{PackageName: "demo"}, Recovery: operatorMigrationRecoverySnapshot{ClusterExtensionName: "demo", ClusterObjectSetName: "demo-1", SubscriptionRef: "operators/demo"}}
	journal.Backup.ClusterServiceVersion = &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1.0.0", Namespace: "operators"}}
	guard := &migrationExecutionClient{Client: kubeClient, coordinator: c, namespace: namespace, id: id}
	require.NoError(t, c.advanceJournal(ctx, migration.NewMigrator(guard, nil), namespace, journal))
	assert.Equal(t, "done", journal.Phase)
	var extension ocv1.ClusterExtension
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKey{Name: "demo"}, &extension))
}

// TestExtensionPhaseWaitsForAppearedTarget verifies the ce phase waits for a same-job
// extension that appears between the create read and the guard recheck instead of
// failing the duplicate create, for both legacy and managed journals.
func TestExtensionPhaseWaitsForAppearedTarget(t *testing.T) {
	for _, managed := range []bool{false, true} {
		name := "legacy journal"
		if managed {
			name = "managed journal"
		}
		t.Run(name, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()
			id := "0123456789abcdef0123456789abcdef"
			opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators", SystemNamespace: "operator-controller"}
			annotations := map[string]string{migrationExecutionAnnotation: id, migration.MigratedFromSubscriptionAnnotation: "operators/demo"}
			// The extension is already committed by this job's lost create; creating it
			// again would fail with AlreadyExists.
			extension := &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", Annotations: annotations}}
			checkpoint := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: operatorMigrationCheckpointSecretName("demo"), Namespace: "operator-controller", Annotations: annotations}, Data: map[string][]byte{operatorMigrationCheckpointStateKey: []byte(operatorMigrationCheckpointInProgress)}}
			objects := []client.Object{extension, checkpoint}
			if managed {
				// A completed handoff: ensureMigrationDeploymentAdopted returns on its shortcut.
				objects = append(objects, &ocv1.ClusterObjectDeployment{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "deployment-uid", Generation: 2, Annotations: annotations, Labels: map[string]string{migration.LabelOwnerName: "demo", migrationDeploymentManagedByLabel: migrationDeploymentManagedByValue}}, Spec: ocv1.ClusterObjectDeploymentSpec{Template: ocv1.ClusterObjectDeploymentTemplate{Spec: ocv1.ClusterObjectDeploymentTemplateSpec{ClusterObjectSetContent: ocv1.ClusterObjectSetContent{CollisionProtection: ocv1.CollisionProtectionPrevent}}}}, Status: ocv1.ClusterObjectDeploymentStatus{Conditions: []metav1.Condition{
					{Type: ocv1.ClusterObjectDeploymentTypeProgressing, Status: metav1.ConditionFalse, Reason: ocv1.ClusterObjectDeploymentReasonNewClusterObjectSetProgressed, ObservedGeneration: 2},
					{Type: ocv1.ClusterObjectDeploymentTypeAvailable, Status: metav1.ConditionFalse, ObservedGeneration: 2},
				}}})
			}
			base := newMigrationTestClient(t, objects...)
			// The create read misses the extension; the guard recheck and the waiter find it.
			reads := 0
			kubeClient := interceptor.NewClient(base.(client.WithWatch), interceptor.Funcs{Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
				if ce, ok := object.(*ocv1.ClusterExtension); ok {
					reads++
					if reads == 1 {
						return apierrors.NewNotFound(schema.GroupResource{Group: ocv1.GroupVersion.Group, Resource: "clusterextensions"}, key.Name)
					}
					if err := cl.Get(ctx, key, object, options...); err != nil {
						return err
					}
					if reads >= 3 {
						ce.Status = ocv1.ClusterExtensionStatus{Conditions: []metav1.Condition{{Type: ocv1.ClusterExtensionTypeInstalled, Status: metav1.ConditionTrue}}}
					}
					return nil
				}
				return cl.Get(ctx, key, object, options...)
			}})
			c := &migrationCoordinator{client: kubeClient, identity: "replacement"}
			namespace, namespaceErr := migrationJobNamespace(id)
			require.NoError(t, namespaceErr)
			claimed, err := c.claim(ctx, namespace)
			require.NoError(t, err)
			require.True(t, claimed)
			journal := &migrationJournal{JobID: id, Phase: "ce", Options: opts, Info: migration.MigrationInfo{PackageName: "demo"}, Recovery: operatorMigrationRecoverySnapshot{UseClusterObjectDeployment: managed, ClusterExtensionName: "demo", ClusterObjectSetName: "demo-1", SubscriptionRef: "operators/demo"}}
			journal.Backup.ClusterServiceVersion = &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1.0.0", Namespace: "operators"}}
			guard := &migrationExecutionClient{Client: kubeClient, coordinator: c, namespace: namespace, id: id}
			require.NoError(t, c.advanceJournal(ctx, migration.NewMigrator(guard, nil), namespace, journal))
			assert.Equal(t, "done", journal.Phase)
		})
	}
}

// TestExtensionPhaseRejectsDisappearingTargetWithTerminatingRevision verifies the ce
// create guard rechecks the revision when a verified extension disappears between
// the probe and the create read on a cluster that never served the deployment API.
// It also pins that the appeared-target wait (TestExtensionPhaseWaitsForAppearedTarget)
// does not fire when the deployment API is unserved: the guard rejects instead of waiting.
func TestExtensionPhaseRejectsDisappearingTargetWithTerminatingRevision(t *testing.T) {
	ctx := context.Background()
	id := "0123456789abcdef0123456789abcdef"
	opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators", SystemNamespace: "operator-controller"}
	annotations := map[string]string{migrationExecutionAnnotation: id, migration.MigratedFromSubscriptionAnnotation: "operators/demo"}
	now := metav1.Now()
	cos := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", Annotations: annotations, DeletionTimestamp: &now, Finalizers: []string{"operators.demo/hold"}}, Status: ocv1.ClusterObjectSetStatus{CompletedAt: metav1.Now(), Conditions: []metav1.Condition{{Type: ocv1.ClusterObjectSetTypeReady, Status: metav1.ConditionTrue}}}}
	extension := &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", Annotations: annotations}}
	checkpoint := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: operatorMigrationCheckpointSecretName("demo"), Namespace: "operator-controller", Annotations: annotations}, Data: map[string][]byte{operatorMigrationCheckpointStateKey: []byte(operatorMigrationCheckpointInProgress)}}
	base := newMigrationTestClient(t, cos, extension, checkpoint)
	// The cluster never served the deployment API; the extension is visible to
	// the probe but vanishes before the create read.
	reads := 0
	kubeClient := interceptor.NewClient(base.(client.WithWatch), interceptor.Funcs{Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
		if _, ok := object.(*ocv1.ClusterObjectDeployment); ok {
			return &meta.NoKindMatchError{GroupKind: schema.GroupKind{Group: ocv1.GroupVersion.Group, Kind: ocv1.ClusterObjectDeploymentKind}}
		}
		if _, ok := object.(*ocv1.ClusterExtension); ok {
			reads++
			if reads > 1 {
				return apierrors.NewNotFound(schema.GroupResource{Group: ocv1.GroupVersion.Group, Resource: "clusterextensions"}, key.Name)
			}
		}
		return cl.Get(ctx, key, object, options...)
	}})
	c := &migrationCoordinator{client: kubeClient, identity: "replacement"}
	namespace, namespaceErr := migrationJobNamespace(id)
	require.NoError(t, namespaceErr)
	claimed, err := c.claim(ctx, namespace)
	require.NoError(t, err)
	require.True(t, claimed)
	journal := &migrationJournal{JobID: id, Phase: "ce", Options: opts, Info: migration.MigrationInfo{PackageName: "demo"}, Recovery: operatorMigrationRecoverySnapshot{ClusterExtensionName: "demo", ClusterObjectSetName: "demo-1", SubscriptionRef: "operators/demo"}}
	journal.Backup.ClusterServiceVersion = &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1.0.0", Namespace: "operators"}}
	guard := &migrationExecutionClient{Client: kubeClient, coordinator: c, namespace: namespace, id: id}
	err = c.advanceJournal(ctx, migration.NewMigrator(guard, nil), namespace, journal)
	require.ErrorContains(t, err, "ClusterObjectSet demo-1 is being deleted")
}

// TestExtensionAdoptionDuringHandoffWait verifies a deployment adopted by the live extension
// while the rollout wait runs counts as a completed handoff, at both resume phases.
func TestExtensionAdoptionDuringHandoffWait(t *testing.T) {
	for _, phase := range []string{"cos", "ce"} {
		t.Run(phase, func(t *testing.T) {
			// Protected but not yet labeled, and the protected rollout is not
			// observed; the adoption race fires while the wait polls.
			deployment := &ocv1.ClusterObjectDeployment{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "deployment-uid", Generation: 2, Annotations: map[string]string{
				migrationExecutionAnnotation: "job", migration.MigratedFromSubscriptionAnnotation: "operators/demo",
			}}, Spec: ocv1.ClusterObjectDeploymentSpec{Template: ocv1.ClusterObjectDeploymentTemplate{Spec: ocv1.ClusterObjectDeploymentTemplateSpec{ClusterObjectSetContent: ocv1.ClusterObjectSetContent{CollisionProtection: ocv1.CollisionProtectionPrevent}}}}, Status: migrationDeploymentStatus(1)}
			extension := &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "extension-uid"}}
			kubeClient := newMigrationTestClient(t, deployment, extension)
			gets := 0
			runner := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
				if err := cl.Get(ctx, key, object, options...); err != nil {
					return err
				}
				cod, ok := object.(*ocv1.ClusterObjectDeployment)
				if !ok {
					return nil
				}
				gets++
				if gets == 2 {
					// The extension adopts while the rollout wait polls; a real
					// controller only adopts a deployment it manages.
					controller := true
					cod.OwnerReferences = []metav1.OwnerReference{{APIVersion: ocv1.GroupVersion.String(), Kind: ocv1.ClusterExtensionKind, Name: "demo", UID: "extension-uid", Controller: &controller}}
					if cod.Labels == nil {
						cod.Labels = map[string]string{}
					}
					cod.Labels[migrationDeploymentManagedByLabel] = migrationDeploymentManagedByValue
					return cl.Update(ctx, cod)
				}
				return nil
			}})
			journal := &migrationJournal{JobID: "job", Phase: phase, Options: migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo"}, Recovery: operatorMigrationRecoverySnapshot{UseClusterObjectDeployment: true}}
			if phase == "cos" {
				require.NoError(t, resumeMigrationRevision(context.Background(), migration.NewMigrator(runner, nil), journal))
			} else {
				require.NoError(t, ensureMigrationDeploymentAdopted(context.Background(), migration.NewMigrator(runner, nil), journal))
			}
			assert.Equal(t, 3, gets)
		})
	}
}

// TestExtensionPhaseProbeRejectsForeignDeployment verifies the legacy-flag probe does not flip
// the recorded manager for a deployment belonging to another execution.
func TestExtensionPhaseProbeRejectsForeignDeployment(t *testing.T) {
	ctx := context.Background()
	id := "0123456789abcdef0123456789abcdef"
	opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators", SystemNamespace: "operator-controller"}
	foreign := &ocv1.ClusterObjectDeployment{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "deployment-uid", Generation: 2, Annotations: map[string]string{
		migrationExecutionAnnotation: "foreign", migration.MigratedFromSubscriptionAnnotation: "operators/demo",
	}}, Spec: ocv1.ClusterObjectDeploymentSpec{Template: ocv1.ClusterObjectDeploymentTemplate{Spec: ocv1.ClusterObjectDeploymentTemplateSpec{ClusterObjectSetContent: ocv1.ClusterObjectSetContent{CollisionProtection: ocv1.CollisionProtectionNone}}}}, Status: migrationDeploymentStatus(2)}
	kubeClient := newMigrationTestClient(t, foreign)
	c := &migrationCoordinator{client: kubeClient, identity: "replacement"}
	namespace, namespaceErr := migrationJobNamespace(id)
	require.NoError(t, namespaceErr)
	claimed, err := c.claim(ctx, namespace)
	require.NoError(t, err)
	require.True(t, claimed)
	journal := &migrationJournal{JobID: id, Phase: "ce", Options: opts, Info: migration.MigrationInfo{PackageName: "demo"}, Recovery: operatorMigrationRecoverySnapshot{ClusterExtensionName: "demo", ClusterObjectSetName: "demo-1", SubscriptionRef: "operators/demo"}}
	guard := &migrationExecutionClient{Client: kubeClient, coordinator: c, namespace: namespace, id: id}
	err = c.advanceJournal(ctx, migration.NewMigrator(guard, nil), namespace, journal)
	require.ErrorContains(t, err, "belongs to a different execution")
	assert.False(t, journal.Recovery.UseClusterObjectDeployment)
}

// TestExtensionPhaseRejectsLegacyRevisionOnServedCluster verifies the ce phase fails fast for a
// bare pre-deployment revision on a cluster that now serves the deployment API.
func TestExtensionPhaseRejectsLegacyRevisionOnServedCluster(t *testing.T) {
	ctx := context.Background()
	id := "0123456789abcdef0123456789abcdef"
	opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators", SystemNamespace: "operator-controller"}
	cos := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", Annotations: map[string]string{
		migrationExecutionAnnotation: id, migration.MigratedFromSubscriptionAnnotation: "operators/demo",
	}}, Status: ocv1.ClusterObjectSetStatus{CompletedAt: metav1.Now(), Conditions: []metav1.Condition{{Type: ocv1.ClusterObjectSetTypeReady, Status: metav1.ConditionTrue}}}}
	kubeClient := newMigrationTestClient(t, cos)
	c := &migrationCoordinator{client: kubeClient, identity: "replacement"}
	namespace, namespaceErr := migrationJobNamespace(id)
	require.NoError(t, namespaceErr)
	claimed, err := c.claim(ctx, namespace)
	require.NoError(t, err)
	require.True(t, claimed)
	journal := &migrationJournal{JobID: id, Phase: "ce", Options: opts, Info: migration.MigrationInfo{PackageName: "demo"}, Recovery: operatorMigrationRecoverySnapshot{ClusterExtensionName: "demo", ClusterObjectSetName: "demo-1", SubscriptionRef: "operators/demo"}}
	guard := &migrationExecutionClient{Client: kubeClient, coordinator: c, namespace: namespace, id: id}
	err = c.advanceJournal(ctx, migration.NewMigrator(guard, nil), namespace, journal)
	require.ErrorContains(t, err, "staged before ClusterObjectDeployment support")
	assert.False(t, journal.Recovery.UseClusterObjectDeployment)
}

// TestExtensionPhaseCompletesInstalledLegacyTarget verifies an existing, verified target
// extension completes the ce phase even when a bare pre-deployment revision remains,
// whether the extension is already installed or still installing.
func TestExtensionPhaseCompletesInstalledLegacyTarget(t *testing.T) {
	for _, installed := range []bool{true, false} {
		name := "installing target"
		if installed {
			name = "installed target"
		}
		t.Run(name, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()
			id := "0123456789abcdef0123456789abcdef"
			opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators", SystemNamespace: "operator-controller"}
			annotations := map[string]string{migrationExecutionAnnotation: id, migration.MigratedFromSubscriptionAnnotation: "operators/demo"}
			cos := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", Annotations: annotations}, Status: ocv1.ClusterObjectSetStatus{CompletedAt: metav1.Now(), Conditions: []metav1.Condition{{Type: ocv1.ClusterObjectSetTypeReady, Status: metav1.ConditionTrue}}}}
			extension := &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", Annotations: annotations}}
			if installed {
				extension.Status = ocv1.ClusterExtensionStatus{Conditions: []metav1.Condition{{Type: ocv1.ClusterExtensionTypeInstalled, Status: metav1.ConditionTrue}}}
			}
			checkpoint := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: operatorMigrationCheckpointSecretName("demo"), Namespace: "operator-controller", Annotations: annotations}, Data: map[string][]byte{operatorMigrationCheckpointStateKey: []byte(operatorMigrationCheckpointInProgress)}}
			base := newMigrationTestClient(t, cos, extension, checkpoint)
			migrationClient := client.Client(base)
			// Observed by the installation waiter, after the probe and create-branch reads.
			waiterSawInstalling, waiterSawInstalled := false, false
			if !installed {
				// The extension finishes installing only after the waiter's first
				// poll observes it as still installing.
				reads := 0
				migrationClient = interceptor.NewClient(base.(client.WithWatch), interceptor.Funcs{Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
					if err := cl.Get(ctx, key, object, options...); err != nil {
						return err
					}
					if ce, ok := object.(*ocv1.ClusterExtension); ok && ce.Name == "demo" {
						reads++
						if reads >= 4 {
							ce.Status = ocv1.ClusterExtensionStatus{Conditions: []metav1.Condition{{Type: ocv1.ClusterExtensionTypeInstalled, Status: metav1.ConditionTrue}}}
						}
						if reads >= 3 {
							installedCondition := false
							for _, condition := range ce.Status.Conditions {
								if condition.Type == ocv1.ClusterExtensionTypeInstalled && condition.Status == metav1.ConditionTrue {
									installedCondition = true
								}
							}
							if installedCondition {
								waiterSawInstalled = true
							} else {
								waiterSawInstalling = true
							}
						}
					}
					return nil
				}})
			}
			kubeClient := migrationClient
			c := &migrationCoordinator{client: kubeClient, identity: "replacement"}
			namespace, namespaceErr := migrationJobNamespace(id)
			require.NoError(t, namespaceErr)
			claimed, err := c.claim(ctx, namespace)
			require.NoError(t, err)
			require.True(t, claimed)
			journal := &migrationJournal{JobID: id, Phase: "ce", Options: opts, Info: migration.MigrationInfo{PackageName: "demo"}, Recovery: operatorMigrationRecoverySnapshot{ClusterExtensionName: "demo", ClusterObjectSetName: "demo-1", SubscriptionRef: "operators/demo"}}
			journal.Backup.ClusterServiceVersion = &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1.0.0", Namespace: "operators"}}
			guard := &migrationExecutionClient{Client: kubeClient, coordinator: c, namespace: namespace, id: id}
			require.NoError(t, c.advanceJournal(ctx, migration.NewMigrator(guard, nil), namespace, journal))
			assert.Equal(t, "done", journal.Phase)
			if !installed {
				// The waiter must observe the extension still installing before it completes.
				assert.True(t, waiterSawInstalling)
				assert.True(t, waiterSawInstalled)
			}
		})
	}
}

// TestExtensionPhaseCompletesAdoptedUnavailableTarget verifies a completed handoff does not
// re-require deployment availability when the target flaps after adoption.
func TestExtensionPhaseCompletesAdoptedUnavailableTarget(t *testing.T) {
	ctx := context.Background()
	id := "0123456789abcdef0123456789abcdef"
	opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators", SystemNamespace: "operator-controller"}
	annotations := map[string]string{migrationExecutionAnnotation: id, migration.MigratedFromSubscriptionAnnotation: "operators/demo"}
	// Protected and adopted, but the migrated operator's pods are currently unready.
	deployment := &ocv1.ClusterObjectDeployment{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "deployment-uid", Generation: 2, Annotations: annotations, Labels: map[string]string{migration.LabelOwnerName: "demo", migrationDeploymentManagedByLabel: migrationDeploymentManagedByValue}}, Spec: ocv1.ClusterObjectDeploymentSpec{Template: ocv1.ClusterObjectDeploymentTemplate{Spec: ocv1.ClusterObjectDeploymentTemplateSpec{ClusterObjectSetContent: ocv1.ClusterObjectSetContent{CollisionProtection: ocv1.CollisionProtectionPrevent}}}}, Status: ocv1.ClusterObjectDeploymentStatus{Conditions: []metav1.Condition{
		{Type: ocv1.ClusterObjectDeploymentTypeProgressing, Status: metav1.ConditionFalse, Reason: ocv1.ClusterObjectDeploymentReasonNewClusterObjectSetProgressed, ObservedGeneration: 2},
		{Type: ocv1.ClusterObjectDeploymentTypeAvailable, Status: metav1.ConditionFalse, ObservedGeneration: 2},
	}}}
	extension := &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", Annotations: annotations}, Status: ocv1.ClusterExtensionStatus{Conditions: []metav1.Condition{{Type: ocv1.ClusterExtensionTypeInstalled, Status: metav1.ConditionTrue}}}}
	checkpoint := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: operatorMigrationCheckpointSecretName("demo"), Namespace: "operator-controller", Annotations: annotations}, Data: map[string][]byte{operatorMigrationCheckpointStateKey: []byte(operatorMigrationCheckpointInProgress)}}
	kubeClient := newMigrationTestClient(t, deployment, extension, checkpoint)
	c := &migrationCoordinator{client: kubeClient, identity: "replacement"}
	namespace, namespaceErr := migrationJobNamespace(id)
	require.NoError(t, namespaceErr)
	claimed, err := c.claim(ctx, namespace)
	require.NoError(t, err)
	require.True(t, claimed)
	journal := &migrationJournal{JobID: id, Phase: "ce", Options: opts, Info: migration.MigrationInfo{PackageName: "demo"}, Recovery: operatorMigrationRecoverySnapshot{UseClusterObjectDeployment: true, ClusterExtensionName: "demo", ClusterObjectSetName: "demo-1", SubscriptionRef: "operators/demo"}}
	journal.Backup.ClusterServiceVersion = &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1.0.0", Namespace: "operators"}}
	guard := &migrationExecutionClient{Client: kubeClient, coordinator: c, namespace: namespace, id: id}
	require.NoError(t, c.advanceJournal(ctx, migration.NewMigrator(guard, nil), namespace, journal))
	assert.Equal(t, "done", journal.Phase)
}

// TestExtensionPhaseProbeSurfacesReadFailure verifies the legacy-flag probe wraps read errors.
func TestExtensionPhaseProbeSurfacesReadFailure(t *testing.T) {
	ctx := context.Background()
	id := "0123456789abcdef0123456789abcdef"
	opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators", SystemNamespace: "operator-controller"}
	kubeClient := newMigrationTestClient(t)
	denied := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
		if _, ok := object.(*ocv1.ClusterObjectDeployment); ok {
			return apierrors.NewForbidden(schema.GroupResource{Group: ocv1.GroupVersion.Group, Resource: "clusterobjectdeployments"}, key.Name, errors.New("delegated grant removed"))
		}
		return cl.Get(ctx, key, object, options...)
	}})
	c := &migrationCoordinator{client: kubeClient, identity: "backend"}
	namespace, namespaceErr := migrationJobNamespace(id)
	require.NoError(t, namespaceErr)
	claimed, err := c.claim(ctx, namespace)
	require.NoError(t, err)
	require.True(t, claimed)
	journal := &migrationJournal{JobID: id, Phase: "ce", Options: opts, Info: migration.MigrationInfo{PackageName: "demo"}}
	guard := &migrationExecutionClient{Client: denied, coordinator: c, namespace: namespace, id: id}
	err = c.advanceJournal(ctx, migration.NewMigrator(guard, nil), namespace, journal)
	require.ErrorContains(t, err, "Cannot read ClusterObjectDeployment demo")
}

// TestExtensionPhaseCreateGuardSurfacesRevisionReadFailure verifies the create guard
// wraps revision read errors that appear after the probe passed.
func TestExtensionPhaseCreateGuardSurfacesRevisionReadFailure(t *testing.T) {
	ctx := context.Background()
	id := "0123456789abcdef0123456789abcdef"
	opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators", SystemNamespace: "operator-controller"}
	kubeClient := newMigrationTestClient(t)
	// The revision is absent at the probe and unreadable at the create guard.
	reads := 0
	denied := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
		if _, ok := object.(*ocv1.ClusterObjectSet); ok {
			reads++
			if reads > 1 {
				return apierrors.NewForbidden(schema.GroupResource{Group: ocv1.GroupVersion.Group, Resource: "clusterobjectsets"}, key.Name, errors.New("delegated grant removed"))
			}
			return apierrors.NewNotFound(schema.GroupResource{Group: ocv1.GroupVersion.Group, Resource: "clusterobjectsets"}, key.Name)
		}
		return cl.Get(ctx, key, object, options...)
	}})
	c := &migrationCoordinator{client: kubeClient, identity: "backend"}
	namespace, namespaceErr := migrationJobNamespace(id)
	require.NoError(t, namespaceErr)
	claimed, err := c.claim(ctx, namespace)
	require.NoError(t, err)
	require.True(t, claimed)
	journal := &migrationJournal{JobID: id, Phase: "ce", Options: opts, Info: migration.MigrationInfo{PackageName: "demo"}}
	guard := &migrationExecutionClient{Client: denied, coordinator: c, namespace: namespace, id: id}
	err = c.advanceJournal(ctx, migration.NewMigrator(guard, nil), namespace, journal)
	require.ErrorContains(t, err, "Cannot read ClusterObjectSet demo-1")
}

// TestMigrationLibraryWaitsForCurrentClusterObjectSetReadinessWithoutChangingStatus verifies completion history never bypasses current handoff readiness.
func TestMigrationLibraryWaitsForCurrentClusterObjectSetReadinessWithoutChangingStatus(t *testing.T) {
	for _, tt := range []struct {
		name       string
		conditions []metav1.Condition
		archived   bool
		deleting   bool
		completed  bool
		ready      bool
		invalid    bool
	}{
		{name: "current Ready", conditions: []metav1.Condition{{Type: "Ready", Status: metav1.ConditionTrue, ObservedGeneration: 2, Reason: "AllObjectsReady"}}, completed: true, ready: true},
		{name: "legacy conditions", conditions: []metav1.Condition{{Type: "Succeeded", Status: metav1.ConditionTrue}, {Type: "Available", Status: metav1.ConditionTrue}}},
		{name: "legacy conditions with completion", conditions: []metav1.Condition{{Type: "Succeeded", Status: metav1.ConditionTrue}, {Type: "Available", Status: metav1.ConditionTrue}}, completed: true},
		{name: "rollout incomplete", conditions: []metav1.Condition{{Type: "Ready", Status: metav1.ConditionFalse, ObservedGeneration: 2, Reason: "RollingOut"}}},
		{name: "readiness unknown", conditions: []metav1.Condition{{Type: "Ready", Status: metav1.ConditionUnknown, ObservedGeneration: 2, Reason: "Reconciling"}}},
		{name: "stale readiness", conditions: []metav1.Condition{{Type: "Ready", Status: metav1.ConditionTrue, ObservedGeneration: 1, Reason: "AllObjectsReady"}}, completed: true},
		{name: "stale legacy success", conditions: []metav1.Condition{{Type: "Ready", Status: metav1.ConditionFalse, ObservedGeneration: 2, Reason: "RollingOut"}, {Type: "Succeeded", Status: metav1.ConditionTrue}, {Type: "Available", Status: metav1.ConditionTrue}}},
		{name: "archived revision", conditions: []metav1.Condition{{Type: "Ready", Status: metav1.ConditionTrue, ObservedGeneration: 2, Reason: "AllObjectsReady"}}, archived: true, completed: true},
		{name: "deletion pending", conditions: []metav1.Condition{{Type: "Ready", Status: metav1.ConditionTrue, ObservedGeneration: 2, Reason: "AllObjectsReady"}}, deleting: true, completed: true},
		{name: "invalid specification", conditions: []metav1.Condition{{Type: "Ready", Status: metav1.ConditionFalse, ObservedGeneration: 2, Reason: ocv1.ClusterObjectSetReasonInvalidSpecification, Message: "fixture validation failed"}}, invalid: true},
	} {
		t.Run(tt.name, func(t *testing.T) {
			cos := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", Generation: 2}, Spec: ocv1.ClusterObjectSetSpec{LifecycleState: ocv1.ClusterObjectSetLifecycleStateActive}, Status: ocv1.ClusterObjectSetStatus{Conditions: tt.conditions}}
			if tt.completed {
				cos.Status.CompletedAt = metav1.Now()
			}
			if tt.archived {
				cos.Spec.LifecycleState = ocv1.ClusterObjectSetLifecycleStateArchived
			}
			if tt.deleting {
				cos.DeletionTimestamp = &metav1.Time{Time: time.Now()}
				cos.Finalizers = []string{"fixture/hold"}
			}
			kubeClient := newMigrationTestClient(t, cos)
			guard := &migrationExecutionClient{Client: kubeClient}
			m := migration.NewMigrator(guard, nil)
			ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
			defer cancel()
			err := m.WaitForCOSSucceeded(ctx, cos.Name)
			if tt.completed {
				require.NoError(t, err)
			} else if tt.invalid {
				require.ErrorContains(t, err, "fixture validation failed")
			} else {
				require.ErrorIs(t, err, context.DeadlineExceeded)
			}
			readyCtx, cancelReady := context.WithTimeout(context.Background(), 50*time.Millisecond)
			defer cancelReady()
			err = m.WaitForClusterObjectSetAvailable(readyCtx, cos.Name)
			if tt.ready {
				require.NoError(t, err)
			} else {
				require.ErrorIs(t, err, context.DeadlineExceeded)
			}
			var stored ocv1.ClusterObjectSet
			require.NoError(t, kubeClient.Get(context.Background(), client.ObjectKeyFromObject(cos), &stored))
			assert.Equal(t, tt.conditions, stored.Status.Conditions)
		})
	}
}

// TestResumingHandoffUsesCompletedAtAndReadyCondition verifies a completed, ready revision permits resumed handoff to the extension.
func TestResumingHandoffUsesCompletedAtAndReadyCondition(t *testing.T) {
	ctx := context.Background()
	id := "0123456789abcdef0123456789abcdef"
	opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators", SystemNamespace: "operator-controller"}
	annotations := map[string]string{migrationExecutionAnnotation: id, migration.MigratedFromSubscriptionAnnotation: "operators/demo"}
	cos := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", Generation: 1, Annotations: annotations}, Status: ocv1.ClusterObjectSetStatus{Conditions: []metav1.Condition{{Type: "Ready", Status: metav1.ConditionTrue, ObservedGeneration: 1, Reason: "AllObjectsReady"}}}}
	extension := &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", Annotations: annotations}, Status: ocv1.ClusterExtensionStatus{Conditions: []metav1.Condition{{Type: ocv1.ClusterExtensionTypeInstalled, Status: metav1.ConditionTrue}}}}
	checkpoint := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: operatorMigrationCheckpointSecretName("demo"), Namespace: "operator-controller", Annotations: annotations}, Data: map[string][]byte{operatorMigrationCheckpointStateKey: []byte(operatorMigrationCheckpointInProgress)}}
	cos.Status.CompletedAt = metav1.Now()
	base := newMigrationTestClient(t, cos, extension, checkpoint)
	// The journal predates the deployment API; the cluster never served it.
	kubeClient := interceptor.NewClient(base.(client.WithWatch), interceptor.Funcs{Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
		if _, ok := object.(*ocv1.ClusterObjectDeployment); ok {
			return &meta.NoKindMatchError{GroupKind: schema.GroupKind{Group: ocv1.GroupVersion.Group, Kind: ocv1.ClusterObjectDeploymentKind}}
		}
		return cl.Get(ctx, key, object, options...)
	}})
	c := &migrationCoordinator{client: kubeClient, identity: "replacement"}
	namespace, namespaceErr := migrationJobNamespace(id)
	require.NoError(t, namespaceErr)
	claimed, err := c.claim(ctx, namespace)
	require.NoError(t, err)
	require.True(t, claimed)
	journal := &migrationJournal{JobID: id, Phase: "cos", Options: opts, Info: migration.MigrationInfo{PackageName: "demo"}, Backup: migration.Backup{ClusterServiceVersion: &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1", Namespace: "operators"}}}}
	require.NoError(t, c.saveJournal(ctx, namespace, journal))
	ctx, cancel := context.WithTimeout(ctx, time.Second)
	defer cancel()
	require.NoError(t, c.executeCandidate(ctx, migration.NewMigrator(kubeClient, nil), namespace, id, opts))
	saved, err := c.loadJournal(ctx, namespace, opts.SubscriptionNamespace, opts.SubscriptionName)
	require.NoError(t, err)
	assert.Equal(t, "done", saved.Phase)
	var linked ocv1.ClusterExtension
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(extension), &linked))
	assert.Equal(t, checkpoint.Name, linked.Annotations[operatorMigrationCheckpointAnnotation])
}

func TestRemigrationReleasesOnlyVerifiedOrphanedRevisionAnnotations(t *testing.T) {
	for _, tt := range []struct {
		name         string
		sourceChange func(*corev1.ServiceAccount)
		change       func(*corev1.ServiceAccount) []client.Object
		denied       bool
		preserve     bool
	}{
		{name: "orphaned source"},
		{name: "unverified source without ownership metadata", preserve: true, sourceChange: func(sa *corev1.ServiceAccount) {
			delete(sa.Labels, migration.LabelOwnerName)
		}},
		{name: "foreign OLMv1 label", preserve: true, sourceChange: func(sa *corev1.ServiceAccount) {
			sa.Labels[migration.LabelOwnerName] = "other"
			sa.Labels["olm.owner"], sa.Labels["olm.owner.namespace"], sa.Labels["olm.owner.kind"] = "demo.v1", "operators", "ClusterServiceVersion"
		}},
		{name: "CSV reference UID does not match backup", preserve: true, sourceChange: func(sa *corev1.ServiceAccount) {
			delete(sa.Labels, migration.LabelOwnerName)
			sa.OwnerReferences = []metav1.OwnerReference{{APIVersion: "operators.coreos.com/v1alpha1", Kind: "ClusterServiceVersion", Name: "demo.v1", UID: "another-csv"}}
		}},
		{name: "CSV labels in another namespace", preserve: true, sourceChange: func(sa *corev1.ServiceAccount) {
			delete(sa.Labels, migration.LabelOwnerName)
			sa.Namespace = "other-namespace"
			sa.Labels["olm.owner"], sa.Labels["olm.owner.namespace"], sa.Labels["olm.owner.kind"] = "demo.v1", "operators", "ClusterServiceVersion"
		}},
		{name: "restored CSV labels without OLMv1 label", sourceChange: func(sa *corev1.ServiceAccount) {
			delete(sa.Labels, migration.LabelOwnerName)
			sa.Labels["olm.owner"], sa.Labels["olm.owner.namespace"], sa.Labels["olm.owner.kind"] = "demo.v1", "operators", "ClusterServiceVersion"
		}},
		{name: "restored CSV owner reference without OLMv1 label", sourceChange: func(sa *corev1.ServiceAccount) {
			delete(sa.Labels, migration.LabelOwnerName)
			sa.OwnerReferences = []metav1.OwnerReference{{APIVersion: "operators.coreos.com/v1alpha1", Kind: "ClusterServiceVersion", Name: "demo.v1", UID: "restored-csv"}}
		}, change: func(sa *corev1.ServiceAccount) []client.Object {
			sa.OwnerReferences = nil // Simulate orphan deletion of the saved CSV.
			return nil
		}},
		{name: "CSV ownership changed", denied: true, sourceChange: func(sa *corev1.ServiceAccount) {
			delete(sa.Labels, migration.LabelOwnerName)
			sa.Labels["olm.owner"], sa.Labels["olm.owner.namespace"], sa.Labels["olm.owner.kind"] = "demo.v1", "operators", "ClusterServiceVersion"
		}, change: func(sa *corev1.ServiceAccount) []client.Object {
			sa.Labels["olm.owner"] = "other.v1"
			return nil
		}},
		{name: "another CSV reference", denied: true, change: func(sa *corev1.ServiceAccount) []client.Object {
			sa.OwnerReferences = []metav1.OwnerReference{{APIVersion: "operators.coreos.com/v1alpha1", Kind: "ClusterServiceVersion", Name: "other.v1", UID: "other-csv"}}
			return nil
		}},
		{name: "previous attempt already released marker", change: func(sa *corev1.ServiceAccount) []client.Object {
			delete(sa.Annotations, migrationResourceRevisionAnnotation)
			return nil
		}},
		{name: "replaced resource", denied: true, change: func(sa *corev1.ServiceAccount) []client.Object {
			sa.UID = "replacement"
			return nil
		}},
		{name: "changed revision", denied: true, change: func(sa *corev1.ServiceAccount) []client.Object {
			sa.Annotations[migrationResourceRevisionAnnotation] = "3"
			return nil
		}},
		{name: "changed owner label", denied: true, change: func(sa *corev1.ServiceAccount) []client.Object {
			sa.Labels[migration.LabelOwnerName] = "another"
			return nil
		}},
		{name: "deleting source", denied: true, change: func(sa *corev1.ServiceAccount) []client.Object {
			sa.DeletionTimestamp = &metav1.Time{Time: time.Now()}
			sa.Finalizers = []string{"fixture/hold"}
			return nil
		}},
		{name: "controlled source", denied: true, change: func(sa *corev1.ServiceAccount) []client.Object {
			sa.OwnerReferences = []metav1.OwnerReference{{APIVersion: "olm.operatorframework.io/v1", Kind: "ClusterObjectSet", Name: "other-1", UID: "other", Controller: new(true)}}
			return nil
		}},
		{name: "noncontroller revision reference", denied: true, change: func(sa *corev1.ServiceAccount) []client.Object {
			sa.OwnerReferences = []metav1.OwnerReference{{APIVersion: "olm.operatorframework.io/v1", Kind: "ClusterObjectSet", Name: "demo-2", UID: "old-revision"}}
			return nil
		}},
		{name: "existing target extension", denied: true, change: func(*corev1.ServiceAccount) []client.Object {
			return []client.Object{&ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo"}}}
		}},
		{name: "unlabeled initial revision", denied: true, change: func(*corev1.ServiceAccount) []client.Object {
			return []client.Object{&ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1"}}}
		}},
		{name: "existing later revision", denied: true, change: func(*corev1.ServiceAccount) []client.Object {
			return []client.Object{&ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-2", Labels: map[string]string{migration.LabelOwnerName: "demo"}}}}
		}},
	} {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			sa := &corev1.ServiceAccount{ObjectMeta: metav1.ObjectMeta{Name: "demo", Namespace: "operators", UID: "source", Labels: map[string]string{migration.LabelOwnerName: "demo", "customer": "preserved"}, Annotations: map[string]string{migrationResourceRevisionAnnotation: "2", "customer": "preserved"}}, AutomountServiceAccountToken: new(false)}
			if tt.sourceChange != nil {
				tt.sourceChange(sa)
			}
			original, err := runtime.DefaultUnstructuredConverter.ToUnstructured(sa)
			require.NoError(t, err)
			source := unstructured.Unstructured{Object: original}
			source.SetAPIVersion("v1")
			source.SetKind("ServiceAccount")
			journal := &migrationJournal{Options: migration.Options{ClusterExtensionName: "demo"}, SourceObjects: []unstructured.Unstructured{*source.DeepCopy()}, Info: migration.MigrationInfo{CollectedObjects: []unstructured.Unstructured{*source.DeepCopy()}}, Backup: migration.Backup{ClusterServiceVersion: &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1", Namespace: "operators", UID: "restored-csv"}}}}
			var objects []client.Object
			if tt.change != nil {
				objects = tt.change(sa)
			}
			objects = append(objects, sa)
			kubeClient := newMigrationTestClient(t, objects...)
			var before corev1.ServiceAccount
			require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(sa), &before))
			err = clearOrphanedMigrationRevisionAnnotations(ctx, kubeClient, journal)
			if tt.denied {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
				// Resume after a crash before the phase journal was saved.
				require.NoError(t, clearOrphanedMigrationRevisionAnnotations(ctx, kubeClient, journal))
				if !tt.preserve {
					delete(before.Annotations, migrationResourceRevisionAnnotation)
				}
				assert.Equal(t, source.GetAnnotations(), journal.Info.CollectedObjects[0].GetAnnotations(), "library rendering owns manifest cleanup; the source snapshot stays unchanged")
			}
			var after corev1.ServiceAccount
			require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(sa), &after))
			before.ResourceVersion = after.ResourceVersion
			assert.Equal(t, before, after, "only the verified orphaned revision annotation may change")
		})
	}
}

func TestRemigrationReleasesRevisionBeforeCreatingNewHandoff(t *testing.T) {
	ctx := context.Background()
	id := "0123456789abcdef0123456789abcdef"
	opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators"}
	source := unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": "v1", "kind": "ServiceAccount",
		"metadata": map[string]interface{}{
			"name": "demo", "namespace": "operators", "uid": "source",
			"labels":      map[string]interface{}{"olm.owner": "demo.v1", "olm.owner.namespace": "operators", "olm.owner.kind": "ClusterServiceVersion"},
			"annotations": map[string]interface{}{migrationResourceRevisionAnnotation: "2"},
		},
	}}
	kubeClient := newMigrationTestClient(t, &source)
	c := &migrationCoordinator{client: kubeClient, identity: "backend"}
	namespace, namespaceErr := migrationJobNamespace(id)
	require.NoError(t, namespaceErr)
	claimed, err := c.claim(ctx, namespace)
	require.NoError(t, err)
	require.True(t, claimed)
	journal := &migrationJournal{JobID: id, Phase: "scale", Options: opts, SourceObjects: []unstructured.Unstructured{*source.DeepCopy()}, Info: migration.MigrationInfo{CollectedObjects: []unstructured.Unstructured{*source.DeepCopy()}}, Backup: migration.Backup{ClusterServiceVersion: &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1", Namespace: "operators", UID: "restored-csv"}}}}
	require.NoError(t, c.saveJournal(ctx, namespace, journal))
	interrupted := errors.New("interrupt before creating new handoff")
	runner := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, obj client.Object, options ...client.GetOption) error {
		if _, ok := obj.(*ocv1.ClusterObjectSet); ok {
			saved, err := c.loadJournal(ctx, namespace, opts.SubscriptionNamespace, opts.SubscriptionName)
			if err != nil {
				return err
			}
			if saved.Phase == "cos" {
				return interrupted
			}
		}
		return cl.Get(ctx, key, obj, options...)
	}})
	m := migration.NewMigrator(&migrationExecutionClient{Client: runner, coordinator: c, namespace: namespace, id: id}, nil)
	require.ErrorIs(t, c.advanceJournal(ctx, m, namespace, journal), interrupted)
	var actual corev1.ServiceAccount
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(&source), &actual))
	assert.Equal(t, source.GetUID(), actual.UID)
	assert.NotContains(t, actual.Annotations, migrationResourceRevisionAnnotation)
	saved, err := c.loadJournal(ctx, namespace, opts.SubscriptionNamespace, opts.SubscriptionName)
	require.NoError(t, err)
	assert.Equal(t, "cos", saved.Phase)
	assert.Equal(t, "2", saved.Info.CollectedObjects[0].GetAnnotations()[migrationResourceRevisionAnnotation])
}

func TestRemigrationRevisionReleasePreservesConcurrentUpdates(t *testing.T) {
	ctx := context.Background()
	source := unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": "v1", "kind": "ServiceAccount",
		"metadata": map[string]interface{}{
			"name": "demo", "namespace": "operators", "uid": "source",
			"labels":      map[string]interface{}{migration.LabelOwnerName: "demo"},
			"annotations": map[string]interface{}{migrationResourceRevisionAnnotation: "2"},
		},
	}}
	kubeClient := newMigrationTestClient(t, &source)
	journal := &migrationJournal{Options: migration.Options{ClusterExtensionName: "demo"}, SourceObjects: []unstructured.Unstructured{*source.DeepCopy()}, Info: migration.MigrationInfo{CollectedObjects: []unstructured.Unstructured{*source.DeepCopy()}}}
	runner := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Update: func(ctx context.Context, cl client.WithWatch, obj client.Object, options ...client.UpdateOption) error {
		var concurrent corev1.ServiceAccount
		if err := cl.Get(ctx, client.ObjectKeyFromObject(obj), &concurrent); err != nil {
			return err
		}
		concurrent.Annotations["customer"] = "concurrent change"
		if err := cl.Update(ctx, &concurrent); err != nil {
			return err
		}
		return cl.Update(ctx, obj, options...)
	}})
	require.True(t, apierrors.IsConflict(clearOrphanedMigrationRevisionAnnotations(ctx, runner, journal)))
	var actual corev1.ServiceAccount
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(&source), &actual))
	assert.Equal(t, "2", actual.Annotations[migrationResourceRevisionAnnotation])
	assert.Equal(t, "concurrent change", actual.Annotations["customer"])
	require.NoError(t, clearOrphanedMigrationRevisionAnnotations(ctx, kubeClient, journal))
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(&source), &actual))
	assert.NotContains(t, actual.Annotations, migrationResourceRevisionAnnotation)
	assert.Equal(t, "concurrent change", actual.Annotations["customer"])
}

func TestResumeCannotAdoptResourcesFromAnotherExecution(t *testing.T) {
	ctx := context.Background()
	kubeClient := newMigrationTestClient(t, &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: "reference", Namespace: "system", Annotations: map[string]string{migrationExecutionAnnotation: "other"}}, Data: map[string][]byte{"object": []byte("bundle")}})
	c := &migrationCoordinator{client: kubeClient, identity: "backend"}
	claimed, err := c.claim(ctx, "checkpoint")
	require.NoError(t, err)
	require.True(t, claimed)
	guard := &migrationExecutionClient{Client: kubeClient, coordinator: c, namespace: "checkpoint", id: "current"}
	err = guard.Create(ctx, &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: "reference", Namespace: "system"}, Data: map[string][]byte{"object": []byte("bundle")}})
	require.Error(t, err)
	var secret corev1.Secret
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKey{Name: "reference", Namespace: "system"}, &secret))
	assert.Equal(t, "other", secret.Annotations[migrationExecutionAnnotation])
}

// TestExecutionCreateReconcilesDefaultedClusterExtension verifies a lost extension create
// reconciles when the API server defaulted the upgrade constraint policy.
func TestExecutionCreateReconcilesDefaultedClusterExtension(t *testing.T) {
	ctx := context.Background()
	// The committed extension carries the API server's defaulted policy.
	committed := &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", Annotations: map[string]string{migrationExecutionAnnotation: "current"}}, Spec: ocv1.ClusterExtensionSpec{Source: ocv1.SourceConfig{SourceType: ocv1.SourceTypeCatalog, Catalog: &ocv1.CatalogFilter{PackageName: "demo", UpgradeConstraintPolicy: ocv1.UpgradeConstraintPolicyCatalogProvided}}}}
	kubeClient := newMigrationTestClient(t, committed)
	c := &migrationCoordinator{client: kubeClient, identity: "backend"}
	claimed, err := c.claim(ctx, "checkpoint")
	require.NoError(t, err)
	require.True(t, claimed)
	guard := &migrationExecutionClient{Client: kubeClient, coordinator: c, namespace: "checkpoint", id: "current"}
	// The library's desired spec leaves the policy unset.
	desired := &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo"}, Spec: ocv1.ClusterExtensionSpec{Source: ocv1.SourceConfig{SourceType: ocv1.SourceTypeCatalog, Catalog: &ocv1.CatalogFilter{PackageName: "demo"}}}}
	require.NoError(t, guard.Create(ctx, desired))
}

func TestReinstalledOperatorMigrationReplacesOnlyItsCompletedCheckpoint(t *testing.T) {
	for _, tt := range []struct {
		name       string
		failDelete bool
		interrupt  bool
		unresolved bool
	}{
		{name: "migration completes"},
		{name: "early failure restores reinstalled operator", failDelete: true},
		{name: "backend resumes after checkpoint claim", interrupt: true},
		{name: "unfinished recovery does not offer another execution's rollback", unresolved: true},
	} {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			id := "0123456789abcdef0123456789abcdef"
			opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators", SystemNamespace: "operator-controller"}
			previous := &operatorMigrationRecoverySnapshot{ClusterExtensionName: "demo", ClusterObjectSetName: "demo-1", SubscriptionRef: "operators/demo", SubscriptionSpec: migrationTestSubscriptionSpec(), InstalledCSV: "demo.v1.0.0", InstalledCSVUID: "previous-csv"}
			previous.SubscriptionSpec.CatalogSource = "previous-catalog"
			checkpoint := newTestOperatorMigrationCheckpoint(t, previous)
			checkpoint.UID = "checkpoint-uid"
			checkpoint.Annotations = map[string]string{migrationExecutionAnnotation: "previous-execution"}
			checkpoint.Data[operatorMigrationCheckpointStateKey] = []byte(operatorMigrationCheckpointMigrated)
			if tt.unresolved {
				checkpoint.Data[operatorMigrationCheckpointStateKey] = []byte(operatorMigrationCheckpointRequired)
			}
			spec := migrationTestSubscriptionSpec()
			subscription := &operatorsv1alpha1.Subscription{ObjectMeta: metav1.ObjectMeta{Name: "demo", Namespace: "operators", UID: "reinstalled-subscription"}, Spec: &spec}
			csv := &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1.0.0", Namespace: "operators", UID: "reinstalled-csv"}, Status: operatorsv1alpha1.ClusterServiceVersionStatus{Phase: operatorsv1alpha1.CSVPhaseSucceeded}}
			kubeClient := newMigrationTestClient(t, checkpoint, subscription, csv, &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "operators"}})
			c := &migrationCoordinator{client: kubeClient, identity: "backend"}
			namespace, namespaceErr := migrationJobNamespace(id)
			require.NoError(t, namespaceErr)
			claimed, err := c.claim(ctx, namespace)
			require.NoError(t, err)
			require.True(t, claimed)
			journal := &migrationJournal{JobID: id, Phase: "checkpoint", Options: opts, Info: migration.MigrationInfo{PackageName: "demo"}, Backup: migration.Backup{Subscription: subscription.DeepCopy(), ClusterServiceVersion: csv.DeepCopy()}, Recovery: operatorMigrationRecoverySnapshot{ClusterExtensionName: "demo", ClusterObjectSetName: "demo-1", SubscriptionRef: "operators/demo", SubscriptionSpec: *subscription.Spec.DeepCopy(), InstalledCSV: csv.Name, InstalledCSVUID: csv.UID, Namespace: operatorMigrationNamespaceBackup{Name: "operators"}}}
			require.NoError(t, c.saveJournal(ctx, namespace, journal))
			if tt.interrupt {
				c.client = interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Update: func(ctx context.Context, cl client.WithWatch, obj client.Object, options ...client.UpdateOption) error {
					if obj.GetName() == migrationJournalName("operators", "demo") {
						return errors.New("journal write interrupted")
					}
					return cl.Update(ctx, obj, options...)
				}})
			}
			runner := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{
				Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
					if _, ok := object.(*ocv1.ClusterObjectDeployment); ok {
						// The cluster never served the deployment API.
						return &meta.NoKindMatchError{GroupKind: schema.GroupKind{Group: ocv1.GroupVersion.Group, Kind: ocv1.ClusterObjectDeploymentKind}}
					}
					return cl.Get(ctx, key, object, options...)
				},
				Delete: func(ctx context.Context, cl client.WithWatch, obj client.Object, options ...client.DeleteOption) error {
					if _, ok := obj.(*operatorsv1alpha1.ClusterServiceVersion); !ok {
						return cl.Delete(ctx, obj, options...)
					}
					if tt.failDelete {
						return errors.New("CSV deletion denied")
					}
					if err := cl.Delete(ctx, obj, options...); err != nil {
						return err
					}
					// Simulate ready handover targets after the source managers are removed.
					annotations := map[string]string{migrationExecutionAnnotation: id, migration.MigratedFromSubscriptionAnnotation: "operators/demo"}
					if err := cl.Create(ctx, &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", Annotations: annotations}, Status: ocv1.ClusterObjectSetStatus{CompletedAt: metav1.Now(), Conditions: []metav1.Condition{{Type: ocv1.ClusterObjectSetTypeReady, Status: metav1.ConditionTrue}}}}); err != nil {
						return err
					}
					return cl.Create(ctx, &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", Annotations: annotations}, Status: ocv1.ClusterExtensionStatus{Conditions: []metav1.Condition{{Type: ocv1.ClusterExtensionTypeInstalled, Status: metav1.ConditionTrue}}}})
				}})
			if tt.interrupt {
				require.ErrorIs(t, c.executeCandidate(ctx, migration.NewMigrator(runner, nil), namespace, id, opts), errMigrationSuspended)
				var claimedCheckpoint corev1.Secret
				require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(checkpoint), &claimedCheckpoint))
				assert.Equal(t, id, claimedCheckpoint.Annotations[migrationExecutionAnnotation])
				require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(subscription), &operatorsv1alpha1.Subscription{}))
				c.client = kubeClient
			}
			err = c.executeCandidate(ctx, migration.NewMigrator(runner, nil), namespace, id, opts)
			if tt.unresolved {
				var failure *operatorMigrationFailure
				require.ErrorAs(t, err, &failure)
				assert.ErrorContains(t, err, "already exists")
				assert.False(t, failure.rollbackAttempted)
				require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(subscription), &operatorsv1alpha1.Subscription{}))
				require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(csv), &operatorsv1alpha1.ClusterServiceVersion{}))
				var retained corev1.Secret
				require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(checkpoint), &retained))
				assert.Equal(t, checkpoint.Data, retained.Data)
				assert.Equal(t, checkpoint.Annotations, retained.Annotations)
			} else if tt.failDelete {
				require.ErrorContains(t, err, "rolled back automatically")
				var restored operatorsv1alpha1.Subscription
				require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(subscription), &restored))
				assert.Equal(t, subscription.Spec, restored.Spec)
				assert.Equal(t, csv.Name, restored.Status.InstalledCSV)
				assert.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKeyFromObject(checkpoint), &corev1.Secret{})))
			} else {
				require.NoError(t, err)
				var migrated corev1.Secret
				require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(checkpoint), &migrated))
				assert.Equal(t, id, migrated.Annotations[migrationExecutionAnnotation])
				assert.Equal(t, operatorMigrationCheckpointMigrated, string(migrated.Data[operatorMigrationCheckpointStateKey]))
				var saved operatorMigrationRecoverySnapshot
				require.NoError(t, json.Unmarshal(migrated.Data[operatorMigrationCheckpointDataKey], &saved))
				assert.Equal(t, csv.UID, saved.InstalledCSVUID)
				assert.Equal(t, *subscription.Spec, saved.SubscriptionSpec)
				var extension ocv1.ClusterExtension
				require.NoError(t, kubeClient.Get(ctx, client.ObjectKey{Name: "demo"}, &extension))
				assert.Equal(t, migrated.Name, extension.Annotations[operatorMigrationCheckpointAnnotation])
			}
		})
	}
}

func TestCompletedCheckpointReplacementPreservesRecoveryAndActiveTargets(t *testing.T) {
	for _, tt := range []struct {
		name   string
		change func(*corev1.Secret)
		target client.Object
	}{
		{name: "in progress", change: func(s *corev1.Secret) {
			s.Data[operatorMigrationCheckpointStateKey] = []byte(operatorMigrationCheckpointInProgress)
		}},
		{name: "recovery required", change: func(s *corev1.Secret) {
			s.Data[operatorMigrationCheckpointStateKey] = []byte(operatorMigrationCheckpointRequired)
		}},
		{name: "unknown state", change: func(s *corev1.Secret) { delete(s.Data, operatorMigrationCheckpointStateKey) }},
		{name: "unexpected type", change: func(s *corev1.Secret) { s.Type = corev1.SecretTypeOpaque }},
		{name: "missing execution", change: func(s *corev1.Secret) { s.Annotations = nil }},
		{name: "checkpoint deletion pending", change: func(s *corev1.Secret) {
			s.Finalizers = []string{"fixture/hold"}
			s.DeletionTimestamp = &metav1.Time{Time: time.Now()}
		}},
		{name: "checkpoint has finalizer", change: func(s *corev1.Secret) { s.Finalizers = []string{"fixture/hold"} }},
		{name: "checkpoint has owner reference", change: func(s *corev1.Secret) {
			s.OwnerReferences = []metav1.OwnerReference{{APIVersion: ocv1.GroupVersion.String(), Kind: "ClusterExtension", Name: "demo", UID: "previous-target"}}
		}},
		{name: "another owner", change: func(s *corev1.Secret) { s.Labels[operatorMigrationCheckpointOwnerLabel] = "other" }},
		{name: "invalid backup", change: func(s *corev1.Secret) { s.Data[operatorMigrationCheckpointDataKey] = []byte("invalid") }},
		{name: "another target backup", change: func(s *corev1.Secret) {
			s.Data[operatorMigrationCheckpointDataKey] = []byte(`{"clusterExtensionName":"other","clusterObjectSetName":"other-1"}`)
		}},
		{name: "ClusterExtension remains", target: &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo"}}},
		{name: "initial revision remains without label", target: &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1"}}},
		{name: "controller revision remains", target: &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-2", Labels: map[string]string{migration.LabelOwnerName: "demo"}}}},
		{name: "revision is terminating", target: &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-2", Labels: map[string]string{migration.LabelOwnerName: "demo"}, Finalizers: []string{"fixture/hold"}, DeletionTimestamp: &metav1.Time{Time: time.Now()}}}},
	} {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			snapshot := &operatorMigrationRecoverySnapshot{ClusterExtensionName: "demo", ClusterObjectSetName: "demo-1", SubscriptionRef: "operators/demo"}
			existing := newTestOperatorMigrationCheckpoint(t, snapshot)
			existing.Annotations = map[string]string{migrationExecutionAnnotation: "previous"}
			existing.Data[operatorMigrationCheckpointStateKey] = []byte(operatorMigrationCheckpointMigrated)
			if tt.change != nil {
				tt.change(existing)
			}
			objects := []client.Object{existing}
			if tt.target != nil {
				objects = append(objects, tt.target)
			}
			kubeClient := newMigrationTestClient(t, objects...)
			c := &migrationCoordinator{client: kubeClient, identity: "backend"}
			claimed, err := c.claim(ctx, "job")
			require.NoError(t, err)
			require.True(t, claimed)
			guard := &migrationExecutionClient{Client: kubeClient, coordinator: c, namespace: "job", id: "current"}
			require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(existing), existing))
			before := existing.DeepCopy()
			assert.True(t, apierrors.IsAlreadyExists(guard.Create(ctx, newTestOperatorMigrationCheckpoint(t, snapshot))))
			var retained corev1.Secret
			require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(existing), &retained))
			assert.Equal(t, *before, retained)
			if tt.target != nil {
				assert.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(tt.target), tt.target))
			}
		})
	}
}

func TestCompletedCheckpointReplacementUsesOptimisticConcurrency(t *testing.T) {
	ctx := context.Background()
	snapshot := &operatorMigrationRecoverySnapshot{ClusterExtensionName: "demo", ClusterObjectSetName: "demo-1", SubscriptionRef: "operators/demo"}
	existing := newTestOperatorMigrationCheckpoint(t, snapshot)
	existing.Annotations = map[string]string{migrationExecutionAnnotation: "previous"}
	existing.Data[operatorMigrationCheckpointStateKey] = []byte(operatorMigrationCheckpointMigrated)
	kubeClient := newMigrationTestClient(t, existing)
	c := &migrationCoordinator{client: kubeClient, identity: "backend"}
	claimed, err := c.claim(ctx, "job")
	require.NoError(t, err)
	require.True(t, claimed)
	competing := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Update: func(ctx context.Context, cl client.WithWatch, obj client.Object, options ...client.UpdateOption) error {
		var concurrent corev1.Secret
		if err := cl.Get(ctx, client.ObjectKeyFromObject(existing), &concurrent); err != nil {
			return err
		}
		concurrent.Annotations[migrationExecutionAnnotation] = "competing-execution"
		concurrent.Data[operatorMigrationCheckpointStateKey] = []byte(operatorMigrationCheckpointInProgress)
		if err := cl.Update(ctx, &concurrent); err != nil {
			return err
		}
		return cl.Update(ctx, obj, options...)
	}})
	guard := &migrationExecutionClient{Client: competing, coordinator: c, namespace: "job", id: "current"}
	require.True(t, apierrors.IsConflict(guard.Create(ctx, newTestOperatorMigrationCheckpoint(t, snapshot))))
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(existing), existing))
	assert.Equal(t, "competing-execution", existing.Annotations[migrationExecutionAnnotation])
	assert.Equal(t, operatorMigrationCheckpointInProgress, string(existing.Data[operatorMigrationCheckpointStateKey]))
}

func TestResumeAfterSourceSubscriptionWasDeleted(t *testing.T) {
	ctx := context.Background()
	id := "0123456789abcdef0123456789abcdef"
	opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators", SystemNamespace: "system"}
	annotations := map[string]string{migrationExecutionAnnotation: id, migration.MigratedFromSubscriptionAnnotation: "operators/demo"}
	csv := &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1.0.0", Namespace: "operators", UID: "csv-original"}}
	cos := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", Annotations: annotations}, Status: ocv1.ClusterObjectSetStatus{CompletedAt: metav1.Now(), Conditions: []metav1.Condition{{Type: ocv1.ClusterObjectSetTypeReady, Status: metav1.ConditionTrue}}}}
	extension := &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", Annotations: annotations}, Status: ocv1.ClusterExtensionStatus{Conditions: []metav1.Condition{{Type: ocv1.ClusterExtensionTypeInstalled, Status: metav1.ConditionTrue}}}}
	checkpoint := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: operatorMigrationCheckpointSecretName("demo"), Namespace: "system", Annotations: annotations}, Data: map[string][]byte{operatorMigrationCheckpointStateKey: []byte(operatorMigrationCheckpointInProgress)}}
	kubeClient := newMigrationTestClient(t, csv, cos, extension, checkpoint)
	// The journal predates the deployment API; the cluster never served it.
	legacyCluster := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
		if _, ok := object.(*ocv1.ClusterObjectDeployment); ok {
			return &meta.NoKindMatchError{GroupKind: schema.GroupKind{Group: ocv1.GroupVersion.Group, Kind: ocv1.ClusterObjectDeploymentKind}}
		}
		return cl.Get(ctx, key, object, options...)
	}})
	c := &migrationCoordinator{client: kubeClient, identity: "replacement"}
	namespace, namespaceErr := migrationJobNamespace(id)
	require.NoError(t, namespaceErr)
	claimed, err := c.claim(ctx, namespace)
	require.NoError(t, err)
	require.True(t, claimed)
	journal := &migrationJournal{JobID: id, Phase: "prepare", Options: opts, Info: migration.MigrationInfo{PackageName: "demo"}, Backup: migration.Backup{Subscription: &operatorsv1alpha1.Subscription{ObjectMeta: metav1.ObjectMeta{Name: "demo", Namespace: "operators", UID: "subscription-original"}}, ClusterServiceVersion: csv}}
	require.NoError(t, c.saveJournal(ctx, namespace, journal))
	migrator := migration.NewMigrator(legacyCluster, nil)
	var progress []migration.ProgressEvent
	migrator.Progress = func(event migration.ProgressEvent) { progress = append(progress, event) }
	require.NoError(t, c.executeCandidate(ctx, migrator, namespace, id, opts))
	require.NotEmpty(t, progress)
	assert.Equal(t, migration.ProgressEvent{Step: migration.ProgressStepPrepare, Status: migration.ProgressStarted, Target: "operators/demo"}, progress[0])
	assert.Equal(t, migration.ProgressEvent{Step: migration.ProgressStepCleanup, Status: migration.ProgressCompleted, Target: "operators/demo"}, progress[len(progress)-1])
	var source operatorsv1alpha1.ClusterServiceVersion
	assert.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKeyFromObject(csv), &source)))
	saved, err := c.loadJournal(ctx, namespace, "operators", "demo")
	require.NoError(t, err)
	assert.Equal(t, "done", saved.Phase)
}

func TestFailedHandoffPreservesActiveTargetAndDoesNotRestoreSource(t *testing.T) {
	ctx := context.Background()
	id := "0123456789abcdef0123456789abcdef"
	opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators", SystemNamespace: "system"}
	annotations := map[string]string{migrationExecutionAnnotation: id, migration.MigratedFromSubscriptionAnnotation: "operators/demo"}
	cos := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", Annotations: annotations}}
	checkpoint := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: operatorMigrationCheckpointSecretName("demo"), Namespace: "system", Annotations: annotations}, Data: map[string][]byte{operatorMigrationCheckpointStateKey: []byte(operatorMigrationCheckpointInProgress)}}
	kubeClient := newMigrationTestClient(t, cos, checkpoint)
	c := &migrationCoordinator{client: kubeClient, identity: "replacement"}
	namespace, namespaceErr := migrationJobNamespace(id)
	require.NoError(t, namespaceErr)
	_, err := c.claim(ctx, namespace)
	require.NoError(t, err)
	journal := &migrationJournal{JobID: id, Phase: "ce", Options: opts, Info: migration.MigrationInfo{PackageName: "demo", Channel: "stable"}}
	require.NoError(t, c.saveJournal(ctx, namespace, journal))
	denied := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{
		// The journal predates the deployment API; the cluster never served it,
		// so the ce probe is skipped and the extension denial is reached.
		Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
			if _, ok := object.(*ocv1.ClusterObjectDeployment); ok {
				return &meta.NoKindMatchError{GroupKind: schema.GroupKind{Group: ocv1.GroupVersion.Group, Kind: ocv1.ClusterObjectDeploymentKind}}
			}
			return cl.Get(ctx, key, object, options...)
		},
		Create: func(ctx context.Context, cl client.WithWatch, obj client.Object, options ...client.CreateOption) error {
			if _, ok := obj.(*ocv1.ClusterExtension); ok {
				return apierrors.NewForbidden(schema.GroupResource{Group: "olm.operatorframework.io", Resource: "clusterextensions"}, obj.GetName(), errors.New("fixture denies creation"))
			}
			return cl.Create(ctx, obj, options...)
		}})
	err = c.executeCandidate(ctx, migration.NewMigrator(denied, nil), namespace, id, opts)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "migration halted")
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(cos), &ocv1.ClusterObjectSet{}))
	assert.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKey{Name: "demo", Namespace: "operators"}, &operatorsv1alpha1.Subscription{})))
	saved, err := c.loadJournal(ctx, namespace, "operators", "demo")
	require.NoError(t, err)
	assert.False(t, saved.RolledBack)
	assert.Equal(t, "done", saved.Phase)
}

func TestCheckpointWriteFailureLeavesJobUnfinishedForReplacement(t *testing.T) {
	store := newMigrationJobStore()
	job, err := store.create("alice", operatorMigrationBulkRequest{Operators: []operatorMigrationOptionsRequest{{SubscriptionName: "demo", SubscriptionNamespace: "operators"}}})
	require.NoError(t, err)
	outage := errors.New("API unavailable")
	store.persist = func(operatorMigrationJobSnapshot) error { return outage }
	handler := &OLMHandler{migrationJobs: store}
	handler.runMigrationJob(job.ID, migration.NewMigrator(newMigrationTestClient(t), nil))
	assert.ErrorIs(t, store.persistenceError(), outage)
	snapshot, found := store.snapshotForRunner(job.ID)
	require.True(t, found)
	assert.Nil(t, snapshot.FinishedAt)
	assert.NotEqual(t, "Cancelled", snapshot.Status)
}

func TestResumeHonorsPreviouslyFailedItemWhenContinueOnErrorIsFalse(t *testing.T) {
	store := newMigrationJobStore()
	stop := false
	job, err := store.create("alice", operatorMigrationBulkRequest{ContinueOnError: &stop, Operators: []operatorMigrationOptionsRequest{{SubscriptionName: "first", SubscriptionNamespace: "operators"}, {SubscriptionName: "second", SubscriptionNamespace: "operators"}}})
	require.NoError(t, err)
	job.Items[0].Status = "Failed"
	handler := &OLMHandler{migrationJobs: store}
	handler.runMigrationJob(job.ID, migration.NewMigrator(newMigrationTestClient(t), nil))
	snapshot, _ := store.snapshotForRunner(job.ID)
	assert.Equal(t, "CompletedWithErrors", snapshot.Status)
	assert.Equal(t, "Skipped", snapshot.Items[1].Status)
}

// TestDelegatedCredentialsSurviveBackendReplacementWithoutRenewal verifies restart uses the original bounded token, never Console or user credentials.
func TestDelegatedCredentialsSurviveBackendReplacementWithoutRenewal(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/resource", r.URL.Path)
		assert.Equal(t, "Bearer delegated-migration-token", r.Header.Get("Authorization"))
		_, _ = w.Write([]byte(`{}`))
	}))
	defer server.Close()
	kubeClient := newMigrationTestClient(t, &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: migrationCredentialsSecretName, Namespace: "checkpoint"}, Data: map[string][]byte{
		"token": []byte("delegated-migration-token"), "expires": []byte(time.Now().Add(time.Hour).UTC().Format(time.RFC3339Nano)),
	}})
	for i := 0; i < 2; i++ {
		c := &migrationCoordinator{client: kubeClient, config: &rest.Config{Host: server.URL, BearerToken: "console-service-token"}}
		config, err := c.executionConfig("checkpoint")
		require.NoError(t, err)
		assert.Empty(t, config.BearerToken)
		transport, err := rest.TransportFor(config)
		require.NoError(t, err)
		response, err := (&http.Client{Transport: transport}).Get(server.URL + "/resource")
		require.NoError(t, err)
		require.NoError(t, response.Body.Close())
	}
}

func TestRecoveryCheckpointSurvivesAWriteFailureAfterSourceRestoration(t *testing.T) {
	ctx := context.Background()
	id := "0123456789abcdef0123456789abcdef"
	opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators", SystemNamespace: "system"}
	checkpoint := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: operatorMigrationCheckpointSecretName("demo"), Namespace: "system", Annotations: map[string]string{migrationExecutionAnnotation: id}}, Type: operatorMigrationCheckpointSecretType, Data: map[string][]byte{operatorMigrationCheckpointStateKey: []byte(operatorMigrationCheckpointRequired)}}
	kubeClient := newMigrationTestClient(t, checkpoint, &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "operators"}})
	c := &migrationCoordinator{client: kubeClient, identity: "replacement"}
	namespace, namespaceErr := migrationJobNamespace(id)
	require.NoError(t, namespaceErr)
	_, err := c.claim(ctx, namespace)
	require.NoError(t, err)
	journal := &migrationJournal{JobID: id, Phase: "recovery", Failure: "fixture failure", Options: opts, Recovery: operatorMigrationRecoverySnapshot{ClusterExtensionName: "demo", ClusterObjectSetName: "demo-1", SubscriptionRef: "operators/demo", Namespace: operatorMigrationNamespaceBackup{Name: "operators"}, SubscriptionSpec: operatorsv1alpha1.SubscriptionSpec{Package: "demo", CatalogSource: "fixture", CatalogSourceNamespace: "catalog"}}}
	require.NoError(t, c.saveJournal(ctx, namespace, journal))
	c.client = interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Update: func(ctx context.Context, cl client.WithWatch, obj client.Object, options ...client.UpdateOption) error {
		if obj.GetName() == migrationJournalName("operators", "demo") {
			return errors.New("checkpoint storage interrupted")
		}
		return cl.Update(ctx, obj, options...)
	}})
	err = c.executeCandidate(ctx, migration.NewMigrator(kubeClient, nil), namespace, id, opts)
	require.ErrorIs(t, err, errMigrationSuspended)
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKey{Name: "demo", Namespace: "operators"}, &operatorsv1alpha1.Subscription{}))
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(checkpoint), &corev1.Secret{}))
	c.client = kubeClient
	err = c.executeCandidate(ctx, migration.NewMigrator(kubeClient, nil), namespace, id, opts)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "rolled back automatically")
	assert.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKeyFromObject(checkpoint), &corev1.Secret{})))
	saved, err := c.loadJournal(ctx, namespace, "operators", "demo")
	require.NoError(t, err)
	assert.True(t, saved.RolledBack)
	assert.Equal(t, "done", saved.Phase)
}

func TestReplacementRunnerContinuesPersistedBatchWithinAuthorizationWindow(t *testing.T) {
	kubeClient := newMigrationTestClient(t)
	original := newMigrationJobStore()
	job, err := original.create("alice", operatorMigrationBulkRequest{Operators: []operatorMigrationOptionsRequest{{SubscriptionName: "finished", SubscriptionNamespace: "operators"}, {SubscriptionName: "active", SubscriptionNamespace: "operators"}, {SubscriptionName: "remaining", SubscriptionNamespace: "operators"}}})
	require.NoError(t, err)
	job.CreatedAt = time.Now().Add(-150 * time.Minute)
	job.Items[0].Status = "Succeeded"
	job.Items[1].Status = "Migrating"
	namespace := seedDurableMigrationJob(t, kubeClient, "alice", job)
	record, _, err := loadDurableMigrationJob(context.Background(), kubeClient, namespace)
	require.NoError(t, err)
	replacement := newMigrationJobStore()
	replacement.jobs[job.ID] = &operatorMigrationJob{operatorMigrationJobSnapshot: record.Snapshot, owner: record.Owner, candidates: record.Request.Operators, currentItem: -1}
	var executed []string
	handler := &OLMHandler{migrationJobs: replacement,
		migrationResumeCandidate: func(operatorMigrationOptionsRequest) (bool, error) { return true, nil },
		migrationExecute: func(ctx context.Context, _ *migration.Migrator, options migration.Options) error {
			require.NoError(t, ctx.Err())
			executed = append(executed, options.SubscriptionName)
			return nil
		},
	}
	handler.runMigrationJob(job.ID, migration.NewMigrator(kubeClient, nil))
	assert.Equal(t, []string{"active", "remaining"}, executed)
	snapshot, _ := replacement.snapshotForRunner(job.ID)
	assert.Equal(t, "Succeeded", snapshot.Status)
	for _, item := range snapshot.Items {
		assert.Equal(t, "Succeeded", item.Status)
	}
}

func TestCollectionListsOnlyTheDelegatedNamespaces(t *testing.T) {
	ctx := context.Background()
	objects := []client.Object{}
	for _, namespace := range []string{"source", "related", "outside"} {
		objects = append(objects, &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: "owned", Namespace: namespace, Labels: map[string]string{"olm.owner": "demo"}}})
	}
	mapper := meta.NewDefaultRESTMapper([]schema.GroupVersion{corev1.SchemeGroupVersion})
	mapper.Add(corev1.SchemeGroupVersion.WithKind("Secret"), meta.RESTScopeNamespace)
	kubeClient := fake.NewClientBuilder().WithScheme(newMigrationTestClient(t).Scheme()).WithObjects(objects...).WithRESTMapper(mapper).Build()
	scoped := interceptor.NewClient(kubeClient, interceptor.Funcs{List: func(ctx context.Context, cl client.WithWatch, list client.ObjectList, options ...client.ListOption) error {
		namespace := (&client.ListOptions{}).ApplyOptions(options).Namespace
		require.NotEmpty(t, namespace, "collection must never ask for cluster-wide Secret access")
		if namespace == "denied" {
			return apierrors.NewForbidden(schema.GroupResource{Resource: "secrets"}, "", errors.New("not delegated"))
		}
		return cl.List(ctx, list, options...)
	}})
	collector := &migrationCollectionClient{Client: scoped, namespaces: []string{"source", "denied", "related"}, expected: map[string][]schema.GroupResource{"source": {{Resource: "secrets"}}, "related": {{Resource: "secrets"}}}}
	var secrets unstructured.UnstructuredList
	secrets.SetGroupVersionKind(corev1.SchemeGroupVersion.WithKind("SecretList"))
	require.NoError(t, collector.List(ctx, &secrets, client.MatchingLabels{"olm.owner": "demo"}))
	require.Len(t, secrets.Items, 2)
	assert.Equal(t, "source", secrets.Items[0].GetNamespace())
	assert.Equal(t, "related", secrets.Items[1].GetNamespace())
}

func TestRecoveryCannotAssociateAReplacedCSV(t *testing.T) {
	ctx := context.Background()
	subscription := &operatorsv1alpha1.Subscription{ObjectMeta: metav1.ObjectMeta{Name: "demo", Namespace: "operators"}}
	csv := &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1.0.0", Namespace: "operators", UID: "replacement"}}
	kubeClient := newMigrationTestClient(t, subscription, csv)
	snapshot := &operatorMigrationRecoverySnapshot{InstalledCSV: csv.Name, InstalledCSVUID: "original"}
	err := restoreOperatorMigrationCSVReference(ctx, kubeClient, client.ObjectKeyFromObject(subscription), snapshot)
	require.ErrorContains(t, err, "Another process replaced ClusterServiceVersion")
	var restored operatorsv1alpha1.Subscription
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(subscription), &restored))
	assert.Empty(t, restored.Status.InstalledCSV)
	assert.Empty(t, restored.Status.CurrentCSV)
}
