package olm

import (
	"net/http"
	"time"
)

// catalogService orchestrates the fetching, caching, and polling of catalog data.
type CatalogService struct {
	poller  *catalogPoller
	fetcher *catalogFetcher
	cache   *catalogCache
}

// NewCatalogService creates a new catalog service.
func NewCatalogService(client *http.Client, pollInterval time.Duration) *catalogService {
	cache := &catalogCache{
		catalogItems: make(map[string][]CatalogItem),
	}
	fetcher := &catalogFetcher{client: client}
	poller := &catalogPoller{
		fetcher: fetcher,
		cache:   cache,
		ticker:  time.NewTicker(pollInterval),
		done:    make(chan bool),
	}
	return &CatalogService{
		poller:  poller,
		fetcher: fetcher,
		cache:   cache,
	}
}

// Start begins the polling process.
func (s *CatalogService) Start() {
	s.poller.Start()
}

// Stop halts the polling process.
func (s *CatalogService) Stop() {
	s.poller.Stop()
}

// GetCatalogItems returns the cached catalog items.
func (s *CatalogService) GetCatalogItems(r *http.Request) ([]CatalogItem, time.Time, bool) {
	return s.cache.GetCatalogItems(r)
}
