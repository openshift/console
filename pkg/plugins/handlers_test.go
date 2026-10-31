package plugins

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path"
	"reflect"
	"strconv"
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

// TestHandleI18nResources_RejectsInvalidLanguageForPlugin ensures invalid 'lng'
// values are rejected before reaching a plugin service.
func TestHandleI18nResources_RejectsInvalidLanguageForPlugin(t *testing.T) {
	var proxiedPath string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		proxiedPath = r.URL.Path
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	h := NewPluginsHandler(upstream.Client(), map[string]string{"monitoring-plugin": upstream.URL}, t.TempDir())

	cases := []struct {
		name string
		path string
	}{
		{"path traversal", "/locales/resource.json?lng=../../../../secret&ns=plugin__monitoring-plugin"},
		{"single quote", "/locales/resource.json?lng=%27&ns=plugin__monitoring-plugin"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			proxiedPath = ""
			req := httptest.NewRequest(http.MethodGet, tc.path, nil)
			rec := httptest.NewRecorder()
			h.HandleI18nResources(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected 400 for invalid lng, got %d", rec.Code)
			}
			if proxiedPath != "" {
				t.Errorf("invalid request was proxied to plugin with path %q", proxiedPath)
			}
		})
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

func TestPluginErrorResponses(t *testing.T) {
	requests := []struct {
		name         string
		path         string
		upstreamPath string
	}{
		{
			name:         "missing locale",
			path:         "/locales/resource.json?lng=zz&ns=plugin__monitoring-plugin",
			upstreamPath: "/locales/zz/plugin__monitoring-plugin.json",
		},
		{
			name:         "valid language",
			path:         "/locales/resource.json?lng=en&ns=plugin__monitoring-plugin",
			upstreamPath: "/locales/en/plugin__monitoring-plugin.json",
		},
		{
			name:         "plugin asset",
			path:         "/api/plugins/monitoring-plugin/missing.js",
			upstreamPath: "/missing.js",
		},
	}
	statusCodes := []int{
		http.StatusBadRequest,
		http.StatusForbidden,
		http.StatusNotFound,
		http.StatusInternalServerError,
		http.StatusBadGateway,
		http.StatusServiceUnavailable,
	}
	for _, request := range requests {
		for _, statusCode := range statusCodes {
			t.Run(fmt.Sprintf("%s/%d", request.name, statusCode), func(t *testing.T) {
				upstreamBody := "<html><body><h1>Request failed</h1><hr><center>nginx/1.20.1</center></body></html>"
				upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					if r.URL.Path != request.upstreamPath {
						t.Errorf("upstream path = %q, want %q", r.URL.Path, request.upstreamPath)
					}
					w.Header().Set("Server", "nginx/1.20.1")
					w.Header().Set("Content-Type", "text/html")
					w.Header().Set("Content-Length", strconv.Itoa(len(upstreamBody)))
					w.Header().Set("ETag", `"upstream-error"`)
					w.WriteHeader(statusCode)
					fmt.Fprint(w, upstreamBody)
				}))
				t.Cleanup(upstream.Close)

				handler := NewPluginsHandler(upstream.Client(), map[string]string{"monitoring-plugin": upstream.URL}, "")
				mux := http.NewServeMux()
				mux.HandleFunc("/locales/resource.json", handler.HandleI18nResources)
				mux.Handle("/api/plugins/", http.StripPrefix("/api/plugins/", http.HandlerFunc(handler.HandlePluginAssets)))
				recorder := httptest.NewRecorder()
				req := httptest.NewRequest(http.MethodGet, request.path, nil)
				mux.ServeHTTP(recorder, req)

				if recorder.Code != statusCode {
					t.Errorf("status = %d, want %d", recorder.Code, statusCode)
				}
				wantBody := `{"error":"failed to get resource from plugin"}`
				if got := recorder.Body.String(); got != wantBody {
					t.Errorf("body = %q, want %q", got, wantBody)
				}
				if got := recorder.Header().Get("Content-Type"); got != "application/json" {
					t.Errorf("Content-Type = %q, want application/json", got)
				}
				for _, header := range []string{"Server", "Content-Length", "ETag"} {
					if got := recorder.Header().Get(header); got != "" {
						t.Errorf("unexpected upstream %s header: %q", header, got)
					}
				}
			})
		}
	}
}

func TestPluginErrorResponseHeaders(t *testing.T) {
	tests := []struct {
		statusCode int
		headers    http.Header
	}{
		{
			statusCode: http.StatusUnauthorized,
			headers:    http.Header{"Www-Authenticate": {`Bearer realm="plugin"`, `Basic realm="plugin"`}},
		},
		{
			statusCode: http.StatusMethodNotAllowed,
			headers:    http.Header{"Allow": {"GET, HEAD"}},
		},
		{
			statusCode: http.StatusRequestedRangeNotSatisfiable,
			headers:    http.Header{"Content-Range": {"bytes */42"}},
		},
		{
			statusCode: http.StatusTooManyRequests,
			headers:    http.Header{"Retry-After": {"30"}},
		},
		{
			statusCode: http.StatusServiceUnavailable,
			headers:    http.Header{"Retry-After": {"Wed, 30 Sep 2026 12:00:00 GMT"}},
		},
	}
	for _, tt := range tests {
		t.Run(strconv.Itoa(tt.statusCode), func(t *testing.T) {
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				for header, values := range tt.headers {
					for _, value := range values {
						w.Header().Add(header, value)
					}
				}
				w.WriteHeader(tt.statusCode)
				fmt.Fprint(w, "<html><body>nginx/1.20.1</body></html>")
			}))
			t.Cleanup(upstream.Close)

			handler := NewPluginsHandler(upstream.Client(), map[string]string{"monitoring-plugin": upstream.URL}, "")
			recorder := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodGet, "/locales/resource.json?lng=en&ns=plugin__monitoring-plugin", nil)
			handler.HandleI18nResources(recorder, req)

			if recorder.Code != tt.statusCode {
				t.Errorf("status = %d, want %d", recorder.Code, tt.statusCode)
			}
			wantBody := `{"error":"failed to get resource from plugin"}`
			if got := recorder.Body.String(); got != wantBody {
				t.Errorf("body = %q, want %q", got, wantBody)
			}
			for header, want := range tt.headers {
				if got := recorder.Header().Values(header); !reflect.DeepEqual(got, want) {
					t.Errorf("%s = %q, want %q", header, got, want)
				}
			}
		})
	}
}

func TestPluginSuccessfulResponses(t *testing.T) {
	tests := []struct {
		name        string
		statusCode  int
		contentType string
		body        string
		path        string
	}{
		{
			name:        "translations",
			statusCode:  http.StatusOK,
			contentType: "application/json",
			body:        `{"title":"Monitoring"}`,
			path:        "/locales/resource.json?lng=en&ns=plugin__monitoring-plugin",
		},
		{
			name:        "asset",
			statusCode:  http.StatusOK,
			contentType: "application/javascript",
			body:        "console.log('monitoring');",
			path:        "/api/plugins/monitoring-plugin/plugin-entry.js",
		},
		{
			name:        "partial asset",
			statusCode:  http.StatusPartialContent,
			contentType: "application/javascript",
			body:        "console",
			path:        "/api/plugins/monitoring-plugin/plugin-entry.js",
		},
		{
			name:       "cached asset",
			statusCode: http.StatusNotModified,
			path:       "/api/plugins/monitoring-plugin/plugin-entry.js",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Server", "nginx/1.20.1")
				if tt.contentType != "" {
					w.Header().Set("Content-Type", tt.contentType)
				}
				w.Header().Set("ETag", `"plugin-resource"`)
				w.Header().Set("Cache-Control", "public, max-age=60")
				w.WriteHeader(tt.statusCode)
				if tt.body != "" {
					fmt.Fprint(w, tt.body)
				}
			}))
			t.Cleanup(upstream.Close)

			handler := NewPluginsHandler(upstream.Client(), map[string]string{"monitoring-plugin": upstream.URL}, "")
			mux := http.NewServeMux()
			mux.HandleFunc("/locales/resource.json", handler.HandleI18nResources)
			mux.Handle("/api/plugins/", http.StripPrefix("/api/plugins/", http.HandlerFunc(handler.HandlePluginAssets)))
			recorder := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodGet, tt.path, nil)
			mux.ServeHTTP(recorder, req)

			if recorder.Code != tt.statusCode {
				t.Errorf("status = %d, want %d", recorder.Code, tt.statusCode)
			}
			if got := recorder.Body.String(); got != tt.body {
				t.Errorf("body = %q, want %q", got, tt.body)
			}
			for header, want := range map[string]string{
				"Content-Type":  tt.contentType,
				"ETag":          `"plugin-resource"`,
				"Cache-Control": "public, max-age=60",
				"Server":        "",
			} {
				if got := recorder.Header().Get(header); got != want {
					t.Errorf("%s = %q, want %q", header, got, want)
				}
			}
		})
	}
}
