package asynccache

import (
	"context"
	"fmt"
	"sync"
	"time"

	"k8s.io/apimachinery/pkg/util/wait"
	"k8s.io/klog"
)

var ( // make these variable so that we can change them in unit tests
	initializationRetryInterval = 5 * time.Second
	initializationTimeout       = 5 * time.Minute
)

type cachingFuncType[T any] func(ctx context.Context) (T, error)

type AsyncCache[T any] struct {
	reloadPeriod time.Duration

	itemRWLock  sync.RWMutex
	cachedItem  T
	cachingFunc cachingFuncType[T]
}

func NewAsyncCache[T any](ctx context.Context, reloadPeriod time.Duration, cachingFunc cachingFuncType[T]) (*AsyncCache[T], error) {
	c := &AsyncCache[T]{
		reloadPeriod: reloadPeriod,
		itemRWLock:   sync.RWMutex{},
		cachingFunc:  cachingFunc,
	}

	err := wait.PollUntilContextTimeout(
		ctx,
		initializationRetryInterval,
		initializationTimeout,
		true,
		func(pollingCtx context.Context) (bool, error) {
			itemChan := make(chan *T, 1)
			errChan := make(chan error, 1)

			go func() {
				item, err := cachingFunc(ctx)
				if err != nil {
					errChan <- err
					return
				}
				itemChan <- &item

			}()

			select {
			case <-pollingCtx.Done(): // either a global context cancel or polling timeout
				return false, nil // leave the error reporting to the polling mechanism
			case item := <-itemChan:
				c.cachedItem = *item
				return true, nil
			case err := <-errChan:
				klog.V(4).Infof("failed to setup an async cache (retrying in %v) - caching func returned error: %v", initializationRetryInterval, err)
				return false, nil
			}
		},
	)

	if err != nil {
		return nil, fmt.Errorf("failed to setup an async cache - caching func returned error: %w", err)
	}
	return c, nil
}

func (c *AsyncCache[T]) runCache(ctx context.Context) {
	item, err := c.cachingFunc(ctx)
	if err != nil {
		klog.Errorf("failed a caching attempt: %v", err)
		return
	}

	c.itemRWLock.Lock()
	defer c.itemRWLock.Unlock()
	c.cachedItem = item
}

func (c *AsyncCache[T]) GetItem() T {
	c.itemRWLock.RLock()
	defer c.itemRWLock.RUnlock()
	return c.cachedItem
}

func (c *AsyncCache[T]) Run(ctx context.Context) {
	go wait.UntilWithContext(ctx, c.runCache, c.reloadPeriod)
}
