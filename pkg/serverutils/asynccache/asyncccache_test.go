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

	c, err := NewAsyncCache(context.Background(), 2*time.Second, cacheTime)
	require.NoError(t, err)

	initializationRetryInterval = 5 * time.Millisecond
	initializationTimeout = 10 * time.Millisecond
	// test that initialization was successful
	item := c.GetItem()
	if item.t.IsZero() {
		t.Error("expected non-zero time")
	}

	time.Sleep(1 * time.Second)
	if item.isContextCancelled() {
		t.Error("expected usable context")
	}

	timedCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	c.Run(timedCtx)

	// wait.UntilWithContext fires runCache immediately, so wait briefly
	// for the first refresh to complete before capturing the baseline.
	time.Sleep(100 * time.Millisecond)
	item = c.GetItem()

	// within the 2s refresh interval the pointer should stay the same
	time.Sleep(500 * time.Millisecond)
	require.Equal(t, item, c.GetItem(), "item should not change within refresh interval")

	// after the refresh interval the item should be replaced
	time.Sleep(2 * time.Second)
	require.NotEqual(t, item, c.GetItem(), "item should change after refresh interval")
	cancel()

	// test that the cache returns error properly
	errorCaching := func(ctx context.Context) (bool, error) {
		return false, fmt.Errorf("test error")
	}

	_, err = NewAsyncCache(context.Background(), 2*time.Second, errorCaching)
	require.Error(t, err)
}
