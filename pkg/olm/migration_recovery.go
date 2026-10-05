package olm

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	operatorsv1 "github.com/operator-framework/api/pkg/operators/v1"
	operatorsv1alpha1 "github.com/operator-framework/api/pkg/operators/v1alpha1"
	"github.com/operator-framework/library-olm/migration/pkg/migration"
	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/util/retry"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

const (
	operatorMigrationCheckpointLabel       = "console.openshift.io/operator-migration-checkpoint"
	operatorMigrationCheckpointOwnerLabel  = "console.openshift.io/operator-migration-owner"
	operatorMigrationCheckpointStateKey    = "state"
	operatorMigrationCheckpointDataKey     = "snapshot"
	operatorMigrationCheckpointInProgress  = "in-progress"
	operatorMigrationCheckpointRequired    = "recovery-required"
	operatorMigrationCheckpointMigrated    = "migrated"
	operatorMigrationCheckpointAnnotation  = "console.openshift.io/operator-migration-checkpoint"
	operatorMigrationCheckpointSecretBase  = "olm-migration-recovery-"
	operatorMigrationCheckpointSecretType  = corev1.SecretType("console.openshift.io/operator-migration-recovery")
	operatorMigrationControllerDeployName  = "operator-controller-controller-manager"
	operatorMigrationControllerDeployLabel = "app.kubernetes.io/name"
	operatorMigrationControllerDeployValue = "operator-controller"
)

type operatorMigrationFailure struct {
	err               error
	rollbackAttempted bool
	rolledBack        bool
	rollbackErr       error
}

func (e *operatorMigrationFailure) Error() string {
	if e.rollbackAttempted && e.rolledBack {
		return fmt.Sprintf("migration failed and was rolled back automatically: %v", e.err)
	}
	if e.rollbackAttempted && e.rollbackErr != nil {
		return fmt.Sprintf("migration failed: %v; automatic rollback failed: %v", e.err, e.rollbackErr)
	}
	if e.rollbackErr != nil {
		return fmt.Sprintf("migration failed: %v; automatic rollback could not be prepared: %v", e.err, e.rollbackErr)
	}
	return e.err.Error()
}

func (e *operatorMigrationFailure) Unwrap() error { return e.err }

type operatorMigrationNamespaceBackup struct {
	Name        string            `json:"name"`
	Labels      map[string]string `json:"labels,omitempty"`
	Annotations map[string]string `json:"annotations,omitempty"`
}

type operatorMigrationOperatorGroupBackup struct {
	Name      string                        `json:"name"`
	Namespace string                        `json:"namespace"`
	Spec      operatorsv1.OperatorGroupSpec `json:"spec"`
}

type operatorMigrationDeploymentBackup struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Replicas  int32  `json:"replicas"`
}

type operatorMigrationRecoverySnapshot struct {
	ClusterExtensionName string                                `json:"clusterExtensionName"`
	ClusterObjectSetName string                                `json:"clusterObjectSetName"`
	SubscriptionRef      string                                `json:"subscriptionRef"`
	SubscriptionSpec     operatorsv1alpha1.SubscriptionSpec    `json:"subscriptionSpec"`
	InstalledCSV         string                                `json:"installedCSV,omitempty"`
	InstalledCSVUID      types.UID                             `json:"installedCSVUID,omitempty"`
	Namespace            operatorMigrationNamespaceBackup      `json:"namespace"`
	OperatorGroup        *operatorMigrationOperatorGroupBackup `json:"operatorGroup,omitempty"`
	Deployments          []operatorMigrationDeploymentBackup   `json:"deployments,omitempty"`
}

type operatorMigrationRecoveryConflict struct {
	ClusterExtensionName string
	ClusterObjectSetName string
	Reason               string
}

func operatorMigrationOwnerHash(name string) string {
	hash := sha256.Sum256([]byte(name))
	return hex.EncodeToString(hash[:8])
}

func operatorMigrationCheckpointSecretName(extensionName string) string {
	return operatorMigrationCheckpointSecretBase + operatorMigrationOwnerHash(extensionName)
}

func migrationCheckpointSystemNamespace(ctx context.Context, migrator *migration.Migrator, opts migration.Options) (string, error) {
	prepared, err := migrator.PrepareClusterObjectSet(ctx, opts)
	if err != nil {
		return "", err
	}
	if prepared.SystemNamespace != "" {
		return prepared.SystemNamespace, nil
	}
	namespace, err := discoverOperatorMigrationSystemNamespace(ctx, migrator.Client)
	if err != nil {
		return "", err
	}
	if namespace == "" {
		return "", fmt.Errorf("operator-controller system namespace could not be found")
	}
	return namespace, nil
}

func discoverOperatorMigrationSystemNamespace(ctx context.Context, kubeClient client.Client) (string, error) {
	var deployments appsv1.DeploymentList
	if err := kubeClient.List(ctx, &deployments, client.MatchingLabels{operatorMigrationControllerDeployLabel: operatorMigrationControllerDeployValue}); err != nil {
		return "", fmt.Errorf("list operator-controller Deployments: %w", err)
	}
	var namespaces []string
	for i := range deployments.Items {
		if deployments.Items[i].Name == operatorMigrationControllerDeployName {
			namespaces = append(namespaces, deployments.Items[i].Namespace)
		}
	}
	if len(namespaces) == 0 {
		return "", nil
	}
	if len(namespaces) > 1 {
		return "", fmt.Errorf("expected one operator-controller Deployment %q, found %d", operatorMigrationControllerDeployName, len(namespaces))
	}
	return namespaces[0], nil
}

func captureOperatorMigrationSnapshot(ctx context.Context, migrator *migration.Migrator, opts migration.Options) (*operatorMigrationRecoverySnapshot, error) {
	opts.ApplyDefaults()
	var subscription operatorsv1alpha1.Subscription
	if err := migrator.Client.Get(ctx, client.ObjectKey{Name: opts.SubscriptionName, Namespace: opts.SubscriptionNamespace}, &subscription); err != nil {
		return nil, fmt.Errorf("get Subscription for migration recovery backup: %w", err)
	}
	if subscription.Spec == nil {
		return nil, fmt.Errorf("Subscription %s/%s has no spec to back up", opts.SubscriptionNamespace, opts.SubscriptionName)
	}
	var namespace corev1.Namespace
	if err := migrator.Client.Get(ctx, client.ObjectKey{Name: opts.SubscriptionNamespace}, &namespace); err != nil {
		return nil, fmt.Errorf("get source namespace for migration recovery backup: %w", err)
	}
	snapshot := &operatorMigrationRecoverySnapshot{
		ClusterExtensionName: opts.ClusterExtensionName,
		ClusterObjectSetName: opts.ClusterExtensionName + "-1",
		SubscriptionRef:      opts.SubscriptionNamespace + "/" + opts.SubscriptionName,
		SubscriptionSpec:     *subscription.Spec.DeepCopy(),
		Namespace: operatorMigrationNamespaceBackup{
			Name:        namespace.Name,
			Labels:      copyStringMap(namespace.Labels),
			Annotations: copyStringMap(namespace.Annotations),
		},
	}

	var groups operatorsv1.OperatorGroupList
	if err := migrator.Client.List(ctx, &groups, client.InNamespace(opts.SubscriptionNamespace)); err != nil {
		return nil, fmt.Errorf("list source OperatorGroups for migration recovery backup: %w", err)
	}
	if len(groups.Items) > 1 {
		return nil, fmt.Errorf("found multiple OperatorGroups in source namespace %s", opts.SubscriptionNamespace)
	}
	if len(groups.Items) == 1 {
		group := &groups.Items[0]
		snapshot.OperatorGroup = &operatorMigrationOperatorGroupBackup{
			Name: group.Name, Namespace: group.Namespace, Spec: *group.Spec.DeepCopy(),
		}
	}

	_, csv, _, err := migrator.GetCSVAndInstallPlan(ctx, opts)
	if err != nil {
		return nil, fmt.Errorf("get CSV for migration recovery backup: %w", err)
	}
	snapshot.InstalledCSV, snapshot.InstalledCSVUID = csv.Name, csv.UID
	for _, strategy := range csv.Spec.InstallStrategy.StrategySpec.DeploymentSpecs {
		var deployment appsv1.Deployment
		key := client.ObjectKey{Name: strategy.Name, Namespace: opts.SubscriptionNamespace}
		if err := migrator.Client.Get(ctx, key, &deployment); err != nil {
			if apierrors.IsNotFound(err) {
				continue
			}
			return nil, fmt.Errorf("get source Deployment %s/%s for migration recovery backup: %w", key.Namespace, key.Name, err)
		}
		replicas := int32(1)
		if deployment.Spec.Replicas != nil {
			replicas = *deployment.Spec.Replicas
		}
		snapshot.Deployments = append(snapshot.Deployments, operatorMigrationDeploymentBackup{
			Name: deployment.Name, Namespace: deployment.Namespace, Replicas: replicas,
		})
	}
	return snapshot, nil
}

func createOperatorMigrationCheckpoint(ctx context.Context, migrator *migration.Migrator, opts migration.Options) (*corev1.Secret, error) {
	systemNamespace, err := migrationCheckpointSystemNamespace(ctx, migrator, opts)
	if err != nil {
		return nil, err
	}
	snapshot, err := captureOperatorMigrationSnapshot(ctx, migrator, opts)
	if err != nil {
		return nil, err
	}
	data, err := json.Marshal(snapshot)
	if err != nil {
		return nil, fmt.Errorf("marshal operator migration recovery backup: %w", err)
	}
	secret := &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      operatorMigrationCheckpointSecretName(snapshot.ClusterExtensionName),
			Namespace: systemNamespace,
			Labels: map[string]string{
				operatorMigrationCheckpointLabel:      "true",
				operatorMigrationCheckpointOwnerLabel: operatorMigrationOwnerHash(snapshot.ClusterExtensionName),
			},
		},
		Type: operatorMigrationCheckpointSecretType,
		Data: map[string][]byte{
			operatorMigrationCheckpointDataKey:  data,
			operatorMigrationCheckpointStateKey: []byte(operatorMigrationCheckpointInProgress),
		},
	}
	if err := migrator.Client.Create(ctx, secret); err != nil {
		if apierrors.IsAlreadyExists(err) {
			return nil, fmt.Errorf("an operator migration recovery checkpoint already exists for %s", snapshot.ClusterExtensionName)
		}
		return nil, fmt.Errorf("create operator migration recovery checkpoint: %w", err)
	}
	return secret, nil
}

func migrateOperatorWithRecovery(ctx context.Context, migrator *migration.Migrator, opts migration.Options) error {
	return migrateOperatorWithRecoveryRunner(ctx, migrator, opts, migrator.Migrate)
}

func migrateOperatorWithRecoveryRunner(
	ctx context.Context,
	migrator *migration.Migrator,
	opts migration.Options,
	runMigration func(context.Context, migration.Options) error,
) error {
	opts.ApplyDefaults()
	checkpoint, err := createOperatorMigrationCheckpoint(ctx, migrator, opts)
	if err != nil {
		return fmt.Errorf("prepare operator migration recovery: %w", err)
	}
	if err := runMigration(ctx, opts); err != nil {
		failure := &operatorMigrationFailure{err: err}
		rollbackCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 2*time.Minute)
		defer cancel()

		// Roll back from the checkpoint even when migration failed before creating the
		// ClusterExtension. The migration can already have stopped source workloads by then.
		if markErr := markOperatorMigrationRecoveryRequired(rollbackCtx, migrator.Client, checkpoint); markErr != nil {
			klog.Errorf("could not mark operator migration recovery checkpoint %s/%s: error category=%s", checkpoint.Namespace, checkpoint.Name, migrationErrorCategory(markErr))
		}
		var snapshot operatorMigrationRecoverySnapshot
		if decodeErr := json.Unmarshal(checkpoint.Data[operatorMigrationCheckpointDataKey], &snapshot); decodeErr != nil {
			failure.rollbackErr = fmt.Errorf("decode operator migration recovery checkpoint: %w", decodeErr)
			return failure
		}
		failure.rollbackAttempted = true
		if rollbackErr := rollbackFailedOperatorMigration(rollbackCtx, migrator.Client, checkpoint, &snapshot); rollbackErr != nil {
			failure.rollbackErr = rollbackErr
			return failure
		}
		failure.rolledBack = true
		return failure
	}
	if err := markOperatorMigrationCheckpointMigrated(ctx, migrator.Client, checkpoint); err != nil {
		klog.Warningf("OLM migration succeeded for %s/%s but its recovery checkpoint could not be updated: error category=%s", opts.SubscriptionNamespace, opts.SubscriptionName, migrationErrorCategory(err))
	}
	var extension ocv1.ClusterExtension
	if err := migrator.Client.Get(ctx, client.ObjectKey{Name: opts.ClusterExtensionName}, &extension); err != nil {
		klog.Warningf("OLM migration succeeded for %s/%s but ClusterExtension %s could not be read to link its recovery checkpoint: error category=%s", opts.SubscriptionNamespace, opts.SubscriptionName, opts.ClusterExtensionName, migrationErrorCategory(err))
		return nil
	}
	if extension.Annotations == nil {
		extension.Annotations = map[string]string{}
	}
	extension.Annotations[operatorMigrationCheckpointAnnotation] = checkpoint.Name
	if err := migrator.Client.Update(ctx, &extension); err != nil {
		klog.Warningf("OLM migration succeeded for %s/%s but ClusterExtension %s could not be linked to its recovery checkpoint: error category=%s", opts.SubscriptionNamespace, opts.SubscriptionName, opts.ClusterExtensionName, migrationErrorCategory(err))
	}
	return nil
}

func rollbackFailedOperatorMigration(
	ctx context.Context,
	kubeClient client.Client,
	checkpoint *corev1.Secret,
	snapshot *operatorMigrationRecoverySnapshot,
) error {
	// A failed migration is never treated as a user-confirmed installed extension.
	// The failed job owns this checkpoint and immediately restores the OLMv0 state.
	return (&OLMHandler{}).rollbackFromOperatorMigrationCheckpoint(ctx, kubeClient, checkpoint, snapshot, true)
}

func markOperatorMigrationRecoveryRequired(ctx context.Context, kubeClient client.Client, secret *corev1.Secret) error {
	current := &corev1.Secret{}
	if err := kubeClient.Get(ctx, client.ObjectKeyFromObject(secret), current); err != nil {
		return err
	}
	current.Data[operatorMigrationCheckpointStateKey] = []byte(operatorMigrationCheckpointRequired)
	return kubeClient.Update(ctx, current)
}

func markOperatorMigrationCheckpointMigrated(ctx context.Context, kubeClient client.Client, secret *corev1.Secret) error {
	current := &corev1.Secret{}
	if err := kubeClient.Get(ctx, client.ObjectKeyFromObject(secret), current); err != nil {
		return err
	}
	current.Data[operatorMigrationCheckpointStateKey] = []byte(operatorMigrationCheckpointMigrated)
	return kubeClient.Update(ctx, current)
}

func findOperatorMigrationCheckpoint(ctx context.Context, kubeClient client.Client, extensionName string) (*corev1.Secret, *operatorMigrationRecoverySnapshot, error) {
	systemNamespace, err := discoverOperatorMigrationSystemNamespace(ctx, kubeClient)
	if err != nil {
		return nil, nil, err
	}
	if systemNamespace == "" {
		return nil, nil, nil
	}
	secret := &corev1.Secret{}
	err = kubeClient.Get(ctx, client.ObjectKey{Name: operatorMigrationCheckpointSecretName(extensionName), Namespace: systemNamespace}, secret)
	if apierrors.IsNotFound(err) {
		return nil, nil, nil
	}
	if err != nil {
		return nil, nil, fmt.Errorf("get operator migration recovery checkpoint for %s: %w", extensionName, err)
	}
	if secret.Labels[operatorMigrationCheckpointLabel] != "true" || secret.Labels[operatorMigrationCheckpointOwnerLabel] != operatorMigrationOwnerHash(extensionName) {
		return nil, nil, fmt.Errorf("operator migration recovery checkpoint does not match %s", extensionName)
	}
	if secret.Type != operatorMigrationCheckpointSecretType {
		return nil, nil, fmt.Errorf("operator migration recovery checkpoint for %s has an unexpected Secret type", extensionName)
	}
	var snapshot operatorMigrationRecoverySnapshot
	if err := json.Unmarshal(secret.Data[operatorMigrationCheckpointDataKey], &snapshot); err != nil {
		return nil, nil, fmt.Errorf("decode operator migration recovery checkpoint: %w", err)
	}
	if snapshot.ClusterExtensionName != extensionName || snapshot.ClusterObjectSetName != extensionName+"-1" {
		return nil, nil, fmt.Errorf("operator migration recovery checkpoint does not match %s", extensionName)
	}
	return secret, &snapshot, nil
}

func listOperatorMigrationRecoveryConflicts(ctx context.Context, kubeClient client.Client) (map[string]operatorMigrationRecoveryConflict, error) {
	var extensions ocv1.ClusterExtensionList
	if err := kubeClient.List(ctx, &extensions); err != nil {
		return nil, fmt.Errorf("list ClusterExtensions for migration recovery scan: %w", err)
	}
	annotatedSubscriptions := make(map[string]struct{}, len(extensions.Items))
	for i := range extensions.Items {
		if ref := extensions.Items[i].Annotations[migration.MigratedFromSubscriptionAnnotation]; ref != "" {
			annotatedSubscriptions[ref] = struct{}{}
		}
	}
	conflicts := make(map[string]operatorMigrationRecoveryConflict)
	var objectSets ocv1.ClusterObjectSetList
	if err := kubeClient.List(ctx, &objectSets); err != nil {
		return nil, fmt.Errorf("list ClusterObjectSets for migration recovery scan: %w", err)
	}
	for i := range objectSets.Items {
		objectSet := &objectSets.Items[i]
		ref := objectSet.Annotations[migration.MigratedFromSubscriptionAnnotation]
		if ref == "" {
			continue
		}
		if _, hasExtension := annotatedSubscriptions[ref]; hasExtension {
			continue
		}
		conflicts[ref] = operatorMigrationRecoveryConflict{
			ClusterExtensionName: objectSet.Labels[migration.LabelOwnerName],
			ClusterObjectSetName: objectSet.Name,
			Reason:               fmt.Sprintf("partial migration: ClusterObjectSet %s exists without its ClusterExtension; roll back the partial migration", objectSet.Name),
		}
	}
	systemNamespace, err := discoverOperatorMigrationSystemNamespace(ctx, kubeClient)
	if err != nil {
		return nil, err
	}
	if systemNamespace == "" {
		return conflicts, nil
	}
	var checkpoints corev1.SecretList
	if err := kubeClient.List(ctx, &checkpoints, client.InNamespace(systemNamespace), client.MatchingLabels{operatorMigrationCheckpointLabel: "true"}); err != nil {
		return nil, fmt.Errorf("list operator migration recovery checkpoints: %w", err)
	}
	for i := range checkpoints.Items {
		checkpoint := &checkpoints.Items[i]
		state := string(checkpoint.Data[operatorMigrationCheckpointStateKey])
		if state != operatorMigrationCheckpointInProgress && state != operatorMigrationCheckpointRequired {
			continue
		}
		var snapshot operatorMigrationRecoverySnapshot
		if err := json.Unmarshal(checkpoint.Data[operatorMigrationCheckpointDataKey], &snapshot); err != nil {
			return nil, fmt.Errorf("decode operator migration recovery checkpoint %s/%s: %w", checkpoint.Namespace, checkpoint.Name, err)
		}
		if snapshot.SubscriptionRef == "" || snapshot.ClusterExtensionName == "" || snapshot.ClusterObjectSetName == "" {
			return nil, fmt.Errorf("operator migration recovery checkpoint %s/%s is missing its owner", checkpoint.Namespace, checkpoint.Name)
		}
		conflicts[snapshot.SubscriptionRef] = operatorMigrationRecoveryConflict{
			ClusterExtensionName: snapshot.ClusterExtensionName,
			ClusterObjectSetName: snapshot.ClusterObjectSetName,
			Reason:               "operator migration was interrupted and requires explicit rollback",
		}
	}
	return conflicts, nil
}

func (o *OLMHandler) rollbackOperatorMigration(ctx context.Context, migrator *migration.Migrator, name string, byObjectSet bool, acknowledgeInstalled bool) error {
	extensionName := name
	if byObjectSet {
		if !strings.HasSuffix(name, "-1") {
			return fmt.Errorf("partial migration ClusterObjectSet %s is not the initial migration revision", name)
		}
		extensionName = strings.TrimSuffix(name, "-1")
	}
	checkpoint, snapshot, err := findOperatorMigrationCheckpoint(ctx, migrator.Client, extensionName)
	if err != nil {
		return err
	}
	if checkpoint == nil {
		if byObjectSet {
			return fmt.Errorf("ClusterObjectSet %s has no Console migration recovery checkpoint", name)
		}
		var extension ocv1.ClusterExtension
		err := migrator.Client.Get(ctx, client.ObjectKey{Name: extensionName}, &extension)
		if apierrors.IsNotFound(err) {
			return o.rollbackOperatorMigration(ctx, migrator, extensionName+"-1", true, acknowledgeInstalled)
		}
		if err != nil {
			return fmt.Errorf("get ClusterExtension %s for rollback: %w", extensionName, err)
		}
		return migrator.RollbackClusterExtension(ctx, extensionName, acknowledgeInstalled)
	}
	return o.rollbackFromOperatorMigrationCheckpoint(ctx, migrator.Client, checkpoint, snapshot, acknowledgeInstalled)
}

func (o *OLMHandler) rollbackFromOperatorMigrationCheckpoint(ctx context.Context, kubeClient client.Client, checkpoint *corev1.Secret, snapshot *operatorMigrationRecoverySnapshot, acknowledgeInstalled bool) error {
	var extension ocv1.ClusterExtension
	extensionErr := kubeClient.Get(ctx, client.ObjectKey{Name: snapshot.ClusterExtensionName}, &extension)
	if extensionErr != nil && !apierrors.IsNotFound(extensionErr) {
		return fmt.Errorf("get ClusterExtension %s for rollback: %w", snapshot.ClusterExtensionName, extensionErr)
	}
	extensionExists := extensionErr == nil
	if extensionExists {
		if !acknowledgeInstalled {
			for _, condition := range extension.Status.Conditions {
				if condition.Type == ocv1.TypeInstalled && condition.Status == metav1.ConditionTrue {
					return fmt.Errorf("ClusterExtension %s is Installed=True; set acknowledgeInstalled to confirm rollback", extension.Name)
				}
			}
		}
		if ref := extension.Annotations[migration.MigratedFromSubscriptionAnnotation]; ref != snapshot.SubscriptionRef {
			return fmt.Errorf("ClusterExtension %s does not match rollback Subscription %s", extension.Name, snapshot.SubscriptionRef)
		}
		if ref := extension.Annotations[operatorMigrationCheckpointAnnotation]; ref != "" && ref != checkpoint.Name {
			return fmt.Errorf("ClusterExtension %s points to a different migration recovery checkpoint", extension.Name)
		}
		if raw := extension.Annotations[migration.MigrationSubscriptionBackupAnnotation]; raw != "" {
			var annotatedSpec operatorsv1alpha1.SubscriptionSpec
			if err := json.Unmarshal([]byte(raw), &annotatedSpec); err != nil {
				return fmt.Errorf("decode Subscription backup on ClusterExtension %s: %w", extension.Name, err)
			}
			encodedAnnotated, _ := json.Marshal(&annotatedSpec)
			encodedCheckpoint, _ := json.Marshal(&snapshot.SubscriptionSpec)
			if string(encodedAnnotated) != string(encodedCheckpoint) {
				return fmt.Errorf("ClusterExtension %s Subscription backup does not match its recovery checkpoint", extension.Name)
			}
		}
	}
	if snapshot.SubscriptionSpec.Package == "" || snapshot.SubscriptionSpec.CatalogSource == "" || snapshot.SubscriptionSpec.CatalogSourceNamespace == "" {
		return fmt.Errorf("Subscription rollback backup is missing required package, source, or sourceNamespace")
	}
	namespace, subscriptionName, found := strings.Cut(snapshot.SubscriptionRef, "/")
	if !found || namespace == "" || subscriptionName == "" || namespace != snapshot.Namespace.Name {
		return fmt.Errorf("invalid migrated-from-subscription reference %q", snapshot.SubscriptionRef)
	}

	if err := ensureOperatorMigrationNamespace(ctx, kubeClient, snapshot.Namespace); err != nil {
		return err
	}
	var existingSubscription operatorsv1alpha1.Subscription
	subscriptionErr := kubeClient.Get(ctx, client.ObjectKey{Name: subscriptionName, Namespace: namespace}, &existingSubscription)
	if subscriptionErr != nil && !apierrors.IsNotFound(subscriptionErr) {
		return fmt.Errorf("check source Subscription %s/%s: %w", namespace, subscriptionName, subscriptionErr)
	}
	if subscriptionErr == nil {
		if extensionExists {
			return fmt.Errorf("Subscription %s/%s already exists while ClusterExtension %s is present", namespace, subscriptionName, extension.Name)
		}
		encodedExisting, _ := json.Marshal(existingSubscription.Spec)
		encodedBackup, _ := json.Marshal(&snapshot.SubscriptionSpec)
		if string(encodedExisting) != string(encodedBackup) {
			return fmt.Errorf("Subscription %s/%s exists with a different spec; refusing partial rollback", namespace, subscriptionName)
		}
	}
	if err := ensureOperatorMigrationGroup(ctx, kubeClient, namespace, snapshot.OperatorGroup); err != nil {
		return err
	}

	if err := deleteOperatorMigrationRevisions(ctx, kubeClient, snapshot, checkpoint.Namespace); err != nil {
		return err
	}
	if extensionExists {
		if err := kubeClient.Delete(ctx, &extension, client.PropagationPolicy(metav1.DeletePropagationOrphan)); err != nil && !apierrors.IsNotFound(err) {
			return fmt.Errorf("delete ClusterExtension %s: %w", extension.Name, err)
		}
	}
	if subscriptionErr != nil {
		restored := &operatorsv1alpha1.Subscription{
			ObjectMeta: metav1.ObjectMeta{Name: subscriptionName, Namespace: namespace},
			Spec:       snapshot.SubscriptionSpec.DeepCopy(),
		}
		if err := kubeClient.Create(ctx, restored); err != nil {
			return fmt.Errorf("restore Subscription %s/%s: %w", namespace, subscriptionName, err)
		}
	}
	if err := restoreOperatorMigrationCSVReference(ctx, kubeClient, client.ObjectKey{Name: subscriptionName, Namespace: namespace}, snapshot); err != nil {
		return err
	}
	if err := restoreOperatorMigrationDeployments(ctx, kubeClient, snapshot.Deployments); err != nil {
		return err
	}
	if err := kubeClient.Delete(ctx, checkpoint); err != nil && !apierrors.IsNotFound(err) {
		return fmt.Errorf("operator restored, but recovery checkpoint cleanup failed: %w", err)
	}
	return nil
}

// A surviving CSV must be associated with the restored Subscription. Otherwise
// OLM's resolver treats it as an orphan and cannot resolve the same package.
func restoreOperatorMigrationCSVReference(ctx context.Context, kubeClient client.Client, key client.ObjectKey, snapshot *operatorMigrationRecoverySnapshot) error {
	if snapshot.InstalledCSV == "" {
		return nil // Older checkpoints do not include the original CSV identity.
	}
	return retry.RetryOnConflict(retry.DefaultBackoff, func() error {
		var subscription operatorsv1alpha1.Subscription
		if err := kubeClient.Get(ctx, key, &subscription); err != nil {
			return err
		}
		if subscription.Status.InstalledCSV != "" {
			return nil // OLM has already associated an installed CSV; preserve it.
		}
		var csv operatorsv1alpha1.ClusterServiceVersion
		err := kubeClient.Get(ctx, client.ObjectKey{Name: snapshot.InstalledCSV, Namespace: key.Namespace}, &csv)
		if apierrors.IsNotFound(err) {
			return nil // The original CSV was removed; OLM will install it again.
		}
		if err != nil {
			return err
		}
		if snapshot.InstalledCSVUID != "" && csv.UID != snapshot.InstalledCSVUID {
			return fmt.Errorf("CSV %s/%s was replaced; refusing to restore its Subscription association", key.Namespace, csv.Name)
		}
		if subscription.Status.CurrentCSV != "" && subscription.Status.CurrentCSV != csv.Name {
			return fmt.Errorf("Subscription %s/%s is already tracking another CSV", key.Namespace, key.Name)
		}
		subscription.Status.InstalledCSV = csv.Name
		subscription.Status.CurrentCSV = csv.Name
		subscription.Status.LastUpdated = metav1.Now()
		if err := kubeClient.Status().Update(ctx, &subscription); err != nil {
			return fmt.Errorf("restore Subscription CSV association: %w", err)
		}
		return nil
	})
}

func ensureOperatorMigrationNamespace(ctx context.Context, kubeClient client.Client, backup operatorMigrationNamespaceBackup) error {
	var namespace corev1.Namespace
	err := kubeClient.Get(ctx, client.ObjectKey{Name: backup.Name}, &namespace)
	if err == nil {
		return nil
	}
	if !apierrors.IsNotFound(err) {
		return fmt.Errorf("get source namespace %s for rollback: %w", backup.Name, err)
	}
	if backup.Name == "" {
		return fmt.Errorf("source namespace backup is missing its name")
	}
	if err := kubeClient.Create(ctx, &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{
		Name: backup.Name, Labels: backup.Labels, Annotations: backup.Annotations,
	}}); err != nil {
		return fmt.Errorf("restore source namespace %s: %w", backup.Name, err)
	}
	return nil
}

func ensureOperatorMigrationGroup(ctx context.Context, kubeClient client.Client, namespace string, backup *operatorMigrationOperatorGroupBackup) error {
	if backup == nil {
		return nil
	}
	if backup.Namespace != namespace || backup.Name == "" {
		return fmt.Errorf("OperatorGroup rollback backup does not match source namespace %s", namespace)
	}
	var groups operatorsv1.OperatorGroupList
	if err := kubeClient.List(ctx, &groups, client.InNamespace(namespace)); err != nil {
		return fmt.Errorf("list OperatorGroups in %s for rollback: %w", namespace, err)
	}
	for i := range groups.Items {
		group := &groups.Items[i]
		if group.Name != backup.Name {
			return fmt.Errorf("cannot restore OperatorGroup %s/%s while another OperatorGroup exists", namespace, group.Name)
		}
		group.Spec = *backup.Spec.DeepCopy()
		if err := kubeClient.Update(ctx, group); err != nil {
			return fmt.Errorf("restore OperatorGroup %s/%s: %w", namespace, group.Name, err)
		}
		return nil
	}
	if err := kubeClient.Create(ctx, &operatorsv1.OperatorGroup{
		ObjectMeta: metav1.ObjectMeta{Name: backup.Name, Namespace: namespace},
		Spec:       *backup.Spec.DeepCopy(),
	}); err != nil {
		return fmt.Errorf("create OperatorGroup %s/%s: %w", namespace, backup.Name, err)
	}
	return nil
}

func deleteOperatorMigrationRevisions(ctx context.Context, kubeClient client.Client, snapshot *operatorMigrationRecoverySnapshot, systemNamespace string) error {
	var revisions ocv1.ClusterObjectSetList
	if err := kubeClient.List(ctx, &revisions, client.MatchingLabels{migration.LabelOwnerName: snapshot.ClusterExtensionName}); err != nil {
		return fmt.Errorf("list ClusterObjectSets for rollback: %w", err)
	}
	revisionNames := make(map[string]struct{}, len(revisions.Items)+1)
	foundInitial := false
	for i := range revisions.Items {
		if revisions.Items[i].Name == snapshot.ClusterObjectSetName {
			foundInitial = true
		}
		revisionNames[revisions.Items[i].Name] = struct{}{}
	}
	var initial ocv1.ClusterObjectSet
	getErr := kubeClient.Get(ctx, client.ObjectKey{Name: snapshot.ClusterObjectSetName}, &initial)
	if getErr != nil && !apierrors.IsNotFound(getErr) {
		return fmt.Errorf("get migration ClusterObjectSet %s: %w", snapshot.ClusterObjectSetName, getErr)
	}
	if getErr == nil {
		owner := initial.Labels[migration.LabelOwnerName]
		ref := initial.Annotations[migration.MigratedFromSubscriptionAnnotation]
		if owner == "" && ref == "" {
			return fmt.Errorf("ClusterObjectSet %s has no migration ownership metadata", initial.Name)
		}
		if owner != "" && owner != snapshot.ClusterExtensionName {
			return fmt.Errorf("ClusterObjectSet %s belongs to another extension %q", initial.Name, owner)
		}
		if ref != "" && ref != snapshot.SubscriptionRef {
			return fmt.Errorf("ClusterObjectSet %s does not match rollback Subscription %s", initial.Name, snapshot.SubscriptionRef)
		}
		if !foundInitial {
			revisions.Items = append(revisions.Items, initial)
			revisionNames[initial.Name] = struct{}{}
		}
	}
	for i := range revisions.Items {
		if err := kubeClient.Delete(ctx, &revisions.Items[i], client.PropagationPolicy(metav1.DeletePropagationOrphan)); err != nil && !apierrors.IsNotFound(err) {
			return fmt.Errorf("delete ClusterObjectSet %s: %w", revisions.Items[i].Name, err)
		}
	}
	var secrets corev1.SecretList
	if err := kubeClient.List(ctx, &secrets, client.InNamespace(systemNamespace), client.MatchingLabels{migration.LabelOwnerName: snapshot.ClusterExtensionName}); err != nil {
		return fmt.Errorf("list ClusterObjectSet ref Secrets for %s: %w", snapshot.ClusterExtensionName, err)
	}
	for i := range secrets.Items {
		secret := &secrets.Items[i]
		if _, found := revisionNames[secret.Labels[migration.LabelRevisionName]]; !found {
			continue
		}
		if err := kubeClient.Delete(ctx, secret); err != nil && !apierrors.IsNotFound(err) {
			return fmt.Errorf("delete ClusterObjectSet ref Secret %s/%s: %w", secret.Namespace, secret.Name, err)
		}
	}
	return nil
}

func restoreOperatorMigrationDeployments(ctx context.Context, kubeClient client.Client, backups []operatorMigrationDeploymentBackup) error {
	for _, backup := range backups {
		var deployment appsv1.Deployment
		key := client.ObjectKey{Name: backup.Name, Namespace: backup.Namespace}
		if err := kubeClient.Get(ctx, key, &deployment); err != nil {
			if apierrors.IsNotFound(err) {
				continue
			}
			return fmt.Errorf("get source Deployment %s/%s for rollback: %w", key.Namespace, key.Name, err)
		}
		if deployment.Spec.Replicas != nil && *deployment.Spec.Replicas == backup.Replicas {
			continue
		}
		replicas := backup.Replicas
		deployment.Spec.Replicas = &replicas
		if err := kubeClient.Update(ctx, &deployment); err != nil {
			return fmt.Errorf("restore source Deployment %s/%s: %w", key.Namespace, key.Name, err)
		}
	}
	return nil
}

func copyStringMap(source map[string]string) map[string]string {
	if source == nil {
		return nil
	}
	result := make(map[string]string, len(source))
	for key, value := range source {
		result[key] = value
	}
	return result
}
