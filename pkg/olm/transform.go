package olm

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/operator-framework/operator-registry/alpha/declcfg"
	"github.com/operator-framework/operator-registry/alpha/property"
	"k8s.io/klog/v2"
)

// CatalogTransformer is responsible for transforming catalog data.
type CatalogTransformer struct {
	packages    map[string]declcfg.Package
	bundles     map[string]declcfg.Bundle
	catalogName string
}

// NewCatalogTransformer creates a new transformer for catalog data.
func NewCatalogTransformer(packages map[string]declcfg.Package, bundles map[string]declcfg.Bundle, catalogName string) *CatalogTransformer {
	return &CatalogTransformer{
		packages:    packages,
		bundles:     bundles,
		catalogName: catalogName,
	}
}

// TransformCatalog transforms the raw catalog data into a list of CatalogItems.
func (t *CatalogTransformer) TransformCatalog() []CatalogItem {
	var catalogItems []CatalogItem
	for pkgName, pkg := range t.packages {
		bundle, ok := t.bundles[pkgName]
		if !ok {
			// A package must have at least one bundle
			continue
		}
		item, err := t.TransformFBC(pkg, bundle)
		if err != nil {
			klog.Warningf("failed to transform package %q: %v", pkgName, err)
			continue
		}
		item.Catalog = t.catalogName
		catalogItems = append(catalogItems, *item)
	}
	return catalogItems
}

func (t *CatalogTransformer) TransformFBC(pkg declcfg.Package, bundle declcfg.Bundle) (*CatalogItem, error) {
	var csvMetadata *property.CSVMetadata
	for _, p := range bundle.Properties {
		if p.Type == property.TypeCSVMetadata {
			if err := json.Unmarshal(p.Value, &csvMetadata); err != nil {
				return nil, fmt.Errorf("failed to unmarshal csv metadata for bundle %q: %w", bundle.Name, err)
			}
		}
	}

	if csvMetadata == nil {
		return nil, fmt.Errorf("no csv metadata found for bundle %q", bundle.Name)
	}

	item := &CatalogItem{
		Name:                   pkg.Name,
		Version:                bundle.Name,
		Capabilities:           csvMetadata.Annotations["capabilities"],
		Categories:             strings.Split(csvMetadata.Annotations["categories"], ","),
		CreatedAt:              csvMetadata.Annotations["createdAt"],
		Description:            csvMetadata.Description,
		DisplayName:            csvMetadata.DisplayName,
		Image:                  bundle.Image,
		InfrastructureFeatures: parseJSONArray(csvMetadata.Annotations["infrastructure-features"]),
		Keywords:               csvMetadata.Keywords,
		LongDescription:        csvMetadata.Annotations["description"],
		Provider:               getProvider(csvMetadata.Provider),
		Repository:             csvMetadata.Annotations["repository"],
		Source:                 "Red Hat", //HACK: Hardcoded source
		Support:                csvMetadata.Annotations["support"],
		ValidSubscription:      parseJSONArray(csvMetadata.Annotations["valid-subscription"]),
	}
	return item, nil
}

func getProvider(providerIface interface{}) string {
	if provider, ok := providerIface.(string); ok {
		return provider
	}
	if provider, ok := providerIface.(map[string]interface{}); ok {
		if name, ok := provider["name"].(string); ok {
			return name
		}
	}
	return ""
}

func parseJSONArray(arr string) []string {
	var parsed []string
	if err := json.Unmarshal([]byte(arr), &parsed); err != nil {
		return nil
	}
	return parsed
}
