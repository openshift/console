package olm

import (
	"encoding/json"
	"testing"

	"github.com/operator-framework/api/pkg/operators/v1alpha1"
	"github.com/operator-framework/operator-registry/alpha/declcfg"
	"github.com/operator-framework/operator-registry/alpha/property"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCreateCatalogItem(t *testing.T) {
	t.Run("should create a catalog item from a valid bundle without icon", func(t *testing.T) {
		pkg := declcfg.Package{
			Schema:         "olm.package",
			Name:           "test-package",
			DefaultChannel: "stable",
		}

		csvMetadata := property.CSVMetadata{
			DisplayName: "Test Package",
			Description: "This is a test package.",
			Annotations: map[string]string{
				CapabilitiesOLMAnnotationKey:           "Basic Install",
				CategoriesOLMAnnotationKey:             "Test, Example",
				CreatedAtOLMAnnotationKey:              "2021-01-01T00:00:00Z",
				RepositoryOLMAnnotationKey:             "https://github.com/test/test-package",
				SupportOLMAnnotationKey:                "Test Support",
				InfrastructureFeaturesOLMAnnotationKey: `["feature1", "feature2"]`,
				ValidSubscriptionOLMAnnotationKey:      `["sub1", "sub2"]`,
			},
			Keywords: []string{"test", "example"},
			Provider: v1alpha1.AppLink{
				Name: "Test Provider",
				URL:  "https://github.com/test/test-package",
			},
		}
		csvMetadataBytes, err := json.Marshal(csvMetadata)
		require.NoError(t, err)

		bundle := declcfg.Bundle{
			Schema:  "olm.bundle",
			Name:    "test-package.v0.1.0",
			Package: "test-package",
			Image:   "quay.io/test/test-package:v0.1.0",
			Properties: []property.Property{
				{
					Type:  property.TypeCSVMetadata,
					Value: csvMetadataBytes,
				},
				{
					Type:  property.TypePackage,
					Value: json.RawMessage(`{"packageName":"test-package","version":"0.1.0"}`),
				},
			},
		}

		item := CreateCatalogItem("test-catalog", &pkg, &bundle)
		require.NoError(t, err)

		assert.Equal(t, "test-package", item.Name)
		assert.Equal(t, "Test Package", item.DisplayName)
		assert.Equal(t, "This is a test package.", item.MarkdownDescription)
		assert.Equal(t, "Basic Install", item.Capabilities)
		assert.Equal(t, []string{"Test", "Example"}, item.Categories)
		assert.Equal(t, "2021-01-01T00:00:00Z", item.CreatedAt)
		assert.Equal(t, "https://github.com/test/test-package", item.Repository)
		assert.Equal(t, "Test Support", item.Support)
		assert.Equal(t, []string{"feature1", "feature2"}, item.InfrastructureFeatures)
		assert.Equal(t, []string{"sub1", "sub2"}, item.ValidSubscription)
		assert.Equal(t, []string{"test", "example"}, item.Keywords)
		assert.Equal(t, "Test Provider", item.Provider)
		assert.Equal(t, "0.1.0", item.Version)
		assert.False(t, item.HasIcon)
	})

	t.Run("should set HasIcon to true when package has icon", func(t *testing.T) {
		pkg := declcfg.Package{
			Schema:         "olm.package",
			Name:           "test-package",
			DefaultChannel: "stable",
			Icon: &declcfg.Icon{
				Data:      []byte("icon-data"),
				MediaType: "image/png",
			},
		}

		csvMetadataBytes, err := json.Marshal(property.CSVMetadata{})
		require.NoError(t, err)

		bundle := declcfg.Bundle{
			Schema:  "olm.bundle",
			Name:    "test-package.v0.1.0",
			Package: "test-package",
			Properties: []property.Property{
				{Type: property.TypeCSVMetadata, Value: csvMetadataBytes},
				{Type: property.TypePackage, Value: json.RawMessage(`{"packageName":"test-package","version":"0.1.0"}`)},
			},
		}

		item := CreateCatalogItem("test-catalog", &pkg, &bundle)
		require.NotNil(t, item)
		assert.True(t, item.HasIcon)
	})
}
func TestCreateConsoleCatalog(t *testing.T) {
	pkg1 := declcfg.Package{Name: "pkg1"}
	bundle1 := declcfg.Bundle{Package: "pkg1", Name: "bundle1", Properties: []property.Property{
		{Type: property.TypeCSVMetadata, Value: json.RawMessage(`{}`)},
	}}

	pkg2 := declcfg.Package{Name: "pkg2"} // No bundle for this package

	pkg3 := declcfg.Package{Name: "pkg3"}
	bundle3 := declcfg.Bundle{Package: "pkg3", Name: "bundle3"} // No CSV metadata

	packages := []*declcfg.Package{&pkg1, &pkg2, &pkg3}
	bundles := []*declcfg.Bundle{&bundle1, &bundle3}
	catalogName := "test-catalog"

	items := CreateConsoleCatalog(catalogName, packages, bundles)

	require.Len(t, items, 2)
	assert.Equal(t, "pkg1", items[0].Name)
	assert.Equal(t, "test-catalog/pkg1/bundle1", items[0].ID)
	assert.Equal(t, "test-catalog", items[0].Catalog)
	assert.Equal(t, "pkg3", items[1].Name)
	assert.Equal(t, "test-catalog/pkg3/bundle3", items[1].ID)
	assert.Equal(t, "test-catalog", items[1].Catalog)
}

func TestGetAvailableVersions(t *testing.T) {
	tests := []struct {
		name     string
		versions []string
		want     []string
		wantErr  bool
	}{
		{
			name:     "deduplicates and sorts versions numerically",
			versions: []string{"1.2.0", "1.10.0", "1.2.0", "2.0.0"},
			want:     []string{"2.0.0", "1.10.0", "1.2.0"},
		},
		{
			name:     "orders prereleases below releases",
			versions: []string{"2.0.0-rc.2", "2.0.0", "2.0.0-rc.10"},
			want:     []string{"2.0.0", "2.0.0-rc.10", "2.0.0-rc.2"},
		},
		{
			name:     "build metadata does not change semantic precedence",
			versions: []string{"1.0.0+aaa", "1.0.0+zzz"},
			want:     []string{"1.0.0+aaa", "1.0.0+zzz"},
		},
		{
			name: "empty package returns an empty version list",
			want: []string{},
		},
		{name: "rejects a prefixed version", versions: []string{"v1.0.0"}, wantErr: true},
		{name: "rejects an incomplete version", versions: []string{"1.0"}, wantErr: true},
		{name: "rejects an invalid version", versions: []string{"invalid"}, wantErr: true},
		{name: "rejects an empty version", versions: []string{""}, wantErr: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			bundles := make([]*declcfg.Bundle, 0, len(tt.versions))
			for _, version := range tt.versions {
				bundles = append(bundles, &declcfg.Bundle{
					Name:       "test-package.v" + version,
					Properties: []property.Property{property.MustBuildPackage("test-package", version)},
				})
			}
			versions, err := getAvailableVersions(bundles)
			if tt.wantErr {
				require.ErrorContains(t, err, "invalid version")
			} else {
				require.NoError(t, err)
				assert.Equal(t, tt.want, versions)
			}
		})
	}
}

func TestGetAvailableVersionsInvalidProperties(t *testing.T) {
	tests := []struct {
		name       string
		properties []property.Property
		wantError  string
	}{
		{name: "missing package property", wantError: "no olm.package property"},
		{
			name:       "malformed package property",
			properties: []property.Property{{Type: property.TypePackage, Value: json.RawMessage(`{"version":42}`)}},
			wantError:  "failed to unmarshal package property",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			versions, err := getAvailableVersions([]*declcfg.Bundle{{Name: "invalid-bundle", Properties: tt.properties}})
			require.ErrorContains(t, err, tt.wantError)
			assert.Nil(t, versions)
		})
	}
}

func TestGetPackageCompatibility(t *testing.T) {
	tests := []struct {
		name     string
		maximums []string
		want     ClusterCompatibility
	}{
		{name: "no bundles", want: ClusterCompatibilityUnknown},
		{
			name:     "latest is incompatible but an older bundle is not ruled out",
			maximums: []string{"4.17", "4.20"},
			want:     ClusterCompatibilityUnknown,
		},
		{
			name:     "every bundle is incompatible",
			maximums: []string{"4.17", "4.16"},
			want:     ClusterCompatibilityIncompatible,
		},
		{
			name:     "a bundle has no declared maximum",
			maximums: []string{"4.17", ""},
			want:     ClusterCompatibilityUnknown,
		},
		{
			name:     "a bundle has an invalid maximum",
			maximums: []string{"4.17", "invalid"},
			want:     ClusterCompatibilityUnknown,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			bundles := make([]*declcfg.Bundle, 0, len(tt.maximums))
			for _, maximum := range tt.maximums {
				bundle := &declcfg.Bundle{}
				if maximum != "" {
					value, err := json.Marshal(maximum)
					require.NoError(t, err)
					bundle.Properties = []property.Property{{Type: "olm.maxOpenShiftVersion", Value: value}}
				}
				bundles = append(bundles, bundle)
			}
			assert.Equal(t, tt.want, getPackageCompatibility("4.18.0", bundles))
		})
	}
}

func TestGetClusterCompatibility(t *testing.T) {
	makeBundle := func(version string, annotations map[string]string) *declcfg.Bundle {
		csvMetadata, err := json.Marshal(property.CSVMetadata{Annotations: annotations})
		require.NoError(t, err)
		packageProperty, err := json.Marshal(property.Package{PackageName: "test-package", Version: version})
		require.NoError(t, err)
		return &declcfg.Bundle{
			Name:    "test-package.v" + version,
			Package: "test-package",
			Properties: []property.Property{
				{Type: property.TypeCSVMetadata, Value: csvMetadata},
				{Type: property.TypePackage, Value: packageProperty},
			},
		}
	}

	tests := []struct {
		name              string
		clusterVersion    string
		annotations       map[string]string
		properties        []property.Property
		wantCompatibility ClusterCompatibility
	}{
		{
			name:              "unknown under the maximum version",
			clusterVersion:    "4.17.3",
			annotations:       map[string]string{"olm.properties": `[{"type":"olm.maxOpenShiftVersion","value":"4.20"}]`},
			wantCompatibility: ClusterCompatibilityUnknown,
		},
		{
			name:              "unknown at the maximum minor version",
			clusterVersion:    "4.17.3",
			annotations:       map[string]string{"olm.properties": `[{"type":"olm.maxOpenShiftVersion","value":"4.17"}]`},
			wantCompatibility: ClusterCompatibilityUnknown,
		},
		{
			name:              "prerelease cluster still exceeds the maximum minor version",
			clusterVersion:    "4.18.0-rc.1",
			annotations:       map[string]string{"olm.properties": `[{"type":"olm.maxOpenShiftVersion","value":"4.17"}]`},
			wantCompatibility: ClusterCompatibilityIncompatible,
		},
		{
			name:              "maximum patch and prerelease are ignored",
			clusterVersion:    "4.17.9",
			annotations:       map[string]string{"olm.properties": `[{"type":"olm.maxOpenShiftVersion","value":"4.17.0-rc.1"}]`},
			wantCompatibility: ClusterCompatibilityUnknown,
		},
		{
			name:              "malformed maximum suffix remains unknown",
			clusterVersion:    "4.18.0",
			annotations:       map[string]string{"olm.properties": `[{"type":"olm.maxOpenShiftVersion","value":"4.17.invalid"}]`},
			wantCompatibility: ClusterCompatibilityUnknown,
		},
		{
			name:              "incompatible above the maximum in CSV properties",
			clusterVersion:    "4.18.0",
			annotations:       map[string]string{"olm.properties": `[{"type":"olm.maxOpenShiftVersion","value":"4.17"}]`},
			wantCompatibility: ClusterCompatibilityIncompatible,
		},
		{
			name:           "incompatible above the maximum in catalog properties",
			clusterVersion: "4.18.0",
			properties: []property.Property{
				{Type: "olm.maxOpenShiftVersion", Value: json.RawMessage(`"4.17"`)},
			},
			wantCompatibility: ClusterCompatibilityIncompatible,
		},
		{
			name:              "distribution annotation in CSV does not establish support",
			clusterVersion:    "4.16.0",
			annotations:       map[string]string{"com.redhat.openshift.versions": "v4.14-v4.16"},
			wantCompatibility: ClusterCompatibilityUnknown,
		},
		{
			name:              "distribution annotation in CSV does not rule out support",
			clusterVersion:    "4.15.0",
			annotations:       map[string]string{"com.redhat.openshift.versions": "v4.16-v4.18"},
			wantCompatibility: ClusterCompatibilityUnknown,
		},
		{
			name:              "unknown when compatibility is not declared",
			clusterVersion:    "4.16.0",
			wantCompatibility: ClusterCompatibilityUnknown,
		},
		{
			name:              "unknown when the cluster version is unavailable",
			annotations:       map[string]string{"olm.properties": `[{"type":"olm.maxOpenShiftVersion","value":"4.17"}]`},
			wantCompatibility: ClusterCompatibilityUnknown,
		},
		{
			name:              "unknown when the maximum version is invalid",
			clusterVersion:    "4.18.0",
			annotations:       map[string]string{"olm.properties": `[{"type":"olm.maxOpenShiftVersion","value":"invalid"}]`},
			wantCompatibility: ClusterCompatibilityUnknown,
		},
		{
			name:              "unknown when the cluster version is invalid",
			clusterVersion:    "invalid",
			annotations:       map[string]string{"olm.properties": `[{"type":"olm.maxOpenShiftVersion","value":"4.17"}]`},
			wantCompatibility: ClusterCompatibilityUnknown,
		},
		{
			name:              "unknown when CSV properties are malformed",
			clusterVersion:    "4.18.0",
			annotations:       map[string]string{"olm.properties": `[{`},
			wantCompatibility: ClusterCompatibilityUnknown,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			latestBundle := makeBundle("2.0.0", tt.annotations)
			latestBundle.Properties = append(latestBundle.Properties, tt.properties...)
			assert.Equal(t, tt.wantCompatibility, getClusterCompatibility(tt.clusterVersion, latestBundle))
		})
	}
}

func TestGetMaxOpenShiftVersion(t *testing.T) {
	tests := []struct {
		name          string
		propertyValue json.RawMessage
		csvProperties string
		wantVersion   string
		wantError     bool
	}{
		{
			name:          "reads a catalog property without CSV metadata",
			propertyValue: json.RawMessage(`"4.17"`),
			wantVersion:   "4.17",
		},
		{
			name:          "reads the CSV olm.properties annotation",
			csvProperties: `[{"type":"olm.maxOpenShiftVersion","value":"4.17"}]`,
			wantVersion:   "4.17",
		},
		{
			name:          "catalog properties take precedence over CSV annotations",
			propertyValue: json.RawMessage(`"4.18"`),
			csvProperties: `[{"type":"olm.maxOpenShiftVersion","value":"4.17"}]`,
			wantVersion:   "4.18",
		},
		{
			name:          "rejects a non-string catalog property",
			propertyValue: json.RawMessage(`{"version":"4.17"}`),
			wantError:     true,
		},
		{
			name:          "rejects malformed CSV properties",
			csvProperties: `[{`,
			wantError:     true,
		},
		{
			name: "no maximum is declared",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			bundle := &declcfg.Bundle{}
			if tt.propertyValue != nil {
				bundle.Properties = append(bundle.Properties, property.Property{
					Type: "olm.maxOpenShiftVersion", Value: tt.propertyValue,
				})
			}
			if tt.csvProperties != "" {
				metadata, err := json.Marshal(property.CSVMetadata{Annotations: map[string]string{
					"olm.properties": tt.csvProperties,
				}})
				require.NoError(t, err)
				bundle.Properties = append(bundle.Properties, property.Property{
					Type: property.TypeCSVMetadata, Value: metadata,
				})
			}

			version, err := getMaxOpenShiftVersion(bundle)
			if tt.wantError {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tt.wantVersion, version)
			}
		})
	}
}

func TestParseJSONArray(t *testing.T) {
	testCases := []struct {
		name     string
		jsonArr  string
		expected []string
	}{
		{
			name:     "valid json array",
			jsonArr:  `["a", "b", "c"]`,
			expected: []string{"a", "b", "c"},
		},
		{
			name:     "invalid json array",
			jsonArr:  `["a", "b", "c"`,
			expected: nil,
		},
		{
			name:     "empty string",
			jsonArr:  "",
			expected: nil,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			assert.Equal(t, tc.expected, parseJSONArray(tc.jsonArr))
		})
	}
}

func TestParseCommaSeparatedString(t *testing.T) {
	testCases := []struct {
		name     string
		cString  string
		expected []string
	}{
		{
			name:     "multiple values with spaces",
			cString:  "a, b, c",
			expected: []string{"a", "b", "c"},
		},
		{
			name:     "single value",
			cString:  "a",
			expected: []string{"a"},
		},
		{
			name:     "empty string",
			cString:  "",
			expected: []string{},
		},
		{
			name:     "commas and spaces",
			cString:  " , ,, ",
			expected: []string{},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			assert.Equal(t, tc.expected, parseCommaSeparatedString(tc.cString))
		})
	}
}
