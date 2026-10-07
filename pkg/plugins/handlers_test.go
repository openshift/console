package plugins

import (
	"crypto/tls"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path"
	"strings"
	"testing"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/auth/csrfverifier"
	"github.com/openshift/console/pkg/middleware"
	"github.com/openshift/console/pkg/proxy"
)

type pluginTestAuthenticator struct {
	auth.Authenticator
}

func (pluginTestAuthenticator) Authenticate(_ http.ResponseWriter, r *http.Request) (*auth.User, error) {
	cookie, err := r.Cookie("session")
	if err != nil {
		return nil, err
	}
	return &auth.User{Username: cookie.Value, Token: "dummy-token-" + cookie.Value}, nil
}

func TestHandlePluginAssets_DoesNotForwardCredentials(t *testing.T) {
	cases := []struct {
		name          string
		asset         string
		user          string
		authenticated bool
	}{
		{"manifest for first user", "plugin-manifest.json", "first", true},
		{"entry script for second user", "plugin-entry.js", "second", true},
		{"nested asset", "assets/chunk.js", "first", true},
		{"explicit authorization", "plugin-entry.js", "second", false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			headers := make(chan http.Header, 1)
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				headers <- r.Header.Clone()
				fmt.Fprint(w, "plugin asset")
			}))
			defer upstream.Close()

			// No service proxy is configured: asset disclosure must be prevented
			// independently of whether the plugin declares a UserToken proxy.
			plugins := NewPluginsHandler(upstream.Client(), map[string]string{"demo": upstream.URL}, t.TempDir())
			handler := http.HandlerFunc(plugins.HandlePluginAssets)
			if tc.authenticated {
				handler = middleware.AuthMiddleware(pluginTestAuthenticator{}, csrfverifier.NewCSRFVerifier(nil, false), handler)
			}
			req := httptest.NewRequest(http.MethodGet, "/api/plugins/demo/"+tc.asset, nil)
			req.AddCookie(&http.Cookie{Name: "session", Value: tc.user})
			req.Header.Set("X-CSRFToken", "dummy-csrf")
			req.Header.Set("Accept", "application/javascript")
			if !tc.authenticated {
				req.Header.Set("Authorization", "Bearer explicit-dummy-token")
			}
			rec := httptest.NewRecorder()
			http.StripPrefix("/api/plugins/", handler).ServeHTTP(rec, req)
			if rec.Code != http.StatusOK || rec.Body.String() != "plugin asset" {
				t.Fatalf("asset did not load: status %d, body %q", rec.Code, rec.Body.String())
			}
			forwarded := <-headers
			for _, header := range []string{"Authorization", "Cookie", "X-CSRFToken"} {
				if forwarded.Get(header) != "" {
					t.Errorf("upstream received %s", header)
				}
			}
			if forwarded.Get("Accept") != "application/javascript" {
				t.Error("non-credential header was not forwarded")
			}
		})
	}
}

func TestPluginServiceProxy_SessionTokenAuthorization(t *testing.T) {
	cases := []struct {
		name      string
		authorize bool
		user      string
		wantToken string
	}{
		{"UserToken first user", true, "first", "Bearer dummy-token-first"},
		{"UserToken second user", true, "second", "Bearer dummy-token-second"},
		{"None", false, "first", ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			headers := make(chan http.Header, 1)
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				headers <- r.Header.Clone()
				w.WriteHeader(http.StatusNoContent)
			}))
			defer upstream.Close()
			endpoint, err := url.Parse(upstream.URL)
			if err != nil {
				t.Fatal(err)
			}
			service := NewPluginsProxyServiceHandler("/api/proxy/control/", endpoint, &tls.Config{}, tc.authorize)
			var handler http.Handler = proxy.NewProxy(service.ProxyConfig)
			if service.Authorize {
				handler = middleware.AuthMiddleware(pluginTestAuthenticator{}, csrfverifier.NewCSRFVerifier(nil, false), handler.ServeHTTP)
			}
			req := httptest.NewRequest(http.MethodGet, "/api/proxy/control/probe", nil)
			req.AddCookie(&http.Cookie{Name: "session", Value: tc.user})
			rec := httptest.NewRecorder()
			http.StripPrefix(service.ConsoleEndpoint, handler).ServeHTTP(rec, req)
			if rec.Code != http.StatusNoContent {
				t.Fatalf("proxy returned %d", rec.Code)
			}
			forwarded := <-headers
			if got := forwarded.Get("Authorization"); got != tc.wantToken {
				t.Errorf("expected authorization %q, got %q", tc.wantToken, got)
			}
			if forwarded.Get("Cookie") != "" {
				t.Error("proxy forwarded the session cookie")
			}
		})
	}
}

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
	var forwardedHeaders http.Header
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		proxiedPath = r.URL.Path
		forwardedHeaders = r.Header.Clone()
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"plugin":"translation"}`))
	}))
	defer upstream.Close()
	upstreamURL, _ := url.Parse(upstream.URL)

	h := NewPluginsHandler(&http.Client{}, map[string]string{"helm": upstreamURL.String()}, t.TempDir())

	req := httptest.NewRequest(http.MethodGet, "/locales/resource.json?lng=zh-CN&ns=plugin__helm", nil)
	req.Header.Set("Authorization", "Bearer explicit-dummy-token")
	req.Header.Set("Cookie", "session=dummy-session")
	req.Header.Set("X-CSRFToken", "dummy-csrf")
	rec := httptest.NewRecorder()
	h.HandleI18nResources(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 for valid plugin request, got %d (body: %s)", rec.Code, rec.Body.String())
	}
	if want := "/locales/zh-CN/plugin__helm.json"; proxiedPath != want {
		t.Errorf("expected proxied path %q, got %q", want, proxiedPath)
	}
	for _, header := range []string{"Authorization", "Cookie", "X-CSRFToken"} {
		if forwardedHeaders.Get(header) != "" {
			t.Errorf("plugin localization received %s", header)
		}
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
