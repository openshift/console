package olm

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"github.com/blang/semver/v4"
	"github.com/operator-framework/operator-registry/alpha/declcfg"
	"github.com/operator-framework/operator-registry/alpha/property"
	"k8s.io/klog/v2"
)

// CachedIcon represents a cached operator icon.
type CachedIcon struct {
	Data         []byte
	MediaType    string
	LastModified string
	ETag         string
}

// ConsoleCatalogItem represents a single item in the catalog.
type ConsoleCatalogItem struct {
	ID                     string   `json:"id"`
	Capabilities           string   `json:"capabilities,omitempty"`
	Catalog                string   `json:"catalog"`
	Categories             []string `json:"categories,omitempty"`
	CreatedAt              string   `json:"createdAt,omitempty"`
	Description            string   `json:"description,omitempty"`
	DisplayName            string   `json:"displayName,omitempty"`
	HasIcon                bool     `json:"hasIcon"`
	Image                  string   `json:"image,omitempty"`
	InfrastructureFeatures []string `json:"infrastructureFeatures,omitempty"`
	Keywords               []string `json:"keywords,omitempty"`
	MarkdownDescription    string   `json:"markdownDescription,omitempty"`
	Name                   string   `json:"name"`
	Provider               string   `json:"provider,omitempty"`
	Repository             string   `json:"repository,omitempty"`
	Source                 string   `json:"source,omitempty"`
	Support                string   `json:"support,omitempty"`
	ValidSubscription      []string `json:"validSubscription,omitempty"`
	Version                string   `json:"version,omitempty"`
	// AvailableVersions lists the distinct bundle versions found for the package.
	AvailableVersions []string `json:"availableVersions"`
	// ClusterCompatibility is incompatible only when every bundle is known incompatible.
	ClusterCompatibility ClusterCompatibility `json:"clusterCompatibility"`
}

// ClusterCompatibility describes package compatibility with the current cluster.
type ClusterCompatibility string

const (
	ClusterCompatibilityCompatible   ClusterCompatibility = "compatible"
	ClusterCompatibilityIncompatible ClusterCompatibility = "incompatible"
	ClusterCompatibilityUnknown      ClusterCompatibility = "unknown"
)

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
		if item == nil {
			continue
		}
		item.Catalog = catalogName
		catalogItems = append(catalogItems, *item)
	}
	return catalogItems
}

func CreateCatalogItem(catalogName string, pkg *declcfg.Package, bundle *declcfg.Bundle) *ConsoleCatalogItem {
	csvMetadata, err := getCSVMetadata(bundle)
	if err != nil {
		klog.Warningf("failed to get csv metadata for bundle %q: %v", bundle.Name, err)
		return nil
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
	withHasIcon(item, pkg)
	withImage(item, bundle)
	withInfrastructureFeatures(item, csvMetadata)
	withKeywords(item, csvMetadata)
	withMarkdownDescription(item, csvMetadata)
	withProvider(item, csvMetadata)
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

// Plain text description takes precedence, fall back to markdown description if empty
func withDescription(item *ConsoleCatalogItem, csvMetadata *property.CSVMetadata, pkg *declcfg.Package) {
	item.Description = pkg.Description
	if csvMetadata == nil {
		return
	}

	if csvMetadata.Annotations == nil {
		return
	}

	item.Description = csvMetadata.Annotations[DescriptionOLMAnnotationKey]
	if item.Description == "" {
		item.Description = pkg.Description
	}
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

func withHasIcon(item *ConsoleCatalogItem, pkg *declcfg.Package) {
	item.HasIcon = pkg.Icon != nil && len(pkg.Icon.Data) > 0
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

// Markdown description from CSV metadata
func withMarkdownDescription(item *ConsoleCatalogItem, csvMetadata *property.CSVMetadata) {
	if csvMetadata == nil {
		item.MarkdownDescription = ""
		return
	}

	item.MarkdownDescription = csvMetadata.Description
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
	if err != nil || version == "" {
		klog.Warningf("failed to get bundle version for bundle %q: %v", bundle.Name, err)
		return
	}

	item.Version = version
}

// getAvailableVersions validates, deduplicates, and sorts bundle versions by semantic precedence.
func getAvailableVersions(bundles []*declcfg.Bundle) ([]string, error) {
	parsedVersions := make(map[string]semver.Version, len(bundles))
	versions := make([]string, 0, len(bundles))
	for _, bundle := range bundles {
		version, err := getBundleVersion(bundle)
		if err != nil {
			return nil, err
		}
		parsed, err := semver.Parse(version)
		if err != nil {
			return nil, fmt.Errorf("invalid version %q for bundle %q: %w", version, bundle.Name, err)
		}
		if _, found := parsedVersions[version]; !found {
			versions = append(versions, version)
			parsedVersions[version] = parsed
		}
	}
	sort.SliceStable(versions, func(i, j int) bool {
		return parsedVersions[versions[i]].GT(parsedVersions[versions[j]])
	})
	return versions, nil
}

// getPackageCompatibility rules out a package only when every offered bundle is incompatible.
func getPackageCompatibility(clusterVersion string, bundles []*declcfg.Bundle) ClusterCompatibility {
	if len(bundles) == 0 {
		return ClusterCompatibilityUnknown
	}
	for _, bundle := range bundles {
		if getClusterCompatibility(clusterVersion, bundle) != ClusterCompatibilityIncompatible {
			return ClusterCompatibilityUnknown
		}
	}
	return ClusterCompatibilityIncompatible
}

// getMaxOpenShiftVersion reads the catalog property first, falling back to the
// CSV's olm.properties annotation when the catalog has not extracted it.
func getMaxOpenShiftVersion(bundle *declcfg.Bundle) (string, error) {
	readProperty := func(properties []property.Property) (string, bool, error) {
		for _, p := range properties {
			if p.Type == "olm.maxOpenShiftVersion" {
				var version string
				err := json.Unmarshal(p.Value, &version)
				return version, true, err
			}
		}
		return "", false, nil
	}
	if version, found, err := readProperty(bundle.Properties); found {
		return version, err
	}

	csvMetadata, err := getCSVMetadata(bundle)
	if err != nil || csvMetadata == nil {
		return "", err
	}
	encodedProperties := csvMetadata.Annotations["olm.properties"]
	if encodedProperties == "" {
		return "", nil
	}
	var properties []property.Property
	if err := json.Unmarshal([]byte(encodedProperties), &properties); err != nil {
		return "", err
	}
	version, _, err := readProperty(properties)
	return version, err
}

func getClusterCompatibility(clusterVersion string, bundle *declcfg.Bundle) ClusterCompatibility {
	if clusterVersion == "" || bundle == nil {
		return ClusterCompatibilityUnknown
	}

	maxVersion, err := getMaxOpenShiftVersion(bundle)
	if err != nil || maxVersion == "" {
		return ClusterCompatibilityUnknown
	}
	compatible, valid := isOpenShiftVersionAtMost(clusterVersion, maxVersion)
	if valid && !compatible {
		return ClusterCompatibilityIncompatible
	}

	// A maximum can rule out compatibility, but does not establish support.
	// The bundle distribution range is not exposed by catalogd's metas endpoint.
	return ClusterCompatibilityUnknown
}

// isOpenShiftVersionAtMost compares major and minor versions, ignoring patch and prerelease.
func isOpenShiftVersionAtMost(clusterVersion, maxVersion string) (bool, bool) {
	cluster, err := semver.Parse(clusterVersion)
	if err != nil {
		return false, false
	}
	// The maximum annotation supports the documented major.minor notation.
	if len(strings.Split(maxVersion, ".")) == 2 {
		maxVersion += ".0"
	}
	maximum, err := semver.Parse(maxVersion)
	if err != nil {
		return false, false
	}
	clusterMinor := semver.Version{Major: cluster.Major, Minor: cluster.Minor}
	maximumMinor := semver.Version{Major: maximum.Major, Minor: maximum.Minor}
	return clusterMinor.LTE(maximumMinor), true
}
