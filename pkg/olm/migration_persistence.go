package olm

import (
	"bytes"
	"compress/gzip"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/operator-framework/library-olm/migration/pkg/migration"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/util/retry"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/openshift/console/pkg/serverutils"
)

const (
	migrationJobNamespacePrefix  = "console-olm-migration-"
	migrationJobLabel            = "console.openshift.io/olm-migration-job"
	migrationJobOwnerLabel       = "console.openshift.io/olm-migration-user"
	migrationJobOwnerAnnotation  = "console.openshift.io/olm-migration-user"
	migrationExecutionAnnotation = "console.openshift.io/olm-migration-execution"
	migrationJobStateName        = "migration"
	migrationJobRecordKey        = "job.json.gz"
	migrationJobCancelKey        = "cancel-requested"
	migrationIndexNamespace      = "openshift-console"
)

var errMigrationJobUnavailable = errors.New("migration job is unavailable or already finished")
var errMigrationSuspended = errors.New("migration suspended for another Console backend to resume")
var errMigrationCheckpointTooLarge = errors.New("migration checkpoint exceeds the supported size")

// Credentials and bundle Secret objects are never included in API responses.
type durableMigrationJob struct {
	Owner               string                       `json:"owner"`
	Request             operatorMigrationBulkRequest `json:"request"`
	Snapshot            operatorMigrationJobSnapshot `json:"snapshot"`
	ExecutionNamespaces []string                     `json:"executionNamespaces"`
}

func migrationUserLabel(owner string) string {
	hash := sha256.Sum256([]byte(owner))
	return hex.EncodeToString(hash[:16])
}

func migrationJobNamespace(id string) (string, error) {
	if len(id) != 32 {
		return "", fmt.Errorf("invalid migration job ID")
	}
	if _, err := hex.DecodeString(id); err != nil {
		return "", fmt.Errorf("invalid migration job ID")
	}
	return migrationJobNamespacePrefix + id, nil
}

func encodeMigrationState(value interface{}) ([]byte, error) {
	var raw bytes.Buffer
	if err := json.NewEncoder(&raw).Encode(value); err != nil {
		return nil, err
	}
	// Match the decoder's bound before any migration can use this checkpoint.
	if raw.Len() > 32*1024*1024 {
		return nil, errMigrationCheckpointTooLarge
	}
	var encoded bytes.Buffer
	w := gzip.NewWriter(&encoded)
	if _, err := w.Write(raw.Bytes()); err != nil {
		return nil, err
	}
	if err := w.Close(); err != nil {
		return nil, err
	}
	if encoded.Len() > 900*1024 {
		return nil, errMigrationCheckpointTooLarge
	}
	return encoded.Bytes(), nil
}

func decodeMigrationState(data []byte, value interface{}) error {
	r, err := gzip.NewReader(bytes.NewReader(data))
	if err != nil {
		return err
	}
	defer r.Close()
	return json.NewDecoder(io.LimitReader(r, 32*1024*1024)).Decode(value)
}

func (o *OLMHandler) createDurableMigrationJob(ctx context.Context, migrator *migration.Migrator, owner string, request operatorMigrationBulkRequest) (*operatorMigrationJobSnapshot, error) {
	if o.migrationCoordinator == nil {
		return nil, fmt.Errorf("durable operator migration is not configured for this Console backend")
	}
	if request.AllEligible {
		results, err := migrator.ScanAllSubscriptionsWithOptions(ctx, request.Acknowledgments.options())
		if err != nil {
			return nil, err
		}
		recovery, err := listOperatorMigrationRecoveryConflicts(ctx, migrator.Client)
		if err != nil {
			return nil, err
		}
		for _, result := range results {
			if _, interrupted := recovery[result.SubscriptionNamespace+"/"+result.SubscriptionName]; interrupted {
				continue
			}
			if result.Status == migration.OperatorStatusEligible {
				request.Operators = append(request.Operators, operatorMigrationOptionsRequest{SubscriptionName: result.SubscriptionName, SubscriptionNamespace: result.SubscriptionNamespace})
			}
		}
		request.AllEligible = false
	}
	if len(request.Operators) > maxMigrationBatchSize {
		return nil, fmt.Errorf("operators cannot exceed %d entries", maxMigrationBatchSize)
	}
	store := newMigrationJobStore()
	job, err := store.create(owner, request)
	if err != nil {
		return nil, err
	}
	namespaceName, _ := migrationJobNamespace(job.ID)
	permissions, err := prepareMigrationExecutionPermissions(ctx, migrator, request, namespaceName)
	if err != nil {
		return nil, err
	}
	namespace := &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{
		Name:        namespaceName,
		Labels:      map[string]string{migrationJobLabel: "true", migrationJobOwnerLabel: migrationUserLabel(owner)},
		Annotations: map[string]string{migrationJobOwnerAnnotation: owner},
	}}
	if err := migrator.Client.Create(ctx, namespace); err != nil {
		return nil, fmt.Errorf("create migration checkpoint namespace: %w", err)
	}
	created := false
	defer func() {
		if !created {
			cleanupCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 30*time.Second)
			defer cancel()
			_ = migrator.Client.Delete(cleanupCtx, namespace)
		}
	}()
	ownerRef := metav1.OwnerReference{APIVersion: "v1", Kind: "Namespace", Name: namespace.Name, UID: namespace.UID}
	record := durableMigrationJob{Owner: owner, Request: request, Snapshot: job.operatorMigrationJobSnapshot}
	for _, object := range permissions {
		binding, ok := object.(*rbacv1.RoleBinding)
		if !ok {
			continue
		}
		for _, subject := range binding.Subjects {
			if subject.Kind == "ServiceAccount" && subject.Name == migrationJobStateName && subject.Namespace == namespace.Name {
				record.ExecutionNamespaces = append(record.ExecutionNamespaces, binding.Namespace)
				break
			}
		}
	}
	sort.Strings(record.ExecutionNamespaces)
	encoded, err := encodeMigrationState(record)
	if err != nil {
		return nil, err
	}
	state := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: migrationJobStateName, Namespace: namespace.Name}, Data: map[string][]byte{migrationJobRecordKey: encoded}}
	sa := &corev1.ServiceAccount{ObjectMeta: metav1.ObjectMeta{Name: migrationJobStateName, Namespace: namespace.Name}}
	objects := []client.Object{state, sa}
	objects = append(objects, permissions...)
	// This is the authenticated user's client. Kubernetes validates all RBAC
	// delegation; Console's service credentials never grant migration privileges.
	for _, object := range objects {
		object.SetOwnerReferences([]metav1.OwnerReference{ownerRef})
		if err := migrator.Client.Create(ctx, object); err != nil {
			return nil, fmt.Errorf("prepare durable migration %s: %w", object.GetName(), err)
		}
	}
	index := &corev1.ConfigMap{ObjectMeta: metav1.ObjectMeta{
		Name: namespace.Name, Namespace: migrationIndexNamespace,
		Labels: namespace.Labels, Annotations: namespace.Annotations,
		OwnerReferences: []metav1.OwnerReference{ownerRef},
	}}
	if err := migrator.Client.Create(ctx, index); err != nil {
		return nil, fmt.Errorf("register durable migration: %w", err)
	}
	created = true
	o.migrationCoordinator.wake()
	return &record.Snapshot, nil
}

func readDurableMigrationJob(ctx context.Context, kubeClient client.Client, id, owner string) (*durableMigrationJob, error) {
	namespace, err := migrationJobNamespace(id)
	if err != nil {
		return nil, err
	}
	var ns corev1.Namespace
	if err := kubeClient.Get(ctx, client.ObjectKey{Name: namespace}, &ns); err != nil {
		if apierrors.IsNotFound(err) {
			return nil, nil
		}
		return nil, err
	}
	if ns.Labels[migrationJobLabel] != "true" || ns.Annotations[migrationJobOwnerAnnotation] != owner {
		return nil, nil
	}
	record, state, err := loadDurableMigrationJob(ctx, kubeClient, namespace)
	if err != nil {
		return nil, err
	}
	if record.Owner != owner || record.Snapshot.ID != id {
		return nil, nil
	}
	if string(state.Data[migrationJobCancelKey]) == "true" && record.Snapshot.FinishedAt == nil {
		record.Snapshot.Status = "CancelRequested"
		record.Snapshot.Message = "Cancellation requested"
		record.Snapshot.ProgressEvent = nil
	}
	return record, nil
}

func loadDurableMigrationJob(ctx context.Context, kubeClient client.Client, namespace string) (*durableMigrationJob, *corev1.Secret, error) {
	var state corev1.Secret
	if err := kubeClient.Get(ctx, client.ObjectKey{Name: migrationJobStateName, Namespace: namespace}, &state); err != nil {
		return nil, nil, err
	}
	var record durableMigrationJob
	if err := decodeMigrationState(state.Data[migrationJobRecordKey], &record); err != nil {
		return nil, nil, fmt.Errorf("decode migration job: %w", err)
	}
	return &record, &state, nil
}

func (o *OLMHandler) migrationJobsHandler(w http.ResponseWriter, r *http.Request) {
	owner, err := o.migrationJobOwner(r)
	if err != nil {
		serverutils.SendResponse(w, http.StatusUnauthorized, serverutils.ApiError{Err: err.Error()})
		return
	}
	migrator, err := o.operatorMigrator(r)
	if err != nil {
		writeOperatorMigrationError(w, err)
		return
	}
	var indexes corev1.ConfigMapList
	if err := migrator.Client.List(r.Context(), &indexes, client.InNamespace(migrationIndexNamespace), client.MatchingLabels{migrationJobLabel: "true", migrationJobOwnerLabel: migrationUserLabel(owner)}); err != nil {
		writeOperatorMigrationError(w, err)
		return
	}
	jobs := make([]operatorMigrationJobSnapshot, 0, len(indexes.Items))
	for _, index := range indexes.Items {
		if index.Annotations[migrationJobOwnerAnnotation] != owner || !strings.HasPrefix(index.Name, migrationJobNamespacePrefix) {
			continue
		}
		record, err := readDurableMigrationJob(r.Context(), migrator.Client, strings.TrimPrefix(index.Name, migrationJobNamespacePrefix), owner)
		if err != nil {
			writeOperatorMigrationError(w, err)
			return
		}
		if record != nil {
			jobs = append(jobs, record.Snapshot)
		}
	}
	sort.Slice(jobs, func(i, j int) bool { return jobs[i].CreatedAt.Before(jobs[j].CreatedAt) })
	serverutils.SendResponse(w, http.StatusOK, jobs)
}

func requestDurableMigrationCancellation(ctx context.Context, kubeClient client.Client, id, owner string) error {
	record, err := readDurableMigrationJob(ctx, kubeClient, id, owner)
	if err != nil {
		return err
	}
	if record == nil || record.Snapshot.FinishedAt != nil {
		return errMigrationJobUnavailable
	}
	namespace, _ := migrationJobNamespace(id)
	return retry.RetryOnConflict(retry.DefaultBackoff, func() error {
		var state corev1.Secret
		if err := kubeClient.Get(ctx, client.ObjectKey{Name: migrationJobStateName, Namespace: namespace}, &state); err != nil {
			return err
		}
		state.Data[migrationJobCancelKey] = []byte("true")
		return kubeClient.Update(ctx, &state)
	})
}
