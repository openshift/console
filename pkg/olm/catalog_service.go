package olm

import (
	"fmt"
	"net/http"
	"time"

	utilerrors "k8s.io/apimachinery/pkg/util/errors"

	"github.com/openshift/console/pkg/proxy"
	"github.com/patrickmn/go-cache"
)

// catalogService orchestrates the fetching, caching, and polling of catalog data.
type CatalogService struct {
	cache    *cache.Cache
	catalogs map[string]string
	client   CatalogdClientInterface

	LastModified time.Time
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
	packages, bundles, err := s.client.Fetch(catalog, baseURL, &s.LastModified)

	// error
	if err != nil {
		return err
	}

	// not modified
	if packages == nil && bundles == nil {
		return nil
	}

	// update cache
	catlaogItems := CreateConsoleCatalog(catalog, packages, bundles)
	s.cache.Set(catalog, catlaogItems, cache.NoExpiration)
	s.LastModified = time.Now()
	s.catalogs[catalog] = baseURL
	return nil
}

func (s *CatalogService) RemoveCatalog(catalogName string) {
	s.cache.Delete(catalogName)
	delete(s.catalogs, catalogName)
	s.LastModified = time.Now()
}

// GetCatalogItems returns the cached catalog items.
func (s *CatalogService) GetCatalogItems(r *http.Request) (items []ConsoleCatalogItem, err error) {
	allItems := []ConsoleCatalogItem{}
	errs := []error{}
	for catalog := range s.catalogs {
		cacheContent, ok := s.cache.Get(catalog)
		if !ok {
			errs = append(errs, fmt.Errorf("cache miss for catalog %s", catalog))
			continue
		}

		catalogItems, ok := cacheContent.([]ConsoleCatalogItem)
		if !ok {
			errs = append(errs, fmt.Errorf("malformed cache content for catalog %s", catalog))
			continue
		}

		allItems = append(allItems, catalogItems...)
	}

	return allItems, utilerrors.NewAggregate(errs)
}
