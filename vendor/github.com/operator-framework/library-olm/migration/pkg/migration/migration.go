package migration

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/uuid"
	"k8s.io/apimachinery/pkg/util/wait"
	"sigs.k8s.io/controller-runtime/pkg/client"

	operatorsv1 "github.com/operator-framework/api/pkg/operators/v1"
	operatorsv1alpha1 "github.com/operator-framework/api/pkg/operators/v1alpha1"
	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	ocv1ac "github.com/operator-framework/operator-controller/applyconfigurations/api/v1"
)

const (
	clusterObjectSetCRDName      = "clusterobjectsets.olm.operatorframework.io"
	clusterExtensionCRDName      = "clusterextensions.olm.operatorframework.io"
	operatorControllerDeployName = "operator-controller-controller-manager"
)

// annotationPrefixesToStrip are annotation prefixes that should be removed from migrated resources.
var annotationPrefixesToStrip = []string{
	"kubectl.kubernetes.io/",
	"olm.operatorframework.io/installed-alongside",
	"deployment.kubernetes.io/",
}

// createdMigrationResources records only objects created by this invocation.
// Recovery must never infer ownership from predictable names or labels: another
// migration may have created objects with the same values after this one started.
type createdMigrationResources struct {
	cos              *ocv1.ClusterObjectSet
	secrets          []corev1.Secret
	ce               *ocv1.ClusterExtension
	ownershipUnknown bool
}

// MigrationResourcesResult records whether target resources may have started
// reconciling when CreateMigrationResources returns. Callers must not restart
// scaled source controllers while TargetMayBeActive is true.
type MigrationResourcesResult struct {
	TargetMayBeActive bool
}

const migrationInvocationAnnotation = "olm.operatorframework.io/migration-invocation"

// Migrate transfers one eligible OLMv0-managed Subscription to OLMv1. It checks
// readiness, compatibility, catalog availability, and target prerequisites
// before removing OLMv0 management. It backs up the Subscription spec in the
// ClusterExtension annotations, creates and waits for the migration
// ClusterObjectSet, creates and waits for the ClusterExtension, then cleans up
// OLMv0 artifacts. An optional disk backup is best-effort; failure to write it
// is reported through Progress when configured but does not stop migration.
//
// Migrate attempts recovery when a failure is known to be safe to reverse.
// Once the target may have started reconciling, it leaves source Deployments
// scaled down rather than risk two active controllers. An error can therefore
// represent a partial migration requiring inspection before retry or rollback.
func (m *Migrator) Migrate(ctx context.Context, opts Options) error {
	opts.ApplyDefaults()
	step := ProgressStepProfile
	m.progress(ProgressEvent{Step: step, Status: ProgressStarted, Message: "Profiling operator"})
	nextStep := func(next ProgressStep, message string) {
		m.progress(ProgressEvent{Step: step, Status: ProgressCompleted})
		step = next
		m.progress(ProgressEvent{Step: step, Status: ProgressStarted, Message: message})
	}
	err := m.migrate(ctx, opts, nextStep)
	if err != nil {
		m.progress(ProgressEvent{Step: step, Status: ProgressFailed, Message: err.Error(), Err: err})
	} else {
		m.progress(ProgressEvent{Step: step, Status: ProgressCompleted})
	}
	return err
}

func (m *Migrator) migrate(ctx context.Context, opts Options, nextStep func(ProgressStep, string)) error {
	_, csv, ip, err := m.GetCSVAndInstallPlan(ctx, opts)
	if err != nil {
		return fmt.Errorf("failed to profile operator: %w", err)
	}
	if err := m.ensureClusterExtensionAbsent(ctx, opts.ClusterExtensionName); err != nil {
		return err
	}

	info, err := m.validatedBundleInfo(ctx, opts, csv, ip)
	if err != nil {
		return fmt.Errorf("failed to get bundle info: %w", err)
	}
	resourceOpts := opts
	resourceOpts.InstallNamespace, err = opts.EffectiveInstallNamespace(info.PackageName, csv.GetAnnotations())
	if err != nil {
		return err
	}
	if err := validateSystemManagedInstallNamespace(resourceOpts); err != nil {
		return err
	}

	nextStep(ProgressStepCheck, "Checking readiness and compatibility")
	readiness, err := m.CheckReadiness(ctx, opts)
	if err != nil {
		return fmt.Errorf("readiness check failed: %w", err)
	}
	if !readiness.Passed() {
		return fmt.Errorf("readiness checks failed (%d issues)", len(readiness.FailedChecks()))
	}

	propsJSON := csv.Annotations["operatorframework.io/properties"]
	compat, err := m.CheckCompatibility(ctx, opts, csv, propsJSON)
	if err != nil {
		return fmt.Errorf("compatibility check failed: %w", err)
	}
	if !compat.Passed() {
		return fmt.Errorf("operator is not compatible with OLMv1 migration (%d issues found)", len(compat.FailedChecks()))
	}

	nextStep(ProgressStepCatalog, "Determining target ClusterCatalog")
	catalogName, err := m.ResolveClusterCatalog(ctx, info, m.RESTConfig)
	if err != nil {
		return fmt.Errorf("failed to resolve ClusterCatalog: %w", err)
	}
	info.ResolvedCatalogName = catalogName

	nextStep(ProgressStepCollect, "Collecting and preflighting operator resources")
	// Fail before taking OLMv0 out of management if the target API or its
	// SecretPacker namespace is not available on this cluster.
	opts, err = m.PrepareClusterObjectSet(ctx, opts)
	if err != nil {
		return err
	}
	objects, err := m.CollectResources(ctx, opts, csv, ip, info.PackageName)
	if err != nil {
		return fmt.Errorf("failed to collect resources: %w", err)
	}
	sourceObjects := make([]unstructured.Unstructured, len(objects))
	for i := range objects {
		sourceObjects[i] = *objects[i].DeepCopy()
	}
	RewriteInstallNamespace(objects, opts.SubscriptionNamespace, resourceOpts.InstallNamespace)
	if err := m.EnsureTargetNamespaceResourcesAbsent(ctx, sourceObjects, objects, resourceOpts); err != nil {
		return err
	}
	info.CollectedObjects = objects
	// The migration COS is applied before the CE. Bootstrap the metadata-derived
	// namespace so its namespaced objects can succeed, then include it in the COS
	// so the controller's catalog-derived revision can take over its ownership.
	if err := m.PrepareInstallNamespace(ctx, resourceOpts); err != nil {
		return err
	}
	if opts.SystemManagedInstallNamespace {
		if err := m.IncludeSystemManagedNamespace(ctx, info, resourceOpts.InstallNamespace); err != nil {
			return err
		}
	}

	nextStep(ProgressStepBackup, "Backing up OLMv0 resources")
	backup, err := m.BackupResources(ctx, opts, csv, ip)
	if err != nil {
		return fmt.Errorf("failed to backup resources: %w", err)
	}
	// Populate CE backup annotations (R2.5) — must happen before PrepareForMigration deletes the Sub.
	if backup.Subscription != nil {
		if j, err := json.Marshal(backup.Subscription.Spec); err == nil {
			info.SubscriptionBackupJSON = string(j)
		}
	}
	if backup.OperatorGroup != nil {
		if j, err := json.Marshal(backup.OperatorGroup.Spec); err == nil {
			info.OperatorGroupBackupJSON = string(j)
		}
	}

	// Disk backup (non-fatal per R2.6 — CE annotation backup is authoritative).
	if opts.BackupDirectory != "" {
		if err := backup.SaveToDisk(opts.BackupDirectory); err != nil {
			m.progress(ProgressEvent{Step: ProgressStepBackup, Status: ProgressWarning, Message: "Backup to disk failed (CE annotation backup is authoritative)", Err: err})
		}
	}

	nextStep(ProgressStepPrepare, "Preparing operator for migration")
	if err := m.PrepareForMigration(ctx, opts, csv); err != nil {
		if recoverErr := m.RecoverFromBackup(ctx, opts, backup); recoverErr != nil {
			return fmt.Errorf("preparation failed: %w; recovery also failed: %v", err, recoverErr)
		}
		return fmt.Errorf("preparation failed (recovered): %w", err)
	}

	// R9: warn about TLS certificate pivot. OLMv0 manages certs directly via its own
	// cert rotation; OLMv1 delegates to cert-manager (upstream) or openshift-service-ca
	// (downstream). Pod restarts are expected during this pivot as the new cert secrets
	// are provisioned. This is known behavior and does not indicate a migration failure.
	m.progress(ProgressEvent{Step: ProgressStepPrepare, Status: ProgressNote, Message: "TLS certificate management will transfer from OLMv0 to cert-manager/service-ca; " +
		"expect pod restarts while new cert secrets are provisioned"})

	restoreSourceDeployments, err := m.ScaleSourceDeployments(ctx, sourceObjects, resourceOpts)
	if err != nil {
		recoveryCtx, cancel := NewRecoveryContext(ctx)
		defer cancel()
		if recoverErr := m.RecoverFromBackup(recoveryCtx, opts, backup); recoverErr != nil {
			return fmt.Errorf("scale source Deployments: %w; recovery also failed: %v", err, recoverErr)
		}
		return fmt.Errorf("scale source Deployments failed (recovered): %w", err)
	}
	nextStep(ProgressStepCreate, "Creating OLMv1 migration resources")
	result, err := m.CreateMigrationResources(ctx, opts, info, backup)
	if err != nil {
		if result.TargetMayBeActive {
			return fmt.Errorf("create migration resources: %w; target ClusterObjectSet may be active, so source Deployments remain scaled to zero", err)
		}
		restoreCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 30*time.Second)
		defer cancel()
		if restoreErr := restoreSourceDeployments(restoreCtx); restoreErr != nil {
			return fmt.Errorf("create migration resources: %w; restore source Deployments: %v", err, restoreErr)
		}
		return err
	}
	if err := m.DeleteSourceNamespaceResources(ctx, sourceObjects, resourceOpts); err != nil {
		return err
	}

	nextStep(ProgressStepCleanup, "Cleaning up OLMv0 resources")
	if err := m.CleanupOLMv0Resources(ctx, opts, info.PackageName, csv.Name).Err(); err != nil {
		return fmt.Errorf("clean up OLMv0 resources: %w", err)
	}
	if err := m.DeleteSourceNamespace(ctx, opts); err != nil {
		return err
	}

	return nil
}

// PrepareClusterObjectSet validates that this cluster can accept the OLMv1
// objects migration creates and resolves where SecretPacker data belongs. It
// must run before PrepareForMigration, which deletes OLMv0 management objects.
func (m *Migrator) PrepareClusterObjectSet(ctx context.Context, opts Options) (Options, error) {
	opts.ApplyDefaults()
	if err := m.ensureClusterExtensionAbsent(ctx, opts.ClusterExtensionName); err != nil {
		return opts, err
	}
	if err := m.ensureClusterObjectSetCRD(ctx); err != nil {
		return opts, err
	}
	if opts.SystemManagedInstallNamespace {
		if opts.InstallNamespace != "" {
			return opts, fmt.Errorf("system-managed install namespace cannot be combined with an explicit install namespace")
		}
		if opts.AcknowledgeNamespaceDelete {
			return opts, fmt.Errorf("--acknowledge-namespace-delete is not supported with a system-managed install namespace")
		}
		if err := m.ensureSystemManagedNamespaceSupport(ctx); err != nil {
			return opts, err
		}
	}
	if opts.SystemNamespace == "" {
		namespace, err := m.operatorControllerNamespace(ctx)
		if err != nil {
			return opts, err
		}
		opts.SystemNamespace = namespace
	}
	if opts.AcknowledgeNamespaceDelete && opts.InstallNamespace != opts.SubscriptionNamespace && opts.SystemNamespace == opts.SubscriptionNamespace {
		return opts, fmt.Errorf("cannot delete source namespace %q: it is the operator-controller namespace used for ClusterObjectSet Secrets", opts.SubscriptionNamespace)
	}
	return opts, nil
}

// ensureSystemManagedNamespaceSupport verifies that the installed
// ClusterExtension CRD accepts an omitted spec.namespace. The optional field
// is currently an operator-controller experimental API, so reject the mode
// before any OLMv0 resources are changed when the standard CRD is installed.
func (m *Migrator) ensureSystemManagedNamespaceSupport(ctx context.Context) error {
	var crd apiextensionsv1.CustomResourceDefinition
	if err := m.Client.Get(ctx, client.ObjectKey{Name: clusterExtensionCRDName}, &crd); err != nil {
		return fmt.Errorf("system-managed install namespace requires ClusterExtension CRD %q with optional spec.namespace: %w", clusterExtensionCRDName, err)
	}
	established := false
	for _, condition := range crd.Status.Conditions {
		if condition.Type == apiextensionsv1.Established && condition.Status == apiextensionsv1.ConditionTrue {
			established = true
			break
		}
	}
	if !established {
		return fmt.Errorf("system-managed install namespace requires established ClusterExtension CRD %q", clusterExtensionCRDName)
	}
	for _, version := range crd.Spec.Versions {
		if version.Name != ocv1.GroupVersion.Version || !version.Served || version.Schema == nil || version.Schema.OpenAPIV3Schema == nil {
			continue
		}
		spec, ok := version.Schema.OpenAPIV3Schema.Properties["spec"]
		if !ok {
			continue
		}
		if _, ok := spec.Properties["namespace"]; !ok {
			continue
		}
		for _, required := range spec.Required {
			if required == "namespace" {
				return fmt.Errorf("system-managed install namespace requires an operator-controller experimental CRD with optional spec.namespace; the installed ClusterExtension CRD requires it")
			}
		}
		return nil
	}
	return fmt.Errorf("system-managed install namespace requires a ClusterExtension CRD schema that declares optional spec.namespace")
}

func (m *Migrator) ensureClusterObjectSetCRD(ctx context.Context) error {
	var crd apiextensionsv1.CustomResourceDefinition
	if err := m.Client.Get(ctx, client.ObjectKey{Name: clusterObjectSetCRDName}, &crd); err != nil {
		return fmt.Errorf("ClusterObjectSet CRD %q is required before migration: %w", clusterObjectSetCRDName, err)
	}
	for _, condition := range crd.Status.Conditions {
		if condition.Type == apiextensionsv1.Established && condition.Status == apiextensionsv1.ConditionTrue {
			return nil
		}
	}
	return fmt.Errorf("ClusterObjectSet CRD %q is not established", clusterObjectSetCRDName)
}

func (m *Migrator) operatorControllerNamespace(ctx context.Context) (string, error) {
	var deployments appsv1.DeploymentList
	if err := m.Client.List(ctx, &deployments, client.MatchingLabels{"app.kubernetes.io/name": "operator-controller"}); err != nil {
		return "", fmt.Errorf("list operator-controller Deployments: %w", err)
	}
	var matches []string
	for _, deployment := range deployments.Items {
		if deployment.Name == operatorControllerDeployName {
			matches = append(matches, deployment.Namespace)
		}
	}
	switch len(matches) {
	case 1:
		return matches[0], nil
	case 0:
		return "", fmt.Errorf("operator-controller Deployment %q was not found; set Options.SystemNamespace only after installing a compatible operator-controller", operatorControllerDeployName)
	default:
		return "", fmt.Errorf("found operator-controller Deployment %q in multiple namespaces %v; set Options.SystemNamespace", operatorControllerDeployName, matches)
	}
}

// EnsurePrerequisites verifies that all prerequisites for migration are met.
func (m *Migrator) EnsurePrerequisites(ctx context.Context, opts Options) (*operatorsv1alpha1.ClusterServiceVersion, *operatorsv1alpha1.InstallPlan, *PreMigrationReport, *PreMigrationReport, error) {
	readiness, err := m.CheckReadiness(ctx, opts)
	if err != nil {
		return nil, nil, nil, nil, err
	}

	_, csv, ip, err := m.GetCSVAndInstallPlan(ctx, opts)
	if err != nil {
		return nil, nil, nil, nil, err
	}

	propsJSON := csv.Annotations["operatorframework.io/properties"]
	compat, err := m.CheckCompatibility(ctx, opts, csv, propsJSON)
	if err != nil {
		return nil, nil, nil, nil, err
	}

	return csv, ip, readiness, compat, nil
}

// BackupResources creates in-memory backup copies of the Subscription, CSV, OperatorGroup,
// and InstallPlan for recovery and auditing (R1.8, R2.6).
func (m *Migrator) BackupResources(ctx context.Context, opts Options, csv *operatorsv1alpha1.ClusterServiceVersion, ip *operatorsv1alpha1.InstallPlan) (*Backup, error) {
	var sub operatorsv1alpha1.Subscription
	if err := m.Client.Get(ctx, types.NamespacedName{
		Name:      opts.SubscriptionName,
		Namespace: opts.SubscriptionNamespace,
	}, &sub); err != nil {
		return nil, fmt.Errorf("failed to backup Subscription: %w", err)
	}

	// Best-effort: fetch the OperatorGroup from the Subscription namespace.
	var ogList operatorsv1.OperatorGroupList
	_ = m.Client.List(ctx, &ogList, client.InNamespace(opts.SubscriptionNamespace))
	var og *operatorsv1.OperatorGroup
	if len(ogList.Items) > 0 {
		og = ogList.Items[0].DeepCopy()
	}

	backup := &Backup{
		Subscription:          sub.DeepCopy(),
		ClusterServiceVersion: csv.DeepCopy(),
		OperatorGroup:         og,
		InstallPlan:           ip.DeepCopy(),
	}
	// Disk backups include every plan associated with this CSV, not just the
	// current Subscription reference. Listing is informational and must not add
	// a new migration prerequisite when disk backup was not requested.
	if opts.BackupDirectory != "" {
		var plans operatorsv1alpha1.InstallPlanList
		if err := m.Client.List(ctx, &plans, client.InNamespace(opts.SubscriptionNamespace)); err != nil {
			m.progress(ProgressEvent{
				Step: ProgressStepBackup, Status: ProgressWarning,
				Message: "Could not list InstallPlans for disk backup (current plan is retained)", Err: err,
			})
		} else {
			for i := range plans.Items {
				if installPlanReferencesCSV(&plans.Items[i], csv.Name) {
					backup.InstallPlans = append(backup.InstallPlans, plans.Items[i].DeepCopy())
				}
			}
		}
	}
	return backup, nil
}

func installPlanReferencesCSV(plan *operatorsv1alpha1.InstallPlan, csvName string) bool {
	for _, name := range plan.Spec.ClusterServiceVersionNames {
		if name == csvName {
			return true
		}
	}
	for _, step := range plan.Status.Plan {
		if step != nil && step.Resolving == csvName {
			return true
		}
	}
	return false
}

// PrepareForMigration removes OLMv0 management of the operator by deleting
// the Subscription and CSV with orphan cascading. A later cross-namespace
// cutover scales source Deployments down before creating target resources.
func (m *Migrator) PrepareForMigration(ctx context.Context, opts Options, csv *operatorsv1alpha1.ClusterServiceVersion) error {
	// Delete Subscription with orphan cascading
	sub := &operatorsv1alpha1.Subscription{}
	sub.Name = opts.SubscriptionName
	sub.Namespace = opts.SubscriptionNamespace
	if err := m.Client.Delete(ctx, sub, client.PropagationPolicy(metav1.DeletePropagationOrphan)); err != nil {
		if client.IgnoreNotFound(err) != nil {
			return fmt.Errorf("failed to delete Subscription: %w", err)
		}
	}

	// Delete CSV with orphan cascading
	if err := m.Client.Delete(ctx, csv, client.PropagationPolicy(metav1.DeletePropagationOrphan)); err != nil {
		if client.IgnoreNotFound(err) != nil {
			return fmt.Errorf("failed to delete CSV: %w", err)
		}
	}

	return nil
}

// NewRecoveryContext returns a cancellation-independent context with enough
// time to recreate and observe a restored Subscription.
func NewRecoveryContext(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.WithoutCancel(ctx), subWaitTimeout+30*time.Second)
}

// RecoverFromBackup restores the Subscription from backup after a failed preparation.
func (m *Migrator) RecoverFromBackup(ctx context.Context, opts Options, backup *Backup) error {
	if backup == nil {
		return fmt.Errorf("no backup available for recovery")
	}

	sub := backup.Subscription.DeepCopy()
	sub.ResourceVersion = ""
	sub.UID = ""
	sub.Generation = 0
	sub.CreationTimestamp = metav1.Time{}
	sub.Status = operatorsv1alpha1.SubscriptionStatus{}

	if backup.Subscription.Status.InstalledCSV != "" {
		sub.Spec.StartingCSV = backup.Subscription.Status.InstalledCSV
	}

	if err := m.Client.Create(ctx, sub); err != nil {
		return fmt.Errorf("failed to re-create Subscription: %w", err)
	}

	return wait.PollUntilContextTimeout(ctx, subWaitPollInterval, subWaitTimeout, true, func(ctx context.Context) (bool, error) {
		var restored operatorsv1alpha1.Subscription
		if err := m.Client.Get(ctx, types.NamespacedName{
			Name:      opts.SubscriptionName,
			Namespace: opts.SubscriptionNamespace,
		}, &restored); err != nil {
			return false, err
		}
		if restored.Status.State == operatorsv1alpha1.SubscriptionStateAtLatest ||
			restored.Status.State == operatorsv1alpha1.SubscriptionStateUpgradePending {
			return true, nil
		}
		m.progress(ProgressEvent{Step: ProgressStepRollback, Status: ProgressWaiting, Message: fmt.Sprintf("Subscription state: %s (waiting for AtLatestKnown)", restored.Status.State)})
		return false, nil
	})
}

// RecoverBeforeCE restores the Subscription after a failure before a migration
// resource was created. It deliberately does not delete a predictably named COS
// or Secret because this invocation cannot establish ownership of such objects.
func (m *Migrator) RecoverBeforeCE(ctx context.Context, opts Options, backup *Backup) error {
	return m.RecoverFromBackup(ctx, opts, backup)
}

// recoverCreatedMigrationResources restores OLMv0 only while no target
// ClusterObjectSet can be active. Once a COS may have reconciled, it preserves
// the COS, its Secrets, and the ClusterExtension (including its backup
// annotations) for explicit operator recovery rather than deleting evidence
// needed to roll the migration back safely.
func (m *Migrator) recoverCreatedMigrationResources(ctx context.Context, opts Options, backup *Backup, resources *createdMigrationResources) error {
	recoveryCtx, cancel := NewRecoveryContext(ctx)
	defer cancel()
	if resources == nil {
		return m.RecoverBeforeCE(recoveryCtx, opts, backup)
	}
	if resources.ownershipUnknown {
		return fmt.Errorf("migration resource creation outcome is unknown; refusing automatic recovery")
	}
	if resources.cos != nil {
		return fmt.Errorf("target ClusterObjectSet may have reconciled; preserving migration resources and refusing automatic OLMv0 recovery")
	}
	if resources.ce != nil {
		if err := m.deleteTrackedResource(recoveryCtx, resources.ce); err != nil && client.IgnoreNotFound(err) != nil {
			return fmt.Errorf("delete created ClusterExtension during recovery: %w", err)
		}
	}
	cleanupErr := m.cleanupCreatedSecrets(recoveryCtx, resources.secrets)
	recoverErr := m.RecoverFromBackup(recoveryCtx, opts, backup)
	return errors.Join(cleanupErr, recoverErr)
}

func (m *Migrator) cleanupCreatedSecrets(ctx context.Context, secrets []corev1.Secret) error {
	var errs []error
	for i := range secrets {
		if err := m.deleteTrackedResource(ctx, &secrets[i]); err != nil && client.IgnoreNotFound(err) != nil {
			errs = append(errs, fmt.Errorf("delete COS ref Secret %s: %w", secrets[i].Name, err))
		}
	}
	return errors.Join(errs...)
}

func (m *Migrator) deleteTrackedResource(ctx context.Context, obj client.Object, opts ...client.DeleteOption) error {
	uid := obj.GetUID()
	opts = append(opts, client.Preconditions{UID: &uid})
	return m.Client.Delete(ctx, obj, opts...)
}

func createdByInvocation(obj client.Object, marker string) bool {
	return obj.GetAnnotations()[migrationInvocationAnnotation] == marker
}

func (m *Migrator) resolveCreatedObject(ctx context.Context, obj client.Object, marker string) bool {
	if err := m.Client.Get(ctx, client.ObjectKeyFromObject(obj), obj); err != nil {
		return false
	}
	return createdByInvocation(obj, marker)
}

// ensureClusterExtensionAbsent rejects a target name before OLMv0 resources
// are removed. CreateClusterExtension remains the race-safe final check.
func (m *Migrator) ensureClusterExtensionAbsent(ctx context.Context, name string) error {
	var ce ocv1.ClusterExtension
	err := m.Client.Get(ctx, client.ObjectKey{Name: name}, &ce)
	if err == nil {
		return fmt.Errorf("ClusterExtension %s already exists", name)
	}
	if client.IgnoreNotFound(err) != nil {
		return fmt.Errorf("check ClusterExtension %s: %w", name, err)
	}
	return nil
}

// CreateClusterObjectSet builds and creates a COS from the collected resources.
// It uses CollisionProtection=None; the controller creates the subsequent catalog-derived revision.
// The COS is annotated with the source Subscription reference.
//
// TODO(R2.7): when boxcutter phase 2 introduces ClusterObjectDeployment as a replacement or
// complement to ClusterObjectSet, update this function (and its callers) to create whichever
// OLMv1 revision object(s) are appropriate. Track upstream progress at OPRUN-4716 and the
// boxcutter ClusterObjectDeployment design.
func (m *Migrator) CreateClusterObjectSet(ctx context.Context, opts Options, info *MigrationInfo) error {
	var err error
	opts, err = m.PrepareClusterObjectSet(ctx, opts)
	if err != nil {
		return err
	}
	resources, err := m.createClusterObjectSet(ctx, opts, info)
	if err != nil {
		if cleanupErr := m.cleanupCreatedClusterObjectSet(ctx, resources); cleanupErr != nil {
			return errors.Join(err, cleanupErr)
		}
	}
	return err
}

// CreateMigrationResources creates the ClusterObjectSet and its ClusterExtension
// as one recoverable operation. Its result reports whether a target COS may have
// started reconciling, including when cleanup was requested after a failure.
func (m *Migrator) CreateMigrationResources(ctx context.Context, opts Options, info *MigrationInfo, backup *Backup) (MigrationResourcesResult, error) {
	resources, err := m.createClusterObjectSet(ctx, opts, info)
	if err != nil {
		result := MigrationResourcesResult{TargetMayBeActive: resources.cos != nil || resources.ownershipUnknown}
		if recoverErr := m.recoverCreatedMigrationResources(ctx, opts, backup, resources); recoverErr != nil {
			return result, fmt.Errorf("COS creation failed: %w; recovery also failed: %v", err, recoverErr)
		}
		return result, fmt.Errorf("COS creation failed (recovered): %w", err)
	}

	ce, ownershipUnknown, err := m.createClusterExtension(ctx, opts, info)
	if ce != nil {
		resources.ce = ce
	}
	resources.ownershipUnknown = resources.ownershipUnknown || ownershipUnknown
	if err != nil {
		result := MigrationResourcesResult{TargetMayBeActive: resources.cos != nil || resources.ownershipUnknown}
		if recoverErr := m.recoverCreatedMigrationResources(ctx, opts, backup, resources); recoverErr != nil {
			return result, fmt.Errorf("ClusterExtension creation failed: %w; recovery also failed: %v", err, recoverErr)
		}
		return result, fmt.Errorf("ClusterExtension creation failed (recovered): %w", err)
	}
	return MigrationResourcesResult{}, nil
}

func (m *Migrator) createClusterObjectSet(ctx context.Context, opts Options, info *MigrationInfo) (*createdMigrationResources, error) {
	resources := &createdMigrationResources{}
	invocationMarker := string(uuid.NewUUID())
	cosName := fmt.Sprintf("%s-1", opts.ClusterExtensionName)

	cosObjects := make([]ocv1ac.ClusterObjectSetObjectApplyConfiguration, 0, len(info.CollectedObjects))
	for _, obj := range info.CollectedObjects {
		stripped := stripResource(obj)
		cosObjects = append(cosObjects, *ocv1ac.ClusterObjectSetObject().
			WithObject(stripped).
			WithCollisionProtection(ocv1.CollisionProtectionNone))
	}

	phases := PhaseSort(cosObjects)

	// Pack inline objects into Secrets to stay within etcd's size limit (R2.4).
	// SecretPacker gzip-compresses large objects and splits across multiple Secrets
	// when the combined size would exceed 900 KiB per Secret.
	// TODO: consider exporting secretPacker so consumers can configure whether to use
	// Secret-backed refs or inline objects (useful for small bundles or testing).
	packer := &secretPacker{
		RevisionName:    cosName,
		OwnerName:       opts.ClusterExtensionName,
		SystemNamespace: opts.SystemNamespace,
	}
	packed, err := packer.pack(phases)
	if err != nil {
		return resources, fmt.Errorf("failed to pack COS objects into Secrets: %w", err)
	}
	cleanupSecrets := func() error {
		cleanupCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 30*time.Second)
		defer cancel()
		return m.cleanupCreatedSecrets(cleanupCtx, resources.secrets)
	}
	failWithSecretCleanup := func(err error) error {
		if resources.ownershipUnknown {
			return err
		}
		if cleanupErr := cleanupSecrets(); cleanupErr != nil {
			return errors.Join(err, fmt.Errorf("clean up COS ref Secrets: %w", cleanupErr))
		}
		return err
	}

	// Create ref Secrets before the COS so the COS controller can find them immediately.
	for i := range packed.Secrets {
		secret := &packed.Secrets[i]
		if secret.Annotations == nil {
			secret.Annotations = map[string]string{}
		}
		secret.Annotations[migrationInvocationAnnotation] = invocationMarker
		if err := m.Client.Create(ctx, secret); err != nil {
			if apierrors.IsAlreadyExists(err) {
				resources.ownershipUnknown = true
				return resources, fmt.Errorf("failed to create COS ref Secret %s: %w", secret.Name, err)
			}
			if m.resolveCreatedObject(context.WithoutCancel(ctx), secret, invocationMarker) {
				resources.secrets = append(resources.secrets, *secret)
			} else {
				resources.ownershipUnknown = true
			}
			return resources, failWithSecretCleanup(fmt.Errorf("failed to create COS ref Secret %s: %w", secret.Name, err))
		}
		resources.secrets = append(resources.secrets, *secret)
	}

	// Replace inline objects with Secret refs in the phases.
	for pos, ref := range packed.Refs {
		phaseIdx, objIdx := pos[0], pos[1]
		localRef := ref
		phases[phaseIdx].Objects[objIdx].Object = nil
		phases[phaseIdx].Objects[objIdx].Ref = &ocv1ac.ObjectSourceRefApplyConfiguration{
			Name:      &localRef.Name,
			Namespace: &localRef.Namespace,
			Key:       &localRef.Key,
		}
	}

	cosSpec := ocv1ac.ClusterObjectSetSpec().
		WithRevision(1).
		WithCollisionProtection(ocv1.CollisionProtectionNone).
		WithLifecycleState(ocv1.ClusterObjectSetLifecycleStateActive).
		WithPhases(phases...)

	cosAnnotations := map[string]string{
		MigratedFromSubscriptionAnnotation: fmt.Sprintf("%s/%s", opts.SubscriptionNamespace, opts.SubscriptionName),
		LabelPackageName:                   info.PackageName,
		LabelBundleName:                    info.BundleName,
		LabelBundleVersion:                 info.Version,
		migrationInvocationAnnotation:      invocationMarker,
	}
	if info.BundleImage != "" {
		cosAnnotations[LabelBundleReference] = info.BundleImage
	}

	cos := ocv1ac.ClusterObjectSet(cosName).
		WithSpec(cosSpec).
		WithLabels(map[string]string{
			LabelOwnerKind: ocv1.ClusterExtensionKind,
			LabelOwnerName: opts.ClusterExtensionName,
		}).
		WithAnnotations(cosAnnotations)

	cosData, err := json.Marshal(cos)
	if err != nil {
		return resources, failWithSecretCleanup(fmt.Errorf("failed to marshal COS: %w", err))
	}
	cosObj := &ocv1.ClusterObjectSet{}
	if err := json.Unmarshal(cosData, cosObj); err != nil {
		return resources, failWithSecretCleanup(fmt.Errorf("failed to decode COS: %w", err))
	}

	// A migration owns only a newly created revision. Applying an existing COS
	// can overwrite its ownership or fail on immutable phases, making recovery
	// and Secret cleanup unsafe.
	if err := m.Client.Create(ctx, cosObj); err != nil {
		if apierrors.IsAlreadyExists(err) {
			resources.ownershipUnknown = true
			return resources, failWithSecretCleanup(fmt.Errorf("failed to create ClusterObjectSet: %w", err))
		}
		if m.resolveCreatedObject(context.WithoutCancel(ctx), cosObj, invocationMarker) {
			resources.cos = cosObj
			return resources, fmt.Errorf("failed to create ClusterObjectSet: %w", err)
		}
		resources.ownershipUnknown = true
		return resources, fmt.Errorf("failed to create ClusterObjectSet: %w", err)
	}
	resources.cos = cosObj

	if err := m.WaitForCOSSucceeded(ctx, cosName); err != nil {
		return resources, err
	}
	if err := m.WaitForClusterObjectSetAvailable(ctx, cosName); err != nil {
		return resources, err
	}
	return resources, nil
}

func (m *Migrator) cleanupCreatedClusterObjectSet(ctx context.Context, resources *createdMigrationResources) error {
	if resources == nil {
		return nil
	}
	if resources.ownershipUnknown {
		return fmt.Errorf("ClusterObjectSet creation outcome is unknown; refusing automatic cleanup")
	}
	cleanupCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 30*time.Second)
	defer cancel()
	if resources.cos != nil {
		if err := m.deleteTrackedResource(cleanupCtx, resources.cos, client.PropagationPolicy(metav1.DeletePropagationOrphan)); err != nil && client.IgnoreNotFound(err) != nil {
			return fmt.Errorf("delete created ClusterObjectSet: %w", err)
		}
	}
	return m.cleanupCreatedSecrets(cleanupCtx, resources.secrets)
}

// WaitForCOSSucceeded waits for the COS to reach Succeeded=True.
func (m *Migrator) WaitForCOSSucceeded(ctx context.Context, cosName string) error {
	return wait.PollUntilContextTimeout(ctx, cosWaitPollInterval, cosWaitTimeout, true, func(ctx context.Context) (bool, error) {
		var cos ocv1.ClusterObjectSet
		if err := m.Client.Get(ctx, types.NamespacedName{Name: cosName}, &cos); err != nil {
			m.progress(ProgressEvent{Step: ProgressStepCreate, Status: ProgressWaiting, Message: fmt.Sprintf("Waiting for COS %s (not found yet)", cosName)})
			return false, err
		}

		for _, c := range cos.Status.Conditions {
			if c.Type == ocv1.ClusterObjectSetTypeSucceeded && c.Status == metav1.ConditionTrue {
				return true, nil
			}
			if c.Type == ocv1.ClusterObjectSetTypeSucceeded && c.Reason == ocv1.ClusterObjectSetReasonBlocked {
				return false, fmt.Errorf("ClusterObjectSet %s is blocked: %s", cosName, c.Message)
			}
		}

		m.progress(ProgressEvent{Step: ProgressStepCreate, Status: ProgressWaiting, Message: fmt.Sprintf("Waiting for ClusterObjectSet %s to reach Succeeded=True...", cosName)})
		return false, nil
	})
}

// CreateClusterExtension creates a CE that adopts the COS (R2.3).
// spec.serviceAccount is NOT set — deprecated and ignored in OLMv1 (R2.5/R7).
// Migration annotations (R2.5) are added for AlreadyMigrated/Conflict detection and rollback.
func (m *Migrator) CreateClusterExtension(ctx context.Context, opts Options, info *MigrationInfo) error {
	ce, _, err := m.createClusterExtension(ctx, opts, info)
	if err != nil && ce != nil {
		if deleteErr := m.deleteTrackedResource(context.WithoutCancel(ctx), ce); deleteErr != nil && client.IgnoreNotFound(deleteErr) != nil {
			return errors.Join(err, fmt.Errorf("delete created ClusterExtension: %w", deleteErr))
		}
	}
	return err
}

func (m *Migrator) createClusterExtension(ctx context.Context, opts Options, info *MigrationInfo) (*ocv1.ClusterExtension, bool, error) {
	invocationMarker := string(uuid.NewUUID())
	// Build annotations (R2.5).
	annotations := map[string]string{
		MigratedFromSubscriptionAnnotation: fmt.Sprintf("%s/%s", opts.SubscriptionNamespace, opts.SubscriptionName),
		migrationInvocationAnnotation:      invocationMarker,
	}
	if info.SubscriptionBackupJSON != "" {
		annotations[MigrationSubscriptionBackupAnnotation] = info.SubscriptionBackupJSON
	}
	if info.OperatorGroupBackupJSON != "" {
		annotations[MigrationOperatorGroupBackupAnnotation] = info.OperatorGroupBackupJSON
	}
	// Record which eligibility-override flags were acknowledged (audit trail).
	if opts.AcknowledgeWatchScopeChange {
		annotations[AnnotationAcknowledgedPrefix+"watch-scope-change"] = "true"
	}
	if opts.AcknowledgeOperatorCondition {
		annotations[AnnotationAcknowledgedPrefix+"operator-condition"] = "true"
	}
	if opts.AcknowledgeOLMv0APIAccess {
		annotations[AnnotationAcknowledgedPrefix+"olmv0-api-access"] = "true"
	}
	if opts.AcknowledgeScopedServiceAccount {
		annotations[AnnotationAcknowledgedPrefix+"scoped-serviceaccount"] = "true"
	}
	if opts.AcknowledgeNotSteadyState {
		annotations[AnnotationAcknowledgedPrefix+"not-steady-state"] = "true"
	}
	if opts.AcknowledgeNamespaceDelete {
		annotations[AnnotationAcknowledgedPrefix+"namespace-delete"] = "true"
	}

	ce := &ocv1.ClusterExtension{
		ObjectMeta: metav1.ObjectMeta{
			Name:        opts.ClusterExtensionName,
			Annotations: annotations,
		},
		Spec: ocv1.ClusterExtensionSpec{
			// ServiceAccount is deliberately not set — deprecated and ignored in OLMv1.
			Source: ocv1.SourceConfig{
				SourceType: ocv1.SourceTypeCatalog,
				Catalog: &ocv1.CatalogFilter{
					PackageName: info.PackageName,
				},
			},
		},
	}
	if !opts.SystemManagedInstallNamespace {
		ce.Spec.Namespace = opts.InstallNamespace
	}

	// Version pinning: Manual approval → pin to installed version; Automatic → channel-based upgrades.
	if info.ManualApproval {
		ce.Spec.Source.Catalog.Version = info.Version
	}

	// R4: when spec.channel is empty, OLMv0 resolved the defaultChannel from the catalog.
	// OLMv1 without channels considers upgrade edges across *all* channels, which may differ.
	// Query the resolved ClusterCatalog for the package's declared defaultChannel and set it
	// explicitly. Warn if it cannot be determined (R4 spec requirement).
	channel := info.Channel
	if channel == "" && info.ResolvedCatalogName != "" && m.RESTConfig != nil {
		var catalog ocv1.ClusterCatalog
		if err := m.Client.Get(ctx, client.ObjectKey{Name: info.ResolvedCatalogName}, &catalog); err == nil {
			pkgInfo, qErr := m.QueryCatalogForPackage(ctx, &catalog, info.PackageName, "", "", m.RESTConfig)
			if qErr == nil && pkgInfo.DefaultChannel != "" {
				channel = pkgInfo.DefaultChannel
				m.progress(ProgressEvent{Step: ProgressStepCreate, Status: ProgressNote, Message: fmt.Sprintf("Resolved default channel %q for package %q from ClusterCatalog %s", channel, info.PackageName, info.ResolvedCatalogName)})
			} else {
				m.progress(ProgressEvent{Step: ProgressStepCreate, Status: ProgressWarning, Message: fmt.Sprintf("Could not determine defaultChannel for package %q — CE will consider all channels; verify upgrade behavior post-migration", info.PackageName)})
			}
		}
	}
	if channel != "" {
		ce.Spec.Source.Catalog.Channels = []string{channel}
	}

	if info.ResolvedCatalogName != "" {
		ce.Spec.Source.Catalog.Selector = &metav1.LabelSelector{
			MatchLabels: map[string]string{
				LabelMetadataName: info.ResolvedCatalogName,
			},
		}
	}

	// R4: map spec.config → CE.spec.config.inline.deploymentConfig (R4, R7).
	// DeploymentConfig is a type alias of SubscriptionConfig in operator-controller;
	// the JSON key must be "deploymentConfig" per the bundle config schema.
	if info.SubscriptionConfig != nil {
		cfgJSON, err := json.Marshal(info.SubscriptionConfig)
		if err != nil {
			return nil, false, fmt.Errorf("failed to marshal SubscriptionConfig for CE: %w", err)
		}
		inlineJSON, err := json.Marshal(map[string]json.RawMessage{"deploymentConfig": cfgJSON})
		if err != nil {
			return nil, false, fmt.Errorf("failed to marshal CE inline config: %w", err)
		}
		ce.Spec.Config = &ocv1.ClusterExtensionConfig{
			ConfigType: ocv1.ClusterExtensionConfigTypeInline,
			Inline:     &apiextensionsv1.JSON{Raw: inlineJSON},
		}
	}

	if err := m.Client.Create(ctx, ce); err != nil {
		if apierrors.IsAlreadyExists(err) {
			return nil, false, fmt.Errorf("failed to create ClusterExtension: %w", err)
		}
		if m.resolveCreatedObject(context.WithoutCancel(ctx), ce, invocationMarker) {
			return ce, false, fmt.Errorf("failed to create ClusterExtension: %w", err)
		}
		return nil, true, fmt.Errorf("failed to create ClusterExtension: %w", err)
	}

	return ce, false, m.WaitForClusterExtensionInstalled(ctx, opts.ClusterExtensionName)
}

// WaitForClusterExtensionInstalled waits for the CE to reach Installed=True.
func (m *Migrator) WaitForClusterExtensionInstalled(ctx context.Context, ceName string) error {
	return wait.PollUntilContextTimeout(ctx, ceWaitPollInterval, ceWaitTimeout, true, func(ctx context.Context) (bool, error) {
		var ce ocv1.ClusterExtension
		if err := m.Client.Get(ctx, types.NamespacedName{Name: ceName}, &ce); err != nil {
			m.progress(ProgressEvent{Step: ProgressStepCreate, Status: ProgressWaiting, Message: fmt.Sprintf("Waiting for CE %s (not found yet)", ceName)})
			return false, err
		}

		for _, c := range ce.Status.Conditions {
			if c.Type == ocv1.TypeInstalled && c.Status == metav1.ConditionTrue {
				return true, nil
			}
		}

		m.progress(ProgressEvent{Step: ProgressStepCreate, Status: ProgressWaiting, Message: fmt.Sprintf("Waiting for ClusterExtension %s to reach Installed=True...", ceName)})
		return false, nil
	})
}

// WaitForClusterObjectSetAvailable waits until the migration COS has observed
// its workload as available. It runs before the ClusterExtension can replace
// the migration revision with a catalog revision, so an Installed=True result
// alone cannot allow source resources to be removed prematurely.
func (m *Migrator) WaitForClusterObjectSetAvailable(ctx context.Context, cosName string) error {
	return wait.PollUntilContextTimeout(ctx, cosWaitPollInterval, cosWaitTimeout, true, func(ctx context.Context) (bool, error) {
		var cos ocv1.ClusterObjectSet
		if err := m.Client.Get(ctx, types.NamespacedName{Name: cosName}, &cos); err != nil {
			m.progress(ProgressEvent{Step: ProgressStepCreate, Status: ProgressWaiting, Message: fmt.Sprintf("Waiting for migration COS %s (not found yet)", cosName)})
			return false, err
		}
		for _, condition := range cos.Status.Conditions {
			if condition.Type == ocv1.ClusterObjectSetTypeAvailable && condition.Status == metav1.ConditionTrue {
				return true, nil
			}
		}
		m.progress(ProgressEvent{Step: ProgressStepCreate, Status: ProgressWaiting, Message: fmt.Sprintf("Waiting for migration ClusterObjectSet %s to reach Available=True...", cosName)})
		return false, nil
	})
}

// CleanupAction describes a single cleanup operation and its result.
type CleanupAction struct {
	Description string
	Succeeded   bool
	Skipped     bool
	Error       error
}

// CleanupResult holds the results of all cleanup operations.
type CleanupResult struct {
	Actions []CleanupAction
}

// Err returns all failures encountered while cleaning up OLMv0 resources.
func (r *CleanupResult) Err() error {
	var errs []error
	for _, action := range r.Actions {
		if action.Error != nil {
			errs = append(errs, fmt.Errorf("%s: %w", action.Description, action.Error))
		}
	}
	return errors.Join(errs...)
}

// CleanupOLMv0Resources removes remaining OLMv0 resources after migration.
func (m *Migrator) CleanupOLMv0Resources(ctx context.Context, opts Options, packageName, csvName string) *CleanupResult {
	result := &CleanupResult{}

	// 1. Delete the Operator CR
	operatorName := fmt.Sprintf("%s.%s", packageName, opts.SubscriptionNamespace)
	err := m.deleteOperatorCR(ctx, packageName, opts.SubscriptionNamespace)
	result.Actions = append(result.Actions, CleanupAction{
		Description: fmt.Sprintf("Delete Operator CR %s", operatorName),
		Succeeded:   err == nil,
		Error:       err,
	})

	// 2. Delete the OperatorCondition
	if csvName != "" {
		err = m.deleteOperatorCondition(ctx, csvName, opts.SubscriptionNamespace)
		result.Actions = append(result.Actions, CleanupAction{
			Description: fmt.Sprintf("Delete OperatorCondition %s/%s", opts.SubscriptionNamespace, csvName),
			Succeeded:   err == nil,
			Error:       err,
		})

		// 3. Delete copied CSVs
		copiedCount, err := m.deleteCopiedCSVs(ctx, csvName, opts.SubscriptionNamespace)
		if copiedCount > 0 {
			result.Actions = append(result.Actions, CleanupAction{
				Description: fmt.Sprintf("Delete %d copied CSV(s)", copiedCount),
				Succeeded:   err == nil,
				Error:       err,
			})
		} else {
			result.Actions = append(result.Actions, CleanupAction{
				Description: "Delete copied CSVs",
				Skipped:     true,
			})
		}
	}

	// 4. OperatorGroup cleanup
	ogActions := m.cleanupOperatorGroup(ctx, opts)
	result.Actions = append(result.Actions, ogActions...)

	return result
}

func (m *Migrator) deleteCopiedCSVs(ctx context.Context, csvName, sourceNamespace string) (int, error) {
	var csvList operatorsv1alpha1.ClusterServiceVersionList
	if err := m.Client.List(ctx, &csvList,
		client.MatchingLabels{
			"olm.managed":                    "true",
			operatorsv1alpha1.CopiedLabelKey: sourceNamespace,
		},
	); err != nil {
		return 0, err
	}

	deleted := 0
	for i := range csvList.Items {
		// The label identifies a source namespace, not a CSV. Preserve copies
		// of other operators installed in that same namespace.
		if csvList.Items[i].Name != csvName {
			continue
		}
		if err := m.Client.Delete(ctx, &csvList.Items[i], client.PropagationPolicy(metav1.DeletePropagationOrphan)); err != nil {
			if client.IgnoreNotFound(err) != nil {
				return deleted, err
			}
		}
		deleted++
	}
	return deleted, nil
}

func (m *Migrator) deleteOperatorCR(ctx context.Context, packageName, namespace string) error {
	operatorName := fmt.Sprintf("%s.%s", packageName, namespace)
	op := &operatorsv1.Operator{}
	op.Name = operatorName
	if err := m.Client.Delete(ctx, op); err != nil {
		return client.IgnoreNotFound(err)
	}
	return nil
}

func (m *Migrator) deleteOperatorCondition(ctx context.Context, csvName, namespace string) error {
	oc := &operatorsv1.OperatorCondition{}
	oc.Name = csvName
	oc.Namespace = namespace
	if err := m.Client.Delete(ctx, oc); err != nil {
		return client.IgnoreNotFound(err)
	}
	return nil
}

// cleanupOperatorGroup deletes the OperatorGroup when both --delete-operatorgroup is set
// AND no other Subscriptions remain in the namespace (R6).
func (m *Migrator) cleanupOperatorGroup(ctx context.Context, opts Options) []CleanupAction {
	var actions []CleanupAction

	// Both conditions required per R6: flag must be set AND no remaining Subscriptions.
	if !opts.DeleteOperatorGroup {
		actions = append(actions, CleanupAction{
			Description: "Delete OperatorGroup (skipped: --delete-operatorgroup not set)",
			Skipped:     true,
		})
		return actions
	}

	var subList operatorsv1alpha1.SubscriptionList
	if err := m.Client.List(ctx, &subList, client.InNamespace(opts.SubscriptionNamespace)); err != nil {
		actions = append(actions, CleanupAction{
			Description: "Check remaining Subscriptions",
			Error:       err,
		})
		return actions
	}

	if len(subList.Items) > 0 {
		actions = append(actions, CleanupAction{
			Description: fmt.Sprintf("Delete OperatorGroup (skipped: %d Subscription(s) remain)", len(subList.Items)),
			Skipped:     true,
		})
		return actions
	}

	var ogList operatorsv1.OperatorGroupList
	if err := m.Client.List(ctx, &ogList, client.InNamespace(opts.SubscriptionNamespace)); err != nil {
		actions = append(actions, CleanupAction{
			Description: "List OperatorGroups",
			Error:       err,
		})
		return actions
	}

	for i := range ogList.Items {
		og := &ogList.Items[i]

		stripped := m.stripOGAggregationClusterRoles(ctx, og.Name)
		for _, name := range stripped {
			actions = append(actions, CleanupAction{
				Description: fmt.Sprintf("Strip OLM labels from aggregation ClusterRole %s", name),
				Succeeded:   true,
			})
		}

		err := m.Client.Delete(ctx, og)
		if err != nil && client.IgnoreNotFound(err) != nil {
			actions = append(actions, CleanupAction{
				Description: fmt.Sprintf("Delete OperatorGroup %s/%s", og.Namespace, og.Name),
				Error:       err,
			})
		} else {
			actions = append(actions, CleanupAction{
				Description: fmt.Sprintf("Delete OperatorGroup %s/%s", og.Namespace, og.Name),
				Succeeded:   true,
			})
		}
	}

	return actions
}

// stripOGAggregationClusterRoles strips olm.owner and olm.managed labels from
// OperatorGroup aggregation ClusterRoles (olm.og.<name>.<view|admin|edit>-<hash>).
func (m *Migrator) stripOGAggregationClusterRoles(ctx context.Context, ogName string) []string {
	prefix := fmt.Sprintf("olm.og.%s.", ogName)

	var crList unstructured.UnstructuredList
	crList.SetAPIVersion("rbac.authorization.k8s.io/v1")
	crList.SetKind("ClusterRoleList")

	if err := m.Client.List(ctx, &crList); err != nil {
		return nil
	}

	var stripped []string
	for _, cr := range crList.Items {
		if !strings.HasPrefix(cr.GetName(), prefix) {
			continue
		}

		lbls := cr.GetLabels()
		if lbls == nil {
			continue
		}

		changed := false
		for _, key := range []string{"olm.owner", "olm.owner.namespace", "olm.owner.kind", "olm.managed"} {
			if _, ok := lbls[key]; ok {
				delete(lbls, key)
				changed = true
			}
		}

		if changed {
			cr.SetLabels(lbls)
			if err := m.Client.Update(ctx, &cr); err == nil {
				stripped = append(stripped, cr.GetName())
			}
		}
	}
	return stripped
}

// FindCRDClusterRoles returns CRD-owned ClusterRoles that are not managed by OLMv1.
func (m *Migrator) FindCRDClusterRoles(ctx context.Context, csvName string) []string {
	var crList unstructured.UnstructuredList
	crList.SetAPIVersion("rbac.authorization.k8s.io/v1")
	crList.SetKind("ClusterRoleList")

	if err := m.Client.List(ctx, &crList); err != nil {
		return nil
	}

	var crdRoles []string
	for _, cr := range crList.Items {
		name := cr.GetName()
		lbls := cr.GetLabels()
		if lbls != nil && lbls["olm.owner"] == csvName {
			for _, suffix := range []string{"-admin", "-edit", "-view", "-crd"} {
				if strings.HasSuffix(name, suffix) {
					crdRoles = append(crdRoles, name)
					break
				}
			}
		}
	}
	return crdRoles
}

// stripResource removes server-side fields from a resource for inclusion in a COS.
func stripResource(obj unstructured.Unstructured) unstructured.Unstructured {
	stripped := unstructured.Unstructured{Object: make(map[string]interface{})}

	stripped.SetAPIVersion(obj.GetAPIVersion())
	stripped.SetKind(obj.GetKind())
	stripped.SetName(obj.GetName())
	if obj.GetNamespace() != "" {
		stripped.SetNamespace(obj.GetNamespace())
	}

	if lbls := obj.GetLabels(); len(lbls) > 0 {
		stripped.SetLabels(lbls)
	}

	if annotations := obj.GetAnnotations(); len(annotations) > 0 {
		filtered := filterAnnotations(annotations)
		if len(filtered) > 0 {
			stripped.SetAnnotations(filtered)
		}
	}

	if spec, ok := obj.Object["spec"]; ok {
		stripped.Object["spec"] = spec
		stripNestedAnnotations(&stripped)
	}

	if data, ok := obj.Object["data"]; ok {
		stripped.Object["data"] = data
	}
	if stringData, ok := obj.Object["stringData"]; ok {
		stripped.Object["stringData"] = stringData
	}

	if rules, ok := obj.Object["rules"]; ok {
		stripped.Object["rules"] = rules
	}

	if roleRef, ok := obj.Object["roleRef"]; ok {
		stripped.Object["roleRef"] = roleRef
	}
	if subjects, ok := obj.Object["subjects"]; ok {
		stripped.Object["subjects"] = subjects
	}

	if webhooks, ok := obj.Object["webhooks"]; ok {
		stripped.Object["webhooks"] = webhooks
	}

	return stripped
}

// filterAnnotations removes annotation prefixes that should not be migrated.
func filterAnnotations(annotations map[string]string) map[string]string {
	filtered := make(map[string]string)
	for k, v := range annotations {
		shouldStrip := false
		for _, prefix := range annotationPrefixesToStrip {
			if strings.HasPrefix(k, prefix) {
				shouldStrip = true
				break
			}
		}
		if !shouldStrip {
			filtered[k] = v
		}
	}
	return filtered
}

// stripNestedAnnotations removes transient annotations from Deployment pod template metadata.
func stripNestedAnnotations(obj *unstructured.Unstructured) {
	templateAnnotations, found, _ := unstructured.NestedMap(obj.Object, "spec", "template", "metadata", "annotations")
	if found && templateAnnotations != nil {
		filtered := make(map[string]interface{})
		for k, v := range templateAnnotations {
			shouldStrip := false
			for _, prefix := range annotationPrefixesToStrip {
				if strings.HasPrefix(k, prefix) {
					shouldStrip = true
					break
				}
			}
			if !shouldStrip {
				filtered[k] = v
			}
		}
		if len(filtered) > 0 {
			_ = unstructured.SetNestedField(obj.Object, filtered, "spec", "template", "metadata", "annotations")
		} else {
			unstructured.RemoveNestedField(obj.Object, "spec", "template", "metadata", "annotations")
		}
	}
}
