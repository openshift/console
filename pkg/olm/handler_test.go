package olm

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
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

func TestOLMHandler_collectionRoutes(t *testing.T) {
	tests := []struct {
		path       string
		wantStatus int
	}{
		{path: "/api/olm/catalog-items", wantStatus: http.StatusOK},
		{path: "/api/olm/list-operands", wantStatus: http.StatusBadRequest},
		{path: "/api/olm/check-package-manifests", wantStatus: http.StatusBadRequest},
	}
	for _, tt := range tests {
		for _, pathSuffix := range []string{"", "/", "///"} {
			t.Run(tt.path+pathSuffix, func(t *testing.T) {
				c := cache.New(5*time.Minute, 10*time.Minute)
				service := NewCatalogService(&http.Client{}, nil, c)
				handler := NewOLMHandler("", nil, service)
				req := httptest.NewRequest(http.MethodGet, tt.path+pathSuffix, nil)
				rr := httptest.NewRecorder()

				handler.ServeHTTP(rr, req)

				assert.Equal(t, tt.wantStatus, rr.Code)
			})
		}
	}
}

func TestOLMHandler_catalogItemRoutes(t *testing.T) {
	items := []ConsoleCatalogItem{
		{Name: "first-package", Catalog: "test-catalog", LifecycleData: json.RawMessage(`{"package":"first-package","versions":[{"name":"2.0"}]}`)},
		{Name: "second-package", Catalog: "test-catalog", LifecycleData: json.RawMessage(`null`)},
	}
	otherItems := []ConsoleCatalogItem{{Name: "first-package", Catalog: "other-catalog", LifecycleData: json.RawMessage(`{"package":"first-package","versions":[{"name":"3.0"}]}`)}}
	tests := []struct {
		name       string
		path       string
		method     string
		wantStatus int
		wantItems  []ConsoleCatalogItem
		wantItem   *ConsoleCatalogItem
		wantError  string
	}{
		{name: "all catalogs", wantStatus: http.StatusOK, wantItems: append(append([]ConsoleCatalogItem{}, items...), otherItems...)},
		{name: "single catalog", path: "/test-catalog", wantStatus: http.StatusOK, wantItems: items},
		{name: "other catalog", path: "/other-catalog", wantStatus: http.StatusOK, wantItems: otherItems},
		{name: "empty catalog", path: "/empty-catalog", wantStatus: http.StatusOK, wantItems: []ConsoleCatalogItem{}},
		{name: "nil item slice", path: "/nil-items-catalog", wantStatus: http.StatusOK, wantItems: []ConsoleCatalogItem{}},
		{name: "single package", path: "/test-catalog/first-package", wantStatus: http.StatusOK, wantItem: &items[0]},
		{name: "same package in other catalog", path: "/other-catalog/first-package", wantStatus: http.StatusOK, wantItem: &otherItems[0]},
		{name: "encoded catalog", path: "/test%2Dcatalog", wantStatus: http.StatusOK, wantItems: items},
		{name: "encoded package", path: "/test-catalog/first%2Dpackage", wantStatus: http.StatusOK, wantItem: &items[0]},
		{name: "missing catalog", path: "/missing-catalog", wantStatus: http.StatusNotFound, wantError: "catalog not found"},
		{name: "malformed catalog", path: "/malformed-catalog", wantStatus: http.StatusInternalServerError, wantError: "failed to get catalog items"},
		{name: "missing package", path: "/test-catalog/missing-package", wantStatus: http.StatusNotFound, wantError: "catalog item not found"},
		{name: "encoded slash in package", path: "/test-catalog/first-package%2F", wantStatus: http.StatusNotFound, wantError: "catalog item not found"},
		{name: "extra segment", path: "/test-catalog/first-package/extra", wantStatus: http.StatusNotFound},
		{name: "unsupported method", path: "/test-catalog", method: http.MethodPost, wantStatus: http.StatusMethodNotAllowed},
	}
	for _, tt := range tests {
		for _, suffix := range []string{"", "/", "///"} {
			t.Run(fmt.Sprintf("%s (suffix %q)", tt.name, suffix), func(t *testing.T) {
				c := cache.New(cache.NoExpiration, 0)
				c.Set(getCatalogItemsKey("test-catalog"), newCachedCatalog(items), cache.NoExpiration)
				c.Set(getCatalogItemsKey("other-catalog"), newCachedCatalog(otherItems), cache.NoExpiration)
				c.Set(getCatalogItemsKey("empty-catalog"), newCachedCatalog([]ConsoleCatalogItem{}), cache.NoExpiration)
				c.Set(getCatalogItemsKey("nil-items-catalog"), newCachedCatalog(nil), cache.NoExpiration)
				c.Set(getCatalogItemsKey("malformed-catalog"), "invalid", cache.NoExpiration)
				service := NewCatalogService(&http.Client{}, nil, c)
				service.index = map[string]struct{}{"test-catalog": {}, "other-catalog": {}, "empty-catalog": {}, "nil-items-catalog": {}}
				handler := NewOLMHandler("", nil, service)
				method := tt.method
				if method == "" {
					method = http.MethodGet
				}
				req := httptest.NewRequest(method, "/api/olm/catalog-items"+tt.path+suffix, nil)
				rr := httptest.NewRecorder()

				handler.ServeHTTP(rr, req)

				require.Equal(t, tt.wantStatus, rr.Code)
				assert.Empty(t, rr.Header().Get("Location"), "trailing slashes should not require a redirect")
				if tt.wantItems != nil {
					assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))
					var returnedItems []ConsoleCatalogItem
					require.NoError(t, json.Unmarshal(rr.Body.Bytes(), &returnedItems))
					require.NotNil(t, returnedItems, "collections must encode as arrays, including empty collections")
					assert.ElementsMatch(t, tt.wantItems, returnedItems)
				}
				if tt.wantItem != nil {
					assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))
					var returnedItem ConsoleCatalogItem
					require.NoError(t, json.Unmarshal(rr.Body.Bytes(), &returnedItem))
					assert.Equal(t, *tt.wantItem, returnedItem)
				}
				if tt.wantError != "" {
					assert.JSONEq(t, fmt.Sprintf(`{"error":%q}`, tt.wantError), rr.Body.String())
				}
			})
		}
	}
}

func TestOLMHandler_catalogItemsForCatalogCaching(t *testing.T) {
	lastModified := time.Now().UTC().Truncate(time.Second)
	tests := []struct {
		name            string
		catalog         string
		ifModifiedSince string
		wantStatus      int
	}{
		{name: "modified", catalog: "test-catalog", ifModifiedSince: lastModified.Add(-time.Hour).Format(http.TimeFormat), wantStatus: http.StatusOK},
		{name: "not modified", catalog: "test-catalog", ifModifiedSince: lastModified.Format(http.TimeFormat), wantStatus: http.StatusNotModified},
		{name: "invalid header", catalog: "test-catalog", ifModifiedSince: "invalid", wantStatus: http.StatusBadRequest},
		{name: "missing catalog", catalog: "missing-catalog", ifModifiedSince: lastModified.Format(http.TimeFormat), wantStatus: http.StatusNotFound},
	}
	for _, tt := range tests {
		for _, suffix := range []string{"", "/", "///"} {
			t.Run(fmt.Sprintf("%s (suffix %q)", tt.name, suffix), func(t *testing.T) {
				c := cache.New(cache.NoExpiration, 0)
				c.Set(getCatalogItemsKey("test-catalog"), newCachedCatalog([]ConsoleCatalogItem{}), cache.NoExpiration)
				service := NewCatalogService(&http.Client{}, nil, c)
				service.LastModified = lastModified.Format(http.TimeFormat)
				handler := NewOLMHandler("", nil, service)
				req := httptest.NewRequest(http.MethodGet, "/api/olm/catalog-items/"+tt.catalog+suffix, nil)
				req.Header.Set("If-Modified-Since", tt.ifModifiedSince)
				rr := httptest.NewRecorder()

				handler.ServeHTTP(rr, req)

				require.Equal(t, tt.wantStatus, rr.Code)
				if tt.wantStatus == http.StatusOK {
					assert.Equal(t, service.LastModified, rr.Header().Get("Last-Modified"))
					assert.JSONEq(t, `[]`, rr.Body.String())
				}
				if tt.wantStatus == http.StatusNotModified {
					assert.Empty(t, rr.Body.String())
				}
			})
		}
	}
}

func TestOLMHandler_catalogItemsHandler(t *testing.T) {
	t.Run("should return catalog items", func(t *testing.T) {
		items := []ConsoleCatalogItem{{
			Name:          "test-item",
			LifecycleData: json.RawMessage(`{"package":"test-item","versions":[{"name":"2.0"}]}`),
		}}
		lastModified := time.Now()
		c := cache.New(5*time.Minute, 10*time.Minute)
		c.Set(getCatalogItemsKey("test-catalog"), newCachedCatalog(items), cache.NoExpiration)
		service := NewCatalogService(&http.Client{}, nil, c)
		service.LastModified = lastModified.UTC().Format(http.TimeFormat)
		service.index["test-catalog"] = struct{}{}

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

func TestOLMHandler_catalogItemHandler(t *testing.T) {
	items := []ConsoleCatalogItem{{
		Name:          "test-item",
		Catalog:       "test-catalog",
		LifecycleData: json.RawMessage(`{"package":"test-item","versions":[{"name":"2.0"}]}`),
	}}
	tests := []struct {
		name        string
		method      string
		packageName string
		cachedItems interface{}
		wantStatus  int
		wantItem    *ConsoleCatalogItem
	}{
		{
			name:        "returns a single catalog item",
			method:      http.MethodGet,
			packageName: "test-item",
			cachedItems: newCachedCatalog(items),
			wantStatus:  http.StatusOK,
			wantItem:    &items[0],
		},
		{
			name:        "returns not found when the item is missing",
			method:      http.MethodGet,
			packageName: "missing-item",
			cachedItems: newCachedCatalog([]ConsoleCatalogItem{}),
			wantStatus:  http.StatusNotFound,
		},
		{
			name:        "rejects unsupported methods",
			method:      http.MethodPost,
			packageName: "test-item",
			cachedItems: newCachedCatalog(items),
			wantStatus:  http.StatusMethodNotAllowed,
		},
		{
			name:        "returns a generic error for malformed cache content",
			method:      http.MethodGet,
			packageName: "test-item",
			cachedItems: "malformed cache content",
			wantStatus:  http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		for _, pathSuffix := range []string{"", "/", "///"} {
			t.Run(fmt.Sprintf("%s (suffix %q)", tt.name, pathSuffix), func(t *testing.T) {
				c := cache.New(5*time.Minute, 10*time.Minute)
				c.Set(getCatalogItemsKey("test-catalog"), tt.cachedItems, cache.NoExpiration)
				service := NewCatalogService(&http.Client{}, nil, c)
				handler := NewOLMHandler("", nil, service)

				path := "/api/olm/catalog-items/test-catalog/" + tt.packageName + pathSuffix
				req := httptest.NewRequest(tt.method, path, nil)
				rr := httptest.NewRecorder()
				handler.ServeHTTP(rr, req)

				assert.Equal(t, tt.wantStatus, rr.Code)
				if tt.wantStatus == http.StatusInternalServerError {
					assert.JSONEq(t, `{"error":"failed to get catalog item"}`, rr.Body.String())
				}
				if tt.wantItem != nil {
					var returnedItem ConsoleCatalogItem
					err := json.Unmarshal(rr.Body.Bytes(), &returnedItem)
					require.NoError(t, err)
					assert.Equal(t, *tt.wantItem, returnedItem)
					var body map[string]json.RawMessage
					require.NoError(t, json.Unmarshal(rr.Body.Bytes(), &body))
					assert.Contains(t, body, "lifecycleData")
					assert.NotContains(t, body, "availableVersions")
					assert.NotContains(t, body, "clusterCompatibility")
					assert.NotContains(t, body, "metadata")
				}
			})
		}
	}
}

func TestOLMHandler_catalogItemHandlerMissingParameters(t *testing.T) {
	tests := []struct {
		name        string
		catalogName string
		packageName string
	}{
		{name: "missing catalog", packageName: "test-package"},
		{name: "missing package", catalogName: "test-catalog"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := &OLMHandler{}
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			req.SetPathValue("catalogName", tt.catalogName)
			req.SetPathValue("packageName", tt.packageName)
			rr := httptest.NewRecorder()
			handler.catalogItemHandler(rr, req)
			assert.Equal(t, http.StatusBadRequest, rr.Code)
			assert.JSONEq(t, `{"error":"catalog name and package name are required"}`, rr.Body.String())
		})
	}
}

type failingResponseWriter struct {
	*httptest.ResponseRecorder
	writes int
}

func (w *failingResponseWriter) Write([]byte) (int, error) {
	w.writes++
	return 0, io.ErrClosedPipe
}

func TestOLMHandler_catalogItemHandlerEncodingFailure(t *testing.T) {
	c := cache.New(cache.NoExpiration, 0)
	c.Set(getCatalogItemsKey("test-catalog"), newCachedCatalog([]ConsoleCatalogItem{{Name: "test-package"}}), cache.NoExpiration)
	handler := NewOLMHandler("", nil, NewCatalogService(&http.Client{}, nil, c))
	req := httptest.NewRequest(http.MethodGet, "/api/olm/catalog-items/test-catalog/test-package", nil)
	w := &failingResponseWriter{ResponseRecorder: httptest.NewRecorder()}

	handler.ServeHTTP(w, req)

	assert.Equal(t, 1, w.writes, "an encoding failure must not trigger another response write")
	assert.Equal(t, http.StatusOK, w.Code, "the handler must not attempt a new error response after writing begins")
	assert.Equal(t, "application/json", w.Header().Get("Content-Type"))
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
		handler := NewOLMHandler("", nil, service)

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
		handler := NewOLMHandler("", nil, service)

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
		handler := NewOLMHandler("", nil, service)

		req := httptest.NewRequest("GET", "/api/olm/catalogd/metas/test-catalog", nil)
		req.SetPathValue("catalogName", "test-catalog")
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusInternalServerError, rr.Code)
	})
}

func TestOLMHandler_lifecycleHandler(t *testing.T) {
	t.Run("should reject invalid catalogNamespace", func(t *testing.T) {
		c := cache.New(5*time.Minute, 10*time.Minute)
		service := NewCatalogService(&http.Client{}, nil, c)
		handler := NewOLMHandler("", nil, service)

		req := httptest.NewRequest("GET", "/api/olm/lifecycle/evil.attacker.com/redhat-operators/test-operator", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
		assert.Contains(t, rr.Body.String(), "The catalog namespace is not valid.")
	})

	t.Run("should reject catalogNamespace with dots", func(t *testing.T) {
		c := cache.New(5*time.Minute, 10*time.Minute)
		service := NewCatalogService(&http.Client{}, nil, c)
		handler := NewOLMHandler("", nil, service)

		req := httptest.NewRequest("GET", "/api/olm/lifecycle/my.namespace/redhat-operators/test-operator", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})

	t.Run("should reject invalid catalogName with uppercase", func(t *testing.T) {
		c := cache.New(5*time.Minute, 10*time.Minute)
		service := NewCatalogService(&http.Client{}, nil, c)
		handler := NewOLMHandler("", nil, service)

		req := httptest.NewRequest("GET", "/api/olm/lifecycle/openshift-marketplace/HAS-CAPS/test-operator", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})

	t.Run("should reject non-GET methods", func(t *testing.T) {
		c := cache.New(5*time.Minute, 10*time.Minute)
		service := NewCatalogService(&http.Client{}, nil, c)
		handler := NewOLMHandler("", nil, service)

		req := httptest.NewRequest("POST", "/api/olm/lifecycle/openshift-marketplace/redhat-operators/test-operator", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusMethodNotAllowed, rr.Code)
	})

	t.Run("should return 404 when URL does not match pattern", func(t *testing.T) {
		c := cache.New(5*time.Minute, 10*time.Minute)
		service := NewCatalogService(&http.Client{}, nil, c)
		handler := NewOLMHandler("", nil, service)

		req := httptest.NewRequest("GET", "/api/olm/lifecycle/openshift-marketplace/redhat-operators", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusNotFound, rr.Code)
	})
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
		handler := NewOLMHandler("", nil, service)

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
		handler := NewOLMHandler("", nil, service)

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
		handler := NewOLMHandler("", nil, service)

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
		handler := NewOLMHandler("", nil, service)

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
		handler := NewOLMHandler("", nil, service)

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
		handler := NewOLMHandler("", nil, service)

		// URL with missing package name doesn't match the route pattern
		req := httptest.NewRequest("GET", "/api/olm/catalog-icons/test-catalog", nil)
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		// Router returns 404 when URL doesn't match pattern
		assert.Equal(t, http.StatusNotFound, rr.Code)
	})
}
