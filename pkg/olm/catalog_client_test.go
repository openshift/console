package olm

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	"github.com/openshift/console/pkg/proxy"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewCatalogdClient(t *testing.T) {
	client := NewCatalogdClient(&http.Client{}, nil)
	assert.NotNil(t, client)
	assert.NotNil(t, client.httpClient)
	assert.Nil(t, client.proxyConfig)
}

func TestCatalogdClient_FetchAll(t *testing.T) {
	t.Run("should fetch with base URL", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "/api/v1/all", r.URL.Path)
			assert.Equal(t, http.MethodGet, r.Method)
			w.Header().Set("Last-Modified", time.Now().UTC().Format(http.TimeFormat))
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("{}"))
		}))
		defer server.Close()

		client := NewCatalogdClient(server.Client(), nil)
		resp, err := client.FetchAll("test-catalog", server.URL, "", 0)

		require.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
		resp.Body.Close()
	})

	t.Run("should fetch with If-Modified-Since header", func(t *testing.T) {
		lastModified := time.Now().Add(-1 * time.Hour).UTC().Format(http.TimeFormat)
		maxAge := 24 * time.Hour

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, lastModified, r.Header.Get("If-Modified-Since"))
			assert.Equal(t, "max-age=86400", r.Header.Get("Cache-Control"))
			w.WriteHeader(http.StatusNotModified)
		}))
		defer server.Close()

		client := NewCatalogdClient(server.Client(), nil)
		resp, err := client.FetchAll("test-catalog", server.URL, lastModified, maxAge)

		require.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, http.StatusNotModified, resp.StatusCode)
		resp.Body.Close()
	})

	t.Run("should fetch with proxy config", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "/catalogs/test-catalog/api/v1/all", r.URL.Path)
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("{}"))
		}))
		defer server.Close()

		proxyURL, err := url.Parse(server.URL)
		require.NoError(t, err)

		proxyConfig := &proxy.Config{
			Endpoint: proxyURL,
		}

		client := NewCatalogdClient(server.Client(), proxyConfig)
		resp, err := client.FetchAll("test-catalog", "", "", 0)

		require.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
		resp.Body.Close()
	})

	t.Run("should return error when baseURL is empty and no proxy config", func(t *testing.T) {
		client := NewCatalogdClient(&http.Client{}, nil)
		resp, err := client.FetchAll("test-catalog", "", "", 0)

		assert.Error(t, err)
		assert.Nil(t, resp)
		assert.Contains(t, err.Error(), "baseURL or proxy configuration is required")
	})
}

func TestCatalogdClient_FetchMetas(t *testing.T) {
	t.Run("should fetch metas with base URL", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "/api/v1/metas", r.URL.Path)
			assert.Equal(t, http.MethodGet, r.Method)
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("{}"))
		}))
		defer server.Close()

		req := httptest.NewRequest(http.MethodGet, "/test", nil)

		client := NewCatalogdClient(server.Client(), nil)
		resp, err := client.FetchMetas("test-catalog", server.URL, req)

		require.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
		resp.Body.Close()
	})

	t.Run("should fetch metas with proxy config", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "/catalogs/test-catalog/api/v1/metas", r.URL.Path)
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("{}"))
		}))
		defer server.Close()

		proxyURL, err := url.Parse(server.URL)
		require.NoError(t, err)

		proxyConfig := &proxy.Config{
			Endpoint: proxyURL,
		}

		req := httptest.NewRequest(http.MethodGet, "/test", nil)

		client := NewCatalogdClient(server.Client(), proxyConfig)
		resp, err := client.FetchMetas("test-catalog", "", req)

		require.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
		resp.Body.Close()
	})

	t.Run("should preserve request method", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, http.MethodPost, r.Method)
			w.WriteHeader(http.StatusOK)
		}))
		defer server.Close()

		req := httptest.NewRequest(http.MethodPost, "/test", nil)

		client := NewCatalogdClient(server.Client(), nil)
		resp, err := client.FetchMetas("test-catalog", server.URL, req)

		require.NoError(t, err)
		assert.NotNil(t, resp)
		resp.Body.Close()
	})

	t.Run("should return error when baseURL is empty and no proxy config", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/test", nil)

		client := NewCatalogdClient(&http.Client{}, nil)
		resp, err := client.FetchMetas("test-catalog", "", req)

		assert.Error(t, err)
		assert.Nil(t, resp)
		assert.Contains(t, err.Error(), "baseURL or proxy configuration is required")
	})
}

func TestCatalogdClient_buildCatalogdURL(t *testing.T) {
	t.Run("should build URL with proxy config", func(t *testing.T) {
		proxyURL, err := url.Parse("http://proxy.example.com:8080")
		require.NoError(t, err)

		proxyConfig := &proxy.Config{
			Endpoint: proxyURL,
		}

		client := &CatalogdClient{
			proxyConfig: proxyConfig,
		}

		result, err := client.buildCatalogdURL("my-catalog", "", "/api/v1/all")

		require.NoError(t, err)
		assert.Equal(t, "http://proxy.example.com:8080/catalogs/my-catalog/api/v1/all", result)
	})

	t.Run("should build URL with base URL", func(t *testing.T) {
		client := &CatalogdClient{}

		result, err := client.buildCatalogdURL("my-catalog", "http://catalogd.example.com", "/api/v1/all")

		require.NoError(t, err)
		assert.Equal(t, "http://catalogd.example.com/api/v1/all", result)
	})

	t.Run("should return error when both baseURL and proxy config are missing", func(t *testing.T) {
		client := &CatalogdClient{}

		result, err := client.buildCatalogdURL("my-catalog", "", "/api/v1/all")

		assert.Error(t, err)
		assert.Equal(t, "", result)
		assert.Contains(t, err.Error(), "baseURL or proxy configuration is required")
	})

	t.Run("should prefer proxy config over base URL", func(t *testing.T) {
		proxyURL, err := url.Parse("http://proxy.example.com")
		require.NoError(t, err)

		proxyConfig := &proxy.Config{
			Endpoint: proxyURL,
		}

		client := &CatalogdClient{
			proxyConfig: proxyConfig,
		}

		result, err := client.buildCatalogdURL("my-catalog", "http://catalogd.example.com", "/api/v1/all")

		require.NoError(t, err)
		assert.Equal(t, "http://proxy.example.com/catalogs/my-catalog/api/v1/all", result)
		assert.NotContains(t, result, "catalogd.example.com")
	})
}
