package olm

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"time"

	"github.com/operator-framework/library-olm/migration/pkg/migration"
	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
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

func migrationJournalName(namespace, subscription string) string {
	return "operator-" + operatorMigrationOwnerHash(namespace+"/"+subscription)
}

func (c *migrationCoordinator) loadJournal(ctx context.Context, namespace, subscriptionNamespace, subscription string) (*migrationJournal, error) {
	var secret corev1.Secret
	if err := c.client.Get(ctx, client.ObjectKey{Name: migrationJournalName(subscriptionNamespace, subscription), Namespace: namespace}, &secret); err != nil {
		return nil, err
	}
	var journal migrationJournal
	if err := decodeMigrationState(secret.Data[migrationJobRecordKey], &journal); err != nil {
		return nil, err
	}
	return &journal, nil
}

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
	recovery, err := captureOperatorMigrationSnapshot(ctx, m, options)
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
	guard := &migrationExecutionClient{Client: migrator.Client, coordinator: c, namespace: namespace, id: id, preserveTargets: true, retainCheckpoint: true}
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
	j.Failure, j.Phase = err.Error(), "recovery"
	recoveryCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 2*time.Minute)
	defer cancel()
	if err := c.saveJournal(recoveryCtx, namespace, j); err != nil {
		return errMigrationSuspended
	}
	if err := c.advanceJournal(recoveryCtx, m, namespace, j); err != nil {
		return errMigrationSuspended
	}
	return finish()
}

func (c *migrationCoordinator) cancellationRequested(namespace string) bool {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, state, err := loadDurableMigrationJob(ctx, c.client, namespace)
	return err == nil && string(state.Data[migrationJobCancelKey]) == "true"
}

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
			for _, object := range []client.Object{j.Backup.Subscription, j.Backup.ClusterServiceVersion} {
				uid := object.GetUID()
				if uid == "" {
					return fmt.Errorf("source backup has no UID")
				}
				if err := m.Client.Delete(ctx, object, client.PropagationPolicy(metav1.DeletePropagationOrphan), client.Preconditions(metav1.Preconditions{UID: &uid})); err != nil && !apierrors.IsNotFound(err) {
					return err
				}
			}
			next = "scale"
		case "scale":
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
				} else if err := rollbackFailedOperatorMigration(ctx, m.Client, checkpoint, &j.Recovery); err != nil {
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

func verifyMigrationTarget(object client.Object, journal *migrationJournal) error {
	a := object.GetAnnotations()
	if a[migrationExecutionAnnotation] != journal.JobID || a[migration.MigratedFromSubscriptionAnnotation] != journal.Options.SubscriptionNamespace+"/"+journal.Options.SubscriptionName {
		return fmt.Errorf("migration target %s belongs to a different execution", object.GetName())
	}
	return nil
}

type migrationExecutionClient struct {
	client.Client
	coordinator      *migrationCoordinator
	namespace        string
	id               string
	preserveTargets  bool
	retainCheckpoint bool
}

func (c *migrationExecutionClient) Status() client.SubResourceWriter {
	return &migrationStatusWriter{SubResourceWriter: c.Client.Status(), guard: c}
}

type migrationStatusWriter struct {
	client.SubResourceWriter
	guard *migrationExecutionClient
}

func (w *migrationStatusWriter) Create(ctx context.Context, object, subResource client.Object, options ...client.SubResourceCreateOption) error {
	if err := w.guard.coordinator.ownsLease(ctx, w.guard.namespace); err != nil {
		return errMigrationSuspended
	}
	return w.SubResourceWriter.Create(ctx, object, subResource, options...)
}

func (w *migrationStatusWriter) Update(ctx context.Context, object client.Object, options ...client.SubResourceUpdateOption) error {
	if err := w.guard.coordinator.ownsLease(ctx, w.guard.namespace); err != nil {
		return errMigrationSuspended
	}
	return w.SubResourceWriter.Update(ctx, object, options...)
}

func (w *migrationStatusWriter) Patch(ctx context.Context, object client.Object, patch client.Patch, options ...client.SubResourcePatchOption) error {
	if err := w.guard.coordinator.ownsLease(ctx, w.guard.namespace); err != nil {
		return errMigrationSuspended
	}
	return w.SubResourceWriter.Patch(ctx, object, patch, options...)
}

func (w *migrationStatusWriter) Apply(ctx context.Context, object runtime.ApplyConfiguration, options ...client.SubResourceApplyOption) error {
	if err := w.guard.coordinator.ownsLease(ctx, w.guard.namespace); err != nil {
		return errMigrationSuspended
	}
	return w.SubResourceWriter.Apply(ctx, object, options...)
}

func (c *migrationExecutionClient) Create(ctx context.Context, object client.Object, options ...client.CreateOption) error {
	if err := c.coordinator.ownsLease(ctx, c.namespace); err != nil {
		return errMigrationSuspended
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
		return err
	}
	compatible := false
	switch desired := object.(type) {
	case *corev1.Secret:
		actual, ok := existing.(*corev1.Secret)
		compatible = ok && desired.Type == actual.Type && reflect.DeepEqual(desired.Data, actual.Data)
	case *ocv1.ClusterObjectSet:
		actual, ok := existing.(*ocv1.ClusterObjectSet)
		compatible = ok && reflect.DeepEqual(desired.Spec, actual.Spec)
	case *ocv1.ClusterExtension:
		actual, ok := existing.(*ocv1.ClusterExtension)
		compatible = ok && reflect.DeepEqual(desired.Spec, actual.Spec)
	}
	if !compatible {
		return err
	}
	return c.Client.Get(ctx, client.ObjectKeyFromObject(object), object)
}

func (c *migrationExecutionClient) Update(ctx context.Context, object client.Object, options ...client.UpdateOption) error {
	if err := c.coordinator.ownsLease(ctx, c.namespace); err != nil {
		return errMigrationSuspended
	}
	return c.Client.Update(ctx, object, options...)
}

func (c *migrationExecutionClient) Patch(ctx context.Context, object client.Object, patch client.Patch, options ...client.PatchOption) error {
	if err := c.coordinator.ownsLease(ctx, c.namespace); err != nil {
		return errMigrationSuspended
	}
	return c.Client.Patch(ctx, object, patch, options...)
}

func (c *migrationExecutionClient) Delete(ctx context.Context, object client.Object, options ...client.DeleteOption) error {
	if err := c.coordinator.ownsLease(ctx, c.namespace); err != nil {
		return errMigrationSuspended
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
