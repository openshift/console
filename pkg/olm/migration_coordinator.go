package olm

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/operator-framework/library-olm/migration/pkg/migration"
	authv1 "k8s.io/api/authentication/v1"
	coordinationv1 "k8s.io/api/coordination/v1"
	corev1 "k8s.io/api/core/v1"
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
}

type migrationCoordinator struct {
	client    client.Client
	config    *rest.Config
	identity  string
	wakeup    chan struct{}
	mu        sync.Mutex
	active    map[string]bool
	completed map[string]time.Time
	ctx       context.Context
}

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
	c := &migrationCoordinator{client: migrator.Client, config: config.Config, identity: hex.EncodeToString(id[:]), wakeup: make(chan struct{}, 1), active: make(map[string]bool), ctx: context.Background()}
	o.migrationCoordinator = c
	go c.run()
}

func (c *migrationCoordinator) wake() {
	select {
	case c.wakeup <- struct{}{}:
	default:
	}
}

func (c *migrationCoordinator) run() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	for {
		c.discover()
		select {
		case <-c.ctx.Done():
			return
		case <-ticker.C:
		case <-c.wakeup:
		}
	}
}

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
	for _, index := range indexes.Items {
		id := strings.TrimPrefix(index.Name, migrationJobNamespacePrefix)
		namespace, err := migrationJobNamespace(id)
		if err != nil || namespace != index.Name {
			continue
		}
		seen[id] = true
		c.mu.Lock()
		if c.active[id] || time.Now().Before(c.completed[id]) {
			c.mu.Unlock()
			continue
		}
		c.active[id] = true
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

func (c *migrationCoordinator) claim(ctx context.Context, namespace string) (bool, error) {
	claimed := false
	err := retry.RetryOnConflict(retry.DefaultBackoff, func() error {
		var lease coordinationv1.Lease
		key := client.ObjectKey{Name: migrationJobStateName, Namespace: namespace}
		err := c.client.Get(ctx, key, &lease)
		now := metav1.NewMicroTime(time.Now().UTC())
		seconds := int32(migrationLeaseDuration / time.Second)
		if apierrors.IsNotFound(err) {
			lease = coordinationv1.Lease{ObjectMeta: metav1.ObjectMeta{Name: key.Name, Namespace: namespace}, Spec: coordinationv1.LeaseSpec{HolderIdentity: &c.identity, LeaseDurationSeconds: &seconds, RenewTime: &now}}
			if err := c.client.Create(ctx, &lease); err != nil {
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
		if lease.Spec.HolderIdentity != nil && *lease.Spec.HolderIdentity != c.identity && lease.Spec.RenewTime != nil && time.Since(lease.Spec.RenewTime.Time) < migrationLeaseDuration {
			return nil
		}
		lease.Spec.HolderIdentity, lease.Spec.LeaseDurationSeconds, lease.Spec.RenewTime = &c.identity, &seconds, &now
		if err := c.client.Update(ctx, &lease); err != nil {
			return err
		}
		claimed = true
		return nil
	})
	return claimed, err
}

func (c *migrationCoordinator) ownsLease(ctx context.Context, namespace string) error {
	var lease coordinationv1.Lease
	if err := c.client.Get(ctx, client.ObjectKey{Name: migrationJobStateName, Namespace: namespace}, &lease); err != nil {
		return err
	}
	if lease.Spec.HolderIdentity == nil || *lease.Spec.HolderIdentity != c.identity || lease.Spec.RenewTime == nil || time.Since(lease.Spec.RenewTime.Time) >= migrationLeaseDuration {
		return errMigrationSuspended
	}
	return nil
}

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
		// Revoke delegated credentials immediately, retain results for one day.
		if err := client.IgnoreNotFound(c.client.Delete(ctx, &corev1.ServiceAccount{ObjectMeta: metav1.ObjectMeta{Name: migrationJobStateName, Namespace: namespace}})); err != nil {
			return err
		}
		if time.Since(*record.Snapshot.FinishedAt) > 24*time.Hour {
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
	config, err := c.executionConfig(namespace)
	if err != nil {
		return err
	}
	migrator, err := newMigrationClient(config)
	if err != nil {
		return err
	}
	migrator = migration.NewMigrator(&migrationCollectionClient{Client: migrator.Client, namespaces: record.ExecutionNamespaces}, migrator.RESTConfig)
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

// Mint/refresh a short-lived token for the per-migration service account. The
// backend can request only this delegated account's tokens; logout is unrelated.
func (c *migrationCoordinator) executionConfig(namespace string) (*rest.Config, error) {
	issuer, err := kubernetes.NewForConfig(c.config)
	if err != nil {
		return nil, err
	}
	var mu sync.Mutex
	var token string
	var expires time.Time
	config := rest.AnonymousClientConfig(c.config)
	config.Timeout = 10 * time.Second
	config.WrapTransport = func(rt http.RoundTripper) http.RoundTripper {
		return migrationTokenTransport{base: rt, token: func(ctx context.Context) (string, error) {
			mu.Lock()
			defer mu.Unlock()
			if token == "" || time.Until(expires) < time.Minute {
				seconds := int64(3600)
				issued, err := issuer.CoreV1().ServiceAccounts(namespace).CreateToken(ctx, migrationJobStateName, &authv1.TokenRequest{Spec: authv1.TokenRequestSpec{ExpirationSeconds: &seconds}}, metav1.CreateOptions{})
				if err != nil {
					return "", fmt.Errorf("request delegated migration credentials: %w", err)
				}
				token, expires = issued.Status.Token, issued.Status.ExpirationTimestamp.Time
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

func (t migrationTokenTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	token, err := t.token(request.Context())
	if err != nil {
		return nil, err
	}
	clone := request.Clone(request.Context())
	clone.Header.Set("Authorization", "Bearer "+token)
	return t.base.RoundTrip(clone)
}
