package olm

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	operatorsv1alpha1 "github.com/operator-framework/api/pkg/operators/v1alpha1"
	"github.com/operator-framework/library-olm/migration/pkg/migration"
	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	coordinationv1 "k8s.io/api/coordination/v1"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/wait"
	"k8s.io/client-go/util/retry"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// operatorMigrationRollbackJob retains recovery inputs independently of the originating batch's lifetime.
type operatorMigrationRollbackJob struct {
	SourceJobID         string                            `json:"sourceJobID"`
	CheckpointName      string                            `json:"checkpointName"`
	CheckpointNamespace string                            `json:"checkpointNamespace"`
	CheckpointUID       types.UID                         `json:"checkpointUID"`
	TargetUID           types.UID                         `json:"targetUID,omitempty"`
	Snapshot            operatorMigrationRecoverySnapshot `json:"snapshot"`
	Restored            bool                              `json:"restored,omitempty"`
}

const rollbackTargetUIDAnnotation = "console.openshift.io/operator-migration-rollback-target-uid"
const rollbackRevisionUIDsAnnotation = "console.openshift.io/operator-migration-rollback-revision-uids"
const rollbackReferenceUIDsAnnotation = "console.openshift.io/operator-migration-rollback-reference-uids"

// rollbackConflict returns a typed conflict when explicit recovery ownership or state is unsafe.
func rollbackConflict(message string) error {
	return apierrors.NewConflict(schema.GroupResource{Resource: "operator-migration-jobs"}, "", fmt.Errorf("%s", message))
}

// createRollbackJob authorizes explicit recovery of one failed item in a completed, owned batch.
func (o *OLMHandler) createRollbackJob(ctx context.Context, m *migration.Migrator, owner string, request operatorMigrationRollbackRequest) (*operatorMigrationJobSnapshot, error) {
	record, err := readDurableMigrationJob(ctx, m.Client, request.JobID, owner)
	if err != nil {
		return nil, err
	}
	if record == nil {
		return nil, apierrors.NewNotFound(schema.GroupResource{Resource: "operator-migration-jobs"}, request.JobID)
	}
	if record.Snapshot.FinishedAt == nil {
		return nil, rollbackConflict("wait for the migration batch to finish before requesting rollback")
	}
	var item *operatorMigrationJobItem
	for i := range record.Snapshot.Items {
		candidate := &record.Snapshot.Items[i]
		if candidate.ClusterExtensionName == request.ClusterExtensionName && request.ClusterExtensionName != "" ||
			candidate.ClusterExtensionName+"-1" == request.ClusterObjectSetName && request.ClusterObjectSetName != "" {
			item = candidate
			break
		}
	}
	if item == nil || item.Status != "Failed" || item.RolledBack || (!item.RollbackAttempted && !item.RecoveryRequired) {
		return nil, rollbackConflict("rollback is available only for a failed operator requiring recovery")
	}
	checkpoint, snapshot, err := findOperatorMigrationCheckpoint(ctx, m.Client, item.ClusterExtensionName)
	if err != nil {
		return nil, err
	}
	checkpointState := ""
	if checkpoint != nil {
		checkpointState = string(checkpoint.Data[operatorMigrationCheckpointStateKey])
	}
	if checkpoint == nil || checkpoint.Annotations[migrationExecutionAnnotation] != request.JobID ||
		snapshot.SubscriptionRef != item.SubscriptionNamespace+"/"+item.SubscriptionName ||
		(checkpointState != operatorMigrationCheckpointRequired && !(item.RecoveryRequired && checkpointState == operatorMigrationCheckpointInProgress)) {
		return nil, rollbackConflict("the migration recovery checkpoint is missing or belongs to another execution")
	}
	rollback := &operatorMigrationRollbackJob{
		SourceJobID: request.JobID, CheckpointName: checkpoint.Name, CheckpointNamespace: checkpoint.Namespace,
		CheckpointUID: checkpoint.UID, Snapshot: *snapshot,
	}
	return o.createDurableMigrationJob(ctx, m, owner, operatorMigrationBulkRequest{
		Rollback:  rollback,
		Operators: []operatorMigrationOptionsRequest{{SubscriptionName: item.SubscriptionName, SubscriptionNamespace: item.SubscriptionNamespace, ClusterExtensionName: item.ClusterExtensionName}},
	})
}

// rollbackLeaseKey identifies the shared per-target recovery Lease independently of the recovery job ID.
func rollbackLeaseKey(rollback *operatorMigrationRollbackJob) client.ObjectKey {
	return client.ObjectKey{Namespace: rollback.CheckpointNamespace, Name: "console-rollback-" + operatorMigrationOwnerHash(rollback.Snapshot.ClusterExtensionName)}
}

// prepareRollbackExecutionPermissions delegates scoped recovery access through the initiating user's RBAC.
func prepareRollbackExecutionPermissions(ctx context.Context, kubeClient client.Client, rollback *operatorMigrationRollbackJob, namespace string) ([]client.Object, error) {
	snapshot := &rollback.Snapshot
	if err := ensureOperatorMigrationNamespace(ctx, kubeClient, snapshot.Namespace); err != nil {
		return nil, err
	}
	read := []string{"get", "list", "watch"}
	clusterRules := []rbacv1.PolicyRule{
		migrationRule("", []string{"namespaces"}, []string{"get"}, []string{snapshot.Namespace.Name}),
		migrationRule("olm.operatorframework.io", []string{"clusterextensions", "clusterobjectsets"}, read, nil),
		migrationRule("olm.operatorframework.io", []string{"clusterextensions"}, []string{"delete"}, []string{snapshot.ClusterExtensionName}),
	}
	var sets ocv1.ClusterObjectSetList
	if err := kubeClient.List(ctx, &sets, client.MatchingLabels{migration.LabelOwnerName: snapshot.ClusterExtensionName}); err != nil {
		return nil, err
	}
	names := []string{snapshot.ClusterObjectSetName}
	for _, set := range sets.Items {
		names = append(names, set.Name)
	}
	clusterRules = append(clusterRules, migrationRule("olm.operatorframework.io", []string{"clusterobjectsets"}, []string{"delete"}, names))
	_, subName, _ := splitSubscriptionRef(snapshot.SubscriptionRef)
	roles := map[string][]rbacv1.PolicyRule{
		namespace: {migrationRule("", []string{"secrets"}, []string{"get", "list", "create", "update", "patch", "delete"}, nil)},
		snapshot.Namespace.Name: {
			migrationRule("operators.coreos.com", []string{"subscriptions", "clusterserviceversions", "operatorgroups"}, read, nil),
			migrationRule("operators.coreos.com", []string{"subscriptions", "operatorgroups"}, []string{"create"}, nil),
			migrationRule("operators.coreos.com", []string{"subscriptions/status"}, []string{"update", "patch"}, []string{subName}),
		},
	}
	if snapshot.OperatorGroup != nil {
		roles[snapshot.Namespace.Name] = append(roles[snapshot.Namespace.Name], migrationRule("operators.coreos.com", []string{"operatorgroups"}, []string{"update"}, []string{snapshot.OperatorGroup.Name}))
	}
	for _, deployment := range snapshot.Deployments {
		roles[deployment.Namespace] = append(roles[deployment.Namespace], migrationRule("apps", []string{"deployments"}, []string{"get", "update", "patch"}, []string{deployment.Name}))
	}
	var secrets corev1.SecretList
	if err := kubeClient.List(ctx, &secrets, client.InNamespace(rollback.CheckpointNamespace), client.MatchingLabels{migration.LabelOwnerName: snapshot.ClusterExtensionName}); err != nil {
		return nil, err
	}
	secretNames := []string{rollback.CheckpointName}
	for _, secret := range secrets.Items {
		secretNames = append(secretNames, secret.Name)
	}
	roles[rollback.CheckpointNamespace] = append(roles[rollback.CheckpointNamespace],
		migrationRule("", []string{"secrets"}, read, nil),
		migrationRule("", []string{"secrets"}, []string{"update"}, []string{rollback.CheckpointName}),
		migrationRule("", []string{"secrets"}, []string{"delete"}, secretNames),
		migrationRule("coordination.k8s.io", []string{"leases"}, []string{"create"}, nil),
		migrationRule("coordination.k8s.io", []string{"leases"}, []string{"get", "update", "patch", "delete"}, []string{rollbackLeaseKey(rollback).Name}),
	)
	subject := rbacv1.Subject{Kind: "ServiceAccount", Name: migrationJobStateName, Namespace: namespace}
	objects := []client.Object{
		&rbacv1.ClusterRole{ObjectMeta: metav1.ObjectMeta{Name: namespace}, Rules: clusterRules},
		&rbacv1.ClusterRoleBinding{ObjectMeta: metav1.ObjectMeta{Name: namespace}, RoleRef: rbacv1.RoleRef{APIGroup: rbacv1.GroupName, Kind: "ClusterRole", Name: namespace}, Subjects: []rbacv1.Subject{subject}},
	}
	for name, rules := range roles {
		objects = append(objects,
			&rbacv1.Role{ObjectMeta: metav1.ObjectMeta{Name: namespace, Namespace: name}, Rules: rules},
			&rbacv1.RoleBinding{ObjectMeta: metav1.ObjectMeta{Name: namespace, Namespace: name}, RoleRef: rbacv1.RoleRef{APIGroup: rbacv1.GroupName, Kind: "Role", Name: namespace}, Subjects: []rbacv1.Subject{subject}},
		)
	}
	return objects, nil
}

// runRollbackJob resumes explicit recovery under both a job Lease and a per-target Lease.
func (c *migrationCoordinator) runRollbackJob(ctx context.Context, stop context.CancelFunc, namespace string, record *durableMigrationJob, store *migrationJobStore, migrator *migration.Migrator) error {
	rollback := record.Request.Rollback
	id := record.Snapshot.ID
	defer func() {
		if recover() != nil {
			klog.Errorf("OLM rollback job %s panicked", id)
			store.update(id, func(job *operatorMigrationJob) {
				now := time.Now().UTC()
				job.FinishedAt = &now
				job.Status, job.Items[0].Status = "Failed", "Failed"
				job.Message, job.Items[0].Error = "rollback failed unexpectedly; recovery checkpoint retained", "rollback failed unexpectedly; recovery checkpoint retained"
			})
		}
	}()
	identity := c.identity + "/" + id
	key := rollbackLeaseKey(rollback)
	claimed, err := claimMigrationLease(ctx, migrator.Client, key, identity)
	if err != nil || !claimed {
		return err
	}
	defer func() {
		stop()
		// Release only our own reservation; another backend may already have taken over.
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		var lease coordinationv1.Lease
		if migrator.Client.Get(cleanupCtx, key, &lease) == nil && lease.Spec.HolderIdentity != nil && *lease.Spec.HolderIdentity == identity {
			_ = migrator.Client.Delete(cleanupCtx, &lease, client.Preconditions{UID: &lease.UID, ResourceVersion: &lease.ResourceVersion})
		}
	}()
	checkTargetLease := func(ctx context.Context) error { return ownsMigrationLease(ctx, migrator.Client, key, identity) }
	guard := &migrationExecutionClient{Client: migrator.Client, coordinator: c, namespace: namespace, id: id, retainCheckpoint: true, additionalLeaseCheck: checkTargetLease, rollbackSourceID: rollback.SourceJobID}
	go func() {
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				renewCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
				err := guard.checkLease(renewCtx)
				if err == nil {
					_, err = c.claim(renewCtx, namespace)
				}
				if err == nil {
					var claimed bool
					claimed, err = claimMigrationLease(renewCtx, migrator.Client, key, identity)
					if !claimed && err == nil {
						err = errMigrationSuspended
					}
				}
				cancel()
				if err != nil {
					stop()
					return
				}
			}
		}
	}()
	store.update(id, func(job *operatorMigrationJob) {
		job.Status, job.Items[0].Status = "Running", "Migrating"
		job.Items[0].RollbackAttempted = true
		job.ProgressEvent = &operatorMigrationProgress{Step: migration.ProgressStepRollback, Status: migration.ProgressStarted}
	})
	if err := store.persistenceError(); err != nil {
		return err
	}
	runCtx, cancel := context.WithTimeout(ctx, 10*time.Minute)
	defer cancel()
	err = executeRollback(runCtx, guard, rollback, func() error {
		rollback.Restored = true
		store.update(id, func(job *operatorMigrationJob) {
			job.Message = "Classic Operator restored; removing recovery checkpoint"
		})
		return store.persistenceError()
	})
	if ctx.Err() != nil || err == errMigrationSuspended || store.persistenceError() != nil {
		return errMigrationSuspended
	}
	now := time.Now().UTC()
	store.update(id, func(job *operatorMigrationJob) {
		job.FinishedAt, job.ProgressEvent = &now, nil
		if err != nil {
			job.Status, job.Items[0].Status, job.Items[0].Error = "Failed", "Failed", err.Error()
			job.Message = err.Error()
		} else {
			job.Status, job.Items[0].Status, job.Items[0].RolledBack = "Succeeded", "Succeeded", true
		}
	})
	if persistErr := store.persistenceError(); persistErr != nil {
		return persistErr
	}
	if err == nil {
		return c.completeSourceRecovery(ctx, record)
	}
	return nil
}

// completeSourceRecovery records successful recovery so the source job can expire without losing unresolved rollback authorization.
func (c *migrationCoordinator) completeSourceRecovery(ctx context.Context, rollbackJob *durableMigrationJob) error {
	namespace, err := migrationJobNamespace(rollbackJob.Request.Rollback.SourceJobID)
	if err != nil {
		return err
	}
	jobNamespace, err := migrationJobNamespace(rollbackJob.Snapshot.ID)
	if err != nil {
		return err
	}
	return retry.RetryOnConflict(retry.DefaultBackoff, func() error {
		if err := c.ownsLease(ctx, jobNamespace); err != nil {
			return err
		}
		source, state, err := loadDurableMigrationJob(ctx, c.client, namespace)
		if apierrors.IsNotFound(err) && rollbackJob.Request.Rollback.Restored {
			return nil // A previously completed recovery may have allowed source cleanup.
		}
		if err != nil {
			return err
		}
		if source.Owner != rollbackJob.Owner || source.Snapshot.ID != rollbackJob.Request.Rollback.SourceJobID || source.Snapshot.FinishedAt == nil {
			return rollbackConflict("source recovery ownership does not match the rollback job")
		}
		for i := range source.Snapshot.Items {
			item := &source.Snapshot.Items[i]
			if item.ClusterExtensionName != rollbackJob.Request.Rollback.Snapshot.ClusterExtensionName || item.SubscriptionNamespace+"/"+item.SubscriptionName != rollbackJob.Request.Rollback.Snapshot.SubscriptionRef {
				continue
			}
			if item.Status != "Failed" {
				return rollbackConflict("source recovery item is not failed")
			}
			item.RolledBack, item.RollbackAttempted, item.RecoveryRequired = true, true, false
			encoded, err := encodeMigrationState(source)
			if err != nil {
				return err
			}
			state.Data[migrationJobRecordKey] = encoded
			return c.client.Update(ctx, state)
		}
		return rollbackConflict("source recovery item is missing")
	})
}

// executeRollback preserves the backup until resource restoration has a durable completion checkpoint.
func executeRollback(ctx context.Context, guard *migrationExecutionClient, rollback *operatorMigrationRollbackJob, saveRestored func() error) error {
	var checkpoint corev1.Secret
	err := guard.Get(ctx, client.ObjectKey{Namespace: rollback.CheckpointNamespace, Name: rollback.CheckpointName}, &checkpoint)
	if apierrors.IsNotFound(err) && rollback.Restored {
		return nil
	}
	if err != nil {
		return err
	}
	if checkpoint.UID != rollback.CheckpointUID || checkpoint.Annotations[migrationExecutionAnnotation] != rollback.SourceJobID {
		return rollbackConflict("recovery checkpoint belongs to another execution")
	}
	if !rollback.Restored {
		if err := bindRollbackTarget(ctx, guard, rollback, &checkpoint); err != nil {
			return err
		}
		if err := (&OLMHandler{}).rollbackFromOperatorMigrationCheckpoint(ctx, guard, &checkpoint, &rollback.Snapshot, true); err != nil {
			return err
		}
		if err := waitForRestoredOperator(ctx, guard, rollback.Snapshot.SubscriptionRef); err != nil {
			return err
		}
		if err := saveRestored(); err != nil {
			return errMigrationSuspended
		}
	}
	guard.retainCheckpoint = false
	if err := guard.Delete(ctx, &checkpoint); err != nil && !apierrors.IsNotFound(err) {
		return err
	}
	return nil
}

// bindRollbackTarget retains verified target and reference Secret identities before orphan deletion removes owner references.
func bindRollbackTarget(ctx context.Context, guard *migrationExecutionClient, rollback *operatorMigrationRollbackJob, checkpoint *corev1.Secret) error {
	savedUID := types.UID(checkpoint.Annotations[rollbackTargetUIDAnnotation])
	if rollback.TargetUID != "" && savedUID != "" && rollback.TargetUID != savedUID {
		return rollbackConflict("recovery checkpoint belongs to another target")
	}
	if rollback.TargetUID == "" {
		rollback.TargetUID = savedUID
	}
	guard.rollbackRevisionUIDs = make(map[string]types.UID)
	if raw := checkpoint.Annotations[rollbackRevisionUIDsAnnotation]; raw != "" {
		if err := json.Unmarshal([]byte(raw), &guard.rollbackRevisionUIDs); err != nil {
			return rollbackConflict("recovery checkpoint revision identities are invalid")
		}
		if guard.rollbackRevisionUIDs == nil {
			guard.rollbackRevisionUIDs = make(map[string]types.UID)
		}
	}
	guard.rollbackReferenceUIDs = make(map[string]types.UID)
	if raw := checkpoint.Annotations[rollbackReferenceUIDsAnnotation]; raw != "" {
		if err := json.Unmarshal([]byte(raw), &guard.rollbackReferenceUIDs); err != nil {
			return rollbackConflict("recovery checkpoint reference identities are invalid")
		}
		if guard.rollbackReferenceUIDs == nil {
			guard.rollbackReferenceUIDs = make(map[string]types.UID)
		}
	}
	var extension ocv1.ClusterExtension
	err := guard.Get(ctx, client.ObjectKey{Name: rollback.Snapshot.ClusterExtensionName}, &extension)
	if err != nil && !apierrors.IsNotFound(err) {
		return err
	}
	if err == nil {
		if extension.UID == "" || extension.Annotations[migrationExecutionAnnotation] != rollback.SourceJobID ||
			extension.Annotations[migration.MigratedFromSubscriptionAnnotation] != rollback.Snapshot.SubscriptionRef ||
			rollback.TargetUID != "" && rollback.TargetUID != extension.UID {
			return rollbackConflict("rollback target belongs to another execution")
		}
		rollback.TargetUID = extension.UID
		guard.rollbackTargetName, guard.rollbackTargetUID = extension.Name, extension.UID
		var revisions ocv1.ClusterObjectSetList
		if err := guard.List(ctx, &revisions, client.MatchingLabels{migration.LabelOwnerName: extension.Name}); err != nil {
			return err
		}
		for i := range revisions.Items {
			revision := &revisions.Items[i]
			if revision.Annotations[migrationExecutionAnnotation] == rollback.SourceJobID {
				if revision.UID != "" {
					guard.rollbackRevisionUIDs[revision.Name] = revision.UID
				}
				continue
			}
			if !guard.ownsRollbackRevision(revision) {
				return rollbackConflict("rollback revision belongs to another execution")
			}
			guard.rollbackRevisionUIDs[revision.Name] = revision.UID
		}
	}
	guard.rollbackTargetName, guard.rollbackTargetUID = rollback.Snapshot.ClusterExtensionName, rollback.TargetUID
	var references corev1.SecretList
	if err := guard.List(ctx, &references, client.InNamespace(checkpoint.Namespace), client.MatchingLabels{migration.LabelOwnerName: guard.rollbackTargetName}); err != nil {
		return err
	}
	for i := range references.Items {
		secret := &references.Items[i]
		if secret.Annotations[migrationExecutionAnnotation] == rollback.SourceJobID ||
			guard.rollbackRevisionUIDs[secret.Labels[migration.LabelRevisionName]] == "" {
			continue
		}
		if !guard.ownsRollbackReference(secret) {
			return rollbackConflict("rollback reference Secret belongs to another execution")
		}
		guard.rollbackReferenceUIDs[secret.Namespace+"/"+secret.Name] = secret.UID
	}
	revisionUIDs := ""
	if len(guard.rollbackRevisionUIDs) > 0 {
		encoded, err := json.Marshal(guard.rollbackRevisionUIDs)
		if err != nil {
			return err
		}
		revisionUIDs = string(encoded)
	}
	referenceUIDs := ""
	if len(guard.rollbackReferenceUIDs) > 0 {
		encoded, err := json.Marshal(guard.rollbackReferenceUIDs)
		if err != nil {
			return err
		}
		referenceUIDs = string(encoded)
	}
	if rollback.TargetUID != "" && (savedUID == "" || checkpoint.Annotations[rollbackRevisionUIDsAnnotation] != revisionUIDs || checkpoint.Annotations[rollbackReferenceUIDsAnnotation] != referenceUIDs) {
		checkpoint.Annotations[rollbackTargetUIDAnnotation] = string(rollback.TargetUID)
		checkpoint.Annotations[rollbackRevisionUIDsAnnotation] = revisionUIDs
		checkpoint.Annotations[rollbackReferenceUIDsAnnotation] = referenceUIDs
		if err := guard.Update(ctx, checkpoint); err != nil {
			return err
		}
	}
	guard.rollbackTargetName, guard.rollbackTargetUID = rollback.Snapshot.ClusterExtensionName, rollback.TargetUID
	return nil
}

// splitSubscriptionRef requires both namespace and name in a source Subscription reference.
func splitSubscriptionRef(ref string) (string, string, bool) {
	// Use the same reference shape as migrated-from-subscription.
	namespace, name, found := strings.Cut(ref, "/")
	return namespace, name, found && namespace != "" && name != ""
}

// waitForRestoredOperator waits for the restored Subscription to reference a healthy CSV before completing recovery.
func waitForRestoredOperator(ctx context.Context, kubeClient client.Client, ref string) error {
	namespace, name, ok := splitSubscriptionRef(ref)
	if !ok {
		return fmt.Errorf("invalid rollback Subscription reference")
	}
	return wait.PollUntilContextCancel(ctx, time.Second, true, func(ctx context.Context) (bool, error) {
		var sub operatorsv1alpha1.Subscription
		if err := kubeClient.Get(ctx, client.ObjectKey{Namespace: namespace, Name: name}, &sub); err != nil {
			return false, err
		}
		if sub.Status.InstalledCSV == "" {
			return false, nil
		}
		var csv operatorsv1alpha1.ClusterServiceVersion
		if err := kubeClient.Get(ctx, client.ObjectKey{Namespace: namespace, Name: sub.Status.InstalledCSV}, &csv); err != nil {
			if apierrors.IsNotFound(err) {
				return false, nil
			}
			return false, err
		}
		return csv.Status.Phase == operatorsv1alpha1.CSVPhaseSucceeded, nil
	})
}
