package olm

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/operator-framework/operator-registry/alpha/declcfg"
	"github.com/patrickmn/go-cache"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockCatalogdClient struct {
	packages []*declcfg.Package
	bundles  []*declcfg.Bundle
	err      error
}

func (m *mockCatalogdClient) Fetch(catalog, baseURL string, ifNotModifiedSince *time.Time) ([]*declcfg.Package, []*declcfg.Bundle, error) {
	if m.err != nil {
		return nil, nil, m.err
	}
	return m.packages, m.bundles, nil
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
		packages := []*declcfg.Package{{Name: "test-package"}}
		bundles := []*declcfg.Bundle{{Name: "test-bundle", Package: "test-package"}}
		client := &mockCatalogdClient{
			packages: packages,
			bundles:  bundles,
		}

		c := cache.New(5*time.Minute, 10*time.Minute)
		service := &CatalogService{
			cache:    c,
			client:   client,
			catalogs: make(map[string]string),
		}

		err := service.UpdateCatalog("test-catalog", "")
		require.NoError(t, err)

		items, found := c.Get("test-catalog")
		assert.True(t, found)
		assert.NotEmpty(t, items)
		assert.NotZero(t, service.LastModified)
	})

	t.Run("should return error on fetch failure", func(t *testing.T) {
		client := &mockCatalogdClient{
			err: fmt.Errorf("fetch failed"),
		}
		c := cache.New(5*time.Minute, 10*time.Minute)
		service := &CatalogService{
			cache:    c,
			client:   client,
			catalogs: make(map[string]string),
		}

		err := service.UpdateCatalog("test-catalog", "")
		assert.Error(t, err)
	})
}

func TestGetCatalogItems(t *testing.T) {
	c := cache.New(5*time.Minute, 10*time.Minute)
	items := []ConsoleCatalogItem{{Name: "test-item"}}
	c.Set("test-catalog", items, cache.DefaultExpiration)

	service := &CatalogService{
		cache:        c,
		catalogs:     map[string]string{"test-catalog": "test-catalog"},
		LastModified: time.Now(),
	}

	t.Run("should return items from cache", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		returnedItems, err := service.GetCatalogItems(req)

		assert.Nil(t, err)
		assert.Equal(t, items, returnedItems)
	})

	t.Run("should return items if cache is stale", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		req.Header.Set("If-Modified-Since", service.LastModified.Add(-1*time.Hour).UTC().Format(http.TimeFormat))
		returnedItems, err := service.GetCatalogItems(req)

		assert.Nil(t, err)
		assert.Equal(t, items, returnedItems)
	})
}
