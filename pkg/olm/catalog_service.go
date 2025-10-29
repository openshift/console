package olm

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"golang.org/x/mod/semver"
	utilerrors "k8s.io/apimachinery/pkg/util/errors"
	klog "k8s.io/klog/v2"

	"github.com/openshift/console/pkg/proxy"
	"github.com/operator-framework/operator-registry/alpha/declcfg"
	"github.com/operator-framework/operator-registry/alpha/property"
	"github.com/patrickmn/go-cache"
)

const (
	cacheExpiration = 24 * time.Hour
	keyPrefix       = "olm:catalog:"
)

type CatalogServiceInterface interface {
	UpdateCatalog(catalogName string, baseURL string) error
	RemoveCatalog(catalogName string)
	GetCatalogItems() ([]ConsoleCatalogItem, error)
}

// catalogService orchestrates the fetching, caching, and polling of catalog data.
type CatalogService struct {
	cache  *cache.Cache        // thread-safe
	index  map[string]struct{} // catalog name -> struct{}{}
	client CatalogdClientInterface

	LastModified string
}

func getCatlogLastModifiedKey(catalog string) string {
	return keyPrefix + catalog + ":last-modified"
}

func getCatalogItemsKey(catalog string) string {
	return keyPrefix + catalog + ":items"
}

func getCatalogBaseURLKey(catalog string) string {
	return keyPrefix + catalog + ":baseURL"
}

func NewCatalogService(serviceClient *http.Client, proxyConfig *proxy.Config, cache *cache.Cache) *CatalogService {
	c := &CatalogService{
		cache:  cache,
		index:  make(map[string]struct{}),
		client: NewCatalogdClient(serviceClient, proxyConfig),
	}
	return c
}

func (s *CatalogService) GetMetas(catalog string, r *http.Request) (*http.Response, error) {
	var baseURL string
	baseURLKey := getCatalogBaseURLKey(catalog)
	if cachedBaseURL, ok := s.cache.Get(baseURLKey); ok {
		if baseURL, ok = cachedBaseURL.(string); !ok {
			return nil, fmt.Errorf("cached base URL for catalog %s is not a string", catalog)
		}
	}
	return s.client.FetchMetas(catalog, baseURL, r)
}

// Start begins the polling process.
func (s *CatalogService) UpdateCatalog(catalog string, baseURL string) error {
	itemsKey := getCatalogItemsKey(catalog)
	lastModifiedKey := getCatlogLastModifiedKey(catalog)
	baseURLKey := getCatalogBaseURLKey(catalog)
	now := time.Now().UTC().Format(http.TimeFormat)

	// only send last modified time if the catalog is already in the cache
	ifModifiedSince := ""
	if catalogLastMod, exists := s.cache.Get(lastModifiedKey); exists {
		ifModifiedSince = catalogLastMod.(string)
	}

	klog.V(4).Infof("updating catalog %s", catalog)
	resp, err := s.client.FetchAll(catalog, baseURL, ifModifiedSince, cacheExpiration)

	if err != nil {
		s.RemoveCatalog(catalog)
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		s.RemoveCatalog(catalog)
		return nil
	}

	if resp.StatusCode == http.StatusNotModified {
		return nil
	}

	if resp.StatusCode != http.StatusOK {

		return fmt.Errorf("catalogd request failed with status: %d, %v", resp.StatusCode, resp.Status)
	}

	// update this catalog's last modified time from upstream
	lastModified := resp.Header.Get("Last-Modified")
	if lastModified != "" {
		s.cache.Set(lastModifiedKey, lastModified, cache.NoExpiration)
	}

	packages, bundles, err := s.processCatalog(resp)
	if err != nil {
		klog.V(4).Infof("error processing catalog %s: %v", catalog, err)
		defer s.RemoveCatalog(catalog)
		return err
	}

	// update cache
	klog.V(4).Infof("fetched %d packages and %d bundles from catalog %s", len(packages), len(bundles), catalog)
	catalogItems := CreateConsoleCatalog(catalog, packages, bundles)
	klog.V(4).Infof("created %d console catalog items for catalog %s", len(catalogItems), catalog)
	s.cache.Set(itemsKey, catalogItems, cacheExpiration)
	s.cache.Set(baseURLKey, baseURL, cache.NoExpiration)
	s.index[catalog] = struct{}{}
	s.LastModified = now
	return nil
}

func (s *CatalogService) RemoveCatalog(catalogName string) {
	itemsKey := getCatalogItemsKey(catalogName)
	lastModifiedKey := getCatlogLastModifiedKey(catalogName)
	baseURLKey := getCatalogBaseURLKey(catalogName)
	s.cache.Delete(itemsKey)
	s.cache.Delete(lastModifiedKey)
	s.cache.Delete(baseURLKey)
	delete(s.index, catalogName)
	s.LastModified = time.Now().UTC().Format(http.TimeFormat)
}

// GetCatalogItems returns the cached catalog items.
func (s *CatalogService) GetCatalogItems() (items []ConsoleCatalogItem, err error) {
	allItems := []ConsoleCatalogItem{}
	errs := []error{}
	for catalog := range s.index {
		itemsKey := getCatalogItemsKey(catalog)
		klog.V(4).Infof("getting catalog items for catalog %s", catalog)
		cacheContent, ok := s.cache.Get(itemsKey)
		if !ok {
			errs = append(errs, fmt.Errorf("cache miss, index out of sync for catalog %s", catalog))
			s.RemoveCatalog(catalog)
			continue
		}

		catalogItems, ok := cacheContent.([]ConsoleCatalogItem)
		if !ok {
			errs = append(errs, fmt.Errorf("malformed cache content for catalog %s", catalog))
			s.RemoveCatalog(catalog)
			continue
		}

		klog.V(4).Infof("appending %d catalog items from catalog %s", len(catalogItems), catalog)
		allItems = append(allItems, catalogItems...)
	}

	err = utilerrors.NewAggregate(errs)
	if err != nil {
		klog.V(4).Infof("error(s) encountered while getting catalog items: %v.", err)
		return nil, err
	}

	klog.V(4).Infof("Returning %d catalog items", len(allItems))
	return allItems, nil
}

func (s *CatalogService) processCatalog(resp *http.Response) ([]*declcfg.Package, []*declcfg.Bundle, error) {
	packages := []*declcfg.Package{}
	latestBundles := make(map[string]*declcfg.Bundle)
	if err := declcfg.WalkMetasReader(resp.Body, func(meta *declcfg.Meta, err error) error {
		if err != nil {
			klog.V(4).Infof("error parsing catalog contents: %v", err)
			return err
		}

		switch meta.Schema {
		case declcfg.SchemaPackage:
			pkg, err := s.processPackage(meta.Blob)
			if err != nil {
				klog.V(4).Infof("failed to process package: %v", err)
				return err
			}
			packages = append(packages, pkg)

		case declcfg.SchemaBundle:
			bundle, err := s.processBundle(meta.Blob)
			if err != nil {
				klog.V(4).Infof("failed to process bundle: %v", err)
			}

			bundleHasMetadata := false
			for _, p := range bundle.Properties {
				if p.Type == property.TypeCSVMetadata {
					bundleHasMetadata = true
					break
				}
			}

			// Only process bundles with metadata.
			if bundleHasMetadata {
				if existingBundle, ok := latestBundles[bundle.Package]; ok {
					existingVersion, err := getBundleVersion(existingBundle)
					if err != nil {
						klog.V(4).Infof("failed to get existing bundle version: %v", err)
						break
					}

					newVersion, err := getBundleVersion(bundle)
					if err != nil {
						klog.V(4).Infof("failed to get new bundle version: %v", err)
						break
					}

					if semver.Compare(newVersion, existingVersion) > 0 {
						latestBundles[bundle.Package] = bundle
					}
				} else {
					latestBundles[bundle.Package] = bundle
				}
			}
		}
		return nil
	}); err != nil {
		klog.V(4).Infof("error walking catalog contents: %v", err)
		return nil, nil, err
	}

	bundles := []*declcfg.Bundle{}
	for _, bundle := range latestBundles {
		bundles = append(bundles, bundle)
	}

	return packages, bundles, nil
}

func (s *CatalogService) processPackage(raw json.RawMessage) (*declcfg.Package, error) {
	var pkg declcfg.Package
	if err := json.Unmarshal(raw, &pkg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal package object: %w", err)
	}
	return &pkg, nil
}

func (s *CatalogService) processBundle(raw json.RawMessage) (*declcfg.Bundle, error) {
	var bundle declcfg.Bundle
	if err := json.Unmarshal(raw, &bundle); err != nil {
		return nil, fmt.Errorf("failed to unmarshal bundle object: %w", err)
	}
	return &bundle, nil
}
