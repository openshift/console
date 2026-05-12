package olm

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/patrickmn/go-cache"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewOLMHandler(t *testing.T) {
	handler := NewOLMHandler("test-url", &http.Client{}, &CatalogService{}, nil)
	assert.NotNil(t, handler)
}

func TestOLMHandler_catalogItemsHandler(t *testing.T) {
	t.Run("should return catalog items", func(t *testing.T) {
		items := []ConsoleCatalogItem{{Name: "test-item"}}
		lastModified := time.Now()
		c := cache.New(5*time.Minute, 10*time.Minute)
		c.Set("olm:catalog:test-catalog:items", items, cache.NoExpiration)
		service := NewCatalogService(&http.Client{}, nil, c)
		service.LastModified = lastModified.UTC().Format(http.TimeFormat)
		service.index["test-catalog"] = struct{}{}

		handler := NewOLMHandler("", nil, service, nil)

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
		handler := NewOLMHandler("", nil, service, nil)

		req := httptest.NewRequest("GET", "/api/olm/catalog-items/", nil)
		req.Header.Set("If-Modified-Since", lastModified.Add(1*time.Second).UTC().Format(http.TimeFormat))
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusNotModified, rr.Code)
	})
}

func TestOLMHandler_catalogdMetasHandler(t *testing.T) {
	t.Run("should return metas from catalogd", func(t *testing.T) {
		// Create a mock catalogd server
		catalogdServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "/api/v1/metas", r.URL.Path)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"schema":"olm.package","name":"test-package"}`))
		}))
		defer catalogdServer.Close()

		c := cache.New(5*time.Minute, 10*time.Minute)
		c.Set(getCatalogBaseURLKey("test-catalog"), catalogdServer.URL, cache.NoExpiration)

		service := NewCatalogService(&http.Client{}, nil, c)
		handler := NewOLMHandler("", nil, service, nil)

		req := httptest.NewRequest("GET", "/api/olm/catalogd/metas/test-catalog", nil)
		req.SetPathValue("catalogName", "test-catalog")
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)
		assert.Contains(t, rr.Body.String(), "test-package")
	})

	t.Run("should return 404 when catalog name is missing from URL", func(t *testing.T) {
		c := cache.New(5*time.Minute, 10*time.Minute)
		service := NewCatalogService(&http.Client{}, nil, c)
		handler := NewOLMHandler("", nil, service, nil)

		req := httptest.NewRequest("GET", "/api/olm/catalogd/metas/", nil)
		// Don't set catalogName path value - URL doesn't match pattern so router returns 404
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusNotFound, rr.Code)
	})

	t.Run("should return 500 when service returns error", func(t *testing.T) {
		c := cache.New(5*time.Minute, 10*time.Minute)
		// Don't set base URL in cache, which will cause an error
		service := NewCatalogService(&http.Client{}, nil, c)
		handler := NewOLMHandler("", nil, service, nil)

		req := httptest.NewRequest("GET", "/api/olm/catalogd/metas/test-catalog", nil)
		req.SetPathValue("catalogName", "test-catalog")
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusInternalServerError, rr.Code)
	})
}

func TestOLMHandler_lifecycleHandler(t *testing.T) {
	t.Run("should proxy lifecycle data from upstream", func(t *testing.T) {
		upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Contains(t, r.URL.Path, "/api/v1alpha1/lifecycles/test-operator")
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"package":"test-operator","versions":[{"name":"1.0"}]}`))
		}))
		defer upstream.Close()

		c := cache.New(5*time.Minute, 10*time.Minute)
		service := NewCatalogService(&http.Client{}, nil, c)
		lifecycleClient := &http.Client{
			Transport: &testTransport{upstream: upstream},
		}
		handler := NewOLMHandler("", nil, service, lifecycleClient)

		req := httptest.NewRequest("GET", "/api/olm/lifecycle/openshift-marketplace/redhat-operators/test-operator", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)
		assert.Contains(t, rr.Body.String(), "test-operator")
	})

	t.Run("should return 400 for invalid catalog namespace", func(t *testing.T) {
		c := cache.New(5*time.Minute, 10*time.Minute)
		service := NewCatalogService(&http.Client{}, nil, c)
		handler := NewOLMHandler("", nil, service, &http.Client{})

		req := httptest.NewRequest("GET", "/api/olm/lifecycle/INVALID-NS/redhat-operators/test-operator", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})

	t.Run("should return 400 for invalid catalog name", func(t *testing.T) {
		c := cache.New(5*time.Minute, 10*time.Minute)
		service := NewCatalogService(&http.Client{}, nil, c)
		handler := NewOLMHandler("", nil, service, &http.Client{})

		req := httptest.NewRequest("GET", "/api/olm/lifecycle/openshift-marketplace/INVALID-CATALOG/test-operator", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})

	t.Run("should return 503 when lifecycle client is nil", func(t *testing.T) {
		c := cache.New(5*time.Minute, 10*time.Minute)
		service := NewCatalogService(&http.Client{}, nil, c)
		handler := NewOLMHandler("", nil, service, nil)

		req := httptest.NewRequest("GET", "/api/olm/lifecycle/openshift-marketplace/redhat-operators/test-operator", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusServiceUnavailable, rr.Code)
	})
}

// testTransport redirects all requests to the upstream test server.
type testTransport struct {
	upstream *httptest.Server
}

func (t *testTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	upstreamURL := t.upstream.URL + req.URL.Path
	newReq, err := http.NewRequestWithContext(req.Context(), req.Method, upstreamURL, req.Body)
	if err != nil {
		return nil, err
	}
	return http.DefaultTransport.RoundTrip(newReq)
}

func TestOLMHandler_catalogIconHandler(t *testing.T) {
	t.Run("should return icon when found in cache", func(t *testing.T) {
		c := cache.New(5*time.Minute, 10*time.Minute)
		icon := &CachedIcon{
			Data:         []byte("test-icon-data"),
			MediaType:    "image/png",
			LastModified: time.Now().UTC().Format(http.TimeFormat),
			ETag:         "abc123",
		}
		c.Set(getCatalogIconKey("test-catalog", "test-package"), icon, cache.NoExpiration)

		service := NewCatalogService(&http.Client{}, nil, c)
		handler := NewOLMHandler("", nil, service, nil)

		req := httptest.NewRequest("GET", "/api/olm/catalog-icons/test-catalog/test-package", nil)
		req.SetPathValue("catalogName", "test-catalog")
		req.SetPathValue("packageName", "test-package")
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)
		assert.Equal(t, "image/png", rr.Header().Get("Content-Type"))
		assert.Equal(t, `"abc123"`, rr.Header().Get("ETag"))
		assert.Equal(t, "public, max-age=86400", rr.Header().Get("Cache-Control"))
		assert.Equal(t, "test-icon-data", rr.Body.String())
	})

	t.Run("should return 404 when icon not found", func(t *testing.T) {
		// Create a mock catalogd server that returns no icon
		catalogdServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusNotFound)
		}))
		defer catalogdServer.Close()

		c := cache.New(5*time.Minute, 10*time.Minute)
		c.Set(getCatalogBaseURLKey("test-catalog"), catalogdServer.URL, cache.NoExpiration)

		service := NewCatalogService(&http.Client{}, nil, c)
		handler := NewOLMHandler("", nil, service, nil)

		req := httptest.NewRequest("GET", "/api/olm/catalog-icons/test-catalog/test-package", nil)
		req.SetPathValue("catalogName", "test-catalog")
		req.SetPathValue("packageName", "test-package")
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusNotFound, rr.Code)
	})

	t.Run("should return 304 when ETag matches", func(t *testing.T) {
		c := cache.New(5*time.Minute, 10*time.Minute)
		icon := &CachedIcon{
			Data:         []byte("test-icon-data"),
			MediaType:    "image/png",
			LastModified: time.Now().UTC().Format(http.TimeFormat),
			ETag:         "abc123",
		}
		c.Set(getCatalogIconKey("test-catalog", "test-package"), icon, cache.NoExpiration)

		service := NewCatalogService(&http.Client{}, nil, c)
		handler := NewOLMHandler("", nil, service, nil)

		req := httptest.NewRequest("GET", "/api/olm/catalog-icons/test-catalog/test-package", nil)
		req.SetPathValue("catalogName", "test-catalog")
		req.SetPathValue("packageName", "test-package")
		req.Header.Set("If-None-Match", `"abc123"`)
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusNotModified, rr.Code)
	})

	t.Run("should return 304 when If-Modified-Since is after LastModified", func(t *testing.T) {
		lastModified := time.Now().Add(-1 * time.Hour)
		c := cache.New(5*time.Minute, 10*time.Minute)
		icon := &CachedIcon{
			Data:         []byte("test-icon-data"),
			MediaType:    "image/png",
			LastModified: lastModified.UTC().Format(http.TimeFormat),
			ETag:         "abc123",
		}
		c.Set(getCatalogIconKey("test-catalog", "test-package"), icon, cache.NoExpiration)

		service := NewCatalogService(&http.Client{}, nil, c)
		handler := NewOLMHandler("", nil, service, nil)

		req := httptest.NewRequest("GET", "/api/olm/catalog-icons/test-catalog/test-package", nil)
		req.SetPathValue("catalogName", "test-catalog")
		req.SetPathValue("packageName", "test-package")
		// Set If-Modified-Since to after the icon's LastModified time
		req.Header.Set("If-Modified-Since", time.Now().UTC().Format(http.TimeFormat))
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusNotModified, rr.Code)
	})

	t.Run("should return icon when fetched from catalogd on cache miss", func(t *testing.T) {
		// Create a mock catalogd server that returns a package with icon
		iconData := []byte("mock-icon-data")
		base64IconData := base64.StdEncoding.EncodeToString(iconData)
		catalogdServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Verify the query parameters
			assert.Equal(t, "olm.package", r.URL.Query().Get("schema"))
			assert.Equal(t, "test-package", r.URL.Query().Get("name"))

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			// Write a package with icon in FBC format (icon data must be base64 encoded)
			pkgJSON := fmt.Sprintf(`{"schema":"olm.package","name":"test-package","icon":{"base64data":"%s","mediatype":"image/png"}}`,
				base64IconData)
			w.Write([]byte(pkgJSON + "\n"))
		}))
		defer catalogdServer.Close()

		c := cache.New(5*time.Minute, 10*time.Minute)
		c.Set(getCatalogBaseURLKey("test-catalog"), catalogdServer.URL, cache.NoExpiration)

		service := NewCatalogService(&http.Client{}, nil, c)
		handler := NewOLMHandler("", nil, service, nil)

		req := httptest.NewRequest("GET", "/api/olm/catalog-icons/test-catalog/test-package", nil)
		req.SetPathValue("catalogName", "test-catalog")
		req.SetPathValue("packageName", "test-package")
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)
		assert.Equal(t, "image/png", rr.Header().Get("Content-Type"))
		assert.NotEmpty(t, rr.Header().Get("ETag"))
		assert.NotEmpty(t, rr.Header().Get("Cache-Control"))
		assert.Equal(t, iconData, rr.Body.Bytes())
	})

	t.Run("should return 404 when URL does not match pattern", func(t *testing.T) {
		c := cache.New(5*time.Minute, 10*time.Minute)
		service := NewCatalogService(&http.Client{}, nil, c)
		handler := NewOLMHandler("", nil, service, nil)

		// URL with missing package name doesn't match the route pattern
		req := httptest.NewRequest("GET", "/api/olm/catalog-icons/test-catalog", nil)
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		// Router returns 404 when URL doesn't match pattern
		assert.Equal(t, http.StatusNotFound, rr.Code)
	})
}
