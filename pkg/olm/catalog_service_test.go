package olm

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/operator-framework/operator-registry/alpha/declcfg"
	"github.com/operator-framework/operator-registry/alpha/property"
	"github.com/patrickmn/go-cache"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockCatalogdClient struct {
	packages         []declcfg.Package
	bundles          []declcfg.Bundle
	packageIconMap   map[string]*declcfg.Package // packageName -> package with icon
	err              error
	fetchCode        int
	fetchPackageErr  error
	fetchPackageCode int
}

func (m *mockCatalogdClient) FetchMetas(catalog string, baseURL string, r *http.Request) (*http.Response, error) {
	// This mock implementation is not used in these tests, but required by the interface
	return nil, fmt.Errorf("FetchMetas not implemented in mock")
}

func (m *mockCatalogdClient) FetchPackageIcon(catalog, baseURL, packageName string) (*http.Response, error) {
	if m.fetchPackageErr != nil {
		return nil, m.fetchPackageErr
	}

	if m.fetchPackageCode == http.StatusNotFound {
		return &http.Response{
			StatusCode: http.StatusNotFound,
			Body:       io.NopCloser(bytes.NewReader([]byte{})),
		}, nil
	}

	pkg, ok := m.packageIconMap[packageName]
	if !ok {
		return &http.Response{
			StatusCode: http.StatusNotFound,
			Body:       io.NopCloser(bytes.NewReader([]byte{})),
		}, nil
	}

	var buf bytes.Buffer
	encoder := json.NewEncoder(&buf)
	pkgMap := map[string]any{
		"schema":         declcfg.SchemaPackage,
		"name":           pkg.Name,
		"defaultChannel": pkg.DefaultChannel,
		"icon":           pkg.Icon,
	}
	if err := encoder.Encode(pkgMap); err != nil {
		return nil, err
	}

	return &http.Response{
		StatusCode: http.StatusOK,
		Body:       io.NopCloser(bytes.NewReader(buf.Bytes())),
	}, nil
}

func (m *mockCatalogdClient) FetchAll(catalog, baseURL, ifNotModifiedSince string, maxAge time.Duration) (*http.Response, error) {
	if m.err != nil {
		return nil, m.err
	}
	if m.fetchCode != 0 {
		return &http.Response{
			StatusCode: m.fetchCode,
			Status:     http.StatusText(m.fetchCode),
			Body:       io.NopCloser(bytes.NewReader(nil)),
		}, nil
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
	service := NewCatalogService(&http.Client{}, nil, c, "")

	assert.NotNil(t, service)
	assert.Equal(t, c, service.cache)
	assert.NotNil(t, service.client)

	service = NewCatalogService(&http.Client{}, nil, c, "4.18.0")
	assert.Equal(t, "4.18.0", service.clusterVersion)
}

func TestUpdateCatalog(t *testing.T) {
	t.Run("should update cache with fetched data", func(t *testing.T) {
		csvMetadata, err := json.Marshal(property.CSVMetadata{
			DisplayName: "Test Bundle",
			Description: "This is a test bundle.",
			Annotations: map[string]string{
				"olm.properties": `[{"type":"olm.maxOpenShiftVersion","value":"4.20"}]`,
			},
		})
		require.NoError(t, err)
		packages := []declcfg.Package{{Name: "test-package"}}
		bundles := []declcfg.Bundle{
			{
				Name:    "test-bundle.v0.5.0",
				Package: "test-package",
				Properties: []property.Property{
					{Type: property.TypePackage, Value: json.RawMessage(`{"packageName":"test-package","version":"0.5.0"}`)},
				},
			},
			{
				Name:    "test-bundle.v1.0.0",
				Package: "test-package",
				Properties: []property.Property{
					{Type: property.TypeCSVMetadata, Value: csvMetadata},
					{Type: property.TypePackage, Value: json.RawMessage(`{"packageName":"test-package","version":"1.0.0"}`)},
				},
			},
			{
				Name:    "test-bundle.v2.0.0",
				Package: "test-package",
				Properties: []property.Property{
					{Type: property.TypeCSVMetadata, Value: csvMetadata},
					{Type: property.TypePackage, Value: json.RawMessage(`{"packageName":"test-package","version":"2.0.0"}`)},
				},
			},
		}
		client := &mockCatalogdClient{
			packages: packages,
			bundles:  bundles,
		}

		c := cache.New(5*time.Minute, 10*time.Minute)
		service := &CatalogService{
			cache:          c,
			client:         client,
			index:          make(map[string]struct{}),
			clusterVersion: "4.18.0",
		}

		err = service.UpdateCatalog("test-catalog", "")
		require.NoError(t, err)

		items, found := c.Get("olm:catalog:test-catalog:items")
		assert.True(t, found)
		require.NotEmpty(t, items)
		cachedItems, ok := items.(cachedCatalog)
		require.True(t, ok)
		assert.Equal(t, "2.0.0", cachedItems.items[0].Version)
		assert.Equal(t, []string{"2.0.0", "1.0.0", "0.5.0"}, cachedItems.items[0].AvailableVersions)
		assert.Equal(t, ClusterCompatibilityUnknown, cachedItems.items[0].ClusterCompatibility)
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

	t.Run("should preserve existing cache on fetch failure", func(t *testing.T) {
		c := cache.New(5*time.Minute, 10*time.Minute)
		// Pre-populate cache with existing data
		existingItems := []ConsoleCatalogItem{{Name: "existing-item", Catalog: "test-catalog"}}
		c.Set(getCatalogItemsKey("test-catalog"), newCachedCatalog(existingItems), cache.DefaultExpiration)
		c.Set(getCatalogBaseURLKey("test-catalog"), "http://catalogd.test", cache.NoExpiration)
		c.Set(getCatalogLastModifiedKey("test-catalog"), "Thu, 01 Jan 2026 00:00:00 GMT", cache.NoExpiration)

		client := &mockCatalogdClient{
			err: fmt.Errorf("connection refused"),
		}
		service := &CatalogService{
			cache:  c,
			client: client,
			index:  map[string]struct{}{"test-catalog": {}},
		}

		err := service.UpdateCatalog("test-catalog", "http://catalogd.test")
		assert.Error(t, err)

		// Verify existing cache data is still intact
		items, found := c.Get(getCatalogItemsKey("test-catalog"))
		assert.True(t, found, "cached items should be preserved on transient error")
		assert.Equal(t, newCachedCatalog(existingItems), items)

		baseURL, found := c.Get(getCatalogBaseURLKey("test-catalog"))
		assert.True(t, found, "cached baseURL should be preserved on transient error")
		assert.Equal(t, "http://catalogd.test", baseURL)

		_, found = c.Get(getCatalogLastModifiedKey("test-catalog"))
		assert.True(t, found, "cached last-modified should be preserved on transient error")

		// Verify index is still intact
		_, inIndex := service.index["test-catalog"]
		assert.True(t, inIndex, "catalog should remain in index on transient error")
	})
}

func TestUpdateCatalogStatusResponses(t *testing.T) {
	tests := []struct {
		name      string
		status    int
		wantError bool
		removed   bool
	}{
		{name: "not modified preserves the cached index", status: http.StatusNotModified},
		{name: "not found removes the cached index", status: http.StatusNotFound, removed: true},
		{name: "server error preserves the cached index", status: http.StatusInternalServerError, wantError: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			items := []ConsoleCatalogItem{{Name: "test-package", Catalog: "test-catalog"}}
			lastModified := "Thu, 01 Jan 2026 00:00:00 GMT"
			c := cache.New(cache.NoExpiration, 0)
			c.Set(getCatalogItemsKey("test-catalog"), newCachedCatalog(items), cache.NoExpiration)
			c.Set(getCatalogLastModifiedKey("test-catalog"), lastModified, cache.NoExpiration)
			c.Set(getCatalogBaseURLKey("test-catalog"), "http://catalogd.test", cache.NoExpiration)
			service := NewCatalogService(&http.Client{}, nil, c, "")
			service.client = &mockCatalogdClient{fetchCode: tt.status}
			service.index["test-catalog"] = struct{}{}
			service.LastModified = lastModified

			err := service.UpdateCatalog("test-catalog", "http://catalogd.test")
			if tt.wantError {
				require.ErrorContains(t, err, "catalogd request failed with status: 500")
			} else {
				require.NoError(t, err)
			}
			item, err := service.GetCatalogItem("test-catalog", "test-package")
			require.NoError(t, err)
			if tt.removed {
				assert.Nil(t, item)
				assert.NotContains(t, service.index, "test-catalog")
				for _, key := range []string{getCatalogItemsKey("test-catalog"), getCatalogBaseURLKey("test-catalog"), getCatalogLastModifiedKey("test-catalog")} {
					_, found := c.Get(key)
					assert.False(t, found, "catalog entry %q should be removed", key)
				}
			} else {
				assert.Equal(t, &items[0], item)
				assert.Contains(t, service.index, "test-catalog")
				assert.Equal(t, lastModified, service.LastModified)
				validator, found := c.Get(getCatalogLastModifiedKey("test-catalog"))
				require.True(t, found)
				assert.Equal(t, lastModified, validator)
			}
		})
	}
}

func TestUpdateCatalogInvalidVersions(t *testing.T) {
	for _, version := range []string{"invalid", "v1.0.0", "1.0", ""} {
		t.Run("rejects version "+version, func(t *testing.T) {
			c := cache.New(5*time.Minute, 10*time.Minute)
			existingItems := []ConsoleCatalogItem{{Name: "existing-item", Catalog: "test-catalog"}}
			lastModified := "Thu, 01 Jan 2026 00:00:00 GMT"
			c.Set(getCatalogItemsKey("test-catalog"), newCachedCatalog(existingItems), cache.NoExpiration)
			c.Set(getCatalogLastModifiedKey("test-catalog"), lastModified, cache.NoExpiration)
			c.Set(getCatalogBaseURLKey("test-catalog"), "http://catalogd.test", cache.NoExpiration)
			service := &CatalogService{
				cache:        c,
				index:        map[string]struct{}{"test-catalog": {}},
				LastModified: lastModified,
				client: &mockCatalogdClient{
					packages: []declcfg.Package{{Name: "test-package"}},
					bundles: []declcfg.Bundle{{
						Name:    "invalid-bundle",
						Package: "test-package",
						// Bundles without CSV metadata must also be validated.
						Properties: []property.Property{property.MustBuildPackage("test-package", version)},
					}},
				},
			}
			err := service.UpdateCatalog("test-catalog", "http://new-catalogd.test")
			require.ErrorContains(t, err, "invalid version")
			items, found := c.Get(getCatalogItemsKey("test-catalog"))
			require.True(t, found)
			assert.Equal(t, newCachedCatalog(existingItems), items)
			validator, found := c.Get(getCatalogLastModifiedKey("test-catalog"))
			require.True(t, found)
			assert.Equal(t, lastModified, validator)
			baseURL, found := c.Get(getCatalogBaseURLKey("test-catalog"))
			require.True(t, found)
			assert.Equal(t, "http://catalogd.test", baseURL)
			assert.Equal(t, lastModified, service.LastModified)
			assert.Contains(t, service.index, "test-catalog")
		})
	}
}

func TestUpdateCatalogPackageCompatibility(t *testing.T) {
	tests := []struct {
		name         string
		olderMaximum string
		want         ClusterCompatibility
	}{
		{name: "older bundle is not ruled out", olderMaximum: "4.20", want: ClusterCompatibilityUnknown},
		{name: "all bundles are incompatible", olderMaximum: "4.17", want: ClusterCompatibilityIncompatible},
		{name: "older bundle declares no maximum", want: ClusterCompatibilityUnknown},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			bundles := []declcfg.Bundle{}
			for i, maximum := range []string{tt.olderMaximum, "4.17"} {
				version := []string{"1.2.0", "1.10.0"}[i]
				bundle := declcfg.Bundle{
					Name:       "test-package.v" + version,
					Package:    "test-package",
					Properties: []property.Property{property.MustBuildPackage("test-package", version)},
				}
				if maximum != "" {
					value, err := json.Marshal(maximum)
					require.NoError(t, err)
					bundle.Properties = append(bundle.Properties, property.Property{Type: "olm.maxOpenShiftVersion", Value: value})
				}
				// Older versions without CSV metadata still contribute to package compatibility.
				if i == 1 {
					bundle.Properties = append(bundle.Properties, property.Property{Type: property.TypeCSVMetadata, Value: json.RawMessage(`{}`)})
				}
				bundles = append(bundles, bundle)
			}
			service := NewCatalogService(&http.Client{}, nil, cache.New(5*time.Minute, 10*time.Minute), "4.18.0")
			service.client = &mockCatalogdClient{packages: []declcfg.Package{{Name: "test-package"}}, bundles: bundles}
			require.NoError(t, service.UpdateCatalog("test-catalog", ""))
			item, err := service.GetCatalogItem("test-catalog", "test-package")
			require.NoError(t, err)
			require.NotNil(t, item)
			assert.Equal(t, "1.10.0", item.Version)
			assert.Equal(t, []string{"1.10.0", "1.2.0"}, item.AvailableVersions)
			assert.Equal(t, tt.want, item.ClusterCompatibility)
		})
	}
}

func TestGetCatalogItems(t *testing.T) {
	c := cache.New(5*time.Minute, 10*time.Minute)
	items := []ConsoleCatalogItem{{Name: "test-item"}}
	c.Set(getCatalogItemsKey("test-catalog"), newCachedCatalog(items), cache.DefaultExpiration)

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

func TestGetCatalogItem(t *testing.T) {
	items := []ConsoleCatalogItem{
		{Name: "first-package", Catalog: "test-catalog"},
		{Name: "middle-package", Catalog: "test-catalog"},
		{Name: "last-package", Catalog: "test-catalog"},
	}
	otherItems := []ConsoleCatalogItem{{Name: "first-package", Catalog: "other-catalog"}}
	tests := []struct {
		name        string
		catalogName string
		packageName string
		want        *ConsoleCatalogItem
		wantError   bool
	}{
		{name: "first package", catalogName: "test-catalog", packageName: "first-package", want: &items[0]},
		{name: "middle package", catalogName: "test-catalog", packageName: "middle-package", want: &items[1]},
		{name: "last package", catalogName: "test-catalog", packageName: "last-package", want: &items[2]},
		{name: "same package in another catalog", catalogName: "other-catalog", packageName: "first-package", want: &otherItems[0]},
		{name: "missing package", catalogName: "test-catalog", packageName: "missing-package"},
		{name: "missing catalog", catalogName: "missing-catalog", packageName: "first-package"},
		{name: "empty catalog", catalogName: "empty-catalog", packageName: "first-package"},
		{name: "malformed cache", catalogName: "malformed-catalog", packageName: "first-package", wantError: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := cache.New(5*time.Minute, 10*time.Minute)
			c.Set(getCatalogItemsKey("test-catalog"), newCachedCatalog(items), cache.NoExpiration)
			c.Set(getCatalogItemsKey("other-catalog"), newCachedCatalog(otherItems), cache.NoExpiration)
			c.Set(getCatalogItemsKey("empty-catalog"), newCachedCatalog([]ConsoleCatalogItem{}), cache.NoExpiration)
			c.Set(getCatalogItemsKey("malformed-catalog"), "malformed cache content", cache.NoExpiration)
			service := NewCatalogService(&http.Client{}, nil, c, "")

			item, err := service.GetCatalogItem(tt.catalogName, tt.packageName)
			if tt.wantError {
				require.ErrorContains(t, err, "malformed cache content")
			} else {
				require.NoError(t, err)
			}
			assert.Equal(t, tt.want, item)
		})
	}
}

func TestGetCatalogItemsInvalidCache(t *testing.T) {
	items := []ConsoleCatalogItem{{Name: "valid-package", Catalog: "valid-catalog"}}
	tests := []struct {
		name      string
		entry     cache.Item
		wantError string
	}{
		{name: "missing catalog", wantError: "cache miss"},
		{name: "malformed catalog", entry: cache.Item{Object: "invalid"}, wantError: "malformed cache content"},
		{
			name:      "expired catalog",
			entry:     cache.Item{Object: newCachedCatalog(items), Expiration: time.Now().Add(-time.Hour).UnixNano()},
			wantError: "cache miss",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			entries := map[string]cache.Item{
				getCatalogItemsKey("valid-catalog"): {Object: newCachedCatalog(items)},
			}
			if tt.entry.Object != nil {
				entries[getCatalogItemsKey("invalid-catalog")] = tt.entry
			}
			c := cache.NewFrom(cache.NoExpiration, 0, entries)
			c.Set(getCatalogBaseURLKey("invalid-catalog"), "http://catalogd.test", cache.NoExpiration)
			c.Set(getCatalogLastModifiedKey("invalid-catalog"), "Thu, 01 Jan 2026 00:00:00 GMT", cache.NoExpiration)
			service := NewCatalogService(&http.Client{}, nil, c, "")
			service.index = map[string]struct{}{"invalid-catalog": {}, "valid-catalog": {}}

			returnedItems, err := service.GetCatalogItems()
			require.ErrorContains(t, err, tt.wantError)
			assert.Nil(t, returnedItems)
			assert.NotContains(t, service.index, "invalid-catalog")
			for _, key := range []string{getCatalogItemsKey("invalid-catalog"), getCatalogBaseURLKey("invalid-catalog"), getCatalogLastModifiedKey("invalid-catalog")} {
				value, found := c.Get(key)
				assert.False(t, found, "invalid catalog entry %q should be removed", key)
				assert.Nil(t, value)
			}
			returnedItems, err = service.GetCatalogItems()
			require.NoError(t, err)
			assert.Equal(t, items, returnedItems)
		})
	}
}

func TestProcessCatalogInvalidData(t *testing.T) {
	tests := []struct {
		name string
		data string
	}{
		{name: "malformed JSON", data: `{"schema":`},
		{name: "invalid package", data: `{"schema":"olm.package","name":"test","defaultChannel":42}`},
		{name: "invalid bundle", data: `{"schema":"olm.bundle","name":"test.v1.0.0","package":"test","image":42}`},
		{name: "missing package property", data: `{"schema":"olm.bundle","name":"test.v1.0.0","package":"test"}`},
		{name: "invalid package property", data: `{"schema":"olm.bundle","name":"test.v1.0.0","package":"test","properties":[{"type":"olm.package","value":{"version":42}}]}`},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			service := &CatalogService{}
			resp := &http.Response{Body: io.NopCloser(strings.NewReader(tt.data))}
			t.Cleanup(func() { resp.Body.Close() })
			packages, bundles, packageBundles, err := service.processCatalog(resp)
			require.Error(t, err)
			assert.Nil(t, packages)
			assert.Nil(t, bundles)
			assert.Nil(t, packageBundles)
		})
	}
}

func TestUpdateCatalogRebuildsPackageIndex(t *testing.T) {
	client := &mockCatalogdClient{}
	setPackages := func(version string, names ...string) {
		client.packages = nil
		client.bundles = nil
		for _, name := range names {
			client.packages = append(client.packages, declcfg.Package{Name: name})
			client.bundles = append(client.bundles, declcfg.Bundle{
				Name:    name + ".v" + version,
				Package: name,
				Properties: []property.Property{
					property.MustBuildPackage(name, version),
					{Type: property.TypeCSVMetadata, Value: json.RawMessage(`{}`)},
				},
			})
		}
	}
	service := NewCatalogService(&http.Client{}, nil, cache.New(5*time.Minute, 10*time.Minute), "4.18.0")
	service.client = client

	setPackages("1.0.0", "retained-package", "removed-package")
	require.NoError(t, service.UpdateCatalog("test-catalog", ""))
	originalItem, err := service.GetCatalogItem("test-catalog", "retained-package")
	require.NoError(t, err)
	require.NotNil(t, originalItem)
	assert.Equal(t, "1.0.0", originalItem.Version)

	// Move the retained package to a different position and replace another package.
	setPackages("2.0.0", "added-package", "retained-package")
	require.NoError(t, service.UpdateCatalog("test-catalog", ""))
	items, err := service.GetCatalogItems()
	require.NoError(t, err)
	require.Len(t, items, 2)
	assert.Equal(t, "added-package", items[0].Name)
	assert.Equal(t, "retained-package", items[1].Name)
	for i := range items {
		item, err := service.GetCatalogItem("test-catalog", items[i].Name)
		require.NoError(t, err)
		require.NotNil(t, item)
		assert.Equal(t, items[i], *item)
		assert.Equal(t, "2.0.0", item.Version)
	}
	item, err := service.GetCatalogItem("test-catalog", "removed-package")
	require.NoError(t, err)
	assert.Nil(t, item)
	assert.Equal(t, "1.0.0", originalItem.Version)

	service.RemoveCatalog("test-catalog")
	item, err = service.GetCatalogItem("test-catalog", "retained-package")
	require.NoError(t, err)
	assert.Nil(t, item)
	items, err = service.GetCatalogItems()
	require.NoError(t, err)
	assert.Empty(t, items)
}

func TestGetPackageIcon(t *testing.T) {
	t.Run("should return icon from cache", func(t *testing.T) {
		c := cache.New(5*time.Minute, 10*time.Minute)
		cachedIcon := &CachedIcon{
			Data:         []byte("cached-icon-data"),
			MediaType:    "image/svg+xml",
			LastModified: time.Now().UTC().Format(http.TimeFormat),
			ETag:         "cached-etag",
		}
		c.Set(getCatalogIconKey("test-catalog", "test-package"), cachedIcon, cache.NoExpiration)

		service := &CatalogService{
			cache: c,
			index: make(map[string]struct{}),
		}

		icon, err := service.GetPackageIcon("test-catalog", "test-package")

		require.NoError(t, err)
		assert.Equal(t, cachedIcon, icon)
	})

	t.Run("should fetch icon from catalogd on cache miss", func(t *testing.T) {
		c := cache.New(5*time.Minute, 10*time.Minute)
		// Set the base URL so the service knows where to fetch from
		c.Set(getCatalogBaseURLKey("test-catalog"), "http://catalogd.test", cache.NoExpiration)

		iconData := []byte("test-icon-data")
		client := &mockCatalogdClient{
			packageIconMap: map[string]*declcfg.Package{
				"test-package": {
					Name: "test-package",
					Icon: &declcfg.Icon{
						Data:      iconData,
						MediaType: "image/png",
					},
				},
			},
		}

		service := &CatalogService{
			cache:  c,
			client: client,
			index:  make(map[string]struct{}),
		}

		icon, err := service.GetPackageIcon("test-catalog", "test-package")

		require.NoError(t, err)
		require.NotNil(t, icon)
		assert.Equal(t, iconData, icon.Data)
		assert.Equal(t, "image/png", icon.MediaType)
		assert.NotEmpty(t, icon.ETag)
		assert.NotEmpty(t, icon.LastModified)

		// Verify the icon was cached
		cachedIcon, found := c.Get(getCatalogIconKey("test-catalog", "test-package"))
		assert.True(t, found)
		assert.Equal(t, icon, cachedIcon)
	})

	t.Run("should return nil when package not found", func(t *testing.T) {
		c := cache.New(5*time.Minute, 10*time.Minute)
		c.Set(getCatalogBaseURLKey("test-catalog"), "http://catalogd.test", cache.NoExpiration)

		client := &mockCatalogdClient{
			packageIconMap:   map[string]*declcfg.Package{},
			fetchPackageCode: http.StatusNotFound,
		}

		service := &CatalogService{
			cache:  c,
			client: client,
			index:  make(map[string]struct{}),
		}

		icon, err := service.GetPackageIcon("test-catalog", "nonexistent-package")

		require.NoError(t, err)
		assert.Nil(t, icon)
	})

	t.Run("should return nil when package has no icon", func(t *testing.T) {
		c := cache.New(5*time.Minute, 10*time.Minute)
		c.Set(getCatalogBaseURLKey("test-catalog"), "http://catalogd.test", cache.NoExpiration)

		client := &mockCatalogdClient{
			packageIconMap: map[string]*declcfg.Package{
				"test-package": {
					Name: "test-package",
					Icon: nil, // No icon
				},
			},
		}

		service := &CatalogService{
			cache:  c,
			client: client,
			index:  make(map[string]struct{}),
		}

		icon, err := service.GetPackageIcon("test-catalog", "test-package")

		require.NoError(t, err)
		assert.Nil(t, icon)
	})

	t.Run("should return error when fetch fails", func(t *testing.T) {
		c := cache.New(5*time.Minute, 10*time.Minute)
		c.Set(getCatalogBaseURLKey("test-catalog"), "http://catalogd.test", cache.NoExpiration)

		client := &mockCatalogdClient{
			fetchPackageErr: fmt.Errorf("network error"),
		}

		service := &CatalogService{
			cache:  c,
			client: client,
			index:  make(map[string]struct{}),
		}

		icon, err := service.GetPackageIcon("test-catalog", "test-package")

		require.Error(t, err)
		assert.Nil(t, icon)
		assert.Contains(t, err.Error(), "network error")
	})
}
