package olm

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"time"

	"github.com/operator-framework/library-olm/migration/pkg/migration"
	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/wait"
	"k8s.io/client-go/util/retry"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

const rollbackDeploymentUIDAnnotation = "console.openshift.io/operator-migration-rollback-deployment-uid"

// migrationDeploymentManagedByLabel mirrors the library's controllerManagedByLabel.
const (
	migrationDeploymentManagedByLabel = "app.kubernetes.io/managed-by"
	migrationDeploymentManagedByValue = "operator-controller"
)

// migrationDeployment tolerates a missing deployment API for legacy journals and rollback lookups.
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

// resumeMigrationRevision resumes the manager recorded in the journal; a staged deployment takes precedence.
// Legacy journals resume their direct revision only where the deployment API is not served;
// served clusters reject the pre-deployment revision with rollback guidance.
func resumeMigrationRevision(ctx context.Context, m *migration.Migrator, journal *migrationJournal) error {
	opts := journal.Options
	deployment, err := migrationDeployment(ctx, m.Client, opts.ClusterExtensionName)
	if err != nil {
		return fmt.Errorf("Cannot read ClusterObjectDeployment %s. Check ClusterObjectDeployment read permissions, then retry recovery: %w", opts.ClusterExtensionName, err)
	}
	if deployment == nil && !journal.Recovery.UseClusterObjectDeployment {
		var revision ocv1.ClusterObjectSet
		if err := m.Client.Get(ctx, client.ObjectKey{Name: opts.ClusterExtensionName + "-1"}, &revision); err != nil {
			if !apierrors.IsNotFound(err) {
				return fmt.Errorf("Cannot read ClusterObjectSet %s. Check ClusterObjectSet read permissions, then retry recovery: %w", opts.ClusterExtensionName+"-1", err)
			}
		} else {
			// The legacy path retains annotation-only binding; the deployment path is UID-bound.
			if revision.DeletionTimestamp != nil {
				return fmt.Errorf("ClusterObjectSet %s is being deleted. Ask a cluster administrator to verify the migration target, then retry recovery.", revision.Name)
			}
			if err := verifyMigrationTarget(&revision, journal); err != nil {
				return err
			}
			// A revision staged before the deployment API cannot be adopted by
			// the current operator-controller once that API is served.
			if served, serr := migrationDeploymentServed(ctx, m.Client, opts.ClusterExtensionName); serr != nil {
				return fmt.Errorf("Cannot read ClusterObjectDeployment %s. Check ClusterObjectDeployment read permissions, then retry recovery: %w", opts.ClusterExtensionName, serr)
			} else if served {
				return fmt.Errorf("ClusterObjectSet %s was staged before ClusterObjectDeployment support. Roll back this migration and run it again so it can stage through a ClusterObjectDeployment.", revision.Name)
			}
			// A resumed direct revision keeps the recorded manager.
			if err := m.WaitForCOSSucceeded(ctx, revision.Name); err != nil {
				return err
			}
			return m.WaitForClusterObjectSetAvailable(ctx, revision.Name)
		}
	}
	if deployment == nil {
		if served, serr := migrationDeploymentServed(ctx, m.Client, opts.ClusterExtensionName); serr != nil {
			return fmt.Errorf("Cannot read ClusterObjectDeployment %s. Check ClusterObjectDeployment read permissions, then retry recovery: %w", opts.ClusterExtensionName, serr)
		} else if !served {
			return fmt.Errorf("The ClusterObjectDeployment API is not available, so the migration cannot stage its target. Roll back this migration and run it again after installing operator-controller with ClusterObjectDeployment support.")
		}
		if err := m.CreateClusterObjectSet(ctx, opts, &journal.Info); err != nil {
			return fmt.Errorf("Cannot stage the migration target: %w", err)
		}
		// The staged deployment is authoritative on retry; the flag is persisted when the journal advances.
		journal.Recovery.UseClusterObjectDeployment = true
		return nil
	}
	if err := verifyMigrationTarget(deployment, journal); err != nil {
		return err
	}
	journal.Recovery.UseClusterObjectDeployment = true
	if migrationDeploymentHandoffComplete(deployment) {
		return nil
	}
	err = waitForMigrationDeployment(ctx, m.Client, deployment, m.Progress)
	if err == nil {
		err = completeMigrationDeploymentHandoff(ctx, m.Client, deployment, m.Progress)
	}
	if err != nil {
		// Treat a failure after live-extension adoption as success.
		return adoptedDuringHandoff(ctx, m, journal, deployment, err)
	}
	return nil
}

// waitForMigrationDeployment rejects stale rollout status and terminal failures after a backend restart.
// The timeout is more generous than the library's staging wait; recovery tolerates slower controllers.
func waitForMigrationDeployment(ctx context.Context, kubeClient client.Client, expected *ocv1.ClusterObjectDeployment, progress migration.ProgressFunc) error {
	var collision error
	waits := 0
	err := wait.PollUntilContextTimeout(ctx, time.Second, 10*time.Minute, true, func(ctx context.Context) (bool, error) {
		current, err := migrationDeployment(ctx, kubeClient, expected.Name)
		if err != nil {
			return false, fmt.Errorf("Cannot read ClusterObjectDeployment %s. Check ClusterObjectDeployment read permissions, then retry recovery: %w", expected.Name, err)
		}
		if current == nil {
			return false, fmt.Errorf("ClusterObjectDeployment %s was deleted before its rollout completed. Review the deployment and migration failure notification with your cluster administrator.", expected.Name)
		}
		if err := verifyMigrationDeploymentIdentity(current, expected); err != nil {
			return false, err
		}
		if err := requireMigrationDeploymentHandoffState(current); err != nil {
			return false, err
		}
		collision = nil
		// A completed handoff is accepted without Available, which may flap after adoption.
		if migrationDeploymentRolloutComplete(current) || migrationDeploymentHandoffComplete(current) {
			return true, nil
		}
		if failed := migrationDeploymentRolloutFailure(current); failed != nil {
			failure := fmt.Errorf("ClusterObjectDeployment %s rollout failed (%s). Review its status and resolve the reported issue before retrying recovery: %s", current.Name, failed.Reason, failed.Message)
			if failed.Reason != ocv1.ClusterObjectDeploymentReasonRevisionObjectCollision {
				return false, failure
			}
			// Ownership can briefly collide while sibling revisions hand off.
			collision = failure
		}
		if progress != nil && waits%5 == 0 {
			// Poll faster than the library to shorten recovery; progress events
			// are throttled to the library's 5s cadence to limit job churn.
			progress(migration.ProgressEvent{Step: migration.ProgressStepCreate, Status: migration.ProgressWaiting, Message: fmt.Sprintf("Waiting for ClusterObjectDeployment %s rollout completion", expected.Name)})
		}
		waits++
		return false, nil
	})
	if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
		return errors.Join(err, collision)
	}
	return err
}

// completeMigrationDeploymentHandoff finishes the protected adoption that staging performs after a permissive rollout.
func completeMigrationDeploymentHandoff(ctx context.Context, kubeClient client.Client, expected *ocv1.ClusterObjectDeployment, progress migration.ProgressFunc) error {
	protected, err := protectMigrationDeployment(ctx, kubeClient, expected)
	if err != nil {
		return err
	}
	// The wait observes the protected generation; it returns immediately once observed.
	if err := waitForMigrationDeployment(ctx, kubeClient, protected, progress); err != nil {
		return err
	}
	return enableMigrationDeploymentAdoption(ctx, kubeClient, protected)
}

// ensureMigrationDeploymentAdopted completes a staged deployment's protected
// adoption when resuming at the ClusterExtension phase.
func ensureMigrationDeploymentAdopted(ctx context.Context, m *migration.Migrator, journal *migrationJournal) error {
	deployment, err := migrationDeployment(ctx, m.Client, journal.Options.ClusterExtensionName)
	if err != nil {
		return fmt.Errorf("Cannot read ClusterObjectDeployment %s. Check ClusterObjectDeployment read permissions, then retry recovery: %w", journal.Options.ClusterExtensionName, err)
	}
	if deployment == nil {
		if served, serr := migrationDeploymentServed(ctx, m.Client, journal.Options.ClusterExtensionName); serr != nil {
			return fmt.Errorf("Cannot read ClusterObjectDeployment %s. Check ClusterObjectDeployment read permissions, then retry recovery: %w", journal.Options.ClusterExtensionName, serr)
		} else if !served {
			return fmt.Errorf("The ClusterObjectDeployment API is not available, so the migration cannot resume. Install operator-controller with ClusterObjectDeployment support, then retry recovery.")
		}
		return fmt.Errorf("Cannot find ClusterObjectDeployment %s to resume its handoff. Ask a cluster administrator to verify the migration target, then retry recovery.", journal.Options.ClusterExtensionName)
	}
	if err := verifyMigrationTarget(deployment, journal); err != nil {
		return err
	}
	if deployment.DeletionTimestamp != nil {
		return fmt.Errorf("ClusterObjectDeployment %s is being deleted. Ask a cluster administrator to verify the migration target, then retry recovery.", deployment.Name)
	}
	owned, err := ownedByLiveMigrationExtension(ctx, m, journal, deployment)
	if err != nil {
		return err
	}
	if owned {
		return nil
	}
	if migrationDeploymentHandoffComplete(deployment) {
		return nil
	}
	err = waitForMigrationDeployment(ctx, m.Client, deployment, m.Progress)
	if err == nil {
		err = completeMigrationDeploymentHandoff(ctx, m.Client, deployment, m.Progress)
	}
	if err != nil {
		// The extension can adopt the deployment while the handoff runs; that is a completed handoff.
		return adoptedDuringHandoff(ctx, m, journal, deployment, err)
	}
	return nil
}

// legacyRevisionCreateError reports why a legacy revision cannot back a new extension.
func legacyRevisionCreateError(ctx context.Context, kubeClient client.Client, extensionName string) error {
	var revision ocv1.ClusterObjectSet
	if err := kubeClient.Get(ctx, client.ObjectKey{Name: extensionName + "-1"}, &revision); err == nil {
		if revision.DeletionTimestamp != nil {
			return fmt.Errorf("ClusterObjectSet %s is being deleted. Ask a cluster administrator to verify the migration target, then retry recovery.", revision.Name)
		}
		return fmt.Errorf("ClusterObjectSet %s was staged before ClusterObjectDeployment support. Roll back this migration and run it again so it can stage through a ClusterObjectDeployment.", revision.Name)
	} else if !apierrors.IsNotFound(err) {
		return fmt.Errorf("Cannot read ClusterObjectSet %s. Check ClusterObjectSet read permissions, then retry recovery: %w", extensionName+"-1", err)
	}
	return fmt.Errorf("No verified migration target exists for ClusterExtension %s. Roll back this migration and run it again so it can stage through a ClusterObjectDeployment.", extensionName)
}

// verifiedMigrationTarget reports whether the target extension exists and verifies,
// regardless of its install state. Read failures other than NotFound and a present
// but foreign target are returned so callers surface the actual conflict.
func verifiedMigrationTarget(ctx context.Context, m *migration.Migrator, journal *migrationJournal) (bool, error) {
	var extension ocv1.ClusterExtension
	if err := m.Client.Get(ctx, client.ObjectKey{Name: journal.Options.ClusterExtensionName}, &extension); err != nil {
		if apierrors.IsNotFound(err) {
			return false, nil
		}
		return false, fmt.Errorf("Cannot read ClusterExtension %s. Check ClusterExtension read permissions, then retry recovery: %w", journal.Options.ClusterExtensionName, err)
	}
	if err := verifyMigrationTarget(&extension, journal); err != nil {
		return false, err
	}
	return true, nil
}

// migrationDeploymentHandoffComplete reports a protected, adoption-enabled,
// unowned deployment whose current rollout completed. The label is only
// written after the protected rollout was observed, so Available must not be
// re-required (it may legitimately flap after adoption), but a newer
// generation that never completed must still block the shortcut.
func migrationDeploymentHandoffComplete(cod *ocv1.ClusterObjectDeployment) bool {
	progress := meta.FindStatusCondition(cod.Status.Conditions, ocv1.ClusterObjectDeploymentTypeProgressing)
	return cod.DeletionTimestamp == nil &&
		progress != nil && progress.ObservedGeneration == cod.Generation &&
		progress.Status == metav1.ConditionFalse &&
		progress.Reason == ocv1.ClusterObjectDeploymentReasonNewClusterObjectSetProgressed &&
		cod.Spec.Template.Spec.CollisionProtection == ocv1.CollisionProtectionPrevent &&
		!deploymentPhaseOverrides(cod) &&
		cod.Labels[migrationDeploymentManagedByLabel] == migrationDeploymentManagedByValue &&
		requireMigrationDeploymentHandoffState(cod) == nil
}

// adoptedDuringHandoff treats a failure that follows adoption by the live extension as success.
func adoptedDuringHandoff(ctx context.Context, m *migration.Migrator, journal *migrationJournal, observed *ocv1.ClusterObjectDeployment, failure error) error {
	if errors.Is(failure, errMigrationSuspended) || errors.Is(failure, context.Canceled) {
		return failure
	}
	current, err := migrationDeployment(ctx, m.Client, journal.Options.ClusterExtensionName)
	if err != nil || current == nil {
		return failure
	}
	if current.UID != observed.UID || current.DeletionTimestamp != nil {
		return failure
	}
	if err := verifyMigrationTarget(current, journal); err != nil {
		return failure
	}
	owned, err := ownedByLiveMigrationExtension(ctx, m, journal, current)
	if err != nil {
		return errors.Join(failure, err)
	}
	if !owned {
		return failure
	}
	return nil
}

// ownedByLiveMigrationExtension reports whether the live target extension controls the deployment.
func ownedByLiveMigrationExtension(ctx context.Context, m *migration.Migrator, journal *migrationJournal, deployment *ocv1.ClusterObjectDeployment) (bool, error) {
	owner := metav1.GetControllerOf(deployment)
	if owner == nil || owner.APIVersion != ocv1.GroupVersion.String() || owner.Kind != ocv1.ClusterExtensionKind || owner.Name != journal.Options.ClusterExtensionName {
		return false, nil
	}
	// The owner reference must still identify the live extension that adopted the deployment.
	var extension ocv1.ClusterExtension
	err := m.Client.Get(ctx, client.ObjectKey{Name: journal.Options.ClusterExtensionName}, &extension)
	if apierrors.IsNotFound(err) {
		return false, fmt.Errorf("ClusterObjectDeployment %s references a deleted ClusterExtension %s. Ask a cluster administrator to verify the migration target, then retry recovery.", deployment.Name, owner.Name)
	}
	if err == nil && (extension.UID == "" || owner.UID != extension.UID) {
		return false, fmt.Errorf("ClusterObjectDeployment %s references a replaced ClusterExtension %s. Ask a cluster administrator to verify the migration target, then retry recovery.", deployment.Name, owner.Name)
	}
	if err != nil {
		return false, fmt.Errorf("Cannot read ClusterExtension %s. Check ClusterExtension read permissions, then retry recovery: %w", owner.Name, err)
	}
	if extension.DeletionTimestamp != nil {
		return false, fmt.Errorf("ClusterExtension %s is being deleted. Ask a cluster administrator to verify the migration target, then retry recovery.", extension.Name)
	}
	if verifyMigrationTarget(deployment, journal) == nil &&
		(deployment.Spec.Template.Spec.CollisionProtection != ocv1.CollisionProtectionPrevent || deploymentPhaseOverrides(deployment)) {
		// Earlier library versions staged without protection; surface the legacy state
		// only for deployments this migration staged.
		message := fmt.Sprintf("ClusterObjectDeployment %s may have been adopted without collision protection", deployment.Name)
		if m.Progress != nil {
			m.Progress(migration.ProgressEvent{Step: migration.ProgressStepCreate, Status: migration.ProgressWarning, Message: message})
		}
		// The name is customer-derived; logs must omit customer resource identifiers.
		klog.Warning("OLM migration adoption: a staged deployment was adopted without collision protection")
	}
	// Ownership by the live extension proves the handoff completed: adoption
	// is gated on the label the migration applies only after protection. The
	// extension controls the template from here on.
	return true, nil
}

// migrationDeploymentServed reports whether the cluster serves the deployment API.
// NotFound still counts as served; a transient read failure reports served with
// the error so fail-closed callers run their own checks while fail-fast callers
// can surface the read error instead of acting on it.
func migrationDeploymentServed(ctx context.Context, kubeClient client.Client, name string) (bool, error) {
	var deployment ocv1.ClusterObjectDeployment
	err := kubeClient.Get(ctx, client.ObjectKey{Name: name}, &deployment)
	if err == nil || apierrors.IsNotFound(err) {
		return true, nil
	}
	if meta.IsNoMatchError(err) {
		return false, nil
	}
	return true, err
}

// migrationDeploymentRevisionHistoryDefault matches the operator-controller COD CRD's
// +kubebuilder:default for spec.revisionHistoryLimit.
const migrationDeploymentRevisionHistoryDefault = 5

// deploymentServedFailClosed reports served for any non-NoMatch outcome,
// keeping the drain fail-closed on transient read failures.
func deploymentServedFailClosed(ctx context.Context, kubeClient client.Client, name string) bool {
	served, err := migrationDeploymentServed(ctx, kubeClient, name)
	if err != nil {
		return true
	}
	return served
}

// verifyMigrationDeploymentIdentity rejects a deployment replaced, changed, or retargeted by another process.
// It checks the console's execution markers where the library's handoff checks its invocation marker.
func verifyMigrationDeploymentIdentity(current, expected *ocv1.ClusterObjectDeployment) error {
	if current.UID != expected.UID || current.Generation != expected.Generation || current.DeletionTimestamp != nil ||
		current.Annotations[migrationExecutionAnnotation] != expected.Annotations[migrationExecutionAnnotation] ||
		current.Annotations[migration.MigratedFromSubscriptionAnnotation] != expected.Annotations[migration.MigratedFromSubscriptionAnnotation] ||
		current.Labels[migration.LabelOwnerName] != expected.Labels[migration.LabelOwnerName] {
		return fmt.Errorf("ClusterObjectDeployment %s no longer matches the migration. Another process might have replaced, changed, or deleted it. Review the deployment and migration failure notification with your cluster administrator.", expected.Name)
	}
	return nil
}

// requireMigrationDeploymentHandoffState rejects deployments another controller manages;
// the library's adoption marker is accepted so interrupted handoffs resume.
func requireMigrationDeploymentHandoffState(cod *ocv1.ClusterObjectDeployment) error {
	if owner := metav1.GetControllerOf(cod); owner != nil {
		return fmt.Errorf("Another controller manages ClusterObjectDeployment %s. Ask a cluster administrator to verify its ownership before retrying recovery.", cod.Name)
	}
	if manager := cod.Labels[migrationDeploymentManagedByLabel]; manager != "" && manager != migrationDeploymentManagedByValue {
		return fmt.Errorf("ClusterObjectDeployment %s is managed by %s. Ask a cluster administrator to verify its ownership before retrying recovery.", cod.Name, manager)
	}
	return nil
}

// requireMigrationDeploymentRollout rejects stale status and terminal failures before mutating the deployment.
func requireMigrationDeploymentRollout(cod *ocv1.ClusterObjectDeployment) error {
	if migrationDeploymentRolloutComplete(cod) {
		return nil
	}
	if failed := migrationDeploymentRolloutFailure(cod); failed != nil {
		if failed.Reason == ocv1.ClusterObjectDeploymentReasonRevisionObjectCollision {
			return fmt.Errorf("ClusterObjectDeployment %s reported a revision object collision (%s). Ownership can briefly collide while sibling revisions hand off; wait for the collision to settle, then retry recovery: %s", cod.Name, failed.Reason, failed.Message)
		}
		return fmt.Errorf("ClusterObjectDeployment %s rollout failed (%s). Review its status and resolve the reported issue before retrying recovery: %s", cod.Name, failed.Reason, failed.Message)
	}
	return fmt.Errorf("ClusterObjectDeployment %s has not completed its rollout. Wait for the rollout to complete, then retry recovery.", cod.Name)
}

// migrationDeploymentRolloutComplete reports whether the controller observed a completed, available rollout.
func migrationDeploymentRolloutComplete(cod *ocv1.ClusterObjectDeployment) bool {
	progress := meta.FindStatusCondition(cod.Status.Conditions, ocv1.ClusterObjectDeploymentTypeProgressing)
	if progress == nil || progress.ObservedGeneration != cod.Generation || progress.Status != metav1.ConditionFalse || progress.Reason != ocv1.ClusterObjectDeploymentReasonNewClusterObjectSetProgressed {
		return false
	}
	available := meta.FindStatusCondition(cod.Status.Conditions, ocv1.ClusterObjectDeploymentTypeAvailable)
	return available != nil && available.ObservedGeneration == cod.Generation && available.Status == metav1.ConditionTrue
}

// migrationDeploymentRolloutFailure reports the terminal rollout failure condition, if any.
func migrationDeploymentRolloutFailure(cod *ocv1.ClusterObjectDeployment) *metav1.Condition {
	progress := meta.FindStatusCondition(cod.Status.Conditions, ocv1.ClusterObjectDeploymentTypeProgressing)
	if progress == nil || progress.ObservedGeneration != cod.Generation || progress.Status != metav1.ConditionFalse || progress.Reason == ocv1.ClusterObjectDeploymentReasonNewClusterObjectSetProgressed {
		return nil
	}
	return progress
}

// deploymentPhaseOverrides reports per-phase or per-object collision protection overrides.
func deploymentPhaseOverrides(cod *ocv1.ClusterObjectDeployment) bool {
	for _, phase := range cod.Spec.Template.Spec.Phases {
		if phase.CollisionProtection != "" {
			return true
		}
		for _, object := range phase.Objects {
			if object.CollisionProtection != "" {
				return true
			}
		}
	}
	return false
}

// loadMigrationDeploymentForHandoff reads the deployment and applies the shared fail-closed guards.
func loadMigrationDeploymentForHandoff(ctx context.Context, kubeClient client.Client, expected *ocv1.ClusterObjectDeployment, action string) (*ocv1.ClusterObjectDeployment, error) {
	var cod ocv1.ClusterObjectDeployment
	if err := kubeClient.Get(ctx, client.ObjectKeyFromObject(expected), &cod); err != nil {
		if apierrors.IsNotFound(err) {
			return nil, fmt.Errorf("ClusterObjectDeployment %s no longer matches the migration. Another process might have replaced, changed, or deleted it. Review the deployment and migration failure notification with your cluster administrator.", expected.Name)
		}
		return nil, fmt.Errorf("Cannot read ClusterObjectDeployment %s %s. Check ClusterObjectDeployment read permissions, then retry recovery: %w", expected.Name, action, err)
	}
	if err := verifyMigrationDeploymentIdentity(&cod, expected); err != nil {
		return nil, err
	}
	if err := requireMigrationDeploymentHandoffState(&cod); err != nil {
		return nil, err
	}
	return &cod, nil
}

// sameMigrationDeploymentBinding reports whether a reread keeps the deployment's
// identity and the migration's binding metadata. Generation is excluded so callers
// enforce their own invariant: protect tolerates its own +1 bump, enable requires
// an exact match. Controller ownership and the adoption label are not binding
// and are re-validated by the callers.
func sameMigrationDeploymentBinding(current, expected *ocv1.ClusterObjectDeployment) bool {
	return current.UID == expected.UID && current.DeletionTimestamp == nil &&
		current.Annotations[migrationExecutionAnnotation] == expected.Annotations[migrationExecutionAnnotation] &&
		current.Annotations[migration.MigratedFromSubscriptionAnnotation] == expected.Annotations[migration.MigratedFromSubscriptionAnnotation] &&
		current.Labels[migration.LabelOwnerName] == expected.Labels[migration.LabelOwnerName]
}

// protectMigrationDeployment switches the template to Prevent after the permissive
// rollout, mirroring the library's staging handoff. It is a no-op when protection
// is already in place.
func protectMigrationDeployment(ctx context.Context, kubeClient client.Client, expected *ocv1.ClusterObjectDeployment) (*ocv1.ClusterObjectDeployment, error) {
	var protected *ocv1.ClusterObjectDeployment
	err := retry.RetryOnConflict(retry.DefaultRetry, func() error {
		cod, err := loadMigrationDeploymentForHandoff(ctx, kubeClient, expected, "to protect it before adoption")
		if err != nil {
			return err
		}
		if cod.Spec.Template.Spec.CollisionProtection == ocv1.CollisionProtectionPrevent && !deploymentPhaseOverrides(cod) {
			// Already protected; the rollout is re-validated before adoption.
			protected = cod.DeepCopy()
			return nil
		}
		if err := requireMigrationDeploymentRollout(cod); err != nil {
			return err
		}
		before := cod.DeepCopy()
		cod.Spec.Template.Spec.CollisionProtection = ocv1.CollisionProtectionPrevent
		for i := range cod.Spec.Template.Spec.Phases {
			phase := &cod.Spec.Template.Spec.Phases[i]
			phase.CollisionProtection = ""
			for j := range phase.Objects {
				phase.Objects[j].CollisionProtection = ""
			}
		}
		if err := kubeClient.Patch(ctx, cod, client.MergeFromWithOptions(before, client.MergeFromWithOptimisticLock{})); err != nil {
			// A lost response may have committed the change; verify before failing.
			// Generations are monotonic, so at most this patch's own bump is expected,
			// and the spec must match the intended protection exactly.
			var current ocv1.ClusterObjectDeployment
			if getErr := kubeClient.Get(ctx, client.ObjectKeyFromObject(expected), &current); getErr == nil &&
				sameMigrationDeploymentBinding(&current, cod) && requireMigrationDeploymentHandoffState(&current) == nil &&
				(current.Generation == cod.Generation || current.Generation == cod.Generation+1) &&
				reflect.DeepEqual(current.Spec, cod.Spec) {
				protected = current.DeepCopy()
				return nil
			}
			return fmt.Errorf("Cannot protect ClusterObjectDeployment %s before adoption. Review the deployment and retry recovery: %w", cod.Name, err)
		}
		protected = cod.DeepCopy()
		return nil
	})
	if err != nil {
		return nil, err
	}
	return protected, nil
}

// enableMigrationDeploymentAdoption marks the deployment adoptable after its
// protected rollout, mirroring the library's staging handoff. It is a no-op
// when adoption is already enabled.
func enableMigrationDeploymentAdoption(ctx context.Context, kubeClient client.Client, expected *ocv1.ClusterObjectDeployment) error {
	return retry.RetryOnConflict(retry.DefaultRetry, func() error {
		cod, err := loadMigrationDeploymentForHandoff(ctx, kubeClient, expected, "to enable adoption")
		if err != nil {
			return err
		}
		if cod.Spec.Template.Spec.CollisionProtection != ocv1.CollisionProtectionPrevent || deploymentPhaseOverrides(cod) {
			return fmt.Errorf("ClusterObjectDeployment %s is not protected before adoption. Retry recovery so the migration can complete the protected handoff.", cod.Name)
		}
		if cod.Labels[migrationDeploymentManagedByLabel] == migrationDeploymentManagedByValue {
			// The handoff already completed; Available must not be re-required.
			return nil
		}
		if err := requireMigrationDeploymentRollout(cod); err != nil {
			return err
		}
		before := cod.DeepCopy()
		if cod.Labels == nil {
			cod.Labels = map[string]string{}
		}
		cod.Labels[migrationDeploymentManagedByLabel] = migrationDeploymentManagedByValue
		if err := kubeClient.Patch(ctx, cod, client.MergeFromWithOptions(before, client.MergeFromWithOptimisticLock{})); err != nil {
			// A lost response may have committed the label; verify before failing.
			// A label patch does not advance the generation; a concurrent spec
			// change shows as a newer generation and is rejected. Acceptance
			// requires the committed label, so adoption already completed and
			// Available is not re-required (it may flap after adoption).
			var current ocv1.ClusterObjectDeployment
			if getErr := kubeClient.Get(ctx, client.ObjectKeyFromObject(expected), &current); getErr == nil &&
				sameMigrationDeploymentBinding(&current, cod) && current.Generation == cod.Generation &&
				migrationDeploymentHandoffComplete(&current) {
				return nil
			}
			return fmt.Errorf("Cannot enable ClusterObjectDeployment %s adoption. Review the deployment and retry recovery: %w", cod.Name, err)
		}
		return nil
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
	extensionUID := extension.UID
	if extensionUID == "" {
		// Orphan deletion can leave this owner reference after the extension is
		// gone. Only an identity verified before deletion authorizes recovery.
		extensionUID = types.UID(checkpoint.Annotations[rollbackTargetUIDAnnotation])
	}
	if deployment != nil {
		if deployment.UID == "" || saved != "" && saved != deployment.UID || deployment.Annotations[migrationExecutionAnnotation] != checkpoint.Annotations[migrationExecutionAnnotation] ||
			deployment.Annotations[migration.MigratedFromSubscriptionAnnotation] != snapshot.SubscriptionRef {
			return nil, rollbackConflict("The rollback deployment does not match this migration job. Ask a cluster administrator to verify the deployment and recovery checkpoint before retrying rollback.")
		}
		if owner := metav1.GetControllerOf(deployment); owner != nil && (owner.APIVersion != ocv1.GroupVersion.String() || owner.Kind != ocv1.ClusterExtensionKind || owner.Name != snapshot.ClusterExtensionName || owner.UID != extensionUID || extensionUID == "") {
			return nil, rollbackConflict("Another controller manages the rollback deployment. Ask a cluster administrator to verify its ownership before retrying rollback.")
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
