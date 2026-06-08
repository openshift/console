package olm

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc/codes"
	grpcstatus "google.golang.org/grpc/status"
)

func TestCatalogSourceGRPCAddress(t *testing.T) {
	tests := []struct {
		name             string
		catalogNamespace string
		catalogName      string
		expected         string
	}{
		{
			name:             "standard catalog",
			catalogNamespace: "openshift-marketplace",
			catalogName:      "redhat-operators",
			expected:         "redhat-operators.openshift-marketplace.svc:50051",
		},
		{
			name:             "custom namespace",
			catalogNamespace: "my-namespace",
			catalogName:      "my-catalog",
			expected:         "my-catalog.my-namespace.svc:50051",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			result := catalogSourceGRPCAddress(tc.catalogNamespace, tc.catalogName)
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

func TestOLMHandler_lifecycleHandler_validation(t *testing.T) {
	handler := &OLMHandler{}
	mux := http.NewServeMux()
	mux.HandleFunc("/api/olm/lifecycle/{catalogNamespace}/{catalogName}/{packageName}", handler.lifecycleHandler)

	t.Run("rejects invalid catalogNamespace", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/olm/lifecycle/evil.attacker.com/redhat-operators/test-operator", nil)
		rr := httptest.NewRecorder()
		mux.ServeHTTP(rr, req)
		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})

	t.Run("rejects invalid catalogName with dots", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/olm/lifecycle/openshift-marketplace/my.catalog.source/test-operator", nil)
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
}

func TestHandleGRPCError(t *testing.T) {
	tests := []struct {
		name           string
		err            error
		expectedStatus int
	}{
		{
			name:           "Unimplemented returns 503",
			err:            grpcstatus.Error(codes.Unimplemented, "method not implemented"),
			expectedStatus: http.StatusServiceUnavailable,
		},
		{
			name:           "Unavailable returns 503",
			err:            grpcstatus.Error(codes.Unavailable, "service unavailable"),
			expectedStatus: http.StatusServiceUnavailable,
		},
		{
			name:           "Internal error returns 502",
			err:            grpcstatus.Error(codes.Internal, "internal error"),
			expectedStatus: http.StatusBadGateway,
		},
		{
			name:           "NotFound returns 502",
			err:            grpcstatus.Error(codes.NotFound, "not found"),
			expectedStatus: http.StatusBadGateway,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			rr := httptest.NewRecorder()
			handleGRPCError(rr, "test-catalog", "test-package", tc.err)
			assert.Equal(t, tc.expectedStatus, rr.Code)
		})
	}
}
