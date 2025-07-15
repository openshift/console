package crdschema

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/pkg/serverutils"
)

// mockRoundTripper is a mock implementation of http.RoundTripper for testing
type mockRoundTripper struct {
	responseStatus int
	responseBody   string
	requestURL     string
	requestMethod  string
	requestPath    string
	shouldError    bool
	errorMessage   string
}

func (m *mockRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	m.requestURL = req.URL.String()
	m.requestMethod = req.Method
	m.requestPath = req.URL.Path

	if m.shouldError {
		return nil, fmt.Errorf(m.errorMessage)
	}

	response := &http.Response{
		StatusCode: m.responseStatus,
		Body:       io.NopCloser(bytes.NewReader([]byte(m.responseBody))),
		Header:     make(http.Header),
	}

	return response, nil
}

// createMockProxy creates a mock proxy for testing with a custom transport
func createMockProxy(mockRT *mockRoundTripper) *proxy.Proxy {
	// Create a mock endpoint URL
	targetURL, _ := url.Parse("https://mock-k8s-api.example.com")
	config := &proxy.Config{
		Endpoint:        targetURL,
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}

	return proxy.NewProxyWithTransport(config, mockRT)
}

// createMockCRD creates a mock CRD for testing
func createMockCRD(name string) *apiextensionsv1.CustomResourceDefinition {
	return &apiextensionsv1.CustomResourceDefinition{
		TypeMeta: metav1.TypeMeta{
			APIVersion: "apiextensions.k8s.io/v1",
			Kind:       "CustomResourceDefinition",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:              name,
			CreationTimestamp: metav1.Now(),
			UID:               "12345678-1234-1234-1234-123456789012",
			ResourceVersion:   "12345",
		},
		Spec: apiextensionsv1.CustomResourceDefinitionSpec{
			Group: "example.com",
			Names: apiextensionsv1.CustomResourceDefinitionNames{
				Plural:   "examples",
				Singular: "example",
				Kind:     "Example",
				ListKind: "ExampleList",
			},
			Scope: apiextensionsv1.NamespaceScoped,
			Versions: []apiextensionsv1.CustomResourceDefinitionVersion{
				{
					Name:    "v1",
					Served:  true,
					Storage: true,
				},
			},
		},
		Status: apiextensionsv1.CustomResourceDefinitionStatus{
			AcceptedNames: apiextensionsv1.CustomResourceDefinitionNames{
				Plural:   "examples",
				Singular: "example",
				Kind:     "Example",
				ListKind: "ExampleList",
			},
			StoredVersions: []string{"v1"},
		},
	}
}

// parseErrorResponse parses the JSON error response
func parseErrorResponse(body []byte) (*serverutils.ApiError, error) {
	var apiError serverutils.ApiError
	if err := json.Unmarshal(body, &apiError); err != nil {
		return nil, err
	}
	return &apiError, nil
}

// Helper function to extract CRD name from request path (same logic as handler)
func extractCRDName(requestPath string) string {
	return strings.TrimPrefix(requestPath, "/")
}

func TestCRDSchemaHandler_HandleCRDSchema(t *testing.T) {
	tests := []struct {
		name            string
		method          string
		requestPath     string
		mockStatus      int
		mockError       bool
		mockErrorMsg    string
		expectedStatus  int
		expectedError   string
		shouldHaveError bool
	}{
		{
			name:           "successful request",
			method:         "GET",
			requestPath:    "/examples.example.com",
			mockStatus:     200,
			expectedStatus: 200,
		},
		{
			name:            "invalid method POST",
			method:          "POST",
			requestPath:     "/examples.example.com",
			expectedStatus:  405,
			expectedError:   "Invalid method: only GET is allowed",
			shouldHaveError: true,
		},
		{
			name:            "invalid method PUT",
			method:          "PUT",
			requestPath:     "/examples.example.com",
			expectedStatus:  405,
			expectedError:   "Invalid method: only GET is allowed",
			shouldHaveError: true,
		},
		{
			name:            "missing CRD name - empty path",
			method:          "GET",
			requestPath:     "/",
			expectedStatus:  400,
			expectedError:   "CRD name parameter is required",
			shouldHaveError: true,
		},
		{
			name:            "CRD not found",
			method:          "GET",
			requestPath:     "/nonexistent.example.com",
			mockStatus:      404,
			expectedStatus:  404,
			shouldHaveError: false,
		},
		{
			name:            "forbidden access",
			method:          "GET",
			requestPath:     "/examples.example.com",
			mockStatus:      403,
			expectedStatus:  403,
			shouldHaveError: false,
		},
		{
			name:            "internal server error",
			method:          "GET",
			requestPath:     "/examples.example.com",
			mockStatus:      500,
			expectedStatus:  500,
			shouldHaveError: false,
		},
		{
			name:            "round trip error",
			method:          "GET",
			requestPath:     "/examples.example.com",
			mockError:       true,
			mockErrorMsg:    "network error",
			expectedStatus:  502,
			shouldHaveError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			crdName := extractCRDName(tt.requestPath)

			// Create mock response body
			var mockResponseBody string
			if tt.mockStatus == 200 && !tt.mockError {
				mockCRD := createMockCRD(crdName)
				crdBytes, _ := json.Marshal(mockCRD)
				mockResponseBody = string(crdBytes)
			}

			// Create mock round tripper
			mockRT := &mockRoundTripper{
				responseStatus: tt.mockStatus,
				responseBody:   mockResponseBody,
				shouldError:    tt.mockError,
				errorMessage:   tt.mockErrorMsg,
			}

			// Create mock proxy
			mockProxy := createMockProxy(mockRT)

			// Create handler
			handler := NewCRDSchemaHandler(mockProxy)

			// Create request with path parameter
			req := httptest.NewRequest(tt.method, tt.requestPath, nil)
			req = req.WithContext(context.Background())
			w := httptest.NewRecorder()

			// Call handler
			handler.HandleCRDSchema(w, req)

			// Check status code
			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			// For error responses that should have custom error handling, check the error message
			if tt.shouldHaveError {
				// Only check custom error messages for method validation and missing name
				if tt.method != "GET" || crdName == "" {
					contentType := w.Header().Get("Content-Type")
					if contentType != "application/json" {
						t.Errorf("Expected Content-Type 'application/json', got '%s'", contentType)
					}

					apiError, err := parseErrorResponse(w.Body.Bytes())
					if err != nil {
						t.Errorf("Failed to parse error response: %v", err)
					}
					if !contains(apiError.Err, tt.expectedError) {
						t.Errorf("Expected error to contain '%s', got '%s'", tt.expectedError, apiError.Err)
					}
				}
			}

			// For successful requests, check that the response contains the full CRD
			if !tt.shouldHaveError && w.Code == 200 {
				var responseCRD apiextensionsv1.CustomResourceDefinition
				if err := json.Unmarshal(w.Body.Bytes(), &responseCRD); err != nil {
					t.Errorf("Failed to unmarshal CRD response: %v", err)
				}

				// Verify that the response contains the expected CRD
				if responseCRD.ObjectMeta.Name != crdName {
					t.Errorf("Expected CRD name %s, got %s", crdName, responseCRD.ObjectMeta.Name)
				}

				// Check that the correct API path was used
				if !tt.mockError && mockRT.requestPath != "" {
					expectedPath := fmt.Sprintf("/apis/apiextensions.k8s.io/v1/customresourcedefinitions/%s", crdName)
					if mockRT.requestPath != expectedPath {
						t.Errorf("Expected request path %s, got %s", expectedPath, mockRT.requestPath)
					}

					// Verify GET method was used
					if mockRT.requestMethod != "GET" {
						t.Errorf("Expected request method 'GET', got %s", mockRT.requestMethod)
					}
				}
			}
		})
	}
}

// Helper function to check if a string contains a substring
func contains(s, substr string) bool {
	return len(substr) == 0 || (len(s) >= len(substr) && s[:len(substr)] == substr)
}

// Helper function to generate expected K8s API path
func expectedK8sAPIPath(crdName string) string {
	return fmt.Sprintf("/apis/apiextensions.k8s.io/v1/customresourcedefinitions/%s", crdName)
}

func TestCRDSchemaHandler_PathTransformation(t *testing.T) {
	tests := []struct {
		name        string
		requestPath string
	}{
		{
			name:        "basic CRD name",
			requestPath: "/test.example.com",
		},
		{
			name:        "complex CRD name",
			requestPath: "/deployments.apps.openshift.io",
		},
		{
			name:        "hyphenated CRD name",
			requestPath: "/my-resource.example.com",
		},
		{
			name:        "CRD with numbers",
			requestPath: "/v1beta1-resources.example.com",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			crdName := extractCRDName(tt.requestPath)
			expectedPath := expectedK8sAPIPath(crdName)

			mockRT := &mockRoundTripper{
				responseStatus: 200,
				responseBody:   "{}",
			}

			mockProxy := createMockProxy(mockRT)
			handler := NewCRDSchemaHandler(mockProxy)

			req := httptest.NewRequest("GET", tt.requestPath, nil)
			w := httptest.NewRecorder()

			handler.HandleCRDSchema(w, req)

			if mockRT.requestPath != expectedPath {
				t.Errorf("Expected request path %s, got %s", expectedPath, mockRT.requestPath)
			}
		})
	}
}

func TestCRDSchemaHandler_ReturnsCompleteCRD(t *testing.T) {
	// Create CRD with full metadata and status
	crd := createMockCRD("examples.example.com")

	// Add multiple versions to test complete structure
	crd.Spec.Versions = append(crd.Spec.Versions, apiextensionsv1.CustomResourceDefinitionVersion{
		Name:    "v1beta1",
		Served:  false,
		Storage: false,
	})

	crdBytes, _ := json.Marshal(crd)
	mockRT := &mockRoundTripper{
		responseStatus: 200,
		responseBody:   string(crdBytes),
	}

	mockProxy := createMockProxy(mockRT)
	handler := NewCRDSchemaHandler(mockProxy)

	req := httptest.NewRequest("GET", "/examples.example.com", nil)
	w := httptest.NewRecorder()

	handler.HandleCRDSchema(w, req)

	if w.Code != 200 {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Verify that we get the complete CRD back
	var responseCRD apiextensionsv1.CustomResourceDefinition
	if err := json.Unmarshal(w.Body.Bytes(), &responseCRD); err != nil {
		t.Errorf("Failed to unmarshal CRD response: %v", err)
	}

	// Verify all versions are present
	if len(responseCRD.Spec.Versions) != 2 {
		t.Errorf("Expected 2 versions, got %d", len(responseCRD.Spec.Versions))
	}

	// Verify the CRD spec details
	if responseCRD.Spec.Group != "example.com" {
		t.Errorf("Expected group 'example.com', got '%s'", responseCRD.Spec.Group)
	}

	if responseCRD.Spec.Names.Kind != "Example" {
		t.Errorf("Expected kind 'Example', got '%s'", responseCRD.Spec.Names.Kind)
	}

	// Verify metadata is preserved
	if responseCRD.ObjectMeta.Name != "examples.example.com" {
		t.Errorf("Expected name 'examples.example.com', got '%s'", responseCRD.ObjectMeta.Name)
	}

	if responseCRD.ObjectMeta.UID == "" {
		t.Error("Expected UID to be preserved")
	}

	if responseCRD.ObjectMeta.ResourceVersion == "" {
		t.Error("Expected ResourceVersion to be preserved")
	}

	// Verify status is preserved
	if len(responseCRD.Status.StoredVersions) != 1 {
		t.Errorf("Expected 1 stored version, got %d", len(responseCRD.Status.StoredVersions))
	}

	if responseCRD.Status.AcceptedNames.Kind != "Example" {
		t.Errorf("Expected accepted names kind 'Example', got '%s'", responseCRD.Status.AcceptedNames.Kind)
	}
}

func TestCRDSchemaHandler_EdgeCases(t *testing.T) {
	tests := []struct {
		name             string
		mockResponseBody string
		expectedStatus   int
	}{
		{
			name:             "empty response body",
			mockResponseBody: "",
			expectedStatus:   200,
		},
		{
			name:             "invalid JSON response",
			mockResponseBody: "invalid json",
			expectedStatus:   200,
		},
		{
			name:             "minimal valid JSON",
			mockResponseBody: `{"kind": "CustomResourceDefinition"}`,
			expectedStatus:   200,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRT := &mockRoundTripper{
				responseStatus: 200,
				responseBody:   tt.mockResponseBody,
			}

			mockProxy := createMockProxy(mockRT)
			handler := NewCRDSchemaHandler(mockProxy)

			req := httptest.NewRequest("GET", "/test.example.com", nil)
			w := httptest.NewRecorder()

			handler.HandleCRDSchema(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			// Verify response body matches what was returned by the mock
			if w.Body.String() != tt.mockResponseBody {
				t.Errorf("Expected response body '%s', got '%s'", tt.mockResponseBody, w.Body.String())
			}
		})
	}
}

func TestCRDSchemaHandler_PathParsing(t *testing.T) {
	tests := []struct {
		name        string
		requestPath string
		shouldWork  bool
		expectedErr string
	}{
		{
			name:        "valid path with slash prefix",
			requestPath: "/myresource.example.com",
			shouldWork:  true,
		},
		{
			name:        "valid path with multiple dots",
			requestPath: "/my.resource.example.com",
			shouldWork:  true,
		},
		{
			name:        "empty path",
			requestPath: "/",
			shouldWork:  false,
			expectedErr: "CRD name parameter is required",
		},
		{
			name:        "just slash",
			requestPath: "/",
			shouldWork:  false,
			expectedErr: "CRD name parameter is required",
		},
		{
			name:        "complex path with multiple components",
			requestPath: "/very.complex.crd.name.example.com",
			shouldWork:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRT := &mockRoundTripper{
				responseStatus: 200,
				responseBody:   `{"kind": "CustomResourceDefinition"}`,
			}

			mockProxy := createMockProxy(mockRT)
			handler := NewCRDSchemaHandler(mockProxy)

			req := httptest.NewRequest("GET", tt.requestPath, nil)
			w := httptest.NewRecorder()

			handler.HandleCRDSchema(w, req)

			if tt.shouldWork {
				if w.Code != 200 {
					t.Errorf("Expected status 200, got %d", w.Code)
				}
			} else {
				if w.Code != 400 {
					t.Errorf("Expected status 400, got %d", w.Code)
				}

				apiError, err := parseErrorResponse(w.Body.Bytes())
				if err != nil {
					t.Errorf("Failed to parse error response: %v", err)
				}
				if !contains(apiError.Err, tt.expectedErr) {
					t.Errorf("Expected error to contain '%s', got '%s'", tt.expectedErr, apiError.Err)
				}
			}
		})
	}
}
