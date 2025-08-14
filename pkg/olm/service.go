package olm

import (
	"net/http"
	"time"

	"github.com/openshift/console/pkg/proxy"
)

// catalogService orchestrates the fetching, caching, and polling of catalog data.
type CatalogService struct {
	fetcher *catalogFetcher
	cache   *catalogCache
}

// NewCatalogService creates a new catalog service.
func NewCatalogService(client *http.Client, catalogdProxyConfig *proxy.Config, pollInterval time.Duration) *CatalogService {
	cache := &catalogCache{
		catalogItems: make(map[string][]CatalogItem),
	}

	if catalogdProxyConfig == nil {

	}
	fetcher := &catalogFetcher{
		client:      client,
		proxyConfig: catalogdProxyConfig,
	}
	return &CatalogService{
		fetcher: fetcher,
		cache:   cache,
	}
}

// GetCatalogItems returns the cached catalog items.
func (s *CatalogService) GetCatalogItems(r *http.Request) ([]CatalogItem, time.Time, bool) {
	return s.cache.GetCatalogItems(r)
}

func (s *CatalogService) AddCatalogItemsFromClusterCatalogToCache(catalogName, baseURL string) error {
	catalogItems, err := s.fetcher.FetchAndTransformCatalog(catalogName, baseURL)
	if err != nil {
		return err
	}
	s.cache.UpdateCatalog(catalogName, catalogItems)
	return nil
}

func (s *CatalogService) RemoveCatalogItemsFromClusterCatalogFromCache(catalogName string) error {
	s.cache.UpdateCatalog(catalogName, nil)
	return nil
}
