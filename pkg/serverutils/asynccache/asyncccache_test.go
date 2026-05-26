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
	cacheTime := func(ctx context.Context) (*testItem, error) {
		return &testItem{ctx: ctx, t: time.Now()}, nil
	}

	initializationRetryInterval = 5 * time.Millisecond
	initializationTimeout = 10 * time.Millisecond

	c, err := NewAsyncCache(context.Background(), 2*time.Second, cacheTime)
	require.NoError(t, err)

	item := c.GetItem()
	require.False(t, item.t.IsZero(), "expected non-zero time")

	time.Sleep(1 * time.Second)
	require.False(t, item.isContextCancelled(), "expected usable context")

	timedCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	c.Run(timedCtx)

	// wait.UntilWithContext fires runCache immediately — let it settle
	time.Sleep(100 * time.Millisecond)
	item = c.GetItem()

	// Cache should return the same item between reloads
	require.Equal(t, item, c.GetItem(), "expected same item before next reload")

	// Cache should eventually return a different item after a reload cycle
	require.Eventually(t, func() bool {
		return c.GetItem() != item
	}, 5*time.Second, 200*time.Millisecond, "expected cache to refresh")

	cancel()

	// Initialization returns error when caching func fails
	errorCaching := func(ctx context.Context) (bool, error) {
		return false, fmt.Errorf("test error")
	}
	_, err = NewAsyncCache(context.Background(), 2*time.Second, errorCaching)
	require.Error(t, err)
}
