package olm

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"testing"
	"time"

	"github.com/operator-framework/operator-registry/alpha/declcfg"
	"github.com/operator-framework/operator-registry/alpha/property"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// mockRoundTripper is a mock implementation of http.RoundTripper.
type mockRoundTripper struct {
	resp *http.Response
	err  error
}

func (m *mockRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	return m.resp, m.err
}

func TestNewCatalogClient(t *testing.T) {
	client := NewCatalogdClient(&http.Client{}, nil)
	assert.NotNil(t, client)
	assert.NotNil(t, client.httpClient)
}

func TestFetch(t *testing.T) {
	now := time.Now()
	t.Run("should return packages and bundles on successful fetch", func(t *testing.T) {
		pkg := declcfg.Package{
			Schema: "olm.package",
			Name:   "test-package",
		}
		bundle := declcfg.Bundle{
			Schema:  "olm.bundle",
			Name:    "test-bundle",
			Package: "test-package",
			Properties: []property.Property{
				{
					Type:  property.TypePackage,
					Value: json.RawMessage(`{"version":"1.0.0"}`),
				},
				{
					Type:  property.TypeCSVMetadata,
					Value: json.RawMessage(`{}`),
				},
			},
		}

		fbc := declcfg.DeclarativeConfig{
			Packages: []declcfg.Package{pkg},
			Bundles:  []declcfg.Bundle{bundle},
		}

		var buf bytes.Buffer
		require.NoError(t, declcfg.WriteJSON(fbc, &buf))

		resp := &http.Response{
			StatusCode: http.StatusOK,
			Body:       io.NopCloser(&buf),
		}

		client := &CatalogdClient{
			httpClient: &http.Client{
				Transport: &mockRoundTripper{resp: resp},
			},
		}

		packages, fetchedBundles, _, err := client.Fetch("test-catalog", "", &now)
		require.NoError(t, err)
		assert.Equal(t, pkg, *packages[0])
		assert.Equal(t, bundle, *fetchedBundles[0])
	})
	t.Run("should return an error when the http client fails", func(t *testing.T) {
		client := &CatalogdClient{
			httpClient: &http.Client{
				Transport: &mockRoundTripper{err: assert.AnError},
			},
		}

		_, _, _, err := client.Fetch("test-catalog", "", &now)
		assert.Error(t, err)
	})
	t.Run("should return an error when the status code is not OK", func(t *testing.T) {
		resp := &http.Response{
			StatusCode: http.StatusInternalServerError,
			Body:       io.NopCloser(&bytes.Buffer{}),
		}

		client := &CatalogdClient{
			httpClient: &http.Client{
				Transport: &mockRoundTripper{resp: resp},
			},
		}

		_, _, _, err := client.Fetch("test-catalog", "", &now)
		assert.Error(t, err)
	})
	t.Run("should return an error when the response body is invalid", func(t *testing.T) {
		resp := &http.Response{
			StatusCode: http.StatusOK,
			Body:       io.NopCloser(bytes.NewBufferString("invalid json")),
		}

		client := &CatalogdClient{
			httpClient: &http.Client{
				Transport: &mockRoundTripper{resp: resp},
			},
		}

		_, _, _, err := client.Fetch("test-catalog", "", &now)
		assert.Error(t, err)
	})
	t.Run("should return nil if content is not modified", func(t *testing.T) {
		resp := &http.Response{
			StatusCode: http.StatusNotModified,
			Body:       io.NopCloser(&bytes.Buffer{}),
		}

		client := &CatalogdClient{
			httpClient: &http.Client{
				Transport: &mockRoundTripper{resp: resp},
			},
		}

		packages, bundles, _, err := client.Fetch("test-catalog", "", &now)
		require.NoError(t, err)
		assert.Nil(t, packages)
		assert.Nil(t, bundles)
	})
}
func TestGetBundleVersion(t *testing.T) {
	t.Run("should return the version from the package property", func(t *testing.T) {
		bundle := &declcfg.Bundle{
			Properties: []property.Property{
				{
					Type:  "olm.package",
					Value: json.RawMessage(`{"version": "1.0.0"}`),
				},
			},
		}

		version, err := getBundleVersion(bundle)
		require.NoError(t, err)
		assert.Equal(t, "1.0.0", version)
	})

	t.Run("should return an error if the package property is not found", func(t *testing.T) {
		bundle := &declcfg.Bundle{
			Properties: []property.Property{},
		}

		_, err := getBundleVersion(bundle)
		assert.Error(t, err)
	})

	t.Run("should return an error if the package property is malformed", func(t *testing.T) {
		bundle := &declcfg.Bundle{
			Properties: []property.Property{
				{
					Type:  "olm.package",
					Value: json.RawMessage(`{"version":}`),
				},
			},
		}

		_, err := getBundleVersion(bundle)
		assert.Error(t, err)
	})
}
