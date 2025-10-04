package olm

import (
	"net/http"
	"time"

	"github.com/openshift/console/pkg/proxy"
	"github.com/patrickmn/go-cache"
	"k8s.io/klog"
)

// catalogService orchestrates the fetching, caching, and polling of catalog data.
type CatalogService struct {
	lastModified time.Time
	cache        *cache.Cache
	client       CatalogdClientInterface
	catalogs     map[string]string
}

func NewCatalogService(serviceClient *http.Client, proxyConfig *proxy.Config, cache *cache.Cache) *CatalogService {
	return &CatalogService{
		cache:    cache,
		client:   NewCatalogdClient(serviceClient, proxyConfig),
		catalogs: make(map[string]string),
	}
}

// Start begins the polling process.
func (s *CatalogService) UpdateCatalog(catalog string, baseURL string) error {
	packages, bundles, err := s.client.Fetch(catalog, baseURL, &s.lastModified)

	// error
	if err != nil {
		return err
	}

	// not modified
	if packages == nil && bundles == nil {
		return nil
	}

	// update cache
	catalogData := CreateConsoleCatalog(catalog, packages, bundles)
	s.cache.Set(catalog, catalogData, cache.NoExpiration)
	s.lastModified = time.Now()
	s.catalogs[catalog] = baseURL
	return nil
}

func (s *CatalogService) RemoveCatalog(catalogName string) error {
	s.cache.Set(catalogName, nil, cache.NoExpiration)
	s.lastModified = time.Now()
	return nil
}

// GetCatalogItems returns the cached catalog items.
func (s *CatalogService) GetCatalogItems(r *http.Request) ([]ConsoleCatalogItem, time.Time, bool) {
	// Check If-Modified-Since header
	if ifModifiedSince := r.Header.Get("If-Modified-Since"); ifModifiedSince != "" {
		if parsedTime, err := time.Parse(http.TimeFormat, ifModifiedSince); err == nil {
			if !s.lastModified.After(parsedTime) {
				// Cache hasn't been modified since the request, return 304 Not Modified
				return nil, s.lastModified, true
			}
		}
	}

	catlogItems := []ConsoleCatalogItem{}
	for catalog := range s.catalogs {
		items, ok := s.cache.Get(catalog)
		if !ok {
			klog.Errorf("Failed to get catalog %s from cache", catalog)
			continue
		}
		catlogItems = append(catlogItems, items.([]ConsoleCatalogItem)...)
	}
	return catlogItems, s.lastModified, false
}
