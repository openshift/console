package olm

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

	"github.com/openshift/console/pkg/proxy"
	"github.com/operator-framework/operator-registry/alpha/declcfg"
	"github.com/operator-framework/operator-registry/alpha/property"
	"golang.org/x/mod/semver"
	"k8s.io/klog/v2"
)

// CatalogFetcher is responsible for fetching catalog data.
type catalogFetcher struct {
	client      *http.Client
	proxyConfig *proxy.Config
}

func (f *catalogFetcher) FetchAndTransformCatalog(catalogName, baseURL string) ([]CatalogItem, error) {
	klog.V(4).Infof("Fetching and transforming catalog: %s", catalogName)

	packages, bundles, err := f.fetchCatalogData(catalogName, baseURL)
	if err != nil {
		return nil, err
	}

	transformer := NewCatalogTransformer(packages, bundles, catalogName)
	return transformer.TransformCatalog(), nil
}

func (f *catalogFetcher) fetchCatalogData(catalogName, baseURL string) (map[string]declcfg.Package, map[string]declcfg.Bundle, error) {
	latestBundles := make(map[string]declcfg.Bundle)
	packages := make(map[string]declcfg.Package)
	var catalogURL string
	var err error

	if f.proxyConfig != nil {
		catalogURL = fmt.Sprintf("%s/catalogs/%s%s", f.proxyConfig.Endpoint.String(), catalogName, CatalogdURLTemplate)
	} else {
		catalogURL, err = url.JoinPath(baseURL, CatalogdURLTemplate)
		if err != nil {
			return nil, nil, fmt.Errorf("error parsing clustercatalog baseURL: %v", baseURL)
		}
	}

	resp, err := f.client.Get(catalogURL)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to fetch catalog %s from %s: %w", catalogName, catalogURL, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, nil, fmt.Errorf("failed to fetch catalog %s from %s: status code %d", resp.Request.URL, catalogURL, resp.StatusCode)
	}

	if err := declcfg.WalkMetasReader(resp.Body, func(meta *declcfg.Meta, err error) error {
		if err != nil {
			return fmt.Errorf("error parsing catalog contents: %v", err)
		}

		switch meta.Schema {
		case declcfg.SchemaPackage:
			pkg, err := f.processPackage(meta.Blob)
			if err != nil {
				return err
			}
			packages[pkg.Name] = *pkg

		case declcfg.SchemaBundle:
			bundle, err := f.processBundle(meta.Blob)
			if err != nil {
				klog.Warningf("failed to process bundle: %v", err)
			}
			if existingBundle, ok := latestBundles[bundle.Package]; ok {
				existingVersion, err := getBundleVersion(existingBundle)
				if err != nil {
					klog.Warningf("failed to get existing bundle version: %v", err)
				}

				newVersion, err := getBundleVersion(*bundle)
				if err != nil {
					klog.Warningf("failed to get new bundle version: %v", err)
				}

				if semver.Compare(newVersion, existingVersion) > 0 {
					latestBundles[bundle.Package] = *bundle
				}
			} else {
				latestBundles[bundle.Package] = *bundle
			}
		}

		return nil
	}); err != nil {
		return nil, nil, err
	}

	return packages, latestBundles, nil
}

// func (f *catalogFetcher) parseRawObjects(rawObjects []json.RawMessage) (map[string]declcfg.Package, map[string]declcfg.Bundle) {
// 	latestBundles := make(map[string]declcfg.Bundle)
// 	packages := make(map[string]declcfg.Package)

// 	for _, raw := range rawObjects {
// 		var meta declcfg.Meta
// 		if err := json.Unmarshal(raw, &meta); err != nil {
// 			klog.Warningf("failed to unmarshal meta object: %v", err)
// 			continue
// 		}

// 		switch meta.Schema {
// 		case declcfg.SchemaPackage:
// 			pkg, err := f.processPackage(raw)
// 			if err != nil {
// 				klog.Warningf("failed to process package: %v", err)
// 				continue
// 			}
// 			packages[pkg.Name] = *pkg
// 		case declcfg.SchemaBundle:
// 			bundle, err := f.processBundle(raw)
// 			if err != nil {
// 				klog.Warningf("failed to process bundle: %v", err)
// 				continue
// 			}
// 			if existingBundle, ok := latestBundles[bundle.Package]; ok {
// 				existingVersion, err := getBundleVersion(existingBundle)
// 				if err != nil {
// 					klog.Warningf("failed to get existing bundle version: %v", err)
// 					continue
// 				}

// 				newVersion, err := getBundleVersion(*bundle)
// 				if err != nil {
// 					klog.Warningf("failed to get new bundle version: %v", err)
// 					continue
// 				}

// 				if semver.Compare(newVersion, existingVersion) > 0 {
// 					latestBundles[bundle.Package] = *bundle
// 				}
// 			} else {
// 				latestBundles[bundle.Package] = *bundle
// 			}
// 		}
// 	}
// 	return packages, latestBundles
// }

func (f *catalogFetcher) processPackage(raw json.RawMessage) (*declcfg.Package, error) {
	var pkg declcfg.Package
	if err := json.Unmarshal(raw, &pkg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal package object: %w", err)
	}
	return &pkg, nil
}

func (f *catalogFetcher) processBundle(raw json.RawMessage) (*declcfg.Bundle, error) {
	var bundle declcfg.Bundle
	if err := json.Unmarshal(raw, &bundle); err != nil {
		return nil, fmt.Errorf("failed to unmarshal bundle object: %w", err)
	}
	return &bundle, nil
}

func getBundleVersion(bundle declcfg.Bundle) (string, error) {
	for _, prop := range bundle.Properties {
		if prop.Type == "olm.package" {
			var pkg property.Package
			if err := json.Unmarshal(prop.Value, &pkg); err != nil {
				return "", fmt.Errorf("failed to unmarshal package property for bundle %q: %w", bundle.Name, err)
			}
			return pkg.Version, nil
		}
	}
	return "", fmt.Errorf("no olm.package property found for bundle %q", bundle.Name)
}
