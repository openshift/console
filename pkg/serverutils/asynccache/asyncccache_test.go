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

	timedCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	c.Run(timedCtx)

	// test the values get properly changed
	var matches int
	var changed bool
	for i := 0; i < 3; i++ {
		newItem := c.GetItem()
		if newItem == item {
			matches++
		} else {
			changed = true
		}

		time.Sleep(1 * time.Second)
	}

	require.Greater(t, matches, 0)
	require.True(t, changed)
	cancel()

	// test that the cache returns error properly
	errorCaching := func(ctx context.Context) (bool, error) {
		return false, fmt.Errorf("test error")
	}

	_, err = NewAsyncCache(context.Background(), 2*time.Second, errorCaching)
	require.Error(t, err)
}
