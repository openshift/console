package olm

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"maps"
	"strings"
	"time"

	operatorsv1 "github.com/operator-framework/api/pkg/operators/v1"
	operatorsv1alpha1 "github.com/operator-framework/api/pkg/operators/v1alpha1"
	"github.com/operator-framework/library-olm/migration/pkg/migration"
	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/wait"
	"k8s.io/client-go/util/retry"
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

// Error formats API-visible failure and recovery diagnostics; its result must not be logged.
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

// Unwrap exposes the original migration error for typed error classification.
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
	UseClusterObjectDeployment bool                                  `json:"useClusterObjectDeployment,omitempty"`
	ClusterExtensionName       string                                `json:"clusterExtensionName"`
	ClusterObjectSetName       string                                `json:"clusterObjectSetName"`
	SubscriptionRef            string                                `json:"subscriptionRef"`
	SubscriptionSpec           operatorsv1alpha1.SubscriptionSpec    `json:"subscriptionSpec"`
	InstalledCSV               string                                `json:"installedCSV,omitempty"`
	InstalledCSVUID            types.UID                             `json:"installedCSVUID,omitempty"`
	Namespace                  operatorMigrationNamespaceBackup      `json:"namespace"`
	OperatorGroup              *operatorMigrationOperatorGroupBackup `json:"operatorGroup,omitempty"`
	Deployments                []operatorMigrationDeploymentBackup   `json:"deployments,omitempty"`
}

type operatorMigrationRecoveryConflict struct {
	ClusterExtensionName string
	ClusterObjectSetName string
	Reason               string
}

// operatorMigrationOwnerHash derives a stable identifier for operator-owned recovery resources.
func operatorMigrationOwnerHash(name string) string {
	hash := sha256.Sum256([]byte(name))
	return hex.EncodeToString(hash[:8])
}

// operatorMigrationCheckpointSecretName constructs the recovery Secret name from the target operator identifier.
func operatorMigrationCheckpointSecretName(extensionName string) string {
	return operatorMigrationCheckpointSecretBase + operatorMigrationOwnerHash(extensionName)
}

// discoverOperatorMigrationSystemNamespace finds the unique operator-controller Deployment namespace, rejecting ambiguous installations.
func discoverOperatorMigrationSystemNamespace(ctx context.Context, kubeClient client.Client) (string, error) {
	var deployments appsv1.DeploymentList
	if err := kubeClient.List(ctx, &deployments, client.MatchingLabels{operatorMigrationControllerDeployLabel: operatorMigrationControllerDeployValue}); err != nil {
		return "", fmt.Errorf("Cannot list operator-controller Deployments. Check your cluster connection and Deployment read permissions, then try again: %w", err)
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
		return "", fmt.Errorf("Expected one operator-controller Deployment %q, but found %d. Ask a cluster administrator to resolve the duplicate installations before trying again.", operatorMigrationControllerDeployName, len(namespaces))
	}
	return namespaces[0], nil
}

// captureOperatorMigrationSnapshot extends the library backup with namespace metadata and deployment replicas needed for durable recovery.
func captureOperatorMigrationSnapshot(ctx context.Context, migrator *migration.Migrator, opts migration.Options, backup *migration.Backup) (*operatorMigrationRecoverySnapshot, error) {
	opts.ApplyDefaults()
	if backup == nil || backup.Subscription == nil || backup.Subscription.Spec == nil || backup.ClusterServiceVersion == nil {
		return nil, fmt.Errorf("The source backup is incomplete. Check that the OLM (Classic) Subscription and ClusterServiceVersion exist, then retry migration.")
	}
	var namespace corev1.Namespace
	if err := migrator.Client.Get(ctx, client.ObjectKey{Name: opts.SubscriptionNamespace}, &namespace); err != nil {
		return nil, fmt.Errorf("Cannot read the source namespace for the recovery backup. Check namespace read permissions, then retry migration: %w", err)
	}
	snapshot := &operatorMigrationRecoverySnapshot{
		UseClusterObjectDeployment: opts.UseClusterObjectDeployment,
		ClusterExtensionName:       opts.ClusterExtensionName,
		ClusterObjectSetName:       opts.ClusterExtensionName + "-1",
		SubscriptionRef:            opts.SubscriptionNamespace + "/" + opts.SubscriptionName,
		SubscriptionSpec:           *backup.Subscription.Spec.DeepCopy(),
		Namespace: operatorMigrationNamespaceBackup{
			Name:        namespace.Name,
			Labels:      maps.Clone(namespace.Labels),
			Annotations: maps.Clone(namespace.Annotations),
		},
	}

	var groups operatorsv1.OperatorGroupList
	if err := migrator.Client.List(ctx, &groups, client.InNamespace(opts.SubscriptionNamespace)); err != nil {
		return nil, fmt.Errorf("Cannot list source OperatorGroups for the recovery backup. Check OperatorGroup read permissions, then retry migration: %w", err)
	}
	if len(groups.Items) > 1 {
		return nil, fmt.Errorf("Multiple OperatorGroups exist in source namespace %s. Ask a cluster administrator to resolve the conflicting OperatorGroups before retrying migration.", opts.SubscriptionNamespace)
	}
	if len(groups.Items) == 1 {
		group := &groups.Items[0]
		snapshot.OperatorGroup = &operatorMigrationOperatorGroupBackup{
			Name: group.Name, Namespace: group.Namespace, Spec: *group.Spec.DeepCopy(),
		}
	}

	csv := backup.ClusterServiceVersion
	snapshot.InstalledCSV, snapshot.InstalledCSVUID = csv.Name, csv.UID
	for _, strategy := range csv.Spec.InstallStrategy.StrategySpec.DeploymentSpecs {
		var deployment appsv1.Deployment
		key := client.ObjectKey{Name: strategy.Name, Namespace: opts.SubscriptionNamespace}
		if err := migrator.Client.Get(ctx, key, &deployment); err != nil {
			if apierrors.IsNotFound(err) {
				continue
			}
			return nil, fmt.Errorf("Cannot read source Deployment %s/%s for the recovery backup. Check Deployment read permissions, then retry migration: %w", key.Namespace, key.Name, err)
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

// markOperatorMigrationRecoveryRequired persists that a checkpoint requires recovery after migration failure.
func markOperatorMigrationRecoveryRequired(ctx context.Context, kubeClient client.Client, secret *corev1.Secret) error {
	current := &corev1.Secret{}
	if err := kubeClient.Get(ctx, client.ObjectKeyFromObject(secret), current); err != nil {
		return err
	}
	current.Data[operatorMigrationCheckpointStateKey] = []byte(operatorMigrationCheckpointRequired)
	return kubeClient.Update(ctx, current)
}

// markOperatorMigrationCheckpointMigrated persists successful handover while retaining the source recovery backup.
func markOperatorMigrationCheckpointMigrated(ctx context.Context, kubeClient client.Client, secret *corev1.Secret) error {
	current := &corev1.Secret{}
	if err := kubeClient.Get(ctx, client.ObjectKeyFromObject(secret), current); err != nil {
		return err
	}
	current.Data[operatorMigrationCheckpointStateKey] = []byte(operatorMigrationCheckpointMigrated)
	return kubeClient.Update(ctx, current)
}

// findOperatorMigrationCheckpoint loads and validates the checkpoint belonging to the requested target extension.
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
		return nil, nil, fmt.Errorf("Cannot read the migration recovery checkpoint for %s. Check Secret read permissions, then try again: %w", extensionName, err)
	}
	if secret.Labels[operatorMigrationCheckpointLabel] != "true" || secret.Labels[operatorMigrationCheckpointOwnerLabel] != operatorMigrationOwnerHash(extensionName) {
		return nil, nil, fmt.Errorf("The migration recovery checkpoint does not match %s. Ask a cluster administrator to verify the checkpoint and target operator before retrying rollback.", extensionName)
	}
	if secret.Type != operatorMigrationCheckpointSecretType {
		return nil, nil, fmt.Errorf("The migration recovery checkpoint for %s has an unexpected Secret type. Ask a cluster administrator to verify the checkpoint before retrying rollback.", extensionName)
	}
	var snapshot operatorMigrationRecoverySnapshot
	if err := json.Unmarshal(secret.Data[operatorMigrationCheckpointDataKey], &snapshot); err != nil {
		return nil, nil, fmt.Errorf("Cannot read the migration recovery backup. Ask a cluster administrator to verify the checkpoint before retrying rollback: %w", err)
	}
	if snapshot.ClusterExtensionName != extensionName || snapshot.ClusterObjectSetName != extensionName+"-1" {
		return nil, nil, fmt.Errorf("The migration recovery checkpoint does not match %s. Ask a cluster administrator to verify the checkpoint and target operator before retrying rollback.", extensionName)
	}
	return secret, &snapshot, nil
}

// listOperatorMigrationRecoveryConflicts reports active targets or retained checkpoints that block a new source migration.
func listOperatorMigrationRecoveryConflicts(ctx context.Context, kubeClient client.Client) (map[string]operatorMigrationRecoveryConflict, error) {
	var extensions ocv1.ClusterExtensionList
	if err := kubeClient.List(ctx, &extensions); err != nil {
		return nil, fmt.Errorf("Cannot list ClusterExtensions for the recovery scan. Check your cluster connection and ClusterExtension read permissions, then retry the scan: %w", err)
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
		return nil, fmt.Errorf("Cannot list ClusterObjectSets for the recovery scan. Check your cluster connection and ClusterObjectSet read permissions, then retry the scan: %w", err)
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
			Reason:               fmt.Sprintf("Migration is incomplete: ClusterObjectSet %s exists without its ClusterExtension. After the batch finishes, use the rollback action in the migration failure notification, if available, or ask a cluster administrator to recover the operator.", objectSet.Name),
		}
	}
	var deployments ocv1.ClusterObjectDeploymentList
	if err := kubeClient.List(ctx, &deployments); err != nil {
		if !apierrors.IsNotFound(err) && !meta.IsNoMatchError(err) {
			return nil, fmt.Errorf("Cannot list ClusterObjectDeployments for the recovery scan. Check your cluster connection and ClusterObjectDeployment read permissions, then retry the scan: %w", err)
		}
	}
	for _, deployment := range deployments.Items {
		ref := deployment.Annotations[migration.MigratedFromSubscriptionAnnotation]
		if ref == "" {
			continue
		}
		if _, hasExtension := annotatedSubscriptions[ref]; !hasExtension {
			conflicts[ref] = operatorMigrationRecoveryConflict{
				ClusterExtensionName: deployment.Name,
				Reason:               fmt.Sprintf("Migration is incomplete: ClusterObjectDeployment %s exists without its ClusterExtension. After the batch finishes, use the rollback action in the migration failure notification, if available, or ask a cluster administrator to recover the operator.", deployment.Name),
			}
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
		return nil, fmt.Errorf("Cannot list migration recovery checkpoints. Check Secret read permissions, then retry the scan: %w", err)
	}
	for i := range checkpoints.Items {
		checkpoint := &checkpoints.Items[i]
		state := string(checkpoint.Data[operatorMigrationCheckpointStateKey])
		if state != operatorMigrationCheckpointInProgress && state != operatorMigrationCheckpointRequired {
			continue
		}
		var snapshot operatorMigrationRecoverySnapshot
		if err := json.Unmarshal(checkpoint.Data[operatorMigrationCheckpointDataKey], &snapshot); err != nil {
			return nil, fmt.Errorf("Cannot read migration recovery checkpoint %s/%s. Ask a cluster administrator to verify the checkpoint before retrying the scan: %w", checkpoint.Namespace, checkpoint.Name, err)
		}
		if snapshot.SubscriptionRef == "" || snapshot.ClusterExtensionName == "" || snapshot.ClusterObjectSetName == "" {
			return nil, fmt.Errorf("Migration recovery checkpoint %s/%s does not identify its source Subscription or target operator. Ask a cluster administrator to verify the checkpoint before retrying the scan.", checkpoint.Namespace, checkpoint.Name)
		}
		conflicts[snapshot.SubscriptionRef] = operatorMigrationRecoveryConflict{
			ClusterExtensionName: snapshot.ClusterExtensionName,
			ClusterObjectSetName: snapshot.ClusterObjectSetName,
			Reason:               "Operator migration stopped before it finished. To restore OLM (Classic) Operator management, use the rollback action in the migration failure notification after the batch finishes.",
		}
	}
	return conflicts, nil
}

// rollbackFromOperatorMigrationCheckpoint waits for target removal before restoring source management and cleaning recovery resources.
func (o *OLMHandler) rollbackFromOperatorMigrationCheckpoint(ctx context.Context, kubeClient client.Client, checkpoint *corev1.Secret, snapshot *operatorMigrationRecoverySnapshot, acknowledgeInstalled bool) error {
	var extension ocv1.ClusterExtension
	extensionErr := kubeClient.Get(ctx, client.ObjectKey{Name: snapshot.ClusterExtensionName}, &extension)
	if extensionErr != nil && !apierrors.IsNotFound(extensionErr) {
		return fmt.Errorf("Cannot read ClusterExtension %s for rollback. Check ClusterExtension read permissions, then retry rollback: %w", snapshot.ClusterExtensionName, extensionErr)
	}
	extensionExists := extensionErr == nil
	if extensionExists {
		if !acknowledgeInstalled {
			for _, condition := range extension.Status.Conditions {
				if condition.Type == ocv1.TypeInstalled && condition.Status == metav1.ConditionTrue {
					return fmt.Errorf("ClusterExtension %s is already installed. Review the rollback warning and confirm the acknowledgment before starting rollback.", extension.Name)
				}
			}
		}
		if ref := extension.Annotations[migration.MigratedFromSubscriptionAnnotation]; ref != snapshot.SubscriptionRef {
			return fmt.Errorf("ClusterExtension %s does not match Subscription %s in the recovery backup. Ask a cluster administrator to verify resource ownership before retrying rollback.", extension.Name, snapshot.SubscriptionRef)
		}
		if ref := extension.Annotations[operatorMigrationCheckpointAnnotation]; ref != "" && ref != checkpoint.Name {
			return fmt.Errorf("ClusterExtension %s points to a different recovery checkpoint. Ask a cluster administrator to verify the checkpoint before retrying rollback.", extension.Name)
		}
		if raw := extension.Annotations[migration.MigrationSubscriptionBackupAnnotation]; raw != "" {
			var annotatedSpec operatorsv1alpha1.SubscriptionSpec
			if err := json.Unmarshal([]byte(raw), &annotatedSpec); err != nil {
				return fmt.Errorf("Cannot read the Subscription backup on ClusterExtension %s. Ask a cluster administrator to verify the recovery backup before retrying rollback: %w", extension.Name, err)
			}
			encodedAnnotated, _ := json.Marshal(&annotatedSpec)
			encodedCheckpoint, _ := json.Marshal(&snapshot.SubscriptionSpec)
			if string(encodedAnnotated) != string(encodedCheckpoint) {
				return fmt.Errorf("The Subscription backup on ClusterExtension %s does not match its recovery checkpoint. Ask a cluster administrator to verify both backups before retrying rollback.", extension.Name)
			}
		}
	}
	if snapshot.SubscriptionSpec.Package == "" || snapshot.SubscriptionSpec.CatalogSource == "" || snapshot.SubscriptionSpec.CatalogSourceNamespace == "" {
		return fmt.Errorf("The Subscription recovery backup is missing its package, catalog source, or catalog source namespace. Ask a cluster administrator to verify the backup before retrying rollback.")
	}
	namespace, subscriptionName, found := strings.Cut(snapshot.SubscriptionRef, "/")
	if !found || namespace == "" || subscriptionName == "" || namespace != snapshot.Namespace.Name {
		return fmt.Errorf("The source Subscription reference %q is invalid. Ask a cluster administrator to verify the recovery checkpoint before retrying rollback.", snapshot.SubscriptionRef)
	}

	if err := ensureOperatorMigrationNamespace(ctx, kubeClient, snapshot.Namespace); err != nil {
		return err
	}
	var existingSubscription operatorsv1alpha1.Subscription
	subscriptionErr := kubeClient.Get(ctx, client.ObjectKey{Name: subscriptionName, Namespace: namespace}, &existingSubscription)
	if subscriptionErr != nil && !apierrors.IsNotFound(subscriptionErr) {
		return fmt.Errorf("Cannot read source Subscription %s/%s. Check Subscription read permissions, then retry rollback: %w", namespace, subscriptionName, subscriptionErr)
	}
	if subscriptionErr == nil {
		if extensionExists {
			return fmt.Errorf("Subscription %s/%s and ClusterExtension %s both exist. Ask a cluster administrator to resolve the conflicting operator management before retrying rollback.", namespace, subscriptionName, extension.Name)
		}
		encodedExisting, _ := json.Marshal(existingSubscription.Spec)
		encodedBackup, _ := json.Marshal(&snapshot.SubscriptionSpec)
		if string(encodedExisting) != string(encodedBackup) {
			return fmt.Errorf("Subscription %s/%s has a different configuration from the recovery backup. Review the Subscription and backup with a cluster administrator before retrying rollback.", namespace, subscriptionName)
		}
	}
	if err := ensureOperatorMigrationGroup(ctx, kubeClient, namespace, snapshot.OperatorGroup); err != nil {
		return err
	}

	_, err := bindMigrationDeployment(ctx, kubeClient, checkpoint, snapshot, &extension)
	if err != nil {
		return err
	}
	// Verify revision ownership before stopping either target controller.
	if guard, ok := kubeClient.(*migrationExecutionClient); ok && guard.rollbackSourceID != "" {
		revisions, err := migrationRevisions(ctx, kubeClient, snapshot.ClusterExtensionName)
		if err != nil {
			return err
		}
		for i := range revisions {
			if revisions[i].Annotations[migrationExecutionAnnotation] != guard.rollbackSourceID && !guard.ownsRollbackRevision(&revisions[i]) {
				return rollbackConflict("This rollback revision does not match the migration job. Ask a cluster administrator to verify the revision and recovery checkpoint before retrying rollback.")
			}
		}
	}
	// Stop target reconciliation before removing revisions or restoring OLM (Classic) management.
	if extensionExists {
		if err := kubeClient.Delete(ctx, &extension, client.PropagationPolicy(metav1.DeletePropagationOrphan)); err != nil && !apierrors.IsNotFound(err) {
			return fmt.Errorf("Cannot delete ClusterExtension %s. Check its status and your delete permissions, then retry rollback: %w", extension.Name, err)
		}
		if err := waitForOperatorMigrationDeletion(ctx, kubeClient, &extension); err != nil {
			return err
		}
	}
	// A final in-flight extension reconciliation may have created a deployment.
	deployment, err := bindMigrationDeployment(ctx, kubeClient, checkpoint, snapshot, &extension)
	if err != nil {
		return err
	}
	if deployment != nil {
		if err := kubeClient.Delete(ctx, deployment, client.PropagationPolicy(metav1.DeletePropagationOrphan)); err != nil && !apierrors.IsNotFound(err) {
			return err
		}
		if err := waitForOperatorMigrationDeletion(ctx, kubeClient, deployment); err != nil {
			return err
		}
	}
	if err := deleteOperatorMigrationRevisions(ctx, kubeClient, snapshot, checkpoint.Namespace); err != nil {
		return err
	}
	if subscriptionErr != nil {
		restored := &operatorsv1alpha1.Subscription{
			ObjectMeta: metav1.ObjectMeta{Name: subscriptionName, Namespace: namespace},
			Spec:       snapshot.SubscriptionSpec.DeepCopy(),
		}
		if err := kubeClient.Create(ctx, restored); err != nil {
			return fmt.Errorf("Cannot restore Subscription %s/%s. Check Subscription create permissions, then retry rollback: %w", namespace, subscriptionName, err)
		}
	}
	if err := restoreOperatorMigrationCSVReference(ctx, kubeClient, client.ObjectKey{Name: subscriptionName, Namespace: namespace}, snapshot); err != nil {
		return err
	}
	if err := restoreOperatorMigrationDeployments(ctx, kubeClient, snapshot.Deployments); err != nil {
		return err
	}
	if err := kubeClient.Delete(ctx, checkpoint); err != nil && !apierrors.IsNotFound(err) {
		return fmt.Errorf("The operator is restored, but recovery checkpoint cleanup failed. Check Secret delete permissions, then retry rollback to finish cleanup: %w", err)
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
			return fmt.Errorf("Another process replaced ClusterServiceVersion %s/%s. Review it and its Subscription with a cluster administrator before retrying rollback.", key.Namespace, csv.Name)
		}
		if subscription.Status.CurrentCSV != "" && subscription.Status.CurrentCSV != csv.Name {
			return fmt.Errorf("Subscription %s/%s already tracks another ClusterServiceVersion. Ask a cluster administrator to verify the installed version before retrying rollback.", key.Namespace, key.Name)
		}
		subscription.Status.InstalledCSV = csv.Name
		subscription.Status.CurrentCSV = csv.Name
		subscription.Status.LastUpdated = metav1.Now()
		if err := kubeClient.Status().Update(ctx, &subscription); err != nil {
			return fmt.Errorf("Cannot restore the Subscription association with its ClusterServiceVersion. Check Subscription status update permissions, then retry rollback: %w", err)
		}
		return nil
	})
}

// ensureOperatorMigrationNamespace keeps an existing source namespace or recreates it from the saved metadata.
func ensureOperatorMigrationNamespace(ctx context.Context, kubeClient client.Client, backup operatorMigrationNamespaceBackup) error {
	var namespace corev1.Namespace
	err := kubeClient.Get(ctx, client.ObjectKey{Name: backup.Name}, &namespace)
	if err == nil {
		return nil
	}
	if !apierrors.IsNotFound(err) {
		return fmt.Errorf("Cannot read source namespace %s for rollback. Check namespace read permissions, then retry rollback: %w", backup.Name, err)
	}
	if backup.Name == "" {
		return fmt.Errorf("The source namespace backup is missing its name. Ask a cluster administrator to verify the recovery checkpoint before retrying rollback.")
	}
	if err := kubeClient.Create(ctx, &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{
		Name: backup.Name, Labels: backup.Labels, Annotations: backup.Annotations,
	}}); err != nil {
		return fmt.Errorf("Cannot restore source namespace %s. Check namespace create permissions, then retry rollback: %w", backup.Name, err)
	}
	return nil
}

// ensureOperatorMigrationGroup restores the saved OperatorGroup only when no competing group exists.
func ensureOperatorMigrationGroup(ctx context.Context, kubeClient client.Client, namespace string, backup *operatorMigrationOperatorGroupBackup) error {
	if backup == nil {
		return nil
	}
	if backup.Namespace != namespace || backup.Name == "" {
		return fmt.Errorf("The OperatorGroup recovery backup does not match source namespace %s. Ask a cluster administrator to verify the checkpoint before retrying rollback.", namespace)
	}
	var groups operatorsv1.OperatorGroupList
	if err := kubeClient.List(ctx, &groups, client.InNamespace(namespace)); err != nil {
		return fmt.Errorf("Cannot list OperatorGroups in %s for rollback. Check OperatorGroup read permissions, then retry rollback: %w", namespace, err)
	}
	for i := range groups.Items {
		group := &groups.Items[i]
		if group.Name != backup.Name {
			return fmt.Errorf("OperatorGroup %s/%s differs from the recovery backup. Ask a cluster administrator to resolve the conflicting OperatorGroups before retrying rollback.", namespace, group.Name)
		}
		group.Spec = *backup.Spec.DeepCopy()
		if err := kubeClient.Update(ctx, group); err != nil {
			return fmt.Errorf("Cannot restore OperatorGroup %s/%s. Check OperatorGroup update permissions, then retry rollback: %w", namespace, group.Name, err)
		}
		return nil
	}
	if err := kubeClient.Create(ctx, &operatorsv1.OperatorGroup{
		ObjectMeta: metav1.ObjectMeta{Name: backup.Name, Namespace: namespace},
		Spec:       *backup.Spec.DeepCopy(),
	}); err != nil {
		return fmt.Errorf("Cannot create OperatorGroup %s/%s. Check OperatorGroup create permissions, then retry rollback: %w", namespace, backup.Name, err)
	}
	return nil
}

// deleteOperatorMigrationRevisions orphan-deletes target revisions, waits for their removal, and removes matching reference Secrets.
func deleteOperatorMigrationRevisions(ctx context.Context, kubeClient client.Client, snapshot *operatorMigrationRecoverySnapshot, systemNamespace string) error {
	items, err := migrationRevisions(ctx, kubeClient, snapshot.ClusterExtensionName)
	if err != nil {
		return fmt.Errorf("Cannot list ClusterObjectSets for rollback. Check ClusterObjectSet read permissions, then retry rollback: %w", err)
	}
	revisions := ocv1.ClusterObjectSetList{Items: items}
	revisionNames := map[string]struct{}{snapshot.ClusterObjectSetName: {}}
	if guard, ok := kubeClient.(*migrationExecutionClient); ok && guard.rollbackSourceID != "" {
		// A previous recovery attempt may have removed revisions before reference
		// cleanup failed. Their verified identities remain in the checkpoint.
		for name := range guard.rollbackRevisionUIDs {
			revisionNames[name] = struct{}{}
		}
	}
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
		return fmt.Errorf("Cannot read migration ClusterObjectSet %s. Check ClusterObjectSet read permissions, then retry rollback: %w", snapshot.ClusterObjectSetName, getErr)
	}
	if getErr == nil {
		owner := initial.Labels[migration.LabelOwnerName]
		ref := initial.Annotations[migration.MigratedFromSubscriptionAnnotation]
		if owner == "" && ref == "" && initial.Spec.Group != snapshot.ClusterExtensionName {
			return fmt.Errorf("ClusterObjectSet %s has no migration ownership metadata. Ask a cluster administrator to verify its ownership before retrying rollback.", initial.Name)
		}
		if initial.Spec.Group != "" && initial.Spec.Group != snapshot.ClusterExtensionName {
			return fmt.Errorf("ClusterObjectSet %s belongs to a different group, %q. Ask a cluster administrator to verify its ownership before retrying rollback.", initial.Name, initial.Spec.Group)
		}
		if owner != "" && owner != snapshot.ClusterExtensionName {
			return fmt.Errorf("ClusterObjectSet %s identifies a different ClusterExtension, %q. Ask a cluster administrator to verify its ownership before retrying rollback.", initial.Name, owner)
		}
		if ref != "" && ref != snapshot.SubscriptionRef {
			return fmt.Errorf("ClusterObjectSet %s does not match Subscription %s in the recovery backup. Ask a cluster administrator to verify its ownership before retrying rollback.", initial.Name, snapshot.SubscriptionRef)
		}
		if !foundInitial {
			revisions.Items = append(revisions.Items, initial)
			revisionNames[initial.Name] = struct{}{}
		}
	}
	for i := range revisions.Items {
		if err := kubeClient.Delete(ctx, &revisions.Items[i], client.PropagationPolicy(metav1.DeletePropagationOrphan)); err != nil && !apierrors.IsNotFound(err) {
			return fmt.Errorf("Cannot delete ClusterObjectSet %s. Check its status and your delete permissions, then retry rollback: %w", revisions.Items[i].Name, err)
		}
		if err := waitForOperatorMigrationDeletion(ctx, kubeClient, &revisions.Items[i]); err != nil {
			return err
		}
	}
	if snapshot.UseClusterObjectDeployment || deploymentIdentityKnown(kubeClient) {
		emptyObservations := 0
		if err := wait.PollUntilContextTimeout(ctx, time.Second, 2*time.Minute, true, func(ctx context.Context) (bool, error) {
			deployment, err := migrationDeployment(ctx, kubeClient, snapshot.ClusterExtensionName)
			if err != nil {
				return false, err
			}
			if deployment != nil {
				return false, rollbackConflict("Cannot restore OLM (Classic) management because a target deployment still exists. Ask a cluster administrator to review the deployment before retrying rollback.")
			}
			remaining, err := migrationRevisions(ctx, kubeClient, snapshot.ClusterExtensionName)
			if err != nil {
				return false, err
			}
			if len(remaining) == 0 {
				emptyObservations++
				return emptyObservations >= 2, nil
			}
			emptyObservations = 0
			for i := range remaining {
				revisionNames[remaining[i].Name] = struct{}{}
				if err := kubeClient.Delete(ctx, &remaining[i], client.PropagationPolicy(metav1.DeletePropagationOrphan)); client.IgnoreNotFound(err) != nil {
					return false, err
				}
			}
			return false, nil
		}); err != nil {
			return err
		}
	}
	var secrets corev1.SecretList
	if err := kubeClient.List(ctx, &secrets, client.InNamespace(systemNamespace), client.MatchingLabels{migration.LabelOwnerName: snapshot.ClusterExtensionName}); err != nil {
		return fmt.Errorf("Cannot list migration reference Secrets for %s. Check Secret read permissions, then retry rollback: %w", snapshot.ClusterExtensionName, err)
	}
	for i := range secrets.Items {
		secret := &secrets.Items[i]
		guard, delegated := kubeClient.(*migrationExecutionClient)
		packedReference := delegated && guard.rollbackSourceID != "" && secret.Type == corev1.SecretType(migration.SecretTypeObjectData) &&
			(secret.Annotations[migrationExecutionAnnotation] == guard.rollbackSourceID || secret.Labels[migration.LabelRevisionName] == "")
		if _, found := revisionNames[secret.Labels[migration.LabelRevisionName]]; !found && !packedReference {
			continue
		}
		// The execution client verifies extension or saved Secret UIDs before
		// deleting unlabelled packed references, including after orphaning.
		if err := kubeClient.Delete(ctx, secret); err != nil && !apierrors.IsNotFound(err) {
			return fmt.Errorf("Cannot delete migration reference Secret %s/%s. Check Secret delete permissions, then retry rollback: %w", secret.Namespace, secret.Name, err)
		}
	}
	return nil
}

// restoreOperatorMigrationDeployments restores recorded replica counts for surviving source controller deployments.
func restoreOperatorMigrationDeployments(ctx context.Context, kubeClient client.Client, backups []operatorMigrationDeploymentBackup) error {
	for _, backup := range backups {
		var deployment appsv1.Deployment
		key := client.ObjectKey{Name: backup.Name, Namespace: backup.Namespace}
		if err := kubeClient.Get(ctx, key, &deployment); err != nil {
			if apierrors.IsNotFound(err) {
				continue
			}
			return fmt.Errorf("Cannot read source Deployment %s/%s for rollback. Check Deployment read permissions, then retry rollback: %w", key.Namespace, key.Name, err)
		}
		if deployment.Spec.Replicas != nil && *deployment.Spec.Replicas == backup.Replicas {
			continue
		}
		replicas := backup.Replicas
		deployment.Spec.Replicas = &replicas
		if err := kubeClient.Update(ctx, &deployment); err != nil {
			return fmt.Errorf("Cannot restore source Deployment %s/%s. Check Deployment update permissions, then retry rollback: %w", key.Namespace, key.Name, err)
		}
	}
	return nil
}

// waitForOperatorMigrationDeletion refuses to restore a competing controller while a target still exists.
func waitForOperatorMigrationDeletion(ctx context.Context, kubeClient client.Client, object client.Object) error {
	key, uid := client.ObjectKeyFromObject(object), object.GetUID()
	return wait.PollUntilContextCancel(ctx, time.Second, true, func(ctx context.Context) (bool, error) {
		current := object.DeepCopyObject().(client.Object)
		err := kubeClient.Get(ctx, key, current)
		if apierrors.IsNotFound(err) {
			return true, nil
		}
		if err != nil {
			return false, err
		}
		if uid != "" && current.GetUID() != uid {
			return false, rollbackConflict("Another process replaced the migration target during rollback. Ask a cluster administrator to verify its ownership before retrying rollback.")
		}
		return false, nil
	})
}
