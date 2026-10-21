package asynccache

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

type testItem struct {
	ctx context.Context
	t   time.Time
}

func (i *testItem) isContextCancelled() bool {
	select {
	case <-i.ctx.Done():
		return true
	default:
		return false
	}
}

func TestAsyncCache(t *testing.T) {
	// Override initialization settings before any NewAsyncCache call
	// so they take effect for the error case test.
	origRetryInterval := initializationRetryInterval
	origTimeout := initializationTimeout
	initializationRetryInterval = 5 * time.Millisecond
	initializationTimeout = 10 * time.Millisecond
	t.Cleanup(func() {
		initializationRetryInterval = origRetryInterval
		initializationTimeout = origTimeout
	})

	cacheTime := func(ctx context.Context) (*testItem, error) {
		return &testItem{ctx: ctx, t: time.Now()}, nil
	}

	c, err := NewAsyncCache(context.Background(), 2*time.Second, cacheTime)
	require.NoError(t, err)

	// test that initialization was successful
	item := c.GetItem()
	require.False(t, item.t.IsZero(), "expected non-zero time")
	require.False(t, item.isContextCancelled(), "expected usable context")

	timedCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	c.Run(timedCtx)

	// wait.UntilWithContext fires runCache immediately; wait for the
	// first refresh before capturing the baseline.
	require.Eventually(t, func() bool {
		return c.GetItem() != item
	}, 5*time.Second, 10*time.Millisecond, "expected item to be refreshed after Run()")

	// Re-grab the reference after the immediate reload
	item = c.GetItem()

	// Within the 2s refresh interval the cached item should stay the same
	time.Sleep(500 * time.Millisecond)
	require.Equal(t, item, c.GetItem(), "item should not change within refresh interval")

	// After the refresh interval the item should be replaced
	require.Eventually(t, func() bool {
		return c.GetItem() != item
	}, 5*time.Second, 100*time.Millisecond, "item should change after refresh interval")

	cancel()

	// test that the cache returns error properly
	errorCaching := func(ctx context.Context) (bool, error) {
		return false, fmt.Errorf("test error")
	}

	_, err = NewAsyncCache(context.Background(), 2*time.Second, errorCaching)
	require.Error(t, err)
}
