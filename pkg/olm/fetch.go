package olm

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/operator-framework/operator-registry/alpha/declcfg"
	"github.com/operator-framework/operator-registry/alpha/property"
	"golang.org/x/mod/semver"
	"k8s.io/klog/v2"
)

// CatalogFetcher is responsible for fetching catalog data.
type catalogFetcher struct {
	client *http.Client
}

func (f *catalogFetcher) FetchAndTransformCatalog(catalogName string) ([]CatalogItem, error) {
	klog.V(4).Infof("Fetching and transforming catalog: %s", catalogName)

	rawObjects, err := f.fetchCatalogData(catalogName)
	if err != nil {
		return nil, err
	}

	packages, bundles := f.parseRawObjects(rawObjects)

	transformer := NewCatalogTransformer(packages, bundles, catalogName)
	return transformer.TransformCatalog(), nil
}

func (f *catalogFetcher) fetchCatalogData(catalogName string) ([]json.RawMessage, error) {
	url := fmt.Sprintf(CatalogdURLTemplate, CatalogdHost, catalogName)
	resp, err := f.client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch catalog %s from %s: %w", catalogName, url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch catalog %s from %s: status code %d", resp.Request.URL, url, resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body for catalog %s from %s: %w", catalogName, url, err)
	}

	var rawObjects []json.RawMessage
	if err := json.Unmarshal(body, &rawObjects); err != nil {
		return nil, fmt.Errorf("failed to unmarshal json array for catalog %s: %w", catalogName, err)
	}

	return rawObjects, nil
}

func (f *catalogFetcher) parseRawObjects(rawObjects []json.RawMessage) (map[string]declcfg.Package, map[string]declcfg.Bundle) {
	latestBundles := make(map[string]declcfg.Bundle)
	packages := make(map[string]declcfg.Package)

	for _, raw := range rawObjects {
		var meta declcfg.Meta
		if err := json.Unmarshal(raw, &meta); err != nil {
			klog.Warningf("failed to unmarshal meta object: %v", err)
			continue
		}

		switch meta.Schema {
		case declcfg.SchemaPackage:
			pkg, err := f.processPackage(raw)
			if err != nil {
				klog.Warningf("failed to process package: %v", err)
				continue
			}
			packages[pkg.Name] = *pkg
		case declcfg.SchemaBundle:
			bundle, err := f.processBundle(raw)
			if err != nil {
				klog.Warningf("failed to process bundle: %v", err)
				continue
			}
			if existingBundle, ok := latestBundles[bundle.Package]; ok {
				existingVersion, err := getBundleVersion(existingBundle)
				if err != nil {
					klog.Warningf("failed to get existing bundle version: %v", err)
					continue
				}

				newVersion, err := getBundleVersion(*bundle)
				if err != nil {
					klog.Warningf("failed to get new bundle version: %v", err)
					continue
				}

				if semver.Compare(newVersion, existingVersion) > 0 {
					latestBundles[bundle.Package] = *bundle
				}
			} else {
				latestBundles[bundle.Package] = *bundle
			}
		}
	}
	return packages, latestBundles
}

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
