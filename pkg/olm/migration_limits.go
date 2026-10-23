package olm

import (
	"context"
	"strings"
	"sync"
	"time"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/client-go/util/flowcontrol"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

const (
	maxConcurrentMigrationPlanning = 4
	maxConcurrentMigrationJobs     = 4
	maxActiveMigrationJobsPerOwner = 10
	migrationPlanningTimeout       = 5 * time.Minute
)

var migrationPlanningSlots = make(chan struct{}, maxConcurrentMigrationPlanning)

// beginMigrationPlanning bounds expensive catalog work and rejects excess requests without queuing more goroutines.
func beginMigrationPlanning(ctx context.Context) (context.Context, func(), error) {
	if err := ctx.Err(); err != nil {
		return nil, nil, err
	}
	select {
	case migrationPlanningSlots <- struct{}{}:
		bounded, cancel := context.WithTimeout(ctx, migrationPlanningTimeout)
		return bounded, func() { cancel(); <-migrationPlanningSlots }, nil
	default:
		return nil, nil, apierrors.NewTooManyRequests("operator migration planning is busy; retry later", 5)
	}
}

type migrationOwnerAdmission struct {
	limiter  flowcontrol.RateLimiter
	lastUsed time.Time
}

type migrationAdmission struct {
	once    sync.Once
	gate    chan struct{}
	owners  map[string]*migrationOwnerAdmission
	limiter flowcontrol.RateLimiter
}

// acquire serializes admission and job creation in this backend without blocking cancelled requests.
func (a *migrationAdmission) acquire(ctx context.Context) (func(), error) {
	a.once.Do(func() {
		a.gate = make(chan struct{}, 1)
		a.owners = make(map[string]*migrationOwnerAdmission)
		a.limiter = flowcontrol.NewTokenBucketRateLimiter(1, 10)
	})
	select {
	case a.gate <- struct{}{}:
		return func() { <-a.gate }, nil
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}

// check bounds submission bursts and checks durable active jobs across backend restarts and replicas.
// Concurrent admission on different replicas may exceed the count by their bounded in-flight requests.
func (a *migrationAdmission) check(ctx context.Context, kubeClient client.Client, owner string) error {
	now := time.Now()
	for key, entry := range a.owners {
		if now.Sub(entry.lastUsed) > time.Minute {
			delete(a.owners, key)
		}
	}
	entry := a.owners[owner]
	if entry == nil {
		if len(a.owners) >= 1024 {
			return apierrors.NewTooManyRequests("operator migration admission is busy; retry later", 60)
		}
		// A burst of five submissions, replenished at thirty per minute per owner.
		entry = &migrationOwnerAdmission{limiter: flowcontrol.NewTokenBucketRateLimiter(0.5, 5)}
		a.owners[owner] = entry
	}
	entry.lastUsed = now
	if !entry.limiter.TryAccept() {
		return apierrors.NewTooManyRequests("operator migration submission limit reached; retry later", 2)
	}
	if !a.limiter.TryAccept() {
		return apierrors.NewTooManyRequests("operator migration admission is busy; retry later", 1)
	}
	var indexes corev1.ConfigMapList
	if err := kubeClient.List(ctx, &indexes, client.InNamespace(migrationIndexNamespace), client.MatchingLabels{migrationJobLabel: "true", migrationJobOwnerLabel: migrationUserLabel(owner)}); err != nil {
		return err
	}
	active := 0
	for _, index := range indexes.Items {
		if index.Annotations[migrationJobOwnerAnnotation] != owner || !strings.HasPrefix(index.Name, migrationJobNamespacePrefix) {
			continue
		}
		record, err := readDurableMigrationJob(ctx, kubeClient, strings.TrimPrefix(index.Name, migrationJobNamespacePrefix), owner)
		if err != nil {
			return err
		}
		if record != nil && record.Snapshot.FinishedAt == nil {
			active++
			if active >= maxActiveMigrationJobsPerOwner {
				return apierrors.NewTooManyRequests("too many active operator migration jobs; wait for a job to finish", 5)
			}
		}
	}
	return nil
}
