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
	t.Run("should create a catalog item from a valid bundle", func(t *testing.T) {
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
