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

type CatalogServiceInterface interface {
	UpdateCatalog(catalogName string, baseURL string) error
	RemoveCatalog(catalogName string)
	GetCatalogItems(retryCount int) ([]ConsoleCatalogItem, error)
}

// catalogService orchestrates the fetching, caching, and polling of catalog data.
type CatalogService struct {
	cache  *cache.Cache
	index  map[string]string
	client CatalogdClientInterface
	mu     sync.RWMutex

	CatalogsLastModified time.Time
	CacheLastModified    time.Time
}

const keyPrefix = "olm:catalog-items:"

func getKey(catalog string) string {
	return keyPrefix + catalog
}

func NewCatalogService(serviceClient *http.Client, proxyConfig *proxy.Config, cache *cache.Cache) *CatalogService {
	c := &CatalogService{
		cache:  cache,
		client: NewCatalogdClient(serviceClient, proxyConfig),
		index:  make(map[string]string),
	}

	c.cache.OnEvicted(func(key string, value interface{}) {
		delete(c.index, key)
	})
	return c
}

// Start begins the polling process.
func (s *CatalogService) UpdateCatalog(catalog string, baseURL string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	key := getKey(catalog)
	_, ok := s.cache.Get(key)
	lastModified := &s.CatalogsLastModified

	// don't send last modified time if the catalog doesn't exist in the cache yet
	if !ok {
		lastModified = nil
	}

	klog.V(4).Infof("Updating catalog %s", catalog)
	packages, bundles, lastModifiedTime, err := s.client.Fetch(catalog, baseURL, lastModified)

	if lastModifiedTime != nil && lastModifiedTime.After(s.CatalogsLastModified) {
		// update last modified time if it's newer than the current last modified time
		s.CatalogsLastModified = *lastModifiedTime
	}

	// error
	if err != nil {
		klog.Warningf("Error fetching catalog %s: %v", catalog, err)
		s.RemoveCatalog(catalog)
		return err
	}

	// not modified
	if packages == nil && bundles == nil {
		klog.V(4).Infof("Catalog %s not modified", catalog)
		return nil
	}

	// update cache
	klog.V(4).Infof("Fetched %d packages and %d bundles from catalog %s", len(packages), len(bundles), catalog)
	catlaogItems := CreateConsoleCatalog(catalog, packages, bundles)
	klog.V(4).Infof("Created %d console catalog items for catalog %s", len(catlaogItems), catalog)
	s.cache.Set(key, catlaogItems, cache.NoExpiration)
	s.CacheLastModified = time.Now()
	s.index[key] = baseURL
	return nil
}

func (s *CatalogService) RemoveCatalog(catalogName string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	key := getKey(catalogName)
	s.cache.Delete(key)
	delete(s.index, key)
	s.CacheLastModified = time.Now()
}

// GetCatalogItems returns the cached catalog items.
func (s *CatalogService) GetCatalogItems(retryCount int) (items []ConsoleCatalogItem, err error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	allItems := []ConsoleCatalogItem{}
	errs := []error{}
	for key := range s.index {
		catalogName := strings.TrimPrefix(key, keyPrefix)
		klog.V(4).Infof("Getting catalog items for catalog %s", catalogName)
		cacheContent, ok := s.cache.Get(key)
		if !ok {
			klog.V(4).Infof("Cache miss, attempting to update catalog %s", catalogName)
			err = s.UpdateCatalog(catalogName, s.index[key])
			if err != nil {
				errs = append(errs, err)
				s.RemoveCatalog(strings.TrimPrefix(key, keyPrefix))
				continue
			}
		}

		catalogItems, ok := cacheContent.([]ConsoleCatalogItem)
		if !ok {
			errs = append(errs, fmt.Errorf("malformed cache content for catalog %s", key))
			s.RemoveCatalog(strings.TrimPrefix(key, keyPrefix))
			s.UpdateCatalog(catalogName, s.index[key])
			continue
		}

		klog.V(4).Infof("Appending %d catalog items from catalog %s", len(catalogItems), catalogName)
		allItems = append(allItems, catalogItems...)
	}

	err = utilerrors.NewAggregate(errs)
	if err != nil {
		if retryCount > 3 {
			return nil, err
		}
		klog.Warningf("Error(s) encountered while getting catalog items: %v. Retrying...", err)
		return s.GetCatalogItems(retryCount + 1)
	}

	klog.V(4).Infof("Returning %d catalog items", len(allItems))
	return allItems, nil
}
