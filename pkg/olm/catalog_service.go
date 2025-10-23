package olm

import (
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	utilerrors "k8s.io/apimachinery/pkg/util/errors"
	klog "k8s.io/klog/v2"

	"github.com/openshift/console/pkg/proxy"
	"github.com/patrickmn/go-cache"
)

const (
	cacheExpiration = 24 * time.Hour
	keyPrefix       = "olm:catalog-items:"
)

type CatalogServiceInterface interface {
	UpdateCatalog(catalogName string, baseURL string) error
	RemoveCatalog(catalogName string)
	GetCatalogItems() ([]ConsoleCatalogItem, error)
}

// catalogService orchestrates the fetching, caching, and polling of catalog data.
type CatalogService struct {
	cache  *cache.Cache
	index  map[string]string
	client CatalogdClientInterface
	mu     sync.RWMutex

	// Per-catalog last modified times from upstream catalogd
	catalogLastModified map[string]time.Time
	// When our cache was last modified (for downstream clients)
	LastModified string
}

func getKey(catalog string) string {
	return keyPrefix + catalog
}

func NewCatalogService(serviceClient *http.Client, proxyConfig *proxy.Config, cache *cache.Cache) *CatalogService {
	c := &CatalogService{
		cache:               cache,
		client:              NewCatalogdClient(serviceClient, proxyConfig),
		index:               make(map[string]string),
		catalogLastModified: make(map[string]time.Time),
	}

	c.cache.OnEvicted(func(key string, value interface{}) {
		delete(c.index, key)
		delete(c.catalogLastModified, key)
	})
	return c
}

// Start begins the polling process.
func (s *CatalogService) UpdateCatalog(catalog string, baseURL string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	var ifModifiedSince *time.Time
	key := getKey(catalog)

	// only send last modified time if the catalog is already in the cache
	if catalogLastMod, exists := s.catalogLastModified[key]; exists {
		ifModifiedSince = &catalogLastMod
	}

	klog.V(4).Infof("updating catalog %s", catalog)
	packages, bundles, lastModified, err := s.client.Fetch(catalog, baseURL, ifModifiedSince)

	// handle errors
	if err != nil {
		klog.V(4).Infof("error fetching catalog %s: %v", catalog, err)
		delete(s.catalogLastModified, catalog)
		delete(s.index, getKey(catalog))
		s.cache.Delete(getKey(catalog))
		if err.Error() == "not found" {
			return nil
		}
		return err
	}

	// not modified
	if packages == nil && bundles == nil {
		klog.V(4).Infof("catalog %s not modified", catalog)
		return nil
	}

	// update this catalog's last modified time from upstream
	if lastModified != nil {
		s.catalogLastModified[key] = *lastModified
	}

	// update cache
	klog.V(4).Infof("fetched %d packages and %d bundles from catalog %s", len(packages), len(bundles), catalog)
	catalogItems := CreateConsoleCatalog(catalog, packages, bundles)
	klog.V(4).Infof("created %d console catalog items for catalog %s", len(catalogItems), catalog)
	s.cache.Set(key, catalogItems, cacheExpiration)
	s.LastModified = time.Now().UTC().Format(http.TimeFormat)
	s.index[key] = baseURL
	return nil
}

func (s *CatalogService) RemoveCatalog(catalogName string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	key := getKey(catalogName)
	s.cache.Delete(key)
	delete(s.index, key)
	delete(s.catalogLastModified, catalogName)
	s.LastModified = time.Now().UTC().Format(http.TimeFormat)
}

// GetCatalogItems returns the cached catalog items.
func (s *CatalogService) GetCatalogItems() (items []ConsoleCatalogItem, err error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	allItems := []ConsoleCatalogItem{}
	errs := []error{}
	for key := range s.index {
		catalogName := strings.TrimPrefix(key, keyPrefix)
		klog.V(4).Infof("getting catalog items for catalog %s", catalogName)
		cacheContent, ok := s.cache.Get(key)
		if !ok {
			errs = append(errs, fmt.Errorf("cache miss, index out of sync for catalog %s", catalogName))
			delete(s.index, key)
			delete(s.catalogLastModified, catalogName)
			s.LastModified = time.Now().UTC().Format(http.TimeFormat)
			continue
		}

		catalogItems, ok := cacheContent.([]ConsoleCatalogItem)
		if !ok {
			errs = append(errs, fmt.Errorf("malformed cache content for catalog %s", catalogName))
			delete(s.index, key)
			delete(s.catalogLastModified, catalogName)
			s.cache.Delete(key)
			s.LastModified = time.Now().UTC().Format(http.TimeFormat)
			continue
		}

		klog.V(4).Infof("appending %d catalog items from catalog %s", len(catalogItems), catalogName)
		allItems = append(allItems, catalogItems...)
	}

	err = utilerrors.NewAggregate(errs)
	if err != nil {
		klog.V(4).Infof("error(s) encountered while getting catalog items: %v. Retrying...", err)
		return nil, err
	}

	klog.V(4).Infof("Returning %d catalog items", len(allItems))
	return allItems, nil
}
