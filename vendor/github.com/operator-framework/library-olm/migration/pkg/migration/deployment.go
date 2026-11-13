package migration

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"slices"

	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	apimeta "k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/wait"
	"k8s.io/client-go/util/retry"
	"sigs.k8s.io/controller-runtime/pkg/client"

	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	ocv1ac "github.com/operator-framework/operator-controller/applyconfigurations/api/v1"
)

const clusterObjectDeploymentCRDName = "clusterobjectdeployments.olm.operatorframework.io"

const rollbackDeploymentUIDsAnnotation = "olm.operatorframework.io/rollback-deployment-uids"

var deploymentNamePattern = regexp.MustCompile(`^[a-z]([a-z0-9-]*[a-z0-9])?$`)

func (m *Migrator) hasClusterObjectDeploymentCRD(ctx context.Context) (bool, error) {
	var crd apiextensionsv1.CustomResourceDefinition
	err := m.Client.Get(ctx, client.ObjectKey{Name: clusterObjectDeploymentCRDName}, &crd)
	if apierrors.IsNotFound(err) {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("discover ClusterObjectDeployment CRD: %w", err)
	}
	return true, nil
}

// prepareClusterObjectDeployment rejects incompatible APIs and occupied revision groups before migration.
func (m *Migrator) prepareClusterObjectDeployment(ctx context.Context, name string) error {
	if len(name) > 52 || !deploymentNamePattern.MatchString(name) {
		return fmt.Errorf("ClusterObjectDeployment name %q must be 1–52 lowercase letters, digits or hyphens, starting with a letter and ending with a letter or digit", name)
	}
	var crd apiextensionsv1.CustomResourceDefinition
	if err := m.Client.Get(ctx, client.ObjectKey{Name: clusterObjectDeploymentCRDName}, &crd); err != nil {
		return fmt.Errorf("ClusterObjectDeployment CRD is required for COD migration: %w", err)
	}
	established := false
	for _, condition := range crd.Status.Conditions {
		established = established || condition.Type == apiextensionsv1.Established && condition.Status == apiextensionsv1.ConditionTrue
	}
	if !established || crd.DeletionTimestamp != nil {
		return fmt.Errorf("ClusterObjectDeployment CRD is not established or is being deleted")
	}
	var cod ocv1.ClusterObjectDeployment
	if err := m.Client.Get(ctx, client.ObjectKey{Name: name}, &cod); err == nil {
		return fmt.Errorf("ClusterObjectDeployment %s already exists", name)
	} else if !apierrors.IsNotFound(err) {
		return fmt.Errorf("check ClusterObjectDeployment %s: %w", name, err)
	}
	// An existing group must not be taken over merely because its deployment
	// is absent. Check conflicting labels and names too, before any OLMv0 objects are deleted.
	var revisions ocv1.ClusterObjectSetList
	if err := m.Client.List(ctx, &revisions); err != nil {
		return fmt.Errorf("check migration revision group: %w", err)
	}
	for _, revision := range revisions.Items {
		if revision.Spec.Group == name || revision.Labels[LabelOwnerName] == name || revision.Name == name+"-1" {
			return fmt.Errorf("ClusterObjectSet %s already occupies migration group %s", revision.Name, name)
		}
	}
	return nil
}

func (m *Migrator) createClusterObjectDeployment(ctx context.Context, opts Options, info *MigrationInfo, phases []*ocv1ac.ClusterObjectSetPhaseApplyConfiguration, marker string, resources *createdMigrationResources) error {
	cod, err := buildClusterObjectDeployment(opts, info, phases, marker)
	if err != nil {
		return err
	}
	// Create rather than apply: an existing deployment may already manage
	// workloads, and its mutable template must never be overwritten here.
	if err := m.Client.Create(ctx, cod); err != nil {
		if createWasRejected(err) {
			return fmt.Errorf("create ClusterObjectDeployment: %w", err)
		}
		if !apierrors.IsAlreadyExists(err) && m.resolveCreatedObject(context.WithoutCancel(ctx), cod, marker) {
			resources.cod = cod
		} else {
			resources.ownershipUnknown = true
		}
		return fmt.Errorf("create ClusterObjectDeployment: %w", err)
	}
	resources.cod = cod
	return m.waitForDeployment(ctx, cod)
}

// waitForDeployment waits for the created deployment to complete its current rollout and become available.
func (m *Migrator) waitForDeployment(ctx context.Context, created *ocv1.ClusterObjectDeployment) error {
	return wait.PollUntilContextTimeout(ctx, cosWaitPollInterval, cosWaitTimeout, true, func(ctx context.Context) (bool, error) {
		var cod ocv1.ClusterObjectDeployment
		if err := m.Client.Get(ctx, client.ObjectKeyFromObject(created), &cod); err != nil {
			return false, err
		}
		if cod.UID != created.UID || cod.Generation != created.Generation || cod.DeletionTimestamp != nil {
			return false, fmt.Errorf("migration ClusterObjectDeployment %s was replaced, changed or deleted", cod.Name)
		}
		progress := apimeta.FindStatusCondition(cod.Status.Conditions, ocv1.ClusterObjectDeploymentTypeProgressing)
		available := apimeta.FindStatusCondition(cod.Status.Conditions, ocv1.ClusterObjectDeploymentTypeAvailable)
		if progress != nil && progress.ObservedGeneration == cod.Generation {
			if progress.Status == metav1.ConditionFalse && progress.Reason != ocv1.ClusterObjectDeploymentReasonNewClusterObjectSetProgressed {
				return false, fmt.Errorf("ClusterObjectDeployment %s rollout failed (%s): %s", cod.Name, progress.Reason, progress.Message)
			}
			if progress.Status == metav1.ConditionFalse && progress.Reason == ocv1.ClusterObjectDeploymentReasonNewClusterObjectSetProgressed &&
				available != nil && available.ObservedGeneration == cod.Generation && available.Status == metav1.ConditionTrue {
				return true, nil
			}
		}
		m.progress(ProgressEvent{Step: ProgressStepCreate, Status: ProgressWaiting, Message: fmt.Sprintf("Waiting for ClusterObjectDeployment %s rollout completion and availability", cod.Name)})
		return false, nil
	})
}

// rollbackDeployment permits the COD API to be absent, but never hides
// authorization or transport errors. A foreign deployment blocks rollback.
func (m *Migrator) rollbackDeployment(ctx context.Context, ce *ocv1.ClusterExtension) (*ocv1.ClusterObjectDeployment, error) {
	var cod ocv1.ClusterObjectDeployment
	if err := m.Client.Get(ctx, client.ObjectKey{Name: ce.Name}, &cod); err != nil {
		if apierrors.IsNotFound(err) || apimeta.IsNoMatchError(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("get rollback ClusterObjectDeployment: %w", err)
	}
	owner := metav1.GetControllerOf(&cod)
	if owner != nil {
		if owner.Kind != ocv1.ClusterExtensionKind || owner.Name != ce.Name || owner.UID != ce.UID || owner.APIVersion != ocv1.GroupVersion.String() {
			return nil, fmt.Errorf("ClusterObjectDeployment %s is controlled by another owner", cod.Name)
		}
	} else if cod.Annotations[migrationInvocationAnnotation] == "" || cod.Annotations[MigratedFromSubscriptionAnnotation] != ce.Annotations[MigratedFromSubscriptionAnnotation] {
		return nil, fmt.Errorf("ClusterObjectDeployment %s has no verified migration ownership", cod.Name)
	}
	return &cod, nil
}

// stopRollbackDeployment runs after CE deletion begins, including on each
// rollback poll to catch a CE reconciliation that was already in flight.
func (m *Migrator) stopRollbackDeployment(ctx context.Context, ce *ocv1.ClusterExtension) (bool, error) {
	cod, err := m.rollbackDeployment(ctx, ce)
	if err != nil || cod == nil {
		return cod == nil && err == nil, err
	}
	// Retain verified identity across orphan deletion, late-created revisions,
	// and retries. A dangling reference is safe only when its UID was verified.
	if err := m.rememberRollbackDeployment(ctx, ce, cod); err != nil {
		return false, err
	}
	if cod.DeletionTimestamp == nil {
		if err := m.deleteTrackedResource(ctx, cod, client.PropagationPolicy("Orphan")); client.IgnoreNotFound(err) != nil {
			return false, fmt.Errorf("stop rollback ClusterObjectDeployment: %w", err)
		}
	}
	return false, nil
}

func rollbackDeploymentUIDs(ce *ocv1.ClusterExtension) ([]types.UID, error) {
	var uids []types.UID
	if saved := ce.Annotations[rollbackDeploymentUIDsAnnotation]; saved != "" {
		if err := json.Unmarshal([]byte(saved), &uids); err != nil {
			return nil, fmt.Errorf("decode verified rollback deployment UIDs: %w", err)
		}
	}
	return uids, nil
}

// rememberRollbackDeployment must only receive a COD verified by rollbackDeployment.
func (m *Migrator) rememberRollbackDeployment(ctx context.Context, ce *ocv1.ClusterExtension, cod *ocv1.ClusterObjectDeployment) error {
	if cod == nil {
		return nil
	}
	if cod.UID == "" {
		return fmt.Errorf("cannot record rollback ClusterObjectDeployment %s without UID", cod.Name)
	}
	err := retry.RetryOnConflict(retry.DefaultRetry, func() error {
		var current ocv1.ClusterExtension
		if err := m.Client.Get(ctx, client.ObjectKeyFromObject(ce), &current); err != nil {
			return err
		}
		if current.UID != ce.UID {
			return fmt.Errorf("ClusterExtension %s changed during rollback", ce.Name)
		}
		uids, err := rollbackDeploymentUIDs(&current)
		if err != nil {
			return err
		}
		if !slices.Contains(uids, cod.UID) {
			before := current.DeepCopy()
			data, err := json.Marshal(append(uids, cod.UID))
			if err != nil {
				return err
			}
			if current.Annotations == nil {
				current.Annotations = map[string]string{}
			}
			current.Annotations[rollbackDeploymentUIDsAnnotation] = string(data)
			if err := m.Client.Patch(ctx, &current, client.MergeFromWithOptions(before, client.MergeFromWithOptimisticLock{})); err != nil {
				return err
			}
		}
		*ce = current
		return nil
	})
	if err != nil {
		return fmt.Errorf("save verified rollback deployment UID: %w", err)
	}
	return nil
}

// listMigrationRevisions selects migration revisions and rejects conflicting ownership identities.
func (m *Migrator) listMigrationRevisions(ctx context.Context, ce *ocv1.ClusterExtension, list *ocv1.ClusterObjectSetList) error {
	if err := m.Client.List(ctx, list); err != nil {
		return err
	}
	selected := list.Items[:0]
	for _, revision := range list.Items {
		if revision.Spec.Group == ce.Name || revision.Labels[LabelOwnerName] == ce.Name || revision.Name == ce.Name+"-1" {
			if err := m.validateRollbackRevision(ctx, &revision, ce); err != nil {
				return err
			}
			selected = append(selected, revision)
		}
	}
	list.Items = selected
	return nil
}

// validateRollbackRevision requires the expected revision group and verifies controller ancestry before deletion.
func (m *Migrator) validateRollbackRevision(ctx context.Context, revision *ocv1.ClusterObjectSet, ce *ocv1.ClusterExtension) error {
	name := ce.Name
	if revision.Spec.Group != name {
		return fmt.Errorf("migration ClusterObjectSet %s belongs to another group %q", revision.Name, revision.Spec.Group)
	}
	if owner := revision.Labels[LabelOwnerName]; owner != "" && owner != name {
		return fmt.Errorf("migration ClusterObjectSet %s belongs to another extension %q", revision.Name, owner)
	}
	owner := metav1.GetControllerOf(revision)
	if owner == nil {
		// Staging revisions and revisions orphaned during rollback have no
		// controller. Their required group was verified above.
		return nil
	}
	unverified := fmt.Errorf("migration ClusterObjectSet %s is controlled by another or unverified owner", revision.Name)
	if owner.APIVersion != ocv1.GroupVersion.String() || owner.Name != name || owner.UID == "" {
		return unverified
	}
	switch owner.Kind {
	case ocv1.ClusterExtensionKind:
		if owner.UID == ce.UID {
			return nil
		}
	case ocv1.ClusterObjectDeploymentKind:
		uids, err := rollbackDeploymentUIDs(ce)
		if err != nil {
			return err
		}
		if slices.Contains(uids, owner.UID) {
			return nil
		}
		cod, err := m.rollbackDeployment(ctx, ce)
		if err != nil {
			return err
		}
		if cod != nil && owner.UID == cod.UID {
			return nil
		}
	}
	return unverified
}

// buildClusterObjectDeployment constructs the same candidate for validation and creation.
func buildClusterObjectDeployment(opts Options, info *MigrationInfo, phases []*ocv1ac.ClusterObjectSetPhaseApplyConfiguration, marker string) (*ocv1.ClusterObjectDeployment, error) {
	annotations := map[string]string{
		MigratedFromSubscriptionAnnotation: fmt.Sprintf("%s/%s", opts.SubscriptionNamespace, opts.SubscriptionName),
		migrationInvocationAnnotation:      marker,
		LabelPackageName:                   info.PackageName,
		LabelBundleName:                    info.BundleName,
		LabelBundleVersion:                 info.Version,
	}
	if info.BundleImage != "" {
		annotations[LabelBundleReference] = info.BundleImage
	}
	configuration := ocv1ac.ClusterObjectDeployment(opts.ClusterExtensionName).
		WithAnnotations(annotations).
		WithLabels(map[string]string{LabelOwnerKind: ocv1.ClusterExtensionKind, LabelOwnerName: opts.ClusterExtensionName, controllerManagedByLabel: "operator-controller"}).
		WithSpec(ocv1ac.ClusterObjectDeploymentSpec().WithTemplate(
			ocv1ac.ClusterObjectDeploymentTemplate().
				WithMetadata(ocv1ac.ClusterObjectDeploymentTemplateMetadata().
					WithLabels(map[string]string{LabelOwnerKind: ocv1.ClusterExtensionKind, LabelOwnerName: opts.ClusterExtensionName}).
					WithAnnotations(annotations)).WithSpec(
				ocv1ac.ClusterObjectDeploymentTemplateSpec().WithPhases(phases...).WithCollisionProtection(ocv1.CollisionProtectionNone))))
	data, err := json.Marshal(configuration)
	if err != nil {
		return nil, fmt.Errorf("marshal ClusterObjectDeployment: %w", err)
	}
	var cod ocv1.ClusterObjectDeployment
	if err := json.Unmarshal(data, &cod); err != nil {
		return nil, fmt.Errorf("decode ClusterObjectDeployment: %w", err)
	}
	return &cod, nil
}
