package olm

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"time"

	operatorsv1alpha1 "github.com/operator-framework/api/pkg/operators/v1alpha1"
	"github.com/operator-framework/library-olm/migration/pkg/migration"
	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/wait"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type migrationJournal struct {
	JobID             string
	Phase             string
	Options           migration.Options
	Info              migration.MigrationInfo
	Backup            migration.Backup
	SourceObjects     []unstructured.Unstructured
	Recovery          operatorMigrationRecoverySnapshot
	Failure           string
	RollbackAttempted bool
	RolledBack        bool
	RollbackError     string
}

// migrationJournalName derives a stable journal key from the source namespace and Subscription name.
func migrationJournalName(namespace, subscription string) string {
	return "operator-" + operatorMigrationOwnerHash(namespace+"/"+subscription)
}

// loadJournal decodes the persisted per-operator execution journal.
func (c *migrationCoordinator) loadJournal(ctx context.Context, namespace, subscriptionNamespace, subscription string) (*migrationJournal, error) {
	var secret corev1.Secret
	if err := c.client.Get(ctx, client.ObjectKey{Name: migrationJournalName(subscriptionNamespace, subscription), Namespace: namespace}, &secret); err != nil {
		return nil, err
	}
	if len(secret.Data[migrationJobRecordKey]) == 0 && secret.Type == corev1.SecretTypeOpaque {
		return nil, apierrors.NewNotFound(corev1.Resource("secrets"), secret.Name)
	}
	var journal migrationJournal
	if err := decodeMigrationState(secret.Data[migrationJobRecordKey], &journal); err != nil {
		return nil, err
	}
	return &journal, nil
}

// saveJournal persists an execution journal only while this backend owns the job Lease.
func (c *migrationCoordinator) saveJournal(ctx context.Context, namespace string, journal *migrationJournal) error {
	if err := c.ownsLease(ctx, namespace); err != nil {
		return err
	}
	encoded, err := encodeMigrationState(journal)
	if err != nil {
		return err
	}
	secret := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: migrationJournalName(journal.Options.SubscriptionNamespace, journal.Options.SubscriptionName), Namespace: namespace}}
	err = c.client.Get(ctx, client.ObjectKeyFromObject(secret), secret)
	if err != nil && !apierrors.IsNotFound(err) {
		return err
	}
	secret.Data = map[string][]byte{migrationJobRecordKey: encoded}
	if apierrors.IsNotFound(err) {
		return c.client.Create(ctx, secret)
	}
	return c.client.Update(ctx, secret)
}

// prepareJournal collects migration inputs and source backups for resumable execution.
func (c *migrationCoordinator) prepareJournal(ctx context.Context, m *migration.Migrator, id string, options migration.Options) (*migrationJournal, error) {
	options.ApplyDefaults()
	reportMigrationPhase(m, options, migration.ProgressStepProfile, migration.ProgressStarted)
	var err error
	options, err = m.PrepareClusterObjectSet(ctx, options)
	if err != nil {
		return nil, err
	}
	reportMigrationPhase(m, options, migration.ProgressStepCheck, migration.ProgressStarted)
	csv, ip, readiness, compatibility, err := m.EnsurePrerequisites(ctx, options)
	if err != nil {
		return nil, err
	}
	if !readiness.Passed() || !compatibility.Passed() {
		return nil, fmt.Errorf("operator did not pass migration requirements")
	}
	reportMigrationPhase(m, options, migration.ProgressStepCollect, migration.ProgressStarted)
	info, err := m.Gather(ctx, options)
	if err != nil {
		return nil, err
	}
	if collector, ok := m.Client.(*migrationCollectionClient); ok {
		if err := collector.collectionError(); err != nil {
			return nil, fmt.Errorf("collect delegated migration resources: %w", err)
		}
	}
	reportMigrationPhase(m, options, migration.ProgressStepCatalog, migration.ProgressStarted)
	info.ResolvedCatalogName, err = m.ResolveClusterCatalog(ctx, info, m.RESTConfig)
	if err != nil {
		return nil, err
	}
	reportMigrationPhase(m, options, migration.ProgressStepBackup, migration.ProgressStarted)
	backup, err := m.BackupResources(ctx, options, csv, ip)
	if err != nil {
		return nil, err
	}
	encoded, err := json.Marshal(backup.Subscription.Spec)
	if err != nil {
		return nil, err
	}
	info.SubscriptionBackupJSON = string(encoded)
	if backup.OperatorGroup != nil {
		encoded, err := json.Marshal(backup.OperatorGroup.Spec)
		if err != nil {
			return nil, err
		}
		info.OperatorGroupBackupJSON = string(encoded)
	}
	recovery, err := captureOperatorMigrationSnapshot(ctx, m, options, backup)
	if err != nil {
		return nil, err
	}
	j := &migrationJournal{JobID: id, Phase: "checkpoint", Options: options, Info: *info, Backup: *backup, Recovery: *recovery}
	for _, object := range info.CollectedObjects {
		j.SourceObjects = append(j.SourceObjects, *object.DeepCopy())
	}
	migration.RewriteInstallNamespace(j.Info.CollectedObjects, options.SubscriptionNamespace, options.InstallNamespace)
	if err := m.EnsureTargetNamespaceResourcesAbsent(ctx, j.SourceObjects, j.Info.CollectedObjects, options); err != nil {
		return nil, err
	}
	return j, nil
}

// executeCandidate resumes or initializes an operator journal and persists phase transitions and recovery results.
func (c *migrationCoordinator) executeCandidate(ctx context.Context, migrator *migration.Migrator, namespace, id string, options migration.Options) error {
	readCtx, cancelRead := context.WithTimeout(context.WithoutCancel(ctx), 10*time.Second)
	j, err := c.loadJournal(readCtx, namespace, options.SubscriptionNamespace, options.SubscriptionName)
	cancelRead()
	if apierrors.IsNotFound(err) {
		j, err = c.prepareJournal(ctx, migrator, id, options)
		if err != nil {
			return err
		}
		if err := c.saveJournal(ctx, namespace, j); err != nil {
			if errors.Is(err, errMigrationCheckpointTooLarge) {
				return err
			}
			return errMigrationSuspended
		}
	} else if err != nil {
		return err
	}
	if j.JobID != id || j.Options.SubscriptionName != options.SubscriptionName || j.Options.SubscriptionNamespace != options.SubscriptionNamespace {
		return fmt.Errorf("migration journal belongs to a different execution")
	}
	guard := &migrationExecutionClient{Client: migrator.Client, coordinator: c, namespace: namespace, id: id, preserveTargets: true, retainCheckpoint: true, sourceSubscription: j.Backup.Subscription}
	m := migration.NewMigrator(guard, migrator.RESTConfig)
	m.Progress = migrator.Progress
	finish := func() error {
		if j.RolledBack {
			cleanupCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 10*time.Second)
			defer cancel()
			// The completed journal must be durable before deleting the backup.
			var checkpoint corev1.Secret
			key := client.ObjectKey{Name: operatorMigrationCheckpointSecretName(j.Options.ClusterExtensionName), Namespace: j.Options.SystemNamespace}
			err := m.Client.Get(cleanupCtx, key, &checkpoint)
			if err != nil && !apierrors.IsNotFound(err) {
				return errMigrationSuspended
			}
			if err == nil {
				if checkpoint.Annotations[migrationExecutionAnnotation] != id {
					return fmt.Errorf("recovery checkpoint belongs to another execution")
				}
				guard.retainCheckpoint = false
				if err := guard.Delete(cleanupCtx, &checkpoint); err != nil && !apierrors.IsNotFound(err) {
					return errMigrationSuspended
				}
			}
		}
		return j.result()
	}
	err = c.advanceJournal(ctx, m, namespace, j)
	if err == nil {
		return finish()
	}
	if errors.Is(err, errMigrationSuspended) || errors.Is(ctx.Err(), context.Canceled) && !c.cancellationRequested(namespace) {
		return errMigrationSuspended
	}
	reportMigrationPhase(m, j.Options, migrationJournalStep(j.Phase), migration.ProgressFailed)
	if j.Phase == "checkpoint" {
		// No source resources have been changed. A rejected checkpoint claim
		// must not offer recovery using another execution's backup.
		j.Failure, j.Phase = err.Error(), "done"
		writeCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 10*time.Second)
		defer cancel()
		if err := c.saveJournal(writeCtx, namespace, j); err != nil {
			return errMigrationSuspended
		}
		return finish()
	}
	j.Failure, j.Phase = err.Error(), "recovery"
	recoveryCtx, cancel := migration.NewRecoveryContext(ctx)
	defer cancel()
	if err := c.saveJournal(recoveryCtx, namespace, j); err != nil {
		return errMigrationSuspended
	}
	if err := c.advanceJournal(recoveryCtx, m, namespace, j); err != nil {
		return errMigrationSuspended
	}
	return finish()
}

// cancellationRequested reads the durable cancellation marker for a job namespace.
func (c *migrationCoordinator) cancellationRequested(namespace string) bool {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, state, err := loadDurableMigrationJob(ctx, c.client, namespace)
	return err == nil && string(state.Data[migrationJobCancelKey]) == "true"
}

// result reconstructs the completed operator outcome, including automatic recovery status.
func (j *migrationJournal) result() error {
	if j.Failure == "" {
		return nil
	}
	f := &operatorMigrationFailure{err: errors.New(j.Failure), rollbackAttempted: j.RollbackAttempted, rolledBack: j.RolledBack}
	if j.RollbackError != "" {
		f.rollbackErr = errors.New(j.RollbackError)
	}
	return f
}

// advanceJournal executes checkpointed migration phases and preserves potentially active targets on failure.
func (c *migrationCoordinator) advanceJournal(ctx context.Context, m *migration.Migrator, namespace string, j *migrationJournal) error {
	opts := j.Options
	checkpoint := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: operatorMigrationCheckpointSecretName(opts.ClusterExtensionName), Namespace: opts.SystemNamespace}}
	for j.Phase != "done" {
		if err := ctx.Err(); err != nil {
			return err
		}
		if err := c.ownsLease(ctx, namespace); err != nil {
			return errMigrationSuspended
		}
		next := ""
		step := migrationJournalStep(j.Phase)
		reportMigrationPhase(m, opts, step, migration.ProgressStarted)
		switch j.Phase {
		case "checkpoint":
			data, err := json.Marshal(j.Recovery)
			if err != nil {
				return err
			}
			checkpoint.Labels = map[string]string{operatorMigrationCheckpointLabel: "true", operatorMigrationCheckpointOwnerLabel: operatorMigrationOwnerHash(opts.ClusterExtensionName)}
			checkpoint.Type = operatorMigrationCheckpointSecretType
			checkpoint.Data = map[string][]byte{operatorMigrationCheckpointDataKey: data, operatorMigrationCheckpointStateKey: []byte(operatorMigrationCheckpointInProgress)}
			if err := m.Client.Create(ctx, checkpoint); err != nil {
				return err
			}
			next = "prepare"
		case "prepare":
			if err := m.PrepareInstallNamespace(ctx, opts); err != nil {
				return err
			}
			if j.Backup.Subscription == nil || j.Backup.ClusterServiceVersion == nil {
				return fmt.Errorf("source backup is incomplete")
			}
			if j.Backup.Subscription.UID == "" || j.Backup.ClusterServiceVersion.UID == "" {
				return fmt.Errorf("source backup has no UID")
			}
			if err := m.PrepareForMigration(ctx, opts, j.Backup.ClusterServiceVersion); err != nil {
				return err
			}
			next = "scale"
		case "scale":
			if err := clearOrphanedMigrationRevisionAnnotations(ctx, m.Client, j); err != nil {
				return err
			}
			if _, err := m.ScaleSourceDeployments(ctx, j.SourceObjects, opts); err != nil {
				return err
			}
			next = "cos"
		case "cos":
			var cos ocv1.ClusterObjectSet
			err := m.Client.Get(ctx, client.ObjectKey{Name: opts.ClusterExtensionName + "-1"}, &cos)
			if apierrors.IsNotFound(err) {
				err = m.CreateClusterObjectSet(ctx, opts, &j.Info)
			} else if err == nil {
				if err = verifyMigrationTarget(&cos, j); err == nil {
					err = m.WaitForCOSSucceeded(ctx, cos.Name)
				}
				if err == nil {
					err = m.WaitForClusterObjectSetAvailable(ctx, cos.Name)
				}
			}
			if err != nil {
				return err
			}
			next = "ce"
		case "ce":
			var extension ocv1.ClusterExtension
			err := m.Client.Get(ctx, client.ObjectKey{Name: opts.ClusterExtensionName}, &extension)
			if apierrors.IsNotFound(err) {
				err = m.CreateClusterExtension(ctx, opts, &j.Info)
			} else if err == nil {
				if err = verifyMigrationTarget(&extension, j); err == nil {
					err = m.WaitForClusterExtensionInstalled(ctx, extension.Name)
				}
			}
			if err != nil {
				return err
			}
			next = "cleanup"
		case "cleanup":
			if err := m.DeleteSourceNamespaceResources(ctx, j.SourceObjects, opts); err != nil {
				return err
			}
			if err := m.CleanupOLMv0Resources(ctx, opts, j.Info.PackageName, j.Backup.ClusterServiceVersion.Name).Err(); err != nil {
				return err
			}
			if err := m.DeleteSourceNamespace(ctx, opts); err != nil {
				return err
			}
			if err := markOperatorMigrationCheckpointMigrated(ctx, m.Client, checkpoint); err != nil {
				return err
			}
			var extension ocv1.ClusterExtension
			if err := m.Client.Get(ctx, client.ObjectKey{Name: opts.ClusterExtensionName}, &extension); err != nil {
				return err
			}
			if err := verifyMigrationTarget(&extension, j); err != nil {
				return err
			}
			if extension.Annotations == nil {
				extension.Annotations = map[string]string{}
			}
			extension.Annotations[operatorMigrationCheckpointAnnotation] = checkpoint.Name
			if err := m.Client.Update(ctx, &extension); err != nil {
				return err
			}
			next = "done"
		case "recovery":
			j.RollbackAttempted = true
			// An active target may already manage the source's objects. Keep it
			// and its reference Secrets intact rather than restart both controllers.
			var target ocv1.ClusterObjectSet
			targetErr := m.Client.Get(ctx, client.ObjectKey{Name: opts.ClusterExtensionName + "-1"}, &target)
			if targetErr != nil && !apierrors.IsNotFound(targetErr) {
				return targetErr
			}
			var extension ocv1.ClusterExtension
			extensionErr := m.Client.Get(ctx, client.ObjectKey{Name: opts.ClusterExtensionName}, &extension)
			if extensionErr != nil && !apierrors.IsNotFound(extensionErr) {
				return extensionErr
			}
			if err := m.Client.Get(ctx, client.ObjectKeyFromObject(checkpoint), checkpoint); err != nil {
				j.RollbackError = fmt.Sprintf("read recovery checkpoint: %v", err)
			} else if checkpoint.Annotations[migrationExecutionAnnotation] != j.JobID {
				j.RollbackError = "recovery checkpoint belongs to another execution"
			} else {
				if err := markOperatorMigrationRecoveryRequired(ctx, m.Client, checkpoint); err != nil {
					return err
				}
				if targetErr == nil || extensionErr == nil {
					j.RollbackError = "target migration resources may be active; migration halted and requires explicit recovery"
				} else if err := (&OLMHandler{}).rollbackFromOperatorMigrationCheckpoint(ctx, m.Client, checkpoint, &j.Recovery, true); err != nil {
					j.RollbackError = err.Error()
				} else {
					j.RolledBack = true
				}
			}
			next = "done"
		default:
			return fmt.Errorf("unknown persisted migration phase %q", j.Phase)
		}
		reportMigrationPhase(m, opts, step, migration.ProgressCompleted)
		j.Phase = next
		if err := c.saveJournal(ctx, namespace, j); err != nil {
			return errMigrationSuspended
		}
	}
	return nil
}

const migrationResourceRevisionAnnotation = "olm.operatorframework.io/revision"

// clearOrphanedMigrationRevisionAnnotations releases stale rollout markers on unchanged source resources before remigration.
// The controller can leave these markers after orphan deletion, preventing adoption even with collisionProtection=None.
func clearOrphanedMigrationRevisionAnnotations(ctx context.Context, kubeClient client.Client, journal *migrationJournal) error {
	for i := range journal.SourceObjects {
		source := &journal.SourceObjects[i]
		revision, marked := source.GetAnnotations()[migrationResourceRevisionAnnotation]
		if !marked || !isMigrationRevisionSource(source, journal) {
			continue
		}
		if source.GetUID() == "" {
			return fmt.Errorf("cannot release a previous migration revision without the source resource UID")
		}
		// A source backup and matching label do not authorize interfering with a live target.
		var extension ocv1.ClusterExtension
		if err := kubeClient.Get(ctx, client.ObjectKey{Name: journal.Options.ClusterExtensionName}, &extension); !apierrors.IsNotFound(err) {
			if err != nil {
				return err
			}
			return fmt.Errorf("cannot release a previous migration revision while the target ClusterExtension exists")
		}
		var initial ocv1.ClusterObjectSet
		if err := kubeClient.Get(ctx, client.ObjectKey{Name: journal.Options.ClusterExtensionName + "-1"}, &initial); !apierrors.IsNotFound(err) {
			if err != nil {
				return err
			}
			return fmt.Errorf("cannot release a previous migration revision while the initial ClusterObjectSet exists")
		}
		var sets ocv1.ClusterObjectSetList
		if err := kubeClient.List(ctx, &sets, client.MatchingLabels{migration.LabelOwnerName: journal.Options.ClusterExtensionName}); err != nil {
			return err
		}
		if len(sets.Items) != 0 {
			return fmt.Errorf("cannot release a previous migration revision while target ClusterObjectSets exist")
		}
		err := wait.PollUntilContextTimeout(ctx, 250*time.Millisecond, 30*time.Second, true, func(ctx context.Context) (bool, error) {
			actual := &unstructured.Unstructured{}
			actual.SetGroupVersionKind(source.GroupVersionKind())
			if err := kubeClient.Get(ctx, client.ObjectKeyFromObject(source), actual); err != nil {
				return apierrors.IsNotFound(err), client.IgnoreNotFound(err)
			}
			if actual.GetUID() != source.GetUID() || actual.GetDeletionTimestamp() != nil {
				return false, fmt.Errorf("cannot release a previous migration revision from a replaced or deleting source resource")
			}
			for _, owner := range actual.GetOwnerReferences() {
				if owner.APIVersion == "olm.operatorframework.io/v1" && owner.Kind == "ClusterObjectSet" {
					return false, fmt.Errorf("cannot release a previous migration revision while a ClusterObjectSet owner reference remains")
				}
				if owner.APIVersion == "operators.coreos.com/v1alpha1" && owner.Kind == "ClusterServiceVersion" {
					csv := journal.Backup.ClusterServiceVersion
					if csv == nil || csv.UID == "" || owner.Name != csv.Name || owner.UID != csv.UID || actual.GetNamespace() != csv.Namespace {
						return false, fmt.Errorf("cannot release a previous migration revision from another CSV's resource")
					}
					// Wait for all CSV owner references, including noncontroller references, to be orphaned.
					return false, nil
				}
			}
			if owner := metav1.GetControllerOf(actual); owner != nil {
				return false, fmt.Errorf("cannot release a previous migration revision from a controlled source resource")
			}
			annotations := actual.GetAnnotations()
			current, present := annotations[migrationResourceRevisionAnnotation]
			if !present {
				return true, nil // A previous attempt already released this resource.
			}
			if current != revision || actual.GetLabels()[migration.LabelOwnerName] != source.GetLabels()[migration.LabelOwnerName] {
				return false, fmt.Errorf("source migration revision ownership changed")
			}
			for _, key := range []string{"olm.owner", "olm.owner.namespace", "olm.owner.kind"} {
				if actual.GetLabels()[key] != source.GetLabels()[key] {
					return false, fmt.Errorf("source CSV ownership changed")
				}
			}
			delete(annotations, migrationResourceRevisionAnnotation)
			actual.SetAnnotations(annotations)
			// Update retains the observed resource version; the execution client also checks the Lease.
			return true, kubeClient.Update(ctx, actual)
		})
		if err != nil {
			return err
		}
	}
	return nil
}

// isMigrationRevisionSource verifies ownership recorded before source orphaning, including CSV-owned resources whose old OLMv1 label was removed during restoration.
func isMigrationRevisionSource(object *unstructured.Unstructured, journal *migrationJournal) bool {
	labels := object.GetLabels()
	if owner := labels[migration.LabelOwnerName]; owner != "" {
		return owner == journal.Options.ClusterExtensionName
	}
	csv := journal.Backup.ClusterServiceVersion
	if csv == nil || csv.UID == "" {
		return false
	}
	if object.GetNamespace() != "" && object.GetNamespace() != csv.Namespace {
		return false
	}
	if labels["olm.owner"] == csv.Name && labels["olm.owner.namespace"] == csv.Namespace && labels["olm.owner.kind"] == "ClusterServiceVersion" {
		return true
	}
	if object.GetNamespace() != csv.Namespace {
		return false
	}
	for _, owner := range object.GetOwnerReferences() {
		if owner.APIVersion == "operators.coreos.com/v1alpha1" && owner.Kind == "ClusterServiceVersion" && owner.Name == csv.Name && owner.UID == csv.UID {
			return true
		}
	}
	return false
}

// verifyMigrationTarget refuses to reuse a target whose execution or source ownership differs from the journal.
func verifyMigrationTarget(object client.Object, journal *migrationJournal) error {
	a := object.GetAnnotations()
	if a[migrationExecutionAnnotation] != journal.JobID || a[migration.MigratedFromSubscriptionAnnotation] != journal.Options.SubscriptionNamespace+"/"+journal.Options.SubscriptionName {
		return fmt.Errorf("migration target %s belongs to a different execution", object.GetName())
	}
	return nil
}

type migrationExecutionClient struct {
	client.Client
	coordinator           *migrationCoordinator
	namespace             string
	id                    string
	preserveTargets       bool
	retainCheckpoint      bool
	additionalLeaseCheck  func(context.Context) error
	sourceSubscription    *operatorsv1alpha1.Subscription
	rollbackSourceID      string
	rollbackTargetName    string
	rollbackTargetUID     types.UID
	rollbackRevisionUIDs  map[string]types.UID
	rollbackReferenceUIDs map[string]types.UID
}

// Get projects current ClusterObjectSet readiness into the legacy conditions required by the migration library, without writing status.
func (c *migrationExecutionClient) Get(ctx context.Context, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
	if err := c.Client.Get(ctx, key, object, options...); err != nil {
		return err
	}
	cos, ok := object.(*ocv1.ClusterObjectSet)
	if !ok {
		return nil
	}
	ready := meta.FindStatusCondition(cos.Status.Conditions, "Ready")
	if ready == nil {
		return nil
	}
	condition := *ready
	if ready.ObservedGeneration != cos.Generation || cos.DeletionTimestamp != nil || cos.Spec.LifecycleState == ocv1.ClusterObjectSetLifecycleStateArchived {
		condition.Status = metav1.ConditionUnknown
		condition.Reason = "Reconciling"
	}
	for _, legacyType := range []string{ocv1.ClusterObjectSetTypeSucceeded, ocv1.ClusterObjectSetTypeAvailable} {
		condition.Type = legacyType
		meta.SetStatusCondition(&cos.Status.Conditions, condition)
	}
	return nil
}

// checkLease checks both the job Lease and any additional recovery reservation before a write.
func (c *migrationExecutionClient) checkLease(ctx context.Context) error {
	if err := c.coordinator.ownsLease(ctx, c.namespace); err != nil {
		return err
	}
	if c.additionalLeaseCheck != nil {
		return c.additionalLeaseCheck(ctx)
	}
	return nil
}

// Status wraps status writes with the same Lease checks as ordinary mutations.
func (c *migrationExecutionClient) Status() client.SubResourceWriter {
	return &migrationStatusWriter{SubResourceWriter: c.Client.Status(), guard: c}
}

type migrationStatusWriter struct {
	client.SubResourceWriter
	guard *migrationExecutionClient
}

// Create checks execution ownership before creating a status subresource.
func (w *migrationStatusWriter) Create(ctx context.Context, object, subResource client.Object, options ...client.SubResourceCreateOption) error {
	if err := w.guard.checkLease(ctx); err != nil {
		return errMigrationSuspended
	}
	return w.SubResourceWriter.Create(ctx, object, subResource, options...)
}

// Update checks execution ownership before updating a status subresource.
func (w *migrationStatusWriter) Update(ctx context.Context, object client.Object, options ...client.SubResourceUpdateOption) error {
	if err := w.guard.checkLease(ctx); err != nil {
		return errMigrationSuspended
	}
	return w.SubResourceWriter.Update(ctx, object, options...)
}

// Patch checks execution ownership before patching a status subresource.
func (w *migrationStatusWriter) Patch(ctx context.Context, object client.Object, patch client.Patch, options ...client.SubResourcePatchOption) error {
	if err := w.guard.checkLease(ctx); err != nil {
		return errMigrationSuspended
	}
	return w.SubResourceWriter.Patch(ctx, object, patch, options...)
}

// Apply checks execution ownership before applying a status subresource configuration.
func (w *migrationStatusWriter) Apply(ctx context.Context, object runtime.ApplyConfiguration, options ...client.SubResourceApplyOption) error {
	if err := w.guard.checkLease(ctx); err != nil {
		return errMigrationSuspended
	}
	return w.SubResourceWriter.Apply(ctx, object, options...)
}

// Create marks created resources with execution ownership and accepts only compatible same-execution retries.
func (c *migrationExecutionClient) Create(ctx context.Context, object client.Object, options ...client.CreateOption) error {
	if err := c.checkLease(ctx); err != nil {
		return errMigrationSuspended
	}
	if cos, ok := object.(*ocv1.ClusterObjectSet); ok {
		// The library's API version predates spec.group. Send it unstructured
		// so the controller can adopt the revision under the extension's group.
		data, err := runtime.DefaultUnstructuredConverter.ToUnstructured(cos)
		if err != nil {
			return err
		}
		revision := &unstructured.Unstructured{Object: data}
		revision.SetGroupVersionKind(ocv1.GroupVersion.WithKind(ocv1.ClusterObjectSetKind))
		if err := unstructured.SetNestedField(revision.Object, cos.Labels[migration.LabelOwnerName], "spec", "group"); err != nil {
			return err
		}
		if err := c.Create(ctx, revision, options...); err != nil {
			return err
		}
		return runtime.DefaultUnstructuredConverter.FromUnstructured(revision.Object, cos)
	}
	a := object.GetAnnotations()
	if a == nil {
		a = map[string]string{}
	}
	a[migrationExecutionAnnotation] = c.id
	object.SetAnnotations(a)
	err := c.Client.Create(ctx, object, options...)
	if err == nil {
		return nil
	}
	// Resolve a crash or a lost response only for an identical object created by this job.
	existing := object.DeepCopyObject().(client.Object)
	if getErr := c.Client.Get(ctx, client.ObjectKeyFromObject(object), existing); getErr != nil {
		return err
	}
	if existing.GetAnnotations()[migrationExecutionAnnotation] != c.id {
		if desired, ok := object.(*corev1.Secret); ok && apierrors.IsAlreadyExists(err) {
			actual := existing.(*corev1.Secret)
			return c.replaceCompletedCheckpoint(ctx, desired, actual, err)
		}
		return err
	}
	compatible := false
	switch desired := object.(type) {
	case *corev1.Secret:
		actual, ok := existing.(*corev1.Secret)
		compatible = ok && desired.Type == actual.Type && reflect.DeepEqual(desired.Data, actual.Data)
	case *unstructured.Unstructured:
		actual, ok := existing.(*unstructured.Unstructured)
		compatible = ok && desired.GroupVersionKind() == ocv1.GroupVersion.WithKind(ocv1.ClusterObjectSetKind) &&
			reflect.DeepEqual(desired.Object["spec"], actual.Object["spec"])
	case *ocv1.ClusterExtension:
		actual, ok := existing.(*ocv1.ClusterExtension)
		compatible = ok && reflect.DeepEqual(desired.Spec, actual.Spec)
	}
	if !compatible {
		return err
	}
	return c.Client.Get(ctx, client.ObjectKeyFromObject(object), object)
}

// replaceCompletedCheckpoint atomically claims a successful migration's backup only after all its targets are absent.
func (c *migrationExecutionClient) replaceCompletedCheckpoint(ctx context.Context, desired, existing *corev1.Secret, createErr error) error {
	if desired.Type != operatorMigrationCheckpointSecretType || existing.Type != desired.Type ||
		existing.DeletionTimestamp != nil || len(existing.Finalizers) != 0 || len(existing.OwnerReferences) != 0 ||
		existing.Annotations[migrationExecutionAnnotation] == "" ||
		desired.Labels[operatorMigrationCheckpointLabel] != "true" || existing.Labels[operatorMigrationCheckpointLabel] != "true" ||
		desired.Labels[operatorMigrationCheckpointOwnerLabel] != existing.Labels[operatorMigrationCheckpointOwnerLabel] ||
		string(desired.Data[operatorMigrationCheckpointStateKey]) != operatorMigrationCheckpointInProgress ||
		string(existing.Data[operatorMigrationCheckpointStateKey]) != operatorMigrationCheckpointMigrated {
		return createErr
	}
	var previous, current operatorMigrationRecoverySnapshot
	if json.Unmarshal(existing.Data[operatorMigrationCheckpointDataKey], &previous) != nil ||
		json.Unmarshal(desired.Data[operatorMigrationCheckpointDataKey], &current) != nil ||
		current.ClusterExtensionName == "" || previous.ClusterExtensionName != current.ClusterExtensionName ||
		previous.ClusterObjectSetName != current.ClusterExtensionName+"-1" || current.ClusterObjectSetName != previous.ClusterObjectSetName ||
		existing.Name != operatorMigrationCheckpointSecretName(current.ClusterExtensionName) ||
		existing.Labels[operatorMigrationCheckpointOwnerLabel] != operatorMigrationOwnerHash(current.ClusterExtensionName) {
		return createErr
	}
	var extension ocv1.ClusterExtension
	if err := c.Client.Get(ctx, client.ObjectKey{Name: current.ClusterExtensionName}, &extension); !apierrors.IsNotFound(err) {
		if err != nil {
			return err
		}
		return createErr
	}
	var initial ocv1.ClusterObjectSet
	if err := c.Client.Get(ctx, client.ObjectKey{Name: previous.ClusterObjectSetName}, &initial); !apierrors.IsNotFound(err) {
		if err != nil {
			return err
		}
		return createErr
	}
	var revisions ocv1.ClusterObjectSetList
	if err := c.Client.List(ctx, &revisions, client.MatchingLabels{migration.LabelOwnerName: current.ClusterExtensionName}); err != nil {
		return err
	}
	if len(revisions.Items) != 0 {
		return createErr
	}
	// Preserve the observed resource version so a competing execution or state
	// update cannot be overwritten. A lost update response is resolved by the
	// ordinary same-execution checkpoint retry above.
	desired.ResourceVersion, desired.UID = existing.ResourceVersion, existing.UID
	return c.Update(ctx, desired)
}

// Update checks the job and recovery Leases before updating a resource.
func (c *migrationExecutionClient) Update(ctx context.Context, object client.Object, options ...client.UpdateOption) error {
	if err := c.checkLease(ctx); err != nil {
		return errMigrationSuspended
	}
	if cos, ok := object.(*ocv1.ClusterObjectSet); ok {
		data, err := runtime.DefaultUnstructuredConverter.ToUnstructured(cos)
		if err != nil {
			return err
		}
		revision := &unstructured.Unstructured{Object: data}
		revision.SetGroupVersionKind(ocv1.GroupVersion.WithKind(ocv1.ClusterObjectSetKind))
		current := &unstructured.Unstructured{}
		current.SetGroupVersionKind(revision.GroupVersionKind())
		if err := c.Client.Get(ctx, client.ObjectKeyFromObject(cos), current); err != nil {
			return err
		}
		// Typed reads drop fields unknown to the pinned API. Preserve the live
		// immutable group without replacing the caller's resource version.
		group, found, err := unstructured.NestedString(current.Object, "spec", "group")
		if err != nil {
			return err
		}
		if found {
			if err := unstructured.SetNestedField(revision.Object, group, "spec", "group"); err != nil {
				return err
			}
		}
		if err := c.Update(ctx, revision, options...); err != nil {
			return err
		}
		return runtime.DefaultUnstructuredConverter.FromUnstructured(revision.Object, cos)
	}
	return c.Client.Update(ctx, object, options...)
}

// Patch checks the job and recovery Leases before patching a resource.
func (c *migrationExecutionClient) Patch(ctx context.Context, object client.Object, patch client.Patch, options ...client.PatchOption) error {
	if err := c.checkLease(ctx); err != nil {
		return errMigrationSuspended
	}
	return c.Client.Patch(ctx, object, patch, options...)
}

// Delete checks execution ownership and UID preconditions while honoring target and checkpoint retention.
func (c *migrationExecutionClient) Delete(ctx context.Context, object client.Object, options ...client.DeleteOption) error {
	if err := c.checkLease(ctx); err != nil {
		return errMigrationSuspended
	}
	uid := object.GetUID()
	if _, subscription := object.(*operatorsv1alpha1.Subscription); subscription && c.sourceSubscription != nil {
		// PrepareForMigration deletes the Subscription by name. Bind that
		// request to the source UID saved before migration began.
		uid = c.sourceSubscription.UID
	}
	if uid != "" {
		options = append(options, client.Preconditions{UID: &uid})
	}
	if c.rollbackSourceID != "" {
		switch object.(type) {
		case *ocv1.ClusterObjectSet, *ocv1.ClusterExtension, *corev1.Secret:
			owned := object.GetAnnotations()[migrationExecutionAnnotation] == c.rollbackSourceID
			if revision, ok := object.(*ocv1.ClusterObjectSet); ok && !owned {
				owned = c.ownsRollbackRevision(revision)
			}
			if secret, ok := object.(*corev1.Secret); ok && !owned {
				owned = c.ownsRollbackReference(secret)
			}
			if extension, ok := object.(*ocv1.ClusterExtension); ok && c.rollbackTargetUID != "" {
				owned = owned && extension.UID == c.rollbackTargetUID
			}
			if !owned {
				return rollbackConflict("rollback resource belongs to another execution")
			}
		}
	}
	if secret, ok := object.(*corev1.Secret); ok && c.retainCheckpoint && secret.Type == operatorMigrationCheckpointSecretType {
		return nil
	}
	if c.preserveTargets {
		switch object.(type) {
		case *ocv1.ClusterObjectSet, *ocv1.ClusterExtension:
			return fmt.Errorf("preserving migration target %s for checkpoint recovery", object.GetName())
		}
	}
	return c.Client.Delete(ctx, object, options...)
}

// ownsRollbackRevision accepts orphaned revisions only when their identity was verified before orphaning.
func (c *migrationExecutionClient) ownsRollbackRevision(revision *ocv1.ClusterObjectSet) bool {
	if revision.Annotations[migrationExecutionAnnotation] != "" || c.rollbackTargetUID == "" ||
		revision.UID == "" || revision.Labels[migration.LabelOwnerName] != c.rollbackTargetName {
		return false
	}
	owner := metav1.GetControllerOf(revision)
	if owner != nil {
		return owner.APIVersion == ocv1.GroupVersion.String() && owner.Kind == "ClusterExtension" &&
			owner.Name == c.rollbackTargetName && owner.UID == c.rollbackTargetUID
	}
	return len(revision.OwnerReferences) == 0 && c.rollbackRevisionUIDs[revision.Name] == revision.UID
}

// ownsRollbackReference accepts controller-created reference Secrets only through verified revision or saved Secret UIDs.
func (c *migrationExecutionClient) ownsRollbackReference(secret *corev1.Secret) bool {
	revision := secret.Labels[migration.LabelRevisionName]
	if secret.Annotations[migrationExecutionAnnotation] != "" || secret.UID == "" || c.rollbackTargetUID == "" ||
		secret.Type != corev1.SecretType(migration.SecretTypeObjectData) ||
		secret.Labels[migration.LabelOwnerName] != c.rollbackTargetName || c.rollbackRevisionUIDs[revision] == "" {
		return false
	}
	owner := metav1.GetControllerOf(secret)
	if owner != nil {
		return owner.APIVersion == ocv1.GroupVersion.String() && owner.Kind == "ClusterObjectSet" &&
			owner.Name == revision && owner.UID == c.rollbackRevisionUIDs[revision]
	}
	return len(secret.OwnerReferences) == 0 && c.rollbackReferenceUIDs[secret.Namespace+"/"+secret.Name] == secret.UID
}
