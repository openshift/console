package olm

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/operator-framework/library-olm/migration/pkg/migration"
	"k8s.io/klog/v2"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/serverutils"
)

const maxMigrationBatchSize = 1000

type operatorMigrationAcknowledgements struct {
	AcknowledgeWatchScopeChange     bool `json:"acknowledgeWatchScopeChange,omitempty"`
	AcknowledgeOperatorCondition    bool `json:"acknowledgeOperatorCondition,omitempty"`
	AcknowledgeOLMv0APIAccess       bool `json:"acknowledgeOLMv0APIAccess,omitempty"`
	AcknowledgeScopedServiceAccount bool `json:"acknowledgeScopedServiceAccount,omitempty"`
	AcknowledgeNotSteadyState       bool `json:"acknowledgeNotSteadyState,omitempty"`
}

func (a operatorMigrationAcknowledgements) apply(request *operatorMigrationOptionsRequest) {
	request.AcknowledgeWatchScopeChange = request.AcknowledgeWatchScopeChange || a.AcknowledgeWatchScopeChange
	request.AcknowledgeOperatorCondition = request.AcknowledgeOperatorCondition || a.AcknowledgeOperatorCondition
	request.AcknowledgeOLMv0APIAccess = request.AcknowledgeOLMv0APIAccess || a.AcknowledgeOLMv0APIAccess
	request.AcknowledgeScopedServiceAccount = request.AcknowledgeScopedServiceAccount || a.AcknowledgeScopedServiceAccount
	request.AcknowledgeNotSteadyState = request.AcknowledgeNotSteadyState || a.AcknowledgeNotSteadyState
}

func (a operatorMigrationAcknowledgements) options() migration.Options {
	return migration.Options{
		AcknowledgeWatchScopeChange:     a.AcknowledgeWatchScopeChange,
		AcknowledgeOperatorCondition:    a.AcknowledgeOperatorCondition,
		AcknowledgeOLMv0APIAccess:       a.AcknowledgeOLMv0APIAccess,
		AcknowledgeScopedServiceAccount: a.AcknowledgeScopedServiceAccount,
		AcknowledgeNotSteadyState:       a.AcknowledgeNotSteadyState,
	}
}

type operatorMigrationBulkRequest struct {
	AllEligible     bool                              `json:"allEligible,omitempty"`
	Operators       []operatorMigrationOptionsRequest `json:"operators,omitempty"`
	Acknowledgments operatorMigrationAcknowledgements `json:"acknowledgements,omitempty"`
	ContinueOnError *bool                             `json:"continueOnError,omitempty"`
}

type operatorMigrationJobItem struct {
	SubscriptionName      string                     `json:"subscriptionName"`
	SubscriptionNamespace string                     `json:"subscriptionNamespace,omitempty"`
	ClusterExtensionName  string                     `json:"clusterExtensionName,omitempty"`
	Status                string                     `json:"status"`
	Progress              string                     `json:"progress,omitempty"`
	ProgressEvent         *operatorMigrationProgress `json:"progressEvent,omitempty"`
	Reason                string                     `json:"reason,omitempty"`
	Error                 string                     `json:"error,omitempty"`
	RollbackAttempted     bool                       `json:"rollbackAttempted,omitempty"`
	RolledBack            bool                       `json:"rolledBack,omitempty"`
}

type operatorMigrationJobSnapshot struct {
	ID              string                     `json:"id"`
	Status          string                     `json:"status"`
	Message         string                     `json:"message,omitempty"`
	ProgressEvent   *operatorMigrationProgress `json:"progressEvent,omitempty"`
	ContinueOnError bool                       `json:"continueOnError"`
	CreatedAt       time.Time                  `json:"createdAt"`
	UpdatedAt       time.Time                  `json:"updatedAt"`
	FinishedAt      *time.Time                 `json:"finishedAt,omitempty"`
	Items           []operatorMigrationJobItem `json:"items"`
}

type operatorMigrationJob struct {
	operatorMigrationJobSnapshot
	owner           string
	allEligible     bool
	acknowledgments operatorMigrationAcknowledgements
	candidates      []operatorMigrationOptionsRequest
	cancel          context.CancelFunc
	currentItem     int
}

type migrationJobStore struct {
	mu         sync.RWMutex
	jobs       map[string]*operatorMigrationJob
	persist    func(operatorMigrationJobSnapshot) error
	persistErr error
}

func newMigrationJobStore() *migrationJobStore {
	return &migrationJobStore{jobs: make(map[string]*operatorMigrationJob)}
}

func (s *migrationJobStore) create(owner string, request operatorMigrationBulkRequest) (*operatorMigrationJob, error) {
	var idBytes [16]byte
	if _, err := rand.Read(idBytes[:]); err != nil {
		return nil, fmt.Errorf("generate migration job ID: %w", err)
	}
	now := time.Now().UTC()
	continueOnError := true
	if request.ContinueOnError != nil {
		continueOnError = *request.ContinueOnError
	}
	job := &operatorMigrationJob{
		operatorMigrationJobSnapshot: operatorMigrationJobSnapshot{
			ID:              hex.EncodeToString(idBytes[:]),
			Status:          "Queued",
			ContinueOnError: continueOnError,
			CreatedAt:       now,
			UpdatedAt:       now,
			Items:           make([]operatorMigrationJobItem, 0, len(request.Operators)),
		},
		owner:           owner,
		allEligible:     request.AllEligible,
		acknowledgments: request.Acknowledgments,
		candidates:      append([]operatorMigrationOptionsRequest(nil), request.Operators...),
		currentItem:     -1,
	}
	for _, candidate := range request.Operators {
		clusterExtensionName := candidate.ClusterExtensionName
		if clusterExtensionName == "" {
			clusterExtensionName = candidate.SubscriptionName
		}
		item := operatorMigrationJobItem{
			SubscriptionName:      candidate.SubscriptionName,
			SubscriptionNamespace: candidate.SubscriptionNamespace,
			ClusterExtensionName:  clusterExtensionName,
			Status:                "Queued",
		}
		job.Items = append(job.Items, item)
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	s.pruneLocked(now)
	s.jobs[job.ID] = job
	return job, nil
}

func (s *migrationJobStore) pruneLocked(now time.Time) {
	for id, job := range s.jobs {
		if job.FinishedAt != nil && now.Sub(*job.FinishedAt) > 24*time.Hour {
			delete(s.jobs, id)
		}
	}
	if len(s.jobs) <= 1000 {
		return
	}
	type entry struct {
		id string
		at time.Time
	}
	finished := make([]entry, 0, len(s.jobs))
	for id, job := range s.jobs {
		if job.FinishedAt != nil {
			finished = append(finished, entry{id: id, at: *job.FinishedAt})
		}
	}
	sort.Slice(finished, func(i, j int) bool { return finished[i].at.Before(finished[j].at) })
	for _, old := range finished {
		if len(s.jobs) <= 1000 {
			break
		}
		delete(s.jobs, old.id)
	}
}

func (s *migrationJobStore) setCancel(id string, cancel context.CancelFunc) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if job := s.jobs[id]; job != nil {
		job.cancel = cancel
		if job.Status == "CancelRequested" {
			cancel()
		}
	}
}

func (s *migrationJobStore) update(id string, update func(*operatorMigrationJob)) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.persistErr != nil {
		return
	}
	if job := s.jobs[id]; job != nil {
		update(job)
		job.UpdatedAt = time.Now().UTC()
		if s.persist != nil {
			if err := s.persist(job.operatorMigrationJobSnapshot); err != nil {
				s.persistErr = err
				if job.cancel != nil {
					job.cancel()
				}
			}
		}
	}
}

func (s *migrationJobStore) persistenceError() error {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.persistErr
}

func (s *migrationJobStore) snapshot(id, owner string) (operatorMigrationJobSnapshot, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	job := s.jobs[id]
	if job == nil || job.owner != owner {
		return operatorMigrationJobSnapshot{}, false
	}
	snapshot := job.operatorMigrationJobSnapshot
	snapshot.Items = append([]operatorMigrationJobItem(nil), job.Items...)
	if job.FinishedAt != nil {
		finished := *job.FinishedAt
		snapshot.FinishedAt = &finished
	}
	return snapshot, true
}

func (s *migrationJobStore) cancelJob(id, owner string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	job := s.jobs[id]
	if job == nil || job.owner != owner || job.FinishedAt != nil {
		return false
	}
	job.Status = "CancelRequested"
	job.Message = "Cancellation requested"
	job.ProgressEvent = nil
	job.UpdatedAt = time.Now().UTC()
	if job.cancel != nil {
		job.cancel()
	}
	return true
}

func (o *OLMHandler) migrationJobOwner(r *http.Request) (string, error) {
	user := auth.GetUserFromRequestContext(r)
	if user == nil {
		return "", fmt.Errorf("authenticated user is required")
	}
	if user.ID != "" {
		return user.ID, nil
	}
	if user.Username != "" {
		return user.Username, nil
	}
	// Auth-disabled local development supplies only a static Kubernetes token.
	if o.authDisabled && user.Token != "" {
		return fmt.Sprintf("token:%x", sha256.Sum256([]byte(user.Token))), nil
	}
	return "", fmt.Errorf("authenticated user identity is missing")
}

func (o *OLMHandler) migrationBulkHandler(w http.ResponseWriter, r *http.Request) {
	var request operatorMigrationBulkRequest
	if err := decodeOperatorMigrationRequest(w, r, &request); err != nil {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: err.Error()})
		return
	}
	if request.AllEligible == (len(request.Operators) > 0) {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: "set allEligible or provide operators, but not both"})
		return
	}
	if len(request.Operators) > maxMigrationBatchSize {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: fmt.Sprintf("operators cannot exceed %d entries", maxMigrationBatchSize)})
		return
	}
	seen := make(map[string]struct{}, len(request.Operators))
	for _, candidate := range request.Operators {
		if err := candidate.validate(); err != nil {
			serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: err.Error()})
			return
		}
		key := candidate.SubscriptionNamespace + "/" + candidate.SubscriptionName
		if _, found := seen[key]; found {
			serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: fmt.Sprintf("duplicate operator %s", key)})
			return
		}
		seen[key] = struct{}{}
	}
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
	job, err := o.createDurableMigrationJob(r.Context(), migrator, owner, request)
	if err != nil {
		writeOperatorMigrationError(w, err)
		return
	}
	serverutils.SendResponse(w, http.StatusAccepted, map[string]string{"jobID": job.ID, "status": job.Status})
}

func (o *OLMHandler) runMigrationJob(jobID string, migrator *migration.Migrator) {
	parent := o.migrationRunContext
	if parent == nil {
		parent = context.Background()
	}
	_, found := o.migrationJobs.snapshotForRunner(jobID)
	if !found {
		return
	}
	// Backend downtime does not consume the replacement runner's time budget.
	ctx, cancel := context.WithTimeout(parent, 2*time.Hour)
	o.migrationJobs.setCancel(jobID, cancel)
	defer cancel()
	defer func() {
		if recovered := recover(); recovered != nil {
			klog.Errorf("OLM migration job %s panicked", jobID)
			o.finishMigrationJob(jobID, "Failed", "migration job failed unexpectedly")
		}
	}()

	var request operatorMigrationBulkRequest
	o.migrationJobs.update(jobID, func(job *operatorMigrationJob) {
		request.AllEligible = job.allEligible
		continueOnError := job.ContinueOnError
		request.ContinueOnError = &continueOnError
		request.Acknowledgments = job.acknowledgments
		request.Operators = append([]operatorMigrationOptionsRequest(nil), job.candidates...)
		job.Status = "Running"
		job.Message = "Preparing operator migration"
		job.ProgressEvent = nil
	})
	continueOnError := request.ContinueOnError != nil && *request.ContinueOnError
	if ctx.Err() != nil {
		if parent.Err() != nil || o.migrationJobs.persistenceError() != nil {
			return
		}
		o.finishMigrationJob(jobID, "Cancelled", "Migration job was cancelled")
		return
	}

	migrator.Progress = o.migrationProgressCallback(jobID)

	candidates := append([]operatorMigrationOptionsRequest(nil), request.Operators...)
	for i := range candidates {
		request.Acknowledgments.apply(&candidates[i])
	}
	if request.AllEligible {
		o.migrationJobs.update(jobID, func(job *operatorMigrationJob) {
			job.Status = "Scanning"
			job.Message = "Scanning all OLMv0 Subscriptions"
			job.ProgressEvent = nil
		})
		results, err := migrator.ScanAllSubscriptionsWithOptions(ctx, request.Acknowledgments.options())
		if err != nil {
			if ctx.Err() != nil {
				o.finishMigrationJob(jobID, "Cancelled", "Migration job was cancelled")
				return
			}
			klog.Errorf("OLM migration job %s scan failed: error category=%s", jobID, migrationErrorCategory(err))
			o.finishMigrationJob(jobID, "Failed", err.Error())
			return
		}
		recoveryConflicts, err := listOperatorMigrationRecoveryConflicts(ctx, migrator.Client)
		if err != nil {
			klog.Errorf("OLM migration job %s recovery scan failed: error category=%s", jobID, migrationErrorCategory(err))
			o.finishMigrationJob(jobID, "Failed", err.Error())
			return
		}
		resultBySubscription := make(map[string]int, len(results))
		for i := range results {
			ref := results[i].SubscriptionNamespace + "/" + results[i].SubscriptionName
			resultBySubscription[ref] = i
			if recovery, found := recoveryConflicts[ref]; found {
				results[i].Status = migration.OperatorStatusConflict
				results[i].Eligible = false
				results[i].Reason = recovery.Reason
			}
		}
		recoveryRefs := make([]string, 0, len(recoveryConflicts))
		for ref := range recoveryConflicts {
			recoveryRefs = append(recoveryRefs, ref)
		}
		sort.Strings(recoveryRefs)
		for _, ref := range recoveryRefs {
			if _, found := resultBySubscription[ref]; found {
				continue
			}
			namespace, name, ok := strings.Cut(ref, "/")
			if !ok || namespace == "" || name == "" {
				o.finishMigrationJob(jobID, "Failed", fmt.Sprintf("migration recovery metadata contains an invalid Subscription reference %q", ref))
				return
			}
			results = append(results, migration.OperatorScanResult{
				SubscriptionName:      name,
				SubscriptionNamespace: namespace,
				Status:                migration.OperatorStatusConflict,
				Reason:                recoveryConflicts[ref].Reason,
			})
		}
		candidates = make([]operatorMigrationOptionsRequest, 0, len(results))
		o.migrationJobs.update(jobID, func(job *operatorMigrationJob) {
			job.Items = make([]operatorMigrationJobItem, 0, len(results))
			for _, result := range results {
				candidate := operatorMigrationOptionsRequest{
					SubscriptionName:      result.SubscriptionName,
					SubscriptionNamespace: result.SubscriptionNamespace,
				}
				request.Acknowledgments.apply(&candidate)
				item := operatorMigrationJobItem{
					SubscriptionName:      result.SubscriptionName,
					SubscriptionNamespace: result.SubscriptionNamespace,
					ClusterExtensionName:  result.SubscriptionName,
					Status:                "Queued",
				}
				if result.Status != migration.OperatorStatusEligible {
					item.Status = "Skipped"
					item.Reason = result.Reason
				}
				job.Items = append(job.Items, item)
				if result.Status == migration.OperatorStatusEligible {
					candidates = append(candidates, candidate)
				}
			}
			job.Message = fmt.Sprintf("Found %d eligible operator(s)", len(candidates))
			job.ProgressEvent = nil
		})
	}
	if len(candidates) == 0 {
		o.finishMigrationJob(jobID, "Succeeded", "No eligible operators to migrate")
		return
	}

	for _, candidate := range candidates {
		if o.migrationJobs.persistenceError() != nil {
			return
		}
		if ctx.Err() != nil {
			if parent.Err() != nil {
				return
			}
			o.finishMigrationJob(jobID, "Cancelled", "Migration job was cancelled")
			return
		}
		index := o.migrationJobs.findItem(jobID, candidate.SubscriptionNamespace, candidate.SubscriptionName)
		if index < 0 {
			index = o.migrationJobs.appendItem(jobID, candidate)
		}
		current, _ := o.migrationJobs.snapshotForRunner(jobID)
		if current.Items[index].Status == "Failed" && !continueOnError {
			o.skipRemainingMigrationItems(jobID, index+1, "Stopped after an operator failed")
			break
		}
		if status := current.Items[index].Status; status == "Succeeded" || status == "Failed" || status == "Skipped" {
			continue
		}
		resuming := false
		if o.migrationResumeCandidate != nil {
			var err error
			resuming, err = o.migrationResumeCandidate(candidate)
			if err != nil {
				return
			}
		}
		o.migrationJobs.update(jobID, func(job *operatorMigrationJob) {
			job.currentItem = index
			job.Items[index].Status = "Checking"
			job.Items[index].Progress = "Checking current eligibility"
			job.Items[index].ProgressEvent = nil
			job.Message = fmt.Sprintf("Checking %s/%s", candidate.SubscriptionNamespace, candidate.SubscriptionName)
			job.ProgressEvent = nil
		})
		options := candidate.options()
		options.ApplyDefaults()
		var scan *migration.OperatorScanResult
		var err error
		if !resuming {
			scan, err = migrator.ScanSubscription(ctx, options)
		}
		if err != nil {
			if parent.Err() != nil || o.migrationJobs.persistenceError() != nil {
				return
			}
			o.migrationJobs.update(jobID, func(job *operatorMigrationJob) {
				job.Items[index].Status = "Failed"
				job.Items[index].Error = err.Error()
			})
			klog.Errorf("OLM migration job %s failed scanning %s/%s: error category=%s", jobID, candidate.SubscriptionNamespace, candidate.SubscriptionName, migrationErrorCategory(err))
			if !continueOnError {
				o.skipRemainingMigrationItems(jobID, index+1, "Stopped after an operator failed")
				break
			}
			continue
		}
		if !resuming && scan.Status != migration.OperatorStatusEligible {
			o.migrationJobs.update(jobID, func(job *operatorMigrationJob) {
				job.Items[index].Status = "Skipped"
				job.Items[index].Reason = scan.Reason
			})
			continue
		}
		o.migrationJobs.update(jobID, func(job *operatorMigrationJob) {
			job.Items[index].Status = "Migrating"
			job.Items[index].Progress = "Migration started"
			job.Message = fmt.Sprintf("Migrating %s/%s", candidate.SubscriptionNamespace, candidate.SubscriptionName)
			job.ProgressEvent = nil
		})
		if o.migrationJobs.persistenceError() != nil || parent.Err() != nil {
			return
		}
		execute := o.migrationExecute
		if execute == nil {
			execute = migrateOperatorWithRecovery
		}
		if err := execute(ctx, migrator, options); err != nil {
			if errors.Is(err, errMigrationSuspended) {
				return
			}
			o.migrationJobs.update(jobID, func(job *operatorMigrationJob) {
				job.Items[index].Status = "Failed"
				job.Items[index].Error = err.Error()
				job.Items[index].Progress = "Migration failed"
				var migrationFailure *operatorMigrationFailure
				if errors.As(err, &migrationFailure) {
					job.Items[index].RollbackAttempted = migrationFailure.rollbackAttempted
					job.Items[index].RolledBack = migrationFailure.rolledBack
				}
			})
			klog.Errorf("OLM migration job %s failed migrating %s/%s: error category=%s", jobID, candidate.SubscriptionNamespace, candidate.SubscriptionName, migrationErrorCategory(err))
			if !continueOnError {
				o.skipRemainingMigrationItems(jobID, index+1, "Stopped after an operator failed")
				break
			}
			continue
		}
		o.migrationJobs.update(jobID, func(job *operatorMigrationJob) {
			job.Items[index].Status = "Succeeded"
			job.Items[index].Progress = "Migration completed"
		})
	}

	snapshot, _ := o.migrationJobs.snapshotForRunner(jobID)
	if o.migrationJobs.persistenceError() != nil {
		return
	}
	failed := false
	for _, item := range snapshot.Items {
		if item.Status == "Failed" {
			failed = true
			break
		}
	}
	if ctx.Err() != nil {
		if parent.Err() != nil {
			return
		}
		o.finishMigrationJob(jobID, "Cancelled", "Migration job was cancelled")
	} else if failed {
		o.finishMigrationJob(jobID, "CompletedWithErrors", "One or more operators failed; review the per-operator results")
	} else {
		o.finishMigrationJob(jobID, "Succeeded", "Migration job completed")
	}
}

func (s *migrationJobStore) findItem(id, namespace, name string) int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	job := s.jobs[id]
	if job == nil {
		return -1
	}
	for i := range job.Items {
		if job.Items[i].SubscriptionNamespace == namespace && job.Items[i].SubscriptionName == name {
			return i
		}
	}
	return -1
}

func (s *migrationJobStore) appendItem(id string, candidate operatorMigrationOptionsRequest) int {
	index := -1
	s.update(id, func(job *operatorMigrationJob) {
		index = len(job.Items)
		job.Items = append(job.Items, operatorMigrationJobItem{
			SubscriptionName:      candidate.SubscriptionName,
			SubscriptionNamespace: candidate.SubscriptionNamespace,
			ClusterExtensionName:  candidate.ClusterExtensionName,
			Status:                "Queued",
		})
	})
	return index
}

func (s *migrationJobStore) snapshotForRunner(id string) (operatorMigrationJobSnapshot, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	job := s.jobs[id]
	if job == nil {
		return operatorMigrationJobSnapshot{}, false
	}
	snapshot := job.operatorMigrationJobSnapshot
	snapshot.Items = append([]operatorMigrationJobItem(nil), job.Items...)
	return snapshot, true
}

func (o *OLMHandler) skipRemainingMigrationItems(jobID string, start int, reason string) {
	o.migrationJobs.update(jobID, func(job *operatorMigrationJob) {
		for i := start; i < len(job.Items); i++ {
			if job.Items[i].Status == "Queued" {
				job.Items[i].Status = "Skipped"
				job.Items[i].Reason = reason
			}
		}
	})
}

func (o *OLMHandler) finishMigrationJob(jobID, status, message string) {
	now := time.Now().UTC()
	o.migrationJobs.update(jobID, func(job *operatorMigrationJob) {
		job.Status = status
		job.Message = message
		job.ProgressEvent = nil
		job.FinishedAt = &now
		job.cancel = nil
	})
}

func (o *OLMHandler) migrationJobHandler(w http.ResponseWriter, r *http.Request) {
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
	record, err := readDurableMigrationJob(r.Context(), migrator.Client, r.PathValue("jobID"), owner)
	if err != nil {
		writeOperatorMigrationError(w, err)
		return
	}
	if record == nil {
		serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{Err: "migration job not found"})
		return
	}
	serverutils.SendResponse(w, http.StatusOK, record.Snapshot)
}

func (o *OLMHandler) migrationJobCancelHandler(w http.ResponseWriter, r *http.Request) {
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
	if err := requestDurableMigrationCancellation(r.Context(), migrator.Client, r.PathValue("jobID"), owner); err != nil {
		if !errors.Is(err, errMigrationJobUnavailable) {
			writeOperatorMigrationError(w, err)
			return
		}
		serverutils.SendResponse(w, http.StatusConflict, serverutils.ApiError{Err: "migration job is unavailable or already finished"})
		return
	}
	serverutils.SendResponse(w, http.StatusAccepted, map[string]string{"status": "CancelRequested"})
}
