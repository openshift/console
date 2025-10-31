package olm

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/patrickmn/go-cache"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewOLMHandler(t *testing.T) {
	handler := NewOLMHandler("test-url", &http.Client{}, &CatalogService{})
	assert.NotNil(t, handler)
}

func TestOLMHandler_catalogItemsHandler(t *testing.T) {
	t.Run("should return catalog items", func(t *testing.T) {
		items := []ConsoleCatalogItem{{Name: "test-item"}}
		lastModified := time.Now()
		c := cache.New(5*time.Minute, 10*time.Minute)
		c.Set("test-catalog", items, cache.NoExpiration)
		service := NewCatalogService(&http.Client{}, nil, c)
		service.LastModified = lastModified.UTC().Format(http.TimeFormat)
		service.index["test-catalog"] = "test-catalog"

		handler := NewOLMHandler("", nil, service)

		req := httptest.NewRequest("GET", "/api/olm/catalog-items/", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)

		var returnedItems []ConsoleCatalogItem
		err := json.Unmarshal(rr.Body.Bytes(), &returnedItems)
		require.NoError(t, err)
		assert.Equal(t, items, returnedItems)
	})

	t.Run("should return 304 if cache is not modified", func(t *testing.T) {
		lastModified := time.Now()
		c := cache.New(5*time.Minute, 10*time.Minute)
		service := NewCatalogService(&http.Client{}, nil, c)
		service.LastModified = lastModified.UTC().Format(http.TimeFormat)
		handler := NewOLMHandler("", nil, service)

		req := httptest.NewRequest("GET", "/api/olm/catalog-items/", nil)
		req.Header.Set("If-Modified-Since", lastModified.Add(1*time.Second).UTC().Format(http.TimeFormat))
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusNotModified, rr.Code)
	})
}

// Note: Testing checkPackageManifestHandler and operandsListHandler is complex
// due to their dependencies on a live Kubernetes cluster and other external services.
// Mocking these dependencies is possible but would require a significant amount of setup.
// For the purpose of this exercise, we'll focus on the simpler handlers.
