package olm

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"github.com/operator-framework/operator-registry/alpha/declcfg"
	"github.com/operator-framework/operator-registry/alpha/property"

	"k8s.io/klog/v2"
)

// ConsoleCatalogItem represents a single item in the catalog.
type ConsoleCatalogItem struct {
	ID                     string   `json:"id"`
	Capabilities           string   `json:"capabilities"`
	Catalog                string   `json:"catalog"`
	Categories             []string `json:"categories"`
	CreatedAt              string   `json:"createdAt"`
	Description            string   `json:"description"`
	DisplayName            string   `json:"displayName"`
	Image                  string   `json:"image"`
	InfrastructureFeatures []string `json:"infrastructureFeatures"`
	Keywords               []string `json:"keywords"`
	MarkdownDescription    string   `json:"markdownDescription"`
	Name                   string   `json:"name"`
	Provider               string   `json:"provider"`
	Repository             string   `json:"repository"`
	Source                 string   `json:"source"`
	Support                string   `json:"support"`
	ValidSubscription      []string `json:"validSubscription"`
	Version                string   `json:"version"`
}

// TransformCatalog transforms the raw catalog data into a list of CatalogItems.
func CreateConsoleCatalog(catalogName string, packages []*declcfg.Package, bundles []*declcfg.Bundle) []ConsoleCatalogItem {
	catalogItems := []ConsoleCatalogItem{}

	bundleMap := map[string]*declcfg.Bundle{}
	for _, bundle := range bundles {
		bundleMap[bundle.Package] = bundle
	}

	for _, pkg := range packages {
		bundle := bundleMap[pkg.Name]
		if bundle == nil {
			klog.Warningf("no bundle found for package %q in catalog %q", pkg.Name, catalogName)
			continue
		}

		item := CreateCatalogItem(catalogName, pkg, bundle)
		item.Catalog = catalogName
		catalogItems = append(catalogItems, *item)
	}
	return catalogItems
}

func CreateCatalogItem(catalogName string, pkg *declcfg.Package, bundle *declcfg.Bundle) *ConsoleCatalogItem {
	csvMetadata, err := getCSVMetadata(bundle)
	if err != nil {
		klog.Warningf("failed to get csv metadata for bundle %q: %v", bundle.Name, err)
	}

	item := &ConsoleCatalogItem{
		ID:      fmt.Sprintf("%s/%s/%s", catalogName, pkg.Name, bundle.Name),
		Name:    pkg.Name,
		Catalog: catalogName,
	}

	withCapabilities(item, csvMetadata)
	withCategories(item, csvMetadata)
	withCreatedAt(item, csvMetadata)
	withDescription(item, csvMetadata, pkg)
	withDisplayName(item, csvMetadata, pkg)
	withImage(item, bundle)
	withInfrastructureFeatures(item, csvMetadata)
	withKeywords(item, csvMetadata)
	withMarkdownDescription(item, csvMetadata, pkg)
	withProvider(item, csvMetadata)
	withMarkdownDescription(item, csvMetadata, pkg)
	withRepository(item, csvMetadata)
	withSupport(item, csvMetadata)
	withValidSubscription(item, csvMetadata)
	withVersion(item, bundle)
	return item
}

func getCSVMetadata(bundle *declcfg.Bundle) (*property.CSVMetadata, error) {
	var csvMetadata *property.CSVMetadata
	for _, p := range bundle.Properties {
		if p.Type == property.TypeCSVMetadata {
			if err := json.Unmarshal(p.Value, &csvMetadata); err != nil {
				return nil, fmt.Errorf("failed to unmarshal csv metadata for bundle %q: %w", bundle.Name, err)
			}
		}
	}
	return csvMetadata, nil
}

func parseJSONArray(arr string) []string {
	var parsed []string
	if err := json.Unmarshal([]byte(arr), &parsed); err != nil {
		return nil
	}
	return parsed
}

func parseCommaSeparatedString(val string) []string {
	if val == "" {
		return []string{}
	}
	parts := strings.Split(val, ",")
	result := []string{}
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			result = append(result, part)
		}
	}
	return result
}

func getInfrastructureFeatures(csvMetadata *property.CSVMetadata) []string {
	infrastructureFeatures := []string{}
	if csvMetadata.Annotations[InfrastructureFeaturesOLMAnnotationKey] != "" {
		infrastructureFeatures = parseJSONArray(csvMetadata.Annotations[InfrastructureFeaturesOLMAnnotationKey])
	}

	infrastructureFeatureSet := make(map[string]bool)
	for _, feature := range infrastructureFeatures {
		infrastructureFeatureSet[feature] = true
	}

	for _, annotationKey := range infrastructureFeatureAnnotations {
		if csvMetadata.Annotations[annotationKey] == "true" {
			infrastructureFeatureSet[annotationKey] = true
		}
	}

	infrastructureFeatures = []string{}
	for feature := range infrastructureFeatureSet {
		infrastructureFeatures = append(infrastructureFeatures, feature)
	}
	sort.Strings(infrastructureFeatures)
	return infrastructureFeatures
}

func withCapabilities(item *ConsoleCatalogItem, csvMetadata *property.CSVMetadata) {
	if csvMetadata == nil {
		return
	}

	capabilities := csvMetadata.Annotations[CapabilitiesOLMAnnotationKey]
	if capabilities != "" {
		item.Capabilities = capabilities
	}
}

func withCategories(item *ConsoleCatalogItem, csvMetadata *property.CSVMetadata) {
	if csvMetadata == nil {
		return
	}

	categories := parseCommaSeparatedString(csvMetadata.Annotations[CategoriesOLMAnnotationKey])
	if len(categories) > 0 {
		item.Categories = categories
	}
}

func withCreatedAt(item *ConsoleCatalogItem, csvMetadata *property.CSVMetadata) {
	if csvMetadata == nil {
		return
	}

	createdAt := csvMetadata.Annotations[CreatedAtOLMAnnotationKey]
	if createdAt != "" {
		item.CreatedAt = createdAt
	}
}

func withDescription(item *ConsoleCatalogItem, csvMetadata *property.CSVMetadata, pkg *declcfg.Package) {
	item.Description = pkg.Description
	if csvMetadata == nil {
		return
	}

	if csvMetadata.Description != "" {
		item.Description = csvMetadata.Description
	}

	if csvMetadata.Annotations[DescriptionOLMAnnotationKey] != "" {
		item.Description = csvMetadata.Annotations[DescriptionOLMAnnotationKey]
	}

	item.Description = pkg.Description
}

func withDisplayName(item *ConsoleCatalogItem, csvMetadata *property.CSVMetadata, pkg *declcfg.Package) {
	item.DisplayName = pkg.Name
	if csvMetadata == nil {
		return
	}

	if csvMetadata.Annotations[DisplayNameOLMAnnotationKey] != "" {
		item.DisplayName = csvMetadata.Annotations[DisplayNameOLMAnnotationKey]
	}

	if csvMetadata.DisplayName != "" {
		item.DisplayName = csvMetadata.DisplayName
	}
}

func withImage(item *ConsoleCatalogItem, bundle *declcfg.Bundle) {
	if bundle.Image != "" {
		item.Image = bundle.Image
	}
}

func withInfrastructureFeatures(item *ConsoleCatalogItem, csvMetadata *property.CSVMetadata) {
	if csvMetadata == nil {
		return
	}

	infrastructureFeatures := getInfrastructureFeatures(csvMetadata)
	if len(infrastructureFeatures) > 0 {
		item.InfrastructureFeatures = infrastructureFeatures
	}
}

func withKeywords(item *ConsoleCatalogItem, csvMetadata *property.CSVMetadata) {
	if csvMetadata == nil {
		return
	}

	if len(csvMetadata.Keywords) > 0 {
		item.Keywords = csvMetadata.Keywords
	}
}

func withMarkdownDescription(item *ConsoleCatalogItem, csvMetadata *property.CSVMetadata, pkg *declcfg.Package) {
	item.MarkdownDescription = pkg.Description
	if csvMetadata == nil {
		return
	}

	if csvMetadata.Annotations[DescriptionOLMAnnotationKey] != "" {
		item.MarkdownDescription = csvMetadata.Annotations[DescriptionOLMAnnotationKey]
	}

	if csvMetadata.Description != "" {
		item.MarkdownDescription = csvMetadata.Description
	}
}

func withProvider(item *ConsoleCatalogItem, csvMetadata *property.CSVMetadata) {
	if csvMetadata == nil {
		return
	}

	if csvMetadata.Provider.Name != "" {
		item.Provider = csvMetadata.Provider.Name
	}
}

func withRepository(item *ConsoleCatalogItem, csvMetadata *property.CSVMetadata) {
	if csvMetadata == nil {
		return
	}

	repository := csvMetadata.Annotations[RepositoryOLMAnnotationKey]
	if repository != "" {
		item.Repository = repository
	}
}

func withSupport(item *ConsoleCatalogItem, csvMetadata *property.CSVMetadata) {
	if csvMetadata == nil {
		return
	}

	support := csvMetadata.Annotations[SupportOLMAnnotationKey]
	if support != "" {
		item.Support = support
	}
}

func withValidSubscription(item *ConsoleCatalogItem, csvMetadata *property.CSVMetadata) {
	if csvMetadata == nil {
		return
	}

	validSubscription := parseJSONArray(csvMetadata.Annotations[ValidSubscriptionOLMAnnotationKey])
	if len(validSubscription) > 0 {
		item.ValidSubscription = validSubscription
	}
}

func withVersion(item *ConsoleCatalogItem, bundle *declcfg.Bundle) {
	version, err := getBundleVersion(bundle)
	if err != nil {
		klog.Warningf("failed to get bundle version for bundle %q: %v", bundle.Name, err)
	}

	if version != "" {
		item.Version = version
	}
}
