package plugins

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/openshift/console/pkg/serverutils"
)

func TestProxyPluginRequest_ServiceDown_Returns503(t *testing.T) {
	// Use a closed server to simulate a plugin service that is down.
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	ts.Close()

	serviceURL, err := url.Parse(ts.URL)
	if err != nil {
		t.Fatalf("failed to parse test server URL: %v", err)
	}

	handler := &PluginsHandler{
		Client:             ts.Client(),
		PluginsEndpointMap: map[string]string{"test-plugin": ts.URL},
	}

	req := httptest.NewRequest("GET", "/test-plugin/plugin-manifest.json", nil)
	rr := httptest.NewRecorder()

	handler.proxyPluginRequest(serviceURL, "test-plugin", rr, req)

	if rr.Code != http.StatusServiceUnavailable {
		t.Errorf("expected status %d, got %d", http.StatusServiceUnavailable, rr.Code)
	}
}

func TestProxyPluginRequest_ServiceDown_ReturnsJSON(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	ts.Close()

	serviceURL, err := url.Parse(ts.URL)
	if err != nil {
		t.Fatalf("failed to parse test server URL: %v", err)
	}

	handler := &PluginsHandler{
		Client:             ts.Client(),
		PluginsEndpointMap: map[string]string{"test-plugin": ts.URL},
	}

	req := httptest.NewRequest("GET", "/test-plugin/plugin-manifest.json", nil)
	rr := httptest.NewRecorder()

	handler.proxyPluginRequest(serviceURL, "test-plugin", rr, req)

	contentType := rr.Header().Get("Content-Type")
	if contentType != "application/json" {
		t.Errorf("expected Content-Type application/json, got %q", contentType)
	}

	var apiErr serverutils.ApiError
	if err := json.NewDecoder(rr.Body).Decode(&apiErr); err != nil {
		t.Fatalf("failed to decode JSON response: %v", err)
	}
	if apiErr.Err == "" {
		t.Error("expected non-empty error message in JSON body")
	}
}

func TestProxyPluginRequest_Upstream502_Returns503(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadGateway)
	}))
	defer ts.Close()

	serviceURL, err := url.Parse(ts.URL)
	if err != nil {
		t.Fatalf("failed to parse test server URL: %v", err)
	}

	handler := &PluginsHandler{
		Client:             ts.Client(),
		PluginsEndpointMap: map[string]string{"test-plugin": ts.URL},
	}

	req := httptest.NewRequest("GET", "/test-plugin/plugin-manifest.json", nil)
	rr := httptest.NewRecorder()

	handler.proxyPluginRequest(serviceURL, "test-plugin", rr, req)

	if rr.Code != http.StatusServiceUnavailable {
		t.Errorf("expected status %d, got %d", http.StatusServiceUnavailable, rr.Code)
	}

	var apiErr serverutils.ApiError
	if err := json.NewDecoder(rr.Body).Decode(&apiErr); err != nil {
		t.Fatalf("failed to decode JSON response: %v", err)
	}
	if apiErr.Err == "" {
		t.Error("expected non-empty error message in JSON body")
	}
}

func TestProxyPluginRequest_Upstream502_NoStaleHeaders(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Encoding", "gzip")
		w.Header().Set("Content-Length", "42")
		w.WriteHeader(http.StatusBadGateway)
	}))
	defer ts.Close()

	serviceURL, err := url.Parse(ts.URL)
	if err != nil {
		t.Fatalf("failed to parse test server URL: %v", err)
	}

	handler := &PluginsHandler{
		Client:             ts.Client(),
		PluginsEndpointMap: map[string]string{"test-plugin": ts.URL},
	}

	req := httptest.NewRequest("GET", "/test-plugin/plugin-manifest.json", nil)
	rr := httptest.NewRecorder()

	handler.proxyPluginRequest(serviceURL, "test-plugin", rr, req)

	if rr.Code != http.StatusServiceUnavailable {
		t.Errorf("expected status %d, got %d", http.StatusServiceUnavailable, rr.Code)
	}

	if ce := rr.Header().Get("Content-Encoding"); ce != "" {
		t.Errorf("expected no Content-Encoding header, got %q", ce)
	}

	contentType := rr.Header().Get("Content-Type")
	if contentType != "application/json" {
		t.Errorf("expected Content-Type application/json, got %q", contentType)
	}

	var apiErr serverutils.ApiError
	if err := json.NewDecoder(rr.Body).Decode(&apiErr); err != nil {
		t.Fatalf("failed to decode JSON response: %v", err)
	}
	if apiErr.Err == "" {
		t.Error("expected non-empty error message in JSON body")
	}
}

func TestProxyPluginRequest_ServiceUp_Proxies200(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"name":"test-plugin"}`))
	}))
	defer ts.Close()

	serviceURL, err := url.Parse(ts.URL)
	if err != nil {
		t.Fatalf("failed to parse test server URL: %v", err)
	}

	handler := &PluginsHandler{
		Client:             ts.Client(),
		PluginsEndpointMap: map[string]string{"test-plugin": ts.URL},
	}

	req := httptest.NewRequest("GET", "/test-plugin/plugin-manifest.json", nil)
	rr := httptest.NewRecorder()

	handler.proxyPluginRequest(serviceURL, "test-plugin", rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rr.Code)
	}

	body := rr.Body.String()
	if body != `{"name":"test-plugin"}` {
		t.Errorf("expected body %q, got %q", `{"name":"test-plugin"}`, body)
	}
}

func TestHandlePluginAssets_FailedPlugin_Returns404(t *testing.T) {
	handler := &PluginsHandler{
		Client:             http.DefaultClient,
		PluginsEndpointMap: map[string]string{},
	}

	req := httptest.NewRequest("GET", "/nonexistent-plugin/plugin-manifest.json", nil)
	rr := httptest.NewRecorder()

	handler.HandlePluginAssets(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Errorf("expected status %d, got %d", http.StatusNotFound, rr.Code)
	}
}

func TestHandleI18nResources_FailedPlugin_Returns404(t *testing.T) {
	handler := &PluginsHandler{
		Client:             http.DefaultClient,
		PluginsEndpointMap: map[string]string{},
	}

	req := httptest.NewRequest("GET", "/locales?lng=en&ns=plugin__nonexistent", nil)
	rr := httptest.NewRecorder()

	handler.HandleI18nResources(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Errorf("expected status %d, got %d", http.StatusNotFound, rr.Code)
	}
}
