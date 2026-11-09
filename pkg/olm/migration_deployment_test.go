package olm

import (
	"context"
	"errors"
	"testing"
	"time"

	operatorsv1alpha1 "github.com/operator-framework/api/pkg/operators/v1alpha1"
	"github.com/operator-framework/library-olm/migration/pkg/migration"
	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/interceptor"
)

func migrationDeploymentStatus(generation int64) ocv1.ClusterObjectDeploymentStatus {
	return ocv1.ClusterObjectDeploymentStatus{Conditions: []metav1.Condition{
		{Type: ocv1.ClusterObjectDeploymentTypeProgressing, Status: metav1.ConditionFalse, Reason: ocv1.ClusterObjectDeploymentReasonNewClusterObjectSetProgressed, ObservedGeneration: generation},
		{Type: ocv1.ClusterObjectDeploymentTypeAvailable, Status: metav1.ConditionTrue, ObservedGeneration: generation},
	}}
}

func TestResumeMigrationDeployment(t *testing.T) {
	for _, tt := range []struct {
		name, reason string
		generation   int64
		foreign      bool
	}{
		{name: "completed current rollout", generation: 2},
		{name: "stale completion", generation: 1},
		{name: "deadline exceeded", generation: 2, reason: ocv1.ReasonProgressDeadlineExceeded},
		{name: "revision collision", generation: 2, reason: ocv1.ClusterObjectDeploymentReasonRevisionObjectCollision},
		{name: "foreign execution", generation: 2, foreign: true},
	} {
		t.Run(tt.name, func(t *testing.T) {
			deployment := &ocv1.ClusterObjectDeployment{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "deployment-uid", Generation: 2, Annotations: map[string]string{
				migrationExecutionAnnotation: "job", migration.MigratedFromSubscriptionAnnotation: "operators/demo",
			}}, Status: migrationDeploymentStatus(tt.generation)}
			if tt.foreign {
				deployment.Annotations[migrationExecutionAnnotation] = "foreign"
			}
			if tt.reason != "" {
				deployment.Status.Conditions[0].Reason = tt.reason
				deployment.Status.Conditions[0].Message = "rollout diagnostics"
			}
			kubeClient := newMigrationTestClient(t, deployment)
			runner := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Create: func(context.Context, client.WithWatch, client.Object, ...client.CreateOption) error {
				t.Fatal("resuming must reuse the original deployment")
				return nil
			}})
			journal := &migrationJournal{JobID: "job", Options: migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", UseClusterObjectDeployment: true}}
			ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
			defer cancel()
			err := resumeMigrationRevision(ctx, migration.NewMigrator(runner, nil), journal)
			switch {
			case tt.foreign:
				require.ErrorContains(t, err, "different execution")
			case tt.reason != "":
				require.ErrorContains(t, err, tt.reason)
				require.ErrorContains(t, err, "rollout diagnostics")
			case tt.generation != 2:
				require.ErrorIs(t, err, context.DeadlineExceeded)
			default:
				require.NoError(t, err)
			}
		})
	}
}

func TestLibrarySelectsMigrationManager(t *testing.T) {
	for _, cod := range []bool{false, true} {
		name := "legacy revision"
		if cod {
			name = "deployment"
		}
		t.Run(name, func(t *testing.T) {
			crds := []client.Object{&apiextensionsv1.CustomResourceDefinition{ObjectMeta: metav1.ObjectMeta{Name: "clusterobjectsets.olm.operatorframework.io"}, Status: apiextensionsv1.CustomResourceDefinitionStatus{Conditions: []apiextensionsv1.CustomResourceDefinitionCondition{{Type: apiextensionsv1.Established, Status: apiextensionsv1.ConditionTrue}}}}}
			if cod {
				crds = append(crds, &apiextensionsv1.CustomResourceDefinition{ObjectMeta: metav1.ObjectMeta{Name: "clusterobjectdeployments.olm.operatorframework.io"}, Status: apiextensionsv1.CustomResourceDefinitionStatus{Conditions: []apiextensionsv1.CustomResourceDefinitionCondition{{Type: apiextensionsv1.Established, Status: apiextensionsv1.ConditionTrue}}}})
			}
			kubeClient := newMigrationTestClient(t, crds...)
			var created client.Object
			stop := errors.New("stop before target rollout")
			runner := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Create: func(_ context.Context, _ client.WithWatch, object client.Object, _ ...client.CreateOption) error {
				created = object.DeepCopyObject().(client.Object)
				return stop
			}})
			guard := rollbackTestGuard(t, kubeClient, "")
			guard.Client = runner
			m := migration.NewMigrator(guard, nil)
			opts, err := m.PrepareClusterObjectSet(context.Background(), migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", SystemNamespace: "system"})
			require.NoError(t, err)
			assert.Equal(t, cod, opts.UseClusterObjectDeployment)
			err = m.CreateClusterObjectSet(context.Background(), opts, &migration.MigrationInfo{})
			require.ErrorIs(t, err, stop)
			require.NotNil(t, created)
			assert.Equal(t, guard.id, created.GetAnnotations()[migrationExecutionAnnotation])
			if cod {
				deployment, ok := created.(*ocv1.ClusterObjectDeployment)
				require.True(t, ok)
				assert.Equal(t, "operator-controller", deployment.Labels["apps.kubernetes.io/managed-by"])
				assert.Equal(t, ocv1.CollisionProtectionNone, deployment.Spec.Template.Spec.CollisionProtection)
			} else {
				revision, ok := created.(*ocv1.ClusterObjectSet)
				require.True(t, ok)
				assert.Equal(t, "demo", revision.Spec.Group)
				assert.Equal(t, "object-controller", revision.Labels["apps.kubernetes.io/managed-by"])
			}
		})
	}
}

func TestRollbackDeploymentPersistsOwnershipAcrossRetries(t *testing.T) {
	for _, adopted := range []bool{false, true} {
		name := "before extension creation"
		if adopted {
			name = "adopted deployment"
		}
		t.Run(name, func(t *testing.T) {
			ctx := context.Background()
			kubeClient, job, checkpoint, snapshot := seedFailedRollback(t)
			deployment := &ocv1.ClusterObjectDeployment{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "deployment-uid", Annotations: map[string]string{
				migrationExecutionAnnotation: job.ID, migration.MigratedFromSubscriptionAnnotation: snapshot.SubscriptionRef,
			}}}
			if adopted {
				extension := &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "extension-uid", Annotations: deployment.Annotations}}
				require.NoError(t, kubeClient.Create(ctx, extension))
				deployment.OwnerReferences = []metav1.OwnerReference{*metav1.NewControllerRef(extension, ocv1.GroupVersion.WithKind(ocv1.ClusterExtensionKind))}
			}
			require.NoError(t, kubeClient.Create(ctx, deployment))
			revision := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", UID: "revision-uid", Generation: 1, OwnerReferences: []metav1.OwnerReference{*metav1.NewControllerRef(deployment, ocv1.GroupVersion.WithKind(ocv1.ClusterObjectDeploymentKind))}}, Spec: ocv1.ClusterObjectSetSpec{Group: "demo"}, Status: ocv1.ClusterObjectSetStatus{Conditions: []metav1.Condition{{Type: ocv1.ClusterObjectSetTypeReady, Status: metav1.ConditionFalse, Reason: ocv1.ReasonBlocked, ObservedGeneration: 1}}}}
			require.NoError(t, kubeClient.Create(ctx, revision))
			reference := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: "packed", Namespace: checkpoint.Namespace, Labels: map[string]string{migration.LabelOwnerName: "demo"}, Annotations: map[string]string{migrationExecutionAnnotation: job.ID}}, Type: corev1.SecretType(migration.SecretTypeObjectData)}
			require.NoError(t, kubeClient.Create(ctx, reference))
			rollback := &operatorMigrationRollbackJob{SourceJobID: job.ID, CheckpointName: checkpoint.Name, CheckpointNamespace: checkpoint.Namespace, CheckpointUID: checkpoint.UID, Snapshot: *snapshot}
			guard := rollbackTestGuard(t, kubeClient, job.ID)
			guard.Client = interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Delete: func(ctx context.Context, cl client.WithWatch, object client.Object, options ...client.DeleteOption) error {
				if _, ok := object.(*ocv1.ClusterObjectSet); ok {
					require.True(t, apierrors.IsNotFound(cl.Get(ctx, client.ObjectKey{Name: "demo"}, &ocv1.ClusterObjectDeployment{})))
					return errors.New("revision cleanup interrupted")
				}
				return cl.Delete(ctx, object, options...)
			}})
			err := executeRollback(ctx, guard, rollback, func() error { t.Fatal("unfinished rollback"); return nil })
			require.ErrorContains(t, err, "revision cleanup interrupted")
			require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(checkpoint), checkpoint))
			assert.Equal(t, "deployment-uid", checkpoint.Annotations[rollbackDeploymentUIDAnnotation])
			assert.JSONEq(t, `{"demo-1":"revision-uid"}`, checkpoint.Annotations[rollbackRevisionUIDsAnnotation])
			// A replacement backend must accept the saved deployment UID even
			// though the revision still has a dangling controller reference.
			replacement := rollbackTestGuard(t, kubeClient, job.ID)
			rollback.TargetUID = ""
			require.NoError(t, bindRollbackTarget(ctx, replacement, rollback, checkpoint))
			assert.True(t, replacement.ownsRollbackRevision(revision))
			require.NoError(t, (&OLMHandler{}).rollbackFromOperatorMigrationCheckpoint(ctx, replacement, checkpoint, snapshot, true))
			assert.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKeyFromObject(reference), &corev1.Secret{})))
			require.NoError(t, kubeClient.Get(ctx, client.ObjectKey{Name: "demo", Namespace: "operators"}, &operatorsv1alpha1.Subscription{}))
		})
	}
}

func TestRollbackRejectsForeignDeploymentAndRevisionsBeforeStoppingControllers(t *testing.T) {
	for _, foreignDeployment := range []bool{false, true} {
		name := "foreign revision controller"
		if foreignDeployment {
			name = "foreign deployment execution"
		}
		t.Run(name, func(t *testing.T) {
			ctx := context.Background()
			kubeClient, job, checkpoint, snapshot := seedFailedRollback(t)
			annotations := map[string]string{migrationExecutionAnnotation: job.ID, migration.MigratedFromSubscriptionAnnotation: snapshot.SubscriptionRef}
			extension := &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "extension-uid", Annotations: annotations}}
			require.NoError(t, kubeClient.Create(ctx, extension))
			deployment := &ocv1.ClusterObjectDeployment{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "deployment-uid", Annotations: map[string]string{migrationExecutionAnnotation: job.ID, migration.MigratedFromSubscriptionAnnotation: snapshot.SubscriptionRef}}}
			if foreignDeployment {
				deployment.Annotations[migrationExecutionAnnotation] = "another-job"
			}
			require.NoError(t, kubeClient.Create(ctx, deployment))
			foreign := deployment.DeepCopy()
			foreign.UID = "foreign-deployment-uid"
			revision := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-2", UID: "revision-uid", OwnerReferences: []metav1.OwnerReference{*metav1.NewControllerRef(foreign, ocv1.GroupVersion.WithKind(ocv1.ClusterObjectDeploymentKind))}}, Spec: ocv1.ClusterObjectSetSpec{Group: "demo"}}
			require.NoError(t, kubeClient.Create(ctx, revision))
			rollback := &operatorMigrationRollbackJob{SourceJobID: job.ID, CheckpointName: checkpoint.Name, CheckpointNamespace: checkpoint.Namespace, CheckpointUID: checkpoint.UID, Snapshot: *snapshot}
			guard := rollbackTestGuard(t, kubeClient, job.ID)
			guard.Client = interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Delete: func(context.Context, client.WithWatch, client.Object, ...client.DeleteOption) error {
				t.Fatal("foreign ownership must be rejected before deleting resources")
				return nil
			}})
			err := executeRollback(ctx, guard, rollback, func() error { t.Fatal("must not restore"); return nil })
			require.True(t, apierrors.IsConflict(err), "%v", err)
		})
	}
}

// A restart between controller deletions must retain the verified extension identity.
func TestRollbackDeploymentResumesAfterExtensionDeletion(t *testing.T) {
	for _, tt := range []struct {
		name       string
		forgetUID  bool
		foreignUID bool
	}{
		{name: "verified deleted extension"},
		{name: "missing extension identity", forgetUID: true},
		{name: "different extension owner", foreignUID: true},
	} {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			kubeClient, job, checkpoint, snapshot := seedFailedRollback(t)
			snapshot.UseClusterObjectDeployment = true
			annotations := map[string]string{migrationExecutionAnnotation: job.ID, migration.MigratedFromSubscriptionAnnotation: snapshot.SubscriptionRef}
			extension := &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "extension-uid", Annotations: annotations}}
			require.NoError(t, kubeClient.Create(ctx, extension))
			deployment := &ocv1.ClusterObjectDeployment{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "deployment-uid", Annotations: annotations,
				OwnerReferences: []metav1.OwnerReference{*metav1.NewControllerRef(extension, ocv1.GroupVersion.WithKind(ocv1.ClusterExtensionKind))}}}
			require.NoError(t, kubeClient.Create(ctx, deployment))
			rollback := &operatorMigrationRollbackJob{SourceJobID: job.ID, CheckpointName: checkpoint.Name, CheckpointNamespace: checkpoint.Namespace, CheckpointUID: checkpoint.UID, Snapshot: *snapshot}
			guard := rollbackTestGuard(t, kubeClient, job.ID)
			interrupted := errors.New("deployment deletion interrupted")
			guard.Client = interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Delete: func(ctx context.Context, cl client.WithWatch, object client.Object, options ...client.DeleteOption) error {
				if _, ok := object.(*ocv1.ClusterObjectDeployment); ok {
					return interrupted
				}
				return cl.Delete(ctx, object, options...)
			}})
			require.ErrorIs(t, executeRollback(ctx, guard, rollback, func() error { t.Fatal("unfinished rollback"); return nil }), interrupted)
			require.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKeyFromObject(extension), &ocv1.ClusterExtension{})))
			require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(checkpoint), checkpoint))
			require.Equal(t, string(extension.UID), checkpoint.Annotations[rollbackTargetUIDAnnotation])
			if tt.forgetUID {
				delete(checkpoint.Annotations, rollbackTargetUIDAnnotation)
				require.NoError(t, kubeClient.Update(ctx, checkpoint))
			}
			if tt.foreignUID {
				deployment.OwnerReferences[0].UID = "foreign-extension-uid"
				require.NoError(t, kubeClient.Update(ctx, deployment))
			}
			rollback.TargetUID = "" // Only checkpoint state survives the interrupted execution.
			replacement := rollbackTestGuard(t, kubeClient, job.ID)
			err := bindRollbackTarget(ctx, replacement, rollback, checkpoint)
			if tt.forgetUID || tt.foreignUID {
				require.True(t, apierrors.IsConflict(err), "%v", err)
				require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(deployment), &ocv1.ClusterObjectDeployment{}))
				return
			}
			require.NoError(t, err)
			require.NoError(t, (&OLMHandler{}).rollbackFromOperatorMigrationCheckpoint(ctx, replacement, checkpoint, snapshot, true))
			require.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKeyFromObject(deployment), &ocv1.ClusterObjectDeployment{})))
			require.NoError(t, kubeClient.Get(ctx, client.ObjectKey{Name: "demo", Namespace: "operators"}, &operatorsv1alpha1.Subscription{}))
		})
	}
}

func TestMigrationDeploymentPlan(t *testing.T) {
	for _, deployment := range []bool{false, true} {
		plan := newOperatorMigrationPlan(migration.Options{ClusterExtensionName: "demo"}, &migration.MigrationInfo{UseClusterObjectDeployment: deployment})
		if deployment {
			assert.Equal(t, "demo", plan.ClusterObjectDeploymentName)
			assert.Empty(t, plan.ClusterObjectSetName)
			assert.Contains(t, plan.Actions, "Create ClusterObjectDeployment demo and wait for its current rollout to complete and become available.")
		} else {
			assert.Equal(t, "demo-1", plan.ClusterObjectSetName)
			assert.Empty(t, plan.ClusterObjectDeploymentName)
		}
	}
}
