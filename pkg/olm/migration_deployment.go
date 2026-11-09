package olm

import (
	"context"
	"fmt"
	"time"

	"github.com/operator-framework/library-olm/migration/pkg/migration"
	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/wait"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

const rollbackDeploymentUIDAnnotation = "console.openshift.io/operator-migration-rollback-deployment-uid"

// deploymentIdentityKnown also supports checkpoints written before the manager field was added.
func deploymentIdentityKnown(kubeClient client.Client) bool {
	guard, ok := kubeClient.(*migrationExecutionClient)
	return ok && guard.rollbackDeploymentUID != ""
}

// migrationDeployment tolerates clusters that only serve the legacy revision API.
func migrationDeployment(ctx context.Context, kubeClient client.Client, name string) (*ocv1.ClusterObjectDeployment, error) {
	var deployment ocv1.ClusterObjectDeployment
	if err := kubeClient.Get(ctx, client.ObjectKey{Name: name}, &deployment); err != nil {
		if apierrors.IsNotFound(err) || meta.IsNoMatchError(err) {
			return nil, nil
		}
		return nil, err
	}
	return &deployment, nil
}

// resumeMigrationRevision resumes the manager selected before the source was orphaned.
func resumeMigrationRevision(ctx context.Context, m *migration.Migrator, journal *migrationJournal) error {
	opts := journal.Options
	if opts.UseClusterObjectDeployment {
		deployment, err := migrationDeployment(ctx, m.Client, opts.ClusterExtensionName)
		if err != nil {
			return err
		}
		if deployment == nil {
			return m.CreateClusterObjectSet(ctx, opts, &journal.Info)
		}
		if err := verifyMigrationTarget(deployment, journal); err != nil {
			return err
		}
		return waitForMigrationDeployment(ctx, m.Client, deployment)
	}
	var revision ocv1.ClusterObjectSet
	if err := m.Client.Get(ctx, client.ObjectKey{Name: opts.ClusterExtensionName + "-1"}, &revision); err != nil {
		if apierrors.IsNotFound(err) {
			return m.CreateClusterObjectSet(ctx, opts, &journal.Info)
		}
		return err
	}
	if err := verifyMigrationTarget(&revision, journal); err != nil {
		return err
	}
	if err := m.WaitForCOSSucceeded(ctx, revision.Name); err != nil {
		return err
	}
	return m.WaitForClusterObjectSetAvailable(ctx, revision.Name)
}

// waitForMigrationDeployment rejects stale rollout status and terminal failures after a backend restart.
func waitForMigrationDeployment(ctx context.Context, kubeClient client.Client, expected *ocv1.ClusterObjectDeployment) error {
	return wait.PollUntilContextTimeout(ctx, time.Second, 10*time.Minute, true, func(ctx context.Context) (bool, error) {
		current, err := migrationDeployment(ctx, kubeClient, expected.Name)
		if err != nil {
			return false, err
		}
		if current == nil || current.UID != expected.UID || current.Generation != expected.Generation || current.DeletionTimestamp != nil {
			return false, fmt.Errorf("migration ClusterObjectDeployment %s was replaced, changed or deleted", expected.Name)
		}
		progress := meta.FindStatusCondition(current.Status.Conditions, ocv1.ClusterObjectDeploymentTypeProgressing)
		available := meta.FindStatusCondition(current.Status.Conditions, ocv1.ClusterObjectDeploymentTypeAvailable)
		if progress == nil || progress.ObservedGeneration != current.Generation || progress.Status != metav1.ConditionFalse {
			return false, nil
		}
		if progress.Reason != ocv1.ClusterObjectDeploymentReasonNewClusterObjectSetProgressed {
			return false, fmt.Errorf("ClusterObjectDeployment %s rollout failed (%s): %s", current.Name, progress.Reason, progress.Message)
		}
		return available != nil && available.ObservedGeneration == current.Generation && available.Status == metav1.ConditionTrue, nil
	})
}

// migrationRevisions includes grouped revisions whose legacy owner labels may be absent.
func migrationRevisions(ctx context.Context, kubeClient client.Client, name string) ([]ocv1.ClusterObjectSet, error) {
	var revisions ocv1.ClusterObjectSetList
	if err := kubeClient.List(ctx, &revisions); err != nil {
		return nil, err
	}
	selected := revisions.Items[:0]
	for _, revision := range revisions.Items {
		if revision.Spec.Group == name || revision.Spec.Group == "" && revision.Labels[migration.LabelOwnerName] == name {
			selected = append(selected, revision)
		}
	}
	return selected, nil
}

// bindMigrationDeployment saves verified identity before deletion can orphan its revisions.
func bindMigrationDeployment(ctx context.Context, kubeClient client.Client, checkpoint *corev1.Secret, snapshot *operatorMigrationRecoverySnapshot, extension *ocv1.ClusterExtension) (*ocv1.ClusterObjectDeployment, error) {
	deployment, err := migrationDeployment(ctx, kubeClient, snapshot.ClusterExtensionName)
	if err != nil {
		return nil, err
	}
	saved := types.UID(checkpoint.Annotations[rollbackDeploymentUIDAnnotation])
	if deployment != nil {
		if deployment.UID == "" || saved != "" && saved != deployment.UID || deployment.Annotations[migrationExecutionAnnotation] != checkpoint.Annotations[migrationExecutionAnnotation] ||
			deployment.Annotations[migration.MigratedFromSubscriptionAnnotation] != snapshot.SubscriptionRef {
			return nil, rollbackConflict("rollback deployment belongs to another execution")
		}
		if owner := metav1.GetControllerOf(deployment); owner != nil && (owner.APIVersion != ocv1.GroupVersion.String() || owner.Kind != ocv1.ClusterExtensionKind || owner.Name != extension.Name || owner.UID != extension.UID || extension.UID == "") {
			return nil, rollbackConflict("rollback deployment is controlled by another extension")
		}
		saved = deployment.UID
		if checkpoint.Annotations == nil {
			checkpoint.Annotations = map[string]string{}
		}
		if checkpoint.Annotations[rollbackDeploymentUIDAnnotation] != string(saved) {
			checkpoint.Annotations[rollbackDeploymentUIDAnnotation] = string(saved)
			if err := kubeClient.Update(ctx, checkpoint); err != nil {
				return nil, err
			}
		}
	}
	if guard, ok := kubeClient.(*migrationExecutionClient); ok {
		guard.rollbackDeploymentUID = saved
	}
	return deployment, nil
}
