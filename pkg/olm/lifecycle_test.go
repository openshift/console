package olm

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLifecycleServiceURL(t *testing.T) {
	tests := []struct {
		name             string
		catalogNamespace string
		catalogName      string
		expected         string
	}{
		{
			name:             "simple catalog name",
			catalogNamespace: "openshift-marketplace",
			catalogName:      "redhat-operators",
			expected:         "https://redhat-operators-lifecycle-server.openshift-marketplace.svc:8443",
		},
		{
			name:             "catalog name with dots",
			catalogNamespace: "openshift-marketplace",
			catalogName:      "my.catalog.source",
			expected:         "https://my-catalog-source-lifecycle-server.openshift-marketplace.svc:8443",
		},
		{
			name:             "catalog name with underscores",
			catalogNamespace: "test-ns",
			catalogName:      "my_catalog",
			expected:         "https://my-catalog-lifecycle-server.test-ns.svc:8443",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			result := lifecycleServiceURL(tc.catalogNamespace, tc.catalogName)
			assert.Equal(t, tc.expected, result)
		})
	}
}

func TestIsValidK8sName(t *testing.T) {
	tests := []struct {
		input string
		valid bool
	}{
		{"openshift-marketplace", true},
		{"redhat-operators", true},
		{"my-ns", true},
		{"a", true},
		{"a1", true},
		{"", false},
		{"-starts-with-dash", false},
		{"ends-with-dash-", false},
		{"has spaces", false},
		{"HAS.CAPS", false},
		{"evil.attacker.com", false},
		{"../../etc/passwd", false},
		{string(make([]byte, 64)), false},
	}

	for _, tc := range tests {
		t.Run(tc.input, func(t *testing.T) {
			assert.Equal(t, tc.valid, isValidK8sName(tc.input), "isValidK8sName(%q)", tc.input)
		})
	}
}

func TestIsValidCatalogName(t *testing.T) {
	tests := []struct {
		input string
		valid bool
	}{
		{"redhat-operators", true},
		{"my.catalog.source", true},
		{"my_catalog", true},
		{"certified-operators", true},
		{"a1", true},
		{"", false},
		{"a", false},
		{"-starts-with-dash", false},
		{"HAS-CAPS", false},
		{"evil attacker", false},
		{"../../etc", false},
	}

	for _, tc := range tests {
		t.Run(tc.input, func(t *testing.T) {
			assert.Equal(t, tc.valid, isValidCatalogName(tc.input), "isValidCatalogName(%q)", tc.input)
		})
	}
}

func TestOLMHandler_lifecycleHandler_validation(t *testing.T) {
	handler := &OLMHandler{
		lifecycleClient: &http.Client{},
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/api/olm/lifecycle/{catalogNamespace}/{catalogName}/{packageName}", handler.lifecycleHandler)

	t.Run("rejects invalid catalogNamespace", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/olm/lifecycle/evil.attacker.com/redhat-operators/test-operator", nil)
		rr := httptest.NewRecorder()
		mux.ServeHTTP(rr, req)
		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})

	t.Run("rejects invalid catalogName with caps", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/olm/lifecycle/openshift-marketplace/HAS-CAPS/test-operator", nil)
		rr := httptest.NewRecorder()
		mux.ServeHTTP(rr, req)
		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})

	t.Run("accepts catalog name with dots", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/olm/lifecycle/openshift-marketplace/my.catalog.source/test-operator", nil)
		rr := httptest.NewRecorder()
		mux.ServeHTTP(rr, req)
		// Will be 503 because the upstream doesn't exist, but NOT 400
		assert.Equal(t, http.StatusServiceUnavailable, rr.Code)
	})

	t.Run("returns 503 when upstream is unavailable", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/olm/lifecycle/openshift-marketplace/nonexistent-catalog/test-operator", nil)
		rr := httptest.NewRecorder()
		mux.ServeHTTP(rr, req)
		assert.Equal(t, http.StatusServiceUnavailable, rr.Code)
	})
}

func TestOLMHandler_lifecycleHandler_nilClient(t *testing.T) {
	handler := &OLMHandler{
		lifecycleClient: nil,
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/api/olm/lifecycle/{catalogNamespace}/{catalogName}/{packageName}", handler.lifecycleHandler)

	req := httptest.NewRequest("GET", "/api/olm/lifecycle/openshift-marketplace/redhat-operators/test-operator", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)
	assert.Equal(t, http.StatusServiceUnavailable, rr.Code)
}
