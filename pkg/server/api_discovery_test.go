package server

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"sort"
	"strings"
	"testing"

	"github.com/openshift/console/pkg/proxy"
)

func newMockK8sAPI(t *testing.T) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/apis":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"kind":       "APIGroupList",
				"apiVersion": "v1",
				"groups": []map[string]interface{}{
					{
						"name": "apps",
						"versions": []map[string]string{
							{"groupVersion": "apps/v1", "version": "v1"},
						},
						"preferredVersion": map[string]string{
							"groupVersion": "apps/v1", "version": "v1",
						},
					},
					{
						"name": "batch",
						"versions": []map[string]string{
							{"groupVersion": "batch/v1", "version": "v1"},
						},
						"preferredVersion": map[string]string{
							"groupVersion": "batch/v1", "version": "v1",
						},
					},
				},
			})
		case "/apis/apps/v1":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"kind":         "APIResourceList",
				"apiVersion":   "v1",
				"groupVersion": "apps/v1",
				"resources": []map[string]interface{}{
					{
						"name":       "deployments",
						"namespaced": true,
						"kind":       "Deployment",
						"verbs":      []string{"create", "delete", "get", "list", "patch", "update", "watch"},
					},
				},
			})
		case "/apis/batch/v1":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"kind":         "APIResourceList",
				"apiVersion":   "v1",
				"groupVersion": "batch/v1",
				"resources": []map[string]interface{}{
					{
						"name":       "jobs",
						"namespaced": true,
						"kind":       "Job",
						"verbs":      []string{"create", "delete", "get", "list", "patch", "update", "watch"},
					},
				},
			})
		case "/api/v1":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"kind":         "APIResourceList",
				"apiVersion":   "v1",
				"groupVersion": "v1",
				"resources": []map[string]interface{}{
					{
						"name":       "pods",
						"namespaced": true,
						"kind":       "Pod",
						"verbs":      []string{"create", "delete", "get", "list", "patch", "update", "watch"},
					},
					{
						"name":       "services",
						"namespaced": true,
						"kind":       "Service",
						"verbs":      []string{"create", "delete", "get", "list", "patch", "update", "watch"},
					},
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
}

func newTestHandler(t *testing.T, backend *httptest.Server) http.HandlerFunc {
	t.Helper()
	endpoint, err := url.Parse(backend.URL)
	if err != nil {
		t.Fatalf("failed to parse backend URL: %v", err)
	}
	return apiDiscoveryHandler(&proxy.Config{Endpoint: endpoint})
}

func TestApiDiscoveryHandler(t *testing.T) {
	backend := newMockK8sAPI(t)
	defer backend.Close()
	handler := newTestHandler(t, backend)

	req := httptest.NewRequest(http.MethodGet, "/api/api-discovery", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var resp apiDiscoveryResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	// Verify groups are returned
	var groups apiGroupList
	if err := json.Unmarshal(resp.Groups, &groups); err != nil {
		t.Fatalf("failed to parse groups: %v", err)
	}
	if len(groups.Groups) != 2 {
		t.Errorf("expected 2 groups, got %d", len(groups.Groups))
	}

	// Verify resource lists: apps/v1 + batch/v1 + core v1 = 3
	if len(resp.ResourceLists) != 3 {
		t.Errorf("expected 3 resource lists, got %d", len(resp.ResourceLists))
	}

	// Verify we can find deployments, jobs, and pods in the resource lists
	body := rec.Body.String()
	for _, resource := range []string{"deployments", "jobs", "pods", "services"} {
		if !strings.Contains(body, resource) {
			t.Errorf("expected response to contain %q", resource)
		}
	}
}

func TestApiDiscoveryHandler_MethodNotAllowed(t *testing.T) {
	backend := newMockK8sAPI(t)
	defer backend.Close()
	handler := newTestHandler(t, backend)

	for _, method := range []string{http.MethodPost, http.MethodPut, http.MethodDelete} {
		t.Run(method, func(t *testing.T) {
			req := httptest.NewRequest(method, "/api/api-discovery", nil)
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)

			if rec.Code != http.StatusMethodNotAllowed {
				t.Errorf("expected 405, got %d", rec.Code)
			}
		})
	}
}

func TestApiDiscoveryHandler_ForwardsConsoleImpersonateGroups(t *testing.T) {
	var capturedAuth, capturedUser string
	var capturedGroups []string

	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedAuth = r.Header.Get("Authorization")
		capturedUser = r.Header.Get("Impersonate-User")
		capturedGroups = r.Header.Values("Impersonate-Group")

		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/apis" {
			json.NewEncoder(w).Encode(map[string]interface{}{
				"kind": "APIGroupList", "apiVersion": "v1", "groups": []interface{}{},
			})
		} else {
			http.NotFound(w, r)
		}
	}))
	defer backend.Close()

	handler := newTestHandler(t, backend)

	req := httptest.NewRequest(http.MethodGet, "/api/api-discovery", nil)
	req.Header.Set("Authorization", "Bearer test-token")
	req.Header.Set("Impersonate-User", "test-user")
	req.Header.Set("X-Console-Impersonate-Groups", "group-a,group-b")

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	if capturedAuth != "Bearer test-token" {
		t.Errorf("expected Authorization header forwarded, got %q", capturedAuth)
	}
	if capturedUser != "test-user" {
		t.Errorf("expected Impersonate-User header forwarded, got %q", capturedUser)
	}
	sort.Strings(capturedGroups)
	if len(capturedGroups) != 3 {
		t.Fatalf("expected 3 Impersonate-Group headers (2 groups + system:authenticated), got %v", capturedGroups)
	}
	if capturedGroups[0] != "group-a" || capturedGroups[1] != "group-b" || capturedGroups[2] != "system:authenticated" {
		t.Errorf("expected [group-a, group-b, system:authenticated], got %v", capturedGroups)
	}
}

func TestApiDiscoveryHandler_ForwardsRawImpersonateGroups(t *testing.T) {
	var capturedGroups []string

	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedGroups = r.Header.Values("Impersonate-Group")

		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/apis" {
			json.NewEncoder(w).Encode(map[string]interface{}{
				"kind": "APIGroupList", "apiVersion": "v1", "groups": []interface{}{},
			})
		} else {
			http.NotFound(w, r)
		}
	}))
	defer backend.Close()

	handler := newTestHandler(t, backend)

	req := httptest.NewRequest(http.MethodGet, "/api/api-discovery", nil)
	req.Header.Set("Impersonate-User", "test-user")
	req.Header.Add("Impersonate-Group", "group-x")

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	sort.Strings(capturedGroups)
	if len(capturedGroups) != 2 {
		t.Fatalf("expected 2 Impersonate-Group headers (1 group + system:authenticated), got %v", capturedGroups)
	}
	if capturedGroups[0] != "group-x" || capturedGroups[1] != "system:authenticated" {
		t.Errorf("expected [group-x, system:authenticated], got %v", capturedGroups)
	}
}

func TestApiDiscoveryHandler_BackendFailure(t *testing.T) {
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "internal error", http.StatusInternalServerError)
	}))
	defer backend.Close()

	handler := newTestHandler(t, backend)

	req := httptest.NewRequest(http.MethodGet, "/api/api-discovery", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadGateway {
		t.Errorf("expected 502 when backend fails, got %d", rec.Code)
	}
}

func TestApiDiscoveryHandler_AllResourceListsFail(t *testing.T) {
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/apis" {
			json.NewEncoder(w).Encode(map[string]interface{}{
				"kind": "APIGroupList", "apiVersion": "v1",
				"groups": []map[string]interface{}{
					{
						"name":             "failing",
						"versions":         []map[string]string{{"groupVersion": "failing/v1", "version": "v1"}},
						"preferredVersion": map[string]string{"groupVersion": "failing/v1", "version": "v1"},
					},
				},
			})
		} else {
			http.Error(w, "forbidden", http.StatusForbidden)
		}
	}))
	defer backend.Close()

	handler := newTestHandler(t, backend)

	req := httptest.NewRequest(http.MethodGet, "/api/api-discovery", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 even when all resource lists fail, got %d", rec.Code)
	}

	var resp apiDiscoveryResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if resp.ResourceLists == nil {
		t.Error("expected resourceLists to be an empty array, got null")
	}
	if len(resp.ResourceLists) != 0 {
		t.Errorf("expected 0 resource lists, got %d", len(resp.ResourceLists))
	}
}

func TestApiDiscoveryHandler_PartialFailure(t *testing.T) {
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/apis":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"kind": "APIGroupList", "apiVersion": "v1",
				"groups": []map[string]interface{}{
					{
						"name":             "good",
						"versions":         []map[string]string{{"groupVersion": "good/v1", "version": "v1"}},
						"preferredVersion": map[string]string{"groupVersion": "good/v1", "version": "v1"},
					},
					{
						"name":             "bad",
						"versions":         []map[string]string{{"groupVersion": "bad/v1", "version": "v1"}},
						"preferredVersion": map[string]string{"groupVersion": "bad/v1", "version": "v1"},
					},
				},
			})
		case "/apis/good/v1":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"kind": "APIResourceList", "groupVersion": "good/v1",
				"resources": []map[string]interface{}{
					{"name": "widgets", "kind": "Widget", "namespaced": true, "verbs": []string{"get"}},
				},
			})
		case "/apis/bad/v1":
			http.Error(w, "forbidden", http.StatusForbidden)
		case "/api/v1":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"kind": "APIResourceList", "groupVersion": "v1",
				"resources": []map[string]interface{}{
					{"name": "pods", "kind": "Pod", "namespaced": true, "verbs": []string{"get"}},
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer backend.Close()

	handler := newTestHandler(t, backend)

	req := httptest.NewRequest(http.MethodGet, "/api/api-discovery", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 despite partial failure, got %d", rec.Code)
	}

	var resp apiDiscoveryResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	// good/v1 + api/v1 should succeed, bad/v1 should be skipped
	if len(resp.ResourceLists) != 2 {
		t.Errorf("expected 2 resource lists (skipping failed group), got %d", len(resp.ResourceLists))
	}

	body := rec.Body.String()
	if !strings.Contains(body, "widgets") {
		t.Error("expected response to contain successful group's resources")
	}
	if strings.Contains(body, "forbidden") {
		t.Error("expected failed group to be silently skipped")
	}
}
