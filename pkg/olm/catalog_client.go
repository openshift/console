package olm

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/openshift/console/pkg/proxy"
	"github.com/operator-framework/operator-registry/alpha/declcfg"
	"github.com/operator-framework/operator-registry/alpha/property"
	"golang.org/x/mod/semver"
	"k8s.io/klog/v2"
)

type CatalogdClientInterface interface {
	Fetch(catalog, baseUrl string, ifNotModifiedSince *time.Time) ([]*declcfg.Package, []*declcfg.Bundle, error)
}

// CatalogFetcher is responsible for fetching catalog data.
type CatalogdClient struct {
	httpClient  *http.Client
	proxyConfig *proxy.Config
}

func NewCatalogdClient(httpClient *http.Client, proxyConfig *proxy.Config) *CatalogdClient {
	return &CatalogdClient{
		httpClient:  httpClient,
		proxyConfig: proxyConfig,
	}
}

// Fetch fetches fbc from the catalogd server and returns packages and bundles. Only the latest
// version of each bundle is returned.
func (c *CatalogdClient) Fetch(catalog, baseUrl string, ifNotModifiedSince *time.Time) ([]*declcfg.Package, []*declcfg.Bundle, error) {
	latestBundles := make(map[string]*declcfg.Bundle)
	packages := []*declcfg.Package{}
	var catalogURL string
	var err error

	if c.proxyConfig != nil {
		catalogURL = fmt.Sprintf("%s/catalogs/%s%s", c.proxyConfig.Endpoint.String(), catalog, CatalogdAllEndpoint)
	} else {
		catalogURL, err = url.JoinPath(baseUrl, CatalogdAllEndpoint)
		if err != nil {
			return nil, nil, fmt.Errorf("error parsing clustercatalog baseURL: %v", baseUrl)
		}
	}

	req, err := http.NewRequest(http.MethodGet, catalogURL, nil)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create request: %w", err)
	}

	if ifNotModifiedSince != nil {
		req.Header.Set("If-Modified-Since", ifNotModifiedSince.UTC().Format(http.TimeFormat))
		req.Header.Set("Cache-Control", "max-age=86400")
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, nil, fmt.Errorf("http client error when fetching catalog %s from %s: %w", catalog, catalogURL, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotModified {
		return nil, nil, nil
	}

	if resp.StatusCode != http.StatusOK {
		return nil, nil, fmt.Errorf("failed to fetch catalog %s from %s: %s", catalog, catalogURL, resp.Status)
	}

	if err := declcfg.WalkMetasReader(resp.Body, func(meta *declcfg.Meta, err error) error {
		if err != nil {
			return fmt.Errorf("error parsing catalog contents: %v", err)
		}

		switch meta.Schema {
		case declcfg.SchemaPackage:
			pkg, err := c.processPackage(meta.Blob)
			if err != nil {
				return err
			}
			packages = append(packages, pkg)

		case declcfg.SchemaBundle:
			bundle, err := c.processBundle(meta.Blob)
			if err != nil {
				klog.Warningf("failed to process bundle: %v", err)
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
						klog.Warningf("failed to get existing bundle version: %v", err)
						break
					}

					newVersion, err := getBundleVersion(bundle)
					if err != nil {
						klog.Warningf("failed to get new bundle version: %v", err)
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
		return nil, nil, err
	}

	bundles := []*declcfg.Bundle{}
	for _, bundle := range latestBundles {
		bundles = append(bundles, bundle)
	}

	return packages, bundles, nil
}

func (c *CatalogdClient) processPackage(raw json.RawMessage) (*declcfg.Package, error) {
	var pkg declcfg.Package
	if err := json.Unmarshal(raw, &pkg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal package object: %w", err)
	}
	return &pkg, nil
}

func (c *CatalogdClient) processBundle(raw json.RawMessage) (*declcfg.Bundle, error) {
	var bundle declcfg.Bundle
	if err := json.Unmarshal(raw, &bundle); err != nil {
		return nil, fmt.Errorf("failed to unmarshal bundle object: %w", err)
	}
	return &bundle, nil
}
