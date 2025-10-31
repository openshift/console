package olm

import (
	"encoding/json"
	"fmt"
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
	packages []*declcfg.Package
	bundles  []*declcfg.Bundle
	err      error
}

func (m *mockCatalogdClient) Fetch(catalog, baseURL string, ifNotModifiedSince *time.Time) ([]*declcfg.Package, []*declcfg.Bundle, *time.Time, error) {
	if m.err != nil {
		return nil, nil, nil, m.err
	}
	return m.packages, m.bundles, nil, nil
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
		packages := []*declcfg.Package{{Name: "test-package"}}
		bundles := []*declcfg.Bundle{{Name: "test-bundle", Package: "test-package", Properties: []property.Property{
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
			cache:               c,
			client:              client,
			index:               make(map[string]string),
			catalogLastModified: make(map[string]time.Time),
		}

		err = service.UpdateCatalog("test-catalog", "")
		require.NoError(t, err)

		items, found := c.Get("olm:catalog-items:test-catalog")
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
			cache:               c,
			client:              client,
			index:               make(map[string]string),
			catalogLastModified: make(map[string]time.Time),
		}

		err := service.UpdateCatalog("test-catalog", "")
		assert.Error(t, err)
	})
}

func TestGetCatalogItems(t *testing.T) {
	c := cache.New(5*time.Minute, 10*time.Minute)
	items := []ConsoleCatalogItem{{Name: "test-item"}}
	c.Set("test-catalog", items, cache.DefaultExpiration)

	now := time.Now()
	service := &CatalogService{
		cache:               c,
		index:               map[string]string{"test-catalog": "test-catalog"},
		catalogLastModified: make(map[string]time.Time),
		LastModified:        now.UTC().Format(http.TimeFormat),
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
