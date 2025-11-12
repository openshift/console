package olm

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/operator-framework/operator-registry/alpha/declcfg"
	"github.com/operator-framework/operator-registry/alpha/property"
	"github.com/patrickmn/go-cache"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockCatalogdClient struct {
	packages []declcfg.Package
	bundles  []declcfg.Bundle
	err      error
}

func (m *mockCatalogdClient) FetchMetas(catalog string, baseURL string, r *http.Request) (*http.Response, error) {
	// This mock implementation is not used in these tests, but required by the interface
	return nil, fmt.Errorf("FetchMetas not implemented in mock")
}

func (m *mockCatalogdClient) FetchAll(catalog, baseURL, ifNotModifiedSince string, maxAge time.Duration) (*http.Response, error) {
	if m.err != nil {
		return nil, m.err
	}

	var buf bytes.Buffer
	encoder := json.NewEncoder(&buf)

	// Write packages - Meta.MarshalJSON expands the blob, so we create the structure directly
	for _, pkg := range m.packages {
		// Create a map that includes the schema field and all package fields
		pkgMap := map[string]any{
			"schema":         declcfg.SchemaPackage,
			"name":           pkg.Name,
			"defaultChannel": pkg.DefaultChannel,
			"description":    pkg.Description,
			"icon":           pkg.Icon,
		}
		if err := encoder.Encode(pkgMap); err != nil {
			return nil, err
		}
	}

	// Write bundles
	for _, bundle := range m.bundles {
		bundleMap := map[string]any{
			"schema":     declcfg.SchemaBundle,
			"name":       bundle.Name,
			"package":    bundle.Package,
			"image":      bundle.Image,
			"properties": bundle.Properties,
		}
		if err := encoder.Encode(bundleMap); err != nil {
			return nil, err
		}
	}

	header := http.Header{}
	header.Set("Last-Modified", time.Now().UTC().Format(http.TimeFormat))
	header.Set("Content-Type", "application/json")

	return &http.Response{
		StatusCode: http.StatusOK,
		Header:     header,
		Body:       io.NopCloser(bytes.NewReader(buf.Bytes())),
	}, nil
}

func TestMockCatalogdClient(t *testing.T) {
	csvMetadata, err := json.Marshal(property.CSVMetadata{
		DisplayName: "Test Bundle",
		Description: "This is a test bundle.",
	})
	require.NoError(t, err)

	packages := []declcfg.Package{{Name: "test-package"}}
	bundles := []declcfg.Bundle{{
		Name:    "test-bundle",
		Package: "test-package",
		Properties: []property.Property{
			{
				Type:  property.TypeCSVMetadata,
				Value: csvMetadata,
			},
		},
	}}

	client := &mockCatalogdClient{
		packages: packages,
		bundles:  bundles,
	}

	resp, err := client.FetchAll("test-catalog", "", "", 0)
	require.NoError(t, err)
	defer resp.Body.Close()

	// Verify the response can be parsed by WalkMetasReader
	packagesFound := []*declcfg.Package{}
	bundlesFound := []*declcfg.Bundle{}

	err = declcfg.WalkMetasReader(resp.Body, func(meta *declcfg.Meta, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}

		switch meta.Schema {
		case declcfg.SchemaPackage:
			var pkg declcfg.Package
			if err := json.Unmarshal(meta.Blob, &pkg); err != nil {
				return err
			}
			packagesFound = append(packagesFound, &pkg)
		case declcfg.SchemaBundle:
			var bundle declcfg.Bundle
			if err := json.Unmarshal(meta.Blob, &bundle); err != nil {
				return err
			}
			bundlesFound = append(bundlesFound, &bundle)
		}
		return nil
	})

	require.NoError(t, err)
	assert.Len(t, packagesFound, 1)
	assert.Len(t, bundlesFound, 1)
	assert.Equal(t, "test-package", packagesFound[0].Name)
	assert.Equal(t, "test-bundle", bundlesFound[0].Name)
	assert.Equal(t, "test-package", bundlesFound[0].Package)
}

func TestNewCatalogService(t *testing.T) {
	c := cache.New(5*time.Minute, 10*time.Minute)
	service := NewCatalogService(&http.Client{}, nil, c)

	assert.NotNil(t, service)
	assert.Equal(t, c, service.cache)
	assert.NotNil(t, service.client)
}

func TestUpdateCatalog(t *testing.T) {
	t.Run("should update cache with fetched data", func(t *testing.T) {
		csvMetadata, err := json.Marshal(property.CSVMetadata{
			DisplayName: "Test Bundle",
			Description: "This is a test bundle.",
		})
		require.NoError(t, err)
		packages := []declcfg.Package{{Name: "test-package"}}
		bundles := []declcfg.Bundle{{Name: "test-bundle", Package: "test-package", Properties: []property.Property{
			{
				Type:  property.TypeCSVMetadata,
				Value: csvMetadata,
			},
		}}}
		client := &mockCatalogdClient{
			packages: packages,
			bundles:  bundles,
		}

		c := cache.New(5*time.Minute, 10*time.Minute)
		service := &CatalogService{
			cache:  c,
			client: client,
			index:  make(map[string]struct{}),
		}

		err = service.UpdateCatalog("test-catalog", "")
		require.NoError(t, err)

		items, found := c.Get("olm:catalog:test-catalog:items")
		assert.True(t, found)
		assert.NotEmpty(t, items)
		assert.NotNil(t, service.LastModified)
	})

	t.Run("should return error on fetch failure", func(t *testing.T) {
		client := &mockCatalogdClient{
			err: fmt.Errorf("fetch failed"),
		}
		c := cache.New(5*time.Minute, 10*time.Minute)
		service := &CatalogService{
			cache:  c,
			client: client,
			index:  make(map[string]struct{}),
		}

		err := service.UpdateCatalog("test-catalog", "")
		assert.Error(t, err)
	})
}

func TestGetCatalogItems(t *testing.T) {
	c := cache.New(5*time.Minute, 10*time.Minute)
	items := []ConsoleCatalogItem{{Name: "test-item"}}
	c.Set("olm:catalog:test-catalog:items", items, cache.DefaultExpiration)

	now := time.Now()
	service := &CatalogService{
		cache:        c,
		index:        map[string]struct{}{"test-catalog": {}},
		LastModified: now.UTC().Format(http.TimeFormat),
	}

	t.Run("should return items from cache", func(t *testing.T) {
		returnedItems, err := service.GetCatalogItems()

		assert.Nil(t, err)
		assert.Equal(t, items, returnedItems)
	})

	t.Run("should return items if cache is stale", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		lastModified, _ := time.Parse(http.TimeFormat, service.LastModified)
		newLastModified := lastModified.Add(-1 * time.Hour)
		req.Header.Set("If-Modified-Since", newLastModified.UTC().Format(http.TimeFormat))
		returnedItems, err := service.GetCatalogItems()

		assert.Nil(t, err)
		assert.Equal(t, items, returnedItems)
	})
}
