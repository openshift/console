package plugins

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path"
	"strings"
	"testing"
)

// setupLocalesDir creates a PublicDir with a locales/en/public.json translation
// file and a sibling secret.json outside the locales directory, returning the
// PublicDir path.
func setupLocalesDir(t *testing.T) string {
	t.Helper()
	publicDir := t.TempDir()

	localesEn := path.Join(publicDir, "locales", "en")
	if err := os.MkdirAll(localesEn, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path.Join(localesEn, "public.json"), []byte(`{"hello":"world"}`), 0644); err != nil {
		t.Fatal(err)
	}
	// A JSON file outside the locales directory that traversal should NOT reach.
	// Its content uses a sentinel that does not appear in any request URL so a
	// leak can be detected without false positives from reflected query params.
	if err := os.WriteFile(path.Join(publicDir, "secret.json"), []byte(`{"exfiltrated":"TOPSECRETVALUE"}`), 0644); err != nil {
		t.Fatal(err)
	}
	return publicDir
}

func TestHandleI18nResources_ServesValidResource(t *testing.T) {
	publicDir := setupLocalesDir(t)
	h := NewPluginsHandler(&http.Client{}, map[string]string{}, publicDir)

	req := httptest.NewRequest(http.MethodGet, "/locales/resource.json?lng=en&ns=public", nil)
	rec := httptest.NewRecorder()
	h.HandleI18nResources(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d (body: %s)", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"hello":"world"`) {
		t.Errorf("expected translation content, got %q", rec.Body.String())
	}
}

// TestHandleI18nResources_RejectsTraversal ensures neither the 'lng' nor the
// 'ns' parameter can be used to read files outside PublicDir/locales.
func TestHandleI18nResources_RejectsTraversal(t *testing.T) {
	publicDir := setupLocalesDir(t)
	h := NewPluginsHandler(&http.Client{}, map[string]string{}, publicDir)

	cases := []struct {
		name  string
		query string
	}{
		{"traversal via ns", "lng=en&ns=../secret"},
		{"traversal via lng", "lng=../&ns=secret"},
		{"deep traversal via lng", "lng=../../../../etc&ns=passwd"},
		{"absolute-ish ns", "lng=en&ns=/etc/passwd"},
		{"encoded dot segments in lng", "lng=..%2F..&ns=secret"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/locales/resource.json?"+tc.query, nil)
			rec := httptest.NewRecorder()
			h.HandleI18nResources(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected 400 for traversal attempt, got %d (body: %q)", rec.Code, rec.Body.String())
			}
			// Assert on the file's sentinel content, not the query string, since
			// the error response echoes the request URL.
			if strings.Contains(rec.Body.String(), "TOPSECRETVALUE") {
				t.Errorf("response leaked out-of-tree file content: %q", rec.Body.String())
			}
		})
	}
}

// TestHandleI18nResources_ProxiesValidPluginRequest ensures a legitimate
// plugin__ namespace with a valid locale is still proxied to the plugin
// service (i.e. the traversal validation does not over-block real requests).
func TestHandleI18nResources_ProxiesValidPluginRequest(t *testing.T) {
	var proxiedPath string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		proxiedPath = r.URL.Path
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"plugin":"translation"}`))
	}))
	defer upstream.Close()
	upstreamURL, _ := url.Parse(upstream.URL)

	h := NewPluginsHandler(&http.Client{}, map[string]string{"helm": upstreamURL.String()}, t.TempDir())

	req := httptest.NewRequest(http.MethodGet, "/locales/resource.json?lng=zh-CN&ns=plugin__helm", nil)
	rec := httptest.NewRecorder()
	h.HandleI18nResources(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 for valid plugin request, got %d (body: %s)", rec.Code, rec.Body.String())
	}
	if want := "/locales/zh-CN/plugin__helm.json"; proxiedPath != want {
		t.Errorf("expected proxied path %q, got %q", want, proxiedPath)
	}
}

// TestHandleI18nResources_RejectsTraversalForPlugin ensures a malicious 'lng'
// is rejected before it can be injected into a plugin-service request path.
func TestHandleI18nResources_RejectsTraversalForPlugin(t *testing.T) {
	var proxiedPath string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		proxiedPath = r.URL.Path
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()
	upstreamURL, _ := url.Parse(upstream.URL)

	h := NewPluginsHandler(&http.Client{}, map[string]string{"helm": upstreamURL.String()}, t.TempDir())

	req := httptest.NewRequest(http.MethodGet, "/locales/resource.json?lng=../../../../secret&ns=plugin__helm", nil)
	rec := httptest.NewRecorder()
	h.HandleI18nResources(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for malicious lng, got %d", rec.Code)
	}
	if proxiedPath != "" {
		t.Errorf("malicious request was proxied to plugin with path %q", proxiedPath)
	}
}

// TestHandlePluginAssets_ProxiesValidRequest ensures a legitimate asset path is
// proxied to the plugin service unchanged.
func TestHandlePluginAssets_ProxiesValidRequest(t *testing.T) {
	var proxiedPath string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		proxiedPath = r.URL.Path
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"manifest":"ok"}`))
	}))
	defer upstream.Close()
	upstreamURL, _ := url.Parse(upstream.URL)

	h := NewPluginsHandler(&http.Client{}, map[string]string{"console-demo-plugin": upstreamURL.String()}, t.TempDir())

	// The pluginAssetsEndpoint prefix is stripped before the handler runs, so the
	// path seen here is "<plugin-name>/<asset-path>" with no leading slash.
	req := httptest.NewRequest(http.MethodGet, "http://console.example.com", nil)
	req.URL.Path = "console-demo-plugin/plugin-manifest.json"
	rec := httptest.NewRecorder()
	h.HandlePluginAssets(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 for valid asset request, got %d (body: %s)", rec.Code, rec.Body.String())
	}
	if want := "/plugin-manifest.json"; proxiedPath != want {
		t.Errorf("expected proxied path %q, got %q", want, proxiedPath)
	}
}

// TestHandlePluginAssets_RejectsTraversal ensures a ".." asset path cannot be
// used to traverse above the plugin's asset root on the plugin service.
func TestHandlePluginAssets_RejectsTraversal(t *testing.T) {
	var proxied bool
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		proxied = true
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()
	upstreamURL, _ := url.Parse(upstream.URL)

	h := NewPluginsHandler(&http.Client{}, map[string]string{"console-demo-plugin": upstreamURL.String()}, t.TempDir())

	cases := []struct {
		name string
		path string
	}{
		{"parent traversal", "console-demo-plugin/../../etc/passwd"},
		{"nested traversal", "console-demo-plugin/assets/../../../secret"},
		{"trailing traversal", "console-demo-plugin/foo/.."},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			proxied = false
			// The pluginAssetsEndpoint prefix is stripped before the handler runs,
			// so the path seen here has no leading slash.
			req := httptest.NewRequest(http.MethodGet, "http://console.example.com", nil)
			req.URL.Path = tc.path
			rec := httptest.NewRecorder()
			h.HandlePluginAssets(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected 400 for traversal attempt, got %d (body: %q)", rec.Code, rec.Body.String())
			}
			if proxied {
				t.Error("traversal request was proxied to the plugin service")
			}
		})
	}
}
