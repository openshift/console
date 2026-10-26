package olm

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strconv"
	"sync"
	"testing"
	"time"

	"github.com/operator-framework/library-olm/migration/pkg/migration"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	coordinationv1 "k8s.io/api/coordination/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/interceptor"
)

// TestMigrationPlanningCapacity bounds expensive work, rejects overload, and releases capacity on cancellation.
func TestMigrationPlanningCapacity(t *testing.T) {
	var releases []func()
	defer func() {
		for _, release := range releases {
			release()
		}
	}()
	for i := 0; i < maxConcurrentMigrationPlanning; i++ {
		ctx, release, err := beginMigrationPlanning(context.Background())
		require.NoError(t, err)
		deadline, bounded := ctx.Deadline()
		require.True(t, bounded)
		assert.InDelta(t, migrationPlanningTimeout.Seconds(), time.Until(deadline).Seconds(), 1)
		releases = append(releases, release)
	}
	_, _, err := beginMigrationPlanning(context.Background())
	require.True(t, apierrors.IsTooManyRequests(err))
	for _, handler := range []http.HandlerFunc{(&OLMHandler{}).migrationScanHandler, (&OLMHandler{}).migrationDryRunHandler} {
		response := httptest.NewRecorder()
		handler(response, httptest.NewRequest(http.MethodPost, "/", nil))
		assert.Equal(t, http.StatusTooManyRequests, response.Code)
		assert.Equal(t, "5", response.Header().Get("Retry-After"))
	}
	releases[0]()
	releases = releases[1:]
	parent, cancel := context.WithCancel(context.Background())
	ctx, release, err := beginMigrationPlanning(parent)
	require.NoError(t, err)
	cancel()
	assert.ErrorIs(t, ctx.Err(), context.Canceled)
	release()
	_, _, err = beginMigrationPlanning(parent)
	assert.ErrorIs(t, err, context.Canceled)
}

// TestMigrationAdmissionLimits uses durable state for the active cap and independent per-owner submission bursts.
func TestMigrationAdmissionLimits(t *testing.T) {
	ctx := context.Background()
	kubeClient := newMigrationTestClient(t)
	var admission migrationAdmission
	release, err := admission.acquire(ctx)
	require.NoError(t, err)
	defer release()
	for i := 0; i < 5; i++ {
		require.NoError(t, admission.check(ctx, kubeClient, "alice"))
	}
	assert.True(t, apierrors.IsTooManyRequests(admission.check(ctx, kubeClient, "alice")))
	require.NoError(t, admission.check(ctx, kubeClient, "bob"))
	for i := 0; i < maxActiveMigrationJobsPerOwner; i++ {
		job, err := newMigrationJobStore().create("active", operatorMigrationBulkRequest{})
		require.NoError(t, err)
		seedDurableMigrationJob(t, kubeClient, "active", job)
	}
	assert.True(t, apierrors.IsTooManyRequests(admission.check(ctx, kubeClient, "active")))
	handler := newMigrationTestHandler(kubeClient)
	_, err = handler.createDurableMigrationJob(ctx, migration.NewMigrator(kubeClient, nil), "active", operatorMigrationBulkRequest{AllEligible: true})
	require.True(t, apierrors.IsTooManyRequests(err), "%v", err)
	// A replacement backend still sees the active limit without the old rate limiter.
	var replacement migrationAdmission
	releaseReplacement, err := replacement.acquire(ctx)
	require.NoError(t, err)
	defer releaseReplacement()
	assert.True(t, apierrors.IsTooManyRequests(replacement.check(ctx, kubeClient, "active")))
	for i := 0; i < maxActiveMigrationJobsPerOwner; i++ {
		job, err := newMigrationJobStore().create("finished", operatorMigrationBulkRequest{})
		require.NoError(t, err)
		now := time.Now()
		job.FinishedAt = &now
		seedDurableMigrationJob(t, kubeClient, "finished", job)
	}
	require.NoError(t, admission.check(ctx, kubeClient, "finished"))
}

// TestMigrationAdmissionWaitHonorsCancellation prevents blocked admission from retaining cancelled requests.
func TestMigrationAdmissionWaitHonorsCancellation(t *testing.T) {
	var admission migrationAdmission
	release, err := admission.acquire(context.Background())
	require.NoError(t, err)
	defer release()
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	_, err = admission.acquire(ctx)
	assert.ErrorIs(t, err, context.Canceled)
}

// TestMigrationDiscoveryCapacity rotates queued work so a full worker limit cannot starve later jobs.
func TestMigrationDiscoveryCapacity(t *testing.T) {
	base := newMigrationTestClient(t)
	for i := 0; i < maxConcurrentMigrationJobs+3; i++ {
		job, err := newMigrationJobStore().create("alice", operatorMigrationBulkRequest{})
		require.NoError(t, err)
		seedDurableMigrationJob(t, base, "alice", job)
	}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	started := make(chan string, maxConcurrentMigrationJobs)
	release := make(chan struct{})
	var once sync.Once
	defer once.Do(func() { close(release) })
	blocked := interceptor.NewClient(base.(client.WithWatch), interceptor.Funcs{Get: func(ctx context.Context, c client.WithWatch, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
		if _, lease := object.(*coordinationv1.Lease); !lease {
			return c.Get(ctx, key, object, options...)
		}
		started <- key.Namespace
		select {
		case <-release:
		case <-ctx.Done():
		}
		return errors.New("stop this discovery attempt")
	}})
	coordinator := &migrationCoordinator{client: blocked, identity: "backend", ctx: ctx, active: make(map[string]bool)}
	coordinator.discover()
	initial := make(map[string]bool)
	for i := 0; i < maxConcurrentMigrationJobs; i++ {
		select {
		case id := <-started:
			initial[id] = true
		case <-time.After(time.Second):
			t.Fatal("workers did not start")
		}
	}
	coordinator.mu.Lock()
	assert.Len(t, coordinator.active, maxConcurrentMigrationJobs)
	coordinator.mu.Unlock()
	once.Do(func() { close(release) })
	require.Eventually(t, func() bool { coordinator.mu.Lock(); defer coordinator.mu.Unlock(); return len(coordinator.active) == 0 }, time.Second, time.Millisecond)
	coordinator.discover()
	newWork := false
	for i := 0; i < maxConcurrentMigrationJobs; i++ {
		select {
		case id := <-started:
			newWork = newWork || !initial[id]
		case <-time.After(time.Second):
			t.Fatal("queued work was not scheduled")
		}
	}
	assert.True(t, newWork)
	require.Eventually(t, func() bool { coordinator.mu.Lock(); defer coordinator.mu.Unlock(); return len(coordinator.active) == 0 }, time.Second, time.Millisecond)
}

// TestMigrationAdmissionGlobalBurst prevents changing owners from bypassing this backend's submission budget.
func TestMigrationAdmissionGlobalBurst(t *testing.T) {
	ctx := context.Background()
	var admission migrationAdmission
	release, err := admission.acquire(ctx)
	require.NoError(t, err)
	defer release()
	kubeClient := newMigrationTestClient(t)
	for i := 0; i < 10; i++ {
		require.NoError(t, admission.check(ctx, kubeClient, strconv.Itoa(i)))
	}
	assert.True(t, apierrors.IsTooManyRequests(admission.check(ctx, kubeClient, "another-owner")))
}
