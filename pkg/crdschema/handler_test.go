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

// createMockProxy creates a mock proxy for testing
func createMockProxy(mockRT *mockRoundTripper) (*proxy.Proxy, func()) {
	// Create a test server that uses our mock round tripper
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Record the request for assertions
		mockRT.requestURL = r.URL.String()
		mockRT.requestMethod = r.Method
		mockRT.requestPath = r.URL.Path

		if mockRT.shouldError {
			http.Error(w, mockRT.errorMessage, http.StatusBadGateway)
			return
		}

		w.WriteHeader(mockRT.responseStatus)
		w.Write([]byte(mockRT.responseBody))
	}))

	targetURL, _ := url.Parse(testServer.URL)
	config := &proxy.Config{
		Endpoint:        targetURL,
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}

	return proxy.NewProxy(config), testServer.Close
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

func TestCRDSchemaHandler_HandleCRDSchema(t *testing.T) {
	tests := []struct {
		name            string
		method          string
		crdName         string
		mockStatus      int
		mockCRD         *apiextensionsv1.CustomResourceDefinition
		mockError       bool
		mockErrorMsg    string
		expectedStatus  int
		expectedError   string
		shouldHaveError bool
	}{
		{
			name:           "successful request",
			method:         "GET",
			crdName:        "examples.example.com",
			mockStatus:     200,
			mockCRD:        createMockCRD("examples.example.com"),
			expectedStatus: 200,
		},
		{
			name:            "invalid method POST",
			method:          "POST",
			crdName:         "examples.example.com",
			expectedStatus:  405,
			expectedError:   "Invalid method: only GET is allowed",
			shouldHaveError: true,
		},
		{
			name:            "invalid method PUT",
			method:          "PUT",
			crdName:         "examples.example.com",
			expectedStatus:  405,
			expectedError:   "Invalid method: only GET is allowed",
			shouldHaveError: true,
		},
		{
			name:            "missing CRD name",
			method:          "GET",
			crdName:         "",
			expectedStatus:  400,
			expectedError:   "CRD name parameter is required",
			shouldHaveError: true,
		},
		{
			name:            "CRD not found",
			method:          "GET",
			crdName:         "nonexistent.example.com",
			mockStatus:      404,
			expectedStatus:  404,
			shouldHaveError: false, // Proxy passes through 404s
		},
		{
			name:            "forbidden access",
			method:          "GET",
			crdName:         "examples.example.com",
			mockStatus:      403,
			expectedStatus:  403,
			shouldHaveError: false, // Proxy passes through 403s
		},
		{
			name:            "internal server error",
			method:          "GET",
			crdName:         "examples.example.com",
			mockStatus:      500,
			expectedStatus:  500,
			shouldHaveError: false, // Proxy passes through 500s
		},
		{
			name:            "round trip error",
			method:          "GET",
			crdName:         "examples.example.com",
			mockError:       true,
			mockErrorMsg:    "network error",
			expectedStatus:  502,
			shouldHaveError: false, // Proxy handles transport errors
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create mock response body
			var mockResponseBody string
			if tt.mockCRD != nil {
				crdBytes, _ := json.Marshal(tt.mockCRD)
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
			mockProxy, cleanup := createMockProxy(mockRT)
			defer cleanup()

			// Create handler
			handler := NewCRDSchemaHandler(mockProxy)

			// Create request
			req := httptest.NewRequest(tt.method, fmt.Sprintf("/api/console/crd-schema?name=%s", tt.crdName), nil)
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
				if tt.method != "GET" || tt.crdName == "" {
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
				if responseCRD.ObjectMeta.Name != tt.crdName {
					t.Errorf("Expected CRD name %s, got %s", tt.crdName, responseCRD.ObjectMeta.Name)
				}

				// Check that the correct API path was used
				if !tt.mockError && mockRT.requestPath != "" {
					expectedPath := fmt.Sprintf("/apis/apiextensions.k8s.io/v1/customresourcedefinitions/%s", tt.crdName)
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

func TestCRDSchemaHandler_PathTransformation(t *testing.T) {
	tests := []struct {
		name         string
		crdName      string
		expectedPath string
	}{
		{
			name:         "basic CRD name",
			crdName:      "test.example.com",
			expectedPath: "/apis/apiextensions.k8s.io/v1/customresourcedefinitions/test.example.com",
		},
		{
			name:         "complex CRD name",
			crdName:      "deployments.apps.openshift.io",
			expectedPath: "/apis/apiextensions.k8s.io/v1/customresourcedefinitions/deployments.apps.openshift.io",
		},
		{
			name:         "hyphenated CRD name",
			crdName:      "my-resource.example.com",
			expectedPath: "/apis/apiextensions.k8s.io/v1/customresourcedefinitions/my-resource.example.com",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRT := &mockRoundTripper{
				responseStatus: 200,
				responseBody:   "{}",
			}

			mockProxy, cleanup := createMockProxy(mockRT)
			defer cleanup()
			handler := NewCRDSchemaHandler(mockProxy)

			req := httptest.NewRequest("GET", fmt.Sprintf("/api/console/crd-schema?name=%s", tt.crdName), nil)
			w := httptest.NewRecorder()

			handler.HandleCRDSchema(w, req)

			if mockRT.requestPath != tt.expectedPath {
				t.Errorf("Expected request path %s, got %s", tt.expectedPath, mockRT.requestPath)
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

	mockProxy, cleanup := createMockProxy(mockRT)
	defer cleanup()
	handler := NewCRDSchemaHandler(mockProxy)

	req := httptest.NewRequest("GET", "/api/console/crd-schema?name=examples.example.com", nil)
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

			mockProxy, cleanup := createMockProxy(mockRT)
			defer cleanup()
			handler := NewCRDSchemaHandler(mockProxy)

			req := httptest.NewRequest("GET", "/api/console/crd-schema?name=test.example.com", nil)
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
