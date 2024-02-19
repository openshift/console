package auth

import (
	"context"
	"fmt"
	"sync"
	"time"

	"k8s.io/apimachinery/pkg/util/wait"
	"k8s.io/klog"
)

const (
	initializationRetryDelay = 30 * time.Second
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

	var err error
	ctx, cancel := context.WithTimeout(ctx, 5*time.Minute)
	wait.UntilWithContext(ctx, func(ctx context.Context) {
		item, err := cachingFunc(ctx)
		if err != nil {
			klog.V(4).Infof("failed to setup an async cache - retrying in %s", initializationRetryDelay)
			return
		}
		c.cachedItem = item
		cancel()
	}, initializationRetryDelay)

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
