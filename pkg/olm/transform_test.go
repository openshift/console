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

func TestTransformFBC(t *testing.T) {
	pkg := declcfg.Package{
		Schema:         "olm.package",
		Name:           "test-package",
		DefaultChannel: "stable",
	}

	csvMetadata := property.CSVMetadata{
		DisplayName: "Test Package",
		Description: "This is a test package.",
		Annotations: map[string]string{
			"capabilities":            "Basic Install",
			"categories":              "Test, Example",
			"createdAt":               "2021-01-01T00:00:00Z",
			"repository":              "https://github.com/test/test-package",
			"support":                 "Test Support",
			"infrastructure-features": `["feature1", "feature2"]`,
			"valid-subscription":      `["sub1", "sub2"]`,
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

	transformer := NewCatalogTransformer(nil, nil, "test-catalog")
	item, err := transformer.TransformFBC(pkg, bundle)
	require.NoError(t, err)

	assert.Equal(t, "test-package", item.Name)
	assert.Equal(t, "Test Package", item.DisplayName)
	assert.Equal(t, "This is a test package.", item.Description)
	assert.Equal(t, "Basic Install", item.Capabilities)
	assert.Equal(t, []string{"Test", " Example"}, item.Categories)
	assert.Equal(t, "2021-01-01T00:00:00Z", item.CreatedAt)
	assert.Equal(t, "https://github.com/test/test-package", item.Repository)
	assert.Equal(t, "Test Support", item.Support)
	assert.Equal(t, []string{"feature1", "feature2"}, item.InfrastructureFeatures)
	assert.Equal(t, []string{"sub1", "sub2"}, item.ValidSubscription)
	assert.Equal(t, []string{"test", "example"}, item.Keywords)
	assert.Equal(t, "Test Provider", item.Provider)
}
