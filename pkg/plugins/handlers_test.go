package plugins

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path"
	"strings"
	"testing"
)

func TestHandleI18nResourcesServesStaticLocale(t *testing.T) {
	dir := t.TempDir()
	localesDir := path.Join(dir, "locales", "en")
	if err := os.MkdirAll(localesDir, 0o755); err != nil {
		t.Fatalf("failed to create locales dir: %v", err)
	}

	const expectedBody = `{"hello":"world"}`
	if err := os.WriteFile(path.Join(localesDir, "public.json"), []byte(expectedBody), 0o644); err != nil {
		t.Fatalf("failed to write locale file: %v", err)
	}

	handler := NewPluginsHandler(http.DefaultClient, nil, dir)
	req := httptest.NewRequest(http.MethodGet, "/locales/resource.json?lng=en&ns=public", nil)
	rec := httptest.NewRecorder()

	handler.HandleI18nResources(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rec.Code)
	}

	if got := strings.TrimSpace(rec.Body.String()); got != expectedBody {
		t.Fatalf("expected body %q, got %q", expectedBody, got)
	}
}

func TestHandleI18nResourcesProxiesPluginLocale(t *testing.T) {
	var requestedPath string
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPath = r.URL.Path
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"plugin":"ok"}`))
	}))
	defer backend.Close()

	handler := NewPluginsHandler(backend.Client(), map[string]string{
		"demo-plugin": backend.URL + "/plugin-root",
	}, t.TempDir())
	req := httptest.NewRequest(http.MethodGet, "/locales/resource.json?lng=en&ns=plugin__demo-plugin", nil)
	rec := httptest.NewRecorder()

	handler.HandleI18nResources(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rec.Code)
	}

	if requestedPath != "/plugin-root/locales/en/plugin__demo-plugin.json" {
		t.Fatalf("expected backend request path %q, got %q", "/plugin-root/locales/en/plugin__demo-plugin.json", requestedPath)
	}

	if got := rec.Body.String(); got != `{"plugin":"ok"}` {
		t.Fatalf("expected body %q, got %q", `{"plugin":"ok"}`, got)
	}
}

func TestHandleI18nResourcesRejectsInvalidLocalePathSegments(t *testing.T) {
	tests := []struct {
		name       string
		url        string
		wantErr    string
		setupProxy bool
	}{
		{
			name:    "rejects language traversal for static locale",
			url:     "/locales/resource.json?lng=../../..&ns=public",
			wantErr: "invalid 'lng' query parameter",
		},
		{
			name:    "rejects namespace traversal for static locale",
			url:     "/locales/resource.json?lng=en&ns=../public",
			wantErr: "invalid 'ns' query parameter",
		},
		{
			name:       "rejects language traversal for plugin locale before proxying",
			url:        "/locales/resource.json?lng=../../..&ns=plugin__demo-plugin",
			wantErr:    "invalid 'lng' query parameter",
			setupProxy: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			backendHit := false
			pluginsEndpointMap := map[string]string{}
			var client *http.Client

			if tt.setupProxy {
				backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					backendHit = true
					w.WriteHeader(http.StatusOK)
				}))
				defer backend.Close()

				client = backend.Client()
				pluginsEndpointMap["demo-plugin"] = backend.URL + "/plugin-root"
			} else {
				client = http.DefaultClient
			}

			handler := NewPluginsHandler(client, pluginsEndpointMap, t.TempDir())
			req := httptest.NewRequest(http.MethodGet, tt.url, nil)
			rec := httptest.NewRecorder()

			handler.HandleI18nResources(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected status %d, got %d", http.StatusBadRequest, rec.Code)
			}

			if !strings.Contains(rec.Body.String(), tt.wantErr) {
				t.Fatalf("expected response body to contain %q, got %q", tt.wantErr, rec.Body.String())
			}

			if backendHit {
				t.Fatalf("expected invalid locale request to be rejected before proxying")
			}
		})
	}
}
