package asynccache

import (
	"context"
	"fmt"
	"sync"
	"time"

	"k8s.io/apimachinery/pkg/util/wait"
	"k8s.io/klog"
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

	item, err := cachingFunc(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to setup an async cache - caching func returned error: %w", err)
	}

	c.cachedItem = item

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
