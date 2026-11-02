package olm

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/operator-framework/library-olm/migration/pkg/migration"
	authv1 "k8s.io/api/authentication/v1"
	coordinationv1 "k8s.io/api/coordination/v1"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/util/retry"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// MigrationBackendConfig enables durable migration execution using the Console backend credentials.
type MigrationBackendConfig struct {
	Config  *rest.Config
	Enabled bool
	Context context.Context
}

type migrationCoordinator struct {
	client    client.Client
	config    *rest.Config
	identity  string
	wakeup    chan struct{}
	mu        sync.Mutex
	active    map[string]bool
	nextJob   int
	completed map[string]time.Time
	ctx       context.Context
	subject   rbacv1.Subject
}

// backendSubject resolves the configured backend credentials through Kubernetes rather than assuming a deployment namespace or service account.
func (c *migrationCoordinator) backendSubject(ctx context.Context) (rbacv1.Subject, error) {
	c.mu.Lock()
	subject := c.subject
	c.mu.Unlock()
	if subject.Name != "" {
		return subject, nil
	}
	if c.config == nil {
		return subject, fmt.Errorf("migration backend credentials are not configured")
	}
	kubeClient, err := kubernetes.NewForConfig(c.config)
	if err != nil {
		return subject, err
	}
	review, err := kubeClient.AuthenticationV1().SelfSubjectReviews().Create(ctx, &authv1.SelfSubjectReview{}, metav1.CreateOptions{})
	if err != nil {
		return subject, fmt.Errorf("identify migration backend: %w", err)
	}
	username := review.Status.UserInfo.Username
	if username == "" || username == "system:anonymous" {
		return subject, fmt.Errorf("authenticated migration backend identity is missing")
	}
	for _, group := range review.Status.UserInfo.Groups {
		if group == "system:unauthenticated" {
			return subject, fmt.Errorf("authenticated migration backend identity is missing")
		}
	}
	subject = rbacv1.Subject{Kind: rbacv1.UserKind, APIGroup: rbacv1.GroupName, Name: username}
	if strings.HasPrefix(username, "system:serviceaccount:") {
		parts := strings.Split(username, ":")
		if len(parts) != 4 || parts[2] == "" || parts[3] == "" {
			return rbacv1.Subject{}, fmt.Errorf("invalid migration backend service account identity")
		}
		subject = rbacv1.Subject{Kind: rbacv1.ServiceAccountKind, Namespace: parts[2], Name: parts[3]}
	}
	c.mu.Lock()
	c.subject = subject
	c.mu.Unlock()
	return subject, nil
}

// startMigrationCoordinator starts durable job discovery with a unique backend identity when persistence is configured.
func (o *OLMHandler) startMigrationCoordinator(config *MigrationBackendConfig) {
	if config.Config == nil {
		return
	}
	migrator, err := newMigrationClient(config.Config)
	if err != nil {
		klog.Errorf("configure migration persistence: error category=%s", migrationErrorCategory(err))
		return
	}
	var id [16]byte
	if _, err := rand.Read(id[:]); err != nil {
		klog.Errorf("create migration coordinator identity: error category=%s", migrationErrorCategory(err))
		return
	}
	ctx := config.Context
	if ctx == nil {
		ctx = context.Background()
	}
	c := &migrationCoordinator{client: migrator.Client, config: config.Config, identity: hex.EncodeToString(id[:]), wakeup: make(chan struct{}, 1), active: make(map[string]bool), ctx: ctx}
	o.migrationCoordinator = c
	go c.run()
}

// wake requests another discovery pass without blocking or accumulating duplicate signals.
func (c *migrationCoordinator) wake() {
	select {
	case c.wakeup <- struct{}{}:
	default:
	}
}

// run discovers persisted jobs periodically and on wakeup until the coordinator context ends.
func (c *migrationCoordinator) run() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	for {
		if c.ctx.Err() != nil {
			return
		}
		c.discover()
		select {
		case <-c.ctx.Done():
			return
		case <-ticker.C:
		case <-c.wakeup:
		}
	}
}

// discover schedules inactive indexed jobs and suppresses repeat processing of retained completed results.
func (c *migrationCoordinator) discover() {
	ctx, cancel := context.WithTimeout(c.ctx, 15*time.Second)
	defer cancel()
	var indexes corev1.ConfigMapList
	if err := c.client.List(ctx, &indexes, client.InNamespace(migrationIndexNamespace), client.MatchingLabels{migrationJobLabel: "true"}); err != nil {
		// Permissions are provisioned by the first initiating administrator.
		if !apierrors.IsForbidden(err) {
			klog.V(4).Infof("discover migration checkpoints: error category=%s", migrationErrorCategory(err))
		}
		return
	}
	seen := make(map[string]bool, len(indexes.Items))
	c.mu.Lock()
	start := c.nextJob
	c.mu.Unlock()
	for offset := range indexes.Items {
		position := (start + offset) % len(indexes.Items)
		index := indexes.Items[position]
		id := strings.TrimPrefix(index.Name, migrationJobNamespacePrefix)
		namespace, err := migrationJobNamespace(id)
		if err != nil || namespace != index.Name {
			continue
		}
		seen[id] = true
		c.mu.Lock()
		if len(c.active) >= maxConcurrentMigrationJobs || c.active[id] || time.Now().Before(c.completed[id]) {
			c.mu.Unlock()
			continue
		}
		c.active[id] = true
		c.nextJob = position + 1
		c.mu.Unlock()
		go func(id, owner string) {
			defer func() { c.mu.Lock(); delete(c.active, id); c.mu.Unlock() }()
			if err := c.resume(id, owner); err != nil && err != errMigrationSuspended {
				klog.Errorf("resume migration %s: error category=%s", id, migrationErrorCategory(err))
			}
		}(id, index.Annotations[migrationJobOwnerAnnotation])
	}
	c.mu.Lock()
	for id := range c.completed {
		if !seen[id] {
			delete(c.completed, id)
		}
	}
	c.mu.Unlock()
}

const migrationLeaseDuration = 30 * time.Second

// claim acquires or renews this job's Lease for the current backend identity.
func (c *migrationCoordinator) claim(ctx context.Context, namespace string) (bool, error) {
	return claimMigrationLease(ctx, c.client, client.ObjectKey{Name: migrationJobStateName, Namespace: namespace}, c.identity)
}

// claimMigrationLease uses optimistic updates to acquire an unheld or expired Lease without replacing a live competing holder.
func claimMigrationLease(ctx context.Context, kubeClient client.Client, key client.ObjectKey, identity string) (bool, error) {
	claimed := false
	err := retry.RetryOnConflict(retry.DefaultBackoff, func() error {
		var lease coordinationv1.Lease
		err := kubeClient.Get(ctx, key, &lease)
		now := metav1.NewMicroTime(time.Now().UTC())
		seconds := int32(migrationLeaseDuration / time.Second)
		if apierrors.IsNotFound(err) {
			lease = coordinationv1.Lease{ObjectMeta: metav1.ObjectMeta{Name: key.Name, Namespace: key.Namespace}, Spec: coordinationv1.LeaseSpec{HolderIdentity: &identity, LeaseDurationSeconds: &seconds, RenewTime: &now}}
			if err := kubeClient.Create(ctx, &lease); err != nil {
				if apierrors.IsAlreadyExists(err) {
					return nil
				}
				return err
			}
			claimed = true
			return nil
		}
		if err != nil {
			return err
		}
		if lease.Spec.HolderIdentity != nil && *lease.Spec.HolderIdentity != identity && lease.Spec.RenewTime != nil && time.Since(lease.Spec.RenewTime.Time) < migrationLeaseDuration {
			return nil
		}
		lease.Spec.HolderIdentity, lease.Spec.LeaseDurationSeconds, lease.Spec.RenewTime = &identity, &seconds, &now
		if err := kubeClient.Update(ctx, &lease); err != nil {
			return err
		}
		claimed = true
		return nil
	})
	return claimed, err
}

// ownsLease checks that this backend still holds an unexpired job Lease.
func (c *migrationCoordinator) ownsLease(ctx context.Context, namespace string) error {
	return ownsMigrationLease(ctx, c.client, client.ObjectKey{Name: migrationJobStateName, Namespace: namespace}, c.identity)
}

// ownsMigrationLease rejects missing, expired, or differently owned Leases before protected execution.
func ownsMigrationLease(ctx context.Context, kubeClient client.Client, key client.ObjectKey, identity string) error {
	var lease coordinationv1.Lease
	if err := kubeClient.Get(ctx, key, &lease); err != nil {
		return err
	}
	if lease.Spec.HolderIdentity == nil || *lease.Spec.HolderIdentity != identity || lease.Spec.RenewTime == nil || time.Since(lease.Spec.RenewTime.Time) >= migrationLeaseDuration {
		return errMigrationSuspended
	}
	return nil
}

// migrationJobNeedsRecovery retains source ownership and item metadata until failed recovery has completed.
func migrationJobNeedsRecovery(record *durableMigrationJob) bool {
	if record.Request.Rollback != nil {
		return false // Recovery retries are authorized against the retained source job.
	}
	for _, item := range record.Snapshot.Items {
		if item.Status == "Failed" && !item.RolledBack && (item.RecoveryRequired || item.RollbackAttempted) {
			return true
		}
	}
	return false
}

// resume claims a job Lease and resumes its persisted state using delegated service-account credentials.
func (c *migrationCoordinator) resume(id, owner string) error {
	namespace, _ := migrationJobNamespace(id)
	ctx, stop := context.WithCancel(c.ctx)
	defer stop()
	claimed, err := c.claim(ctx, namespace)
	if err != nil || !claimed {
		return err
	}
	record, state, err := loadDurableMigrationJob(ctx, c.client, namespace)
	if err != nil {
		return err
	}
	if record.Owner != owner || record.Snapshot.ID != id {
		return fmt.Errorf("migration checkpoint ownership does not match its index")
	}
	if record.Snapshot.FinishedAt != nil {
		// Revoke delegated credentials immediately. Recovery authorization metadata
		// must outlive ordinary results until the failed operator is restored.
		if err := client.IgnoreNotFound(c.client.Delete(ctx, &corev1.ServiceAccount{ObjectMeta: metav1.ObjectMeta{Name: migrationJobStateName, Namespace: namespace}})); err != nil {
			return err
		}
		if record.Request.Rollback != nil && record.Snapshot.Status == "Succeeded" {
			if err := c.completeSourceRecovery(ctx, record); err != nil {
				return err
			}
		}
		if time.Since(*record.Snapshot.FinishedAt) > 24*time.Hour && !migrationJobNeedsRecovery(record) {
			return client.IgnoreNotFound(c.client.Delete(ctx, &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: namespace}}))
		}
		c.mu.Lock()
		if c.completed == nil {
			c.completed = make(map[string]time.Time)
		}
		c.completed[id] = record.Snapshot.FinishedAt.Add(24 * time.Hour)
		c.mu.Unlock()
		return nil
	}
	if record.AuthorizationExpiresAt == nil || !time.Now().Before(*record.AuthorizationExpiresAt) {
		return c.expireAuthorization(ctx, namespace)
	}
	config, err := c.executionConfig(namespace)
	if errors.Is(err, errMigrationCredentialsExpired) {
		return c.expireAuthorization(ctx, namespace)
	}
	if err != nil {
		return err
	}
	migrator, err := newMigrationClient(config)
	if err != nil {
		return err
	}
	migrator = migration.NewMigrator(&migrationCollectionClient{Client: migrator.Client, namespaces: record.ExecutionNamespaces, expected: record.ExecutionResources}, migrator.RESTConfig)
	store := newMigrationJobStore()
	store.jobs[id] = &operatorMigrationJob{operatorMigrationJobSnapshot: record.Snapshot, owner: owner, candidates: record.Request.Operators, acknowledgments: record.Request.Acknowledgments, currentItem: -1}
	store.persist = func(snapshot operatorMigrationJobSnapshot) error {
		writeCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 10*time.Second)
		defer cancel()
		if err := c.ownsLease(writeCtx, namespace); err != nil {
			return err
		}
		return retry.RetryOnConflict(retry.DefaultBackoff, func() error {
			_, current, err := loadDurableMigrationJob(writeCtx, c.client, namespace)
			if err != nil {
				return err
			}
			record.Snapshot = snapshot
			encoded, err := encodeMigrationState(record)
			if err != nil {
				return err
			}
			current.Data[migrationJobRecordKey] = encoded
			return c.client.Update(writeCtx, current)
		})
	}
	if record.Request.Rollback != nil {
		return c.runRollbackJob(ctx, stop, namespace, record, store, migrator)
	}
	if string(state.Data[migrationJobCancelKey]) == "true" {
		// A cancellation may arrive while the backend is down.
		// Recover any partially executed item before marking the batch cancelled.
		for _, candidate := range record.Request.Operators {
			journal, err := c.loadJournal(ctx, namespace, candidate.SubscriptionNamespace, candidate.SubscriptionName)
			if apierrors.IsNotFound(err) {
				continue
			}
			if err != nil {
				return err
			}
			index := store.findItem(id, candidate.SubscriptionNamespace, candidate.SubscriptionName)
			if index < 0 {
				return fmt.Errorf("persisted migration item is missing")
			}
			if journal.Phase != "done" {
				interrupted, cancel := context.WithDeadline(ctx, time.Now().Add(-time.Second))
				err = c.executeCandidate(interrupted, migrator, namespace, id, journal.Options)
				cancel()
			} else {
				err = journal.result()
			}
			if err == errMigrationSuspended {
				return err
			}
			store.update(id, func(job *operatorMigrationJob) {
				if err == nil {
					job.Items[index].Status = "Succeeded"
				} else {
					job.Items[index].Status = "Failed"
					job.Items[index].Error = err.Error()
					if failure, ok := err.(*operatorMigrationFailure); ok {
						job.Items[index].RollbackAttempted = failure.rollbackAttempted
						job.Items[index].RolledBack = failure.rolledBack
					}
				}
			})
			if err := store.persistenceError(); err != nil {
				return err
			}
		}
		store.cancelJob(id, owner)
	}
	go func() {
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				renewCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
				err := c.ownsLease(renewCtx, namespace)
				if err == nil {
					var ok bool
					ok, err = c.claim(renewCtx, namespace)
					if !ok && err == nil {
						err = errMigrationSuspended
					}
				}
				cancel()
				if err != nil {
					stop()
					return
				}
				_, current, err := loadDurableMigrationJob(ctx, c.client, namespace)
				if err == nil && string(current.Data[migrationJobCancelKey]) == "true" {
					store.cancelJob(id, owner)
				}
			}
		}
	}()
	handler := &OLMHandler{migrationJobs: store, migrationRunContext: ctx}
	handler.migrationResumeCandidate = func(candidate operatorMigrationOptionsRequest) (bool, error) {
		_, err := c.loadJournal(ctx, namespace, candidate.SubscriptionNamespace, candidate.SubscriptionName)
		if apierrors.IsNotFound(err) {
			return false, nil
		}
		return err == nil, err
	}
	handler.migrationExecute = func(runCtx context.Context, m *migration.Migrator, options migration.Options) error {
		return c.executeCandidate(runCtx, m, namespace, id, options)
	}
	handler.runMigrationJob(id, migrator)
	if err := store.persistenceError(); err != nil {
		return err
	}
	if ctx.Err() != nil {
		return errMigrationSuspended
	}
	return nil
}

// executionConfig reuses the bounded, Secret-bound credential authorized by the initiating user; the backend cannot renew it.
func (c *migrationCoordinator) executionConfig(namespace string) (*rest.Config, error) {
	ctx := c.ctx
	if ctx == nil {
		ctx = context.Background()
	}
	var secret corev1.Secret
	if err := c.client.Get(ctx, client.ObjectKey{Namespace: namespace, Name: migrationCredentialsSecretName}, &secret); err != nil {
		if apierrors.IsNotFound(err) {
			return nil, errMigrationCredentialsExpired
		}
		return nil, err
	}
	expires, err := time.Parse(time.RFC3339Nano, string(secret.Data["expires"]))
	token := string(secret.Data["token"])
	if err != nil || token == "" || !time.Now().Before(expires) {
		return nil, errMigrationCredentialsExpired
	}
	config := rest.AnonymousClientConfig(c.config)
	config.Timeout = 10 * time.Second
	config.WrapTransport = func(rt http.RoundTripper) http.RoundTripper {
		return migrationTokenTransport{base: rt, token: func(ctx context.Context) (string, error) {
			if err := ctx.Err(); err != nil {
				return "", err
			}
			if !time.Now().Before(expires) {
				return "", errMigrationCredentialsExpired
			}
			return token, nil
		}}
	}
	return config, nil
}

type migrationTokenTransport struct {
	base  http.RoundTripper
	token func(context.Context) (string, error)
}

// RoundTrip clones each request and attaches the current short-lived delegated token.
func (t migrationTokenTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	token, err := t.token(request.Context())
	if err != nil {
		return nil, err
	}
	clone := request.Clone(request.Context())
	clone.Header.Set("Authorization", "Bearer "+token)
	return t.base.RoundTrip(clone)
}
