package server

import (
	"sync"
)

// Store is an in-memory store for named clusters.
type Store interface {
	AddCluster(name string, cluster Cluster)
	GetCluster(name string) (Cluster, bool)
}

// store is a synchronized implementation of Store.
type store struct {
	mu       *sync.RWMutex
	clusters map[string]Cluster
}

// NewStore returns a new Store.
func NewStore() Store {
	return &store{
		mu:       &sync.RWMutex{},
		clusters: make(map[string]Cluster, 0),
	}
}

// AddCluster stores the given named cluster.
func (s *store) AddCluster(name string, cluster Cluster) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.clusters[name] = cluster
}

// GetCluster returns the cluster with the given name.
func (s *store) GetCluster(name string) (Cluster, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	cluster, ok := s.clusters[name]
	return cluster, ok
}
