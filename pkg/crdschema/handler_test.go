package crdschema

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"github.com/openshift/console/pkg/serverutils"
)

// mockRoundTripper is a mock implementation of http.RoundTripper for testing
type mockRoundTripper struct {
	responseStatus int
	responseBody   string
	requestURL     string
	requestMethod  string
	shouldError    bool
	errorMessage   string
}

func (m *mockRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	m.requestURL = req.URL.String()
	m.requestMethod = req.Method

	if m.shouldError {
		return nil, errors.New(m.errorMessage)
	}

	response := &http.Response{
		StatusCode: m.responseStatus,
		Body:       io.NopCloser(bytes.NewReader([]byte(m.responseBody))),
		Header:     make(http.Header),
	}

	return response, nil
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
			expectedError:   "CRD nonexistent.example.com not found",
			shouldHaveError: true,
		},
		{
			name:            "forbidden access",
			method:          "GET",
			crdName:         "examples.example.com",
			mockStatus:      403,
			expectedStatus:  403,
			expectedError:   "Access denied to CRD resource",
			shouldHaveError: true,
		},
		{
			name:            "internal server error",
			method:          "GET",
			crdName:         "examples.example.com",
			mockStatus:      500,
			expectedStatus:  500,
			expectedError:   "Unexpected response: ",
			shouldHaveError: true,
		},
		{
			name:            "round trip error",
			method:          "GET",
			crdName:         "examples.example.com",
			mockError:       true,
			mockErrorMsg:    "network error",
			expectedStatus:  502,
			expectedError:   "Failed to fetch CRD from Kubernetes API",
			shouldHaveError: true,
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

			// Create handler
			handler := NewCRDSchemaHandler("https://api.example.com", mockRT)

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

			// Check Content-Type header
			contentType := w.Header().Get("Content-Type")
			if contentType != "application/json" {
				t.Errorf("Expected Content-Type 'application/json', got '%s'", contentType)
			}

			// For error responses, check the error message
			if tt.shouldHaveError {
				apiError, err := parseErrorResponse(w.Body.Bytes())
				if err != nil {
					t.Errorf("Failed to parse error response: %v", err)
				}
				if !contains(apiError.Err, tt.expectedError) {
					t.Errorf("Expected error to contain '%s', got '%s'", tt.expectedError, apiError.Err)
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

				// Verify that the response has the correct structure
				if responseCRD.Kind != "CustomResourceDefinition" {
					t.Errorf("Expected Kind 'CustomResourceDefinition', got %s", responseCRD.Kind)
				}

				// Check that the correct API endpoint was called
				if !tt.mockError {
					expectedURL := fmt.Sprintf("https://api.example.com/apis/apiextensions.k8s.io/v1/customresourcedefinitions/%s", tt.crdName)
					if mockRT.requestURL != expectedURL {
						t.Errorf("Expected request URL %s, got %s", expectedURL, mockRT.requestURL)
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

func TestCRDSchemaHandler_InvalidK8sEndpoint(t *testing.T) {
	// Test handler with invalid k8s endpoint URL
	mockRT := &mockRoundTripper{
		responseStatus: 200,
		responseBody:   "{}",
	}

	// Create handler with invalid endpoint
	handler := NewCRDSchemaHandler("://invalid-url", mockRT)

	req := httptest.NewRequest("GET", "/api/console/crd-schema?name=test.example.com", nil)
	w := httptest.NewRecorder()

	handler.HandleCRDSchema(w, req)

	// Should return 500 for invalid endpoint
	if w.Code != 500 {
		t.Errorf("Expected status 500, got %d", w.Code)
	}

	// Check error message
	apiError, err := parseErrorResponse(w.Body.Bytes())
	if err != nil {
		t.Errorf("Failed to parse error response: %v", err)
	}
	if apiError.Err != "Failed to construct request URL" {
		t.Errorf("Expected error 'Failed to construct request URL', got '%s'", apiError.Err)
	}
}

func TestCRDSchemaHandler_URLConstruction(t *testing.T) {
	tests := []struct {
		name        string
		k8sEndpoint string
		crdName     string
		expectedURL string
	}{
		{
			name:        "basic endpoint",
			k8sEndpoint: "https://api.example.com",
			crdName:     "test.example.com",
			expectedURL: "https://api.example.com/apis/apiextensions.k8s.io/v1/customresourcedefinitions/test.example.com",
		},
		{
			name:        "endpoint with port",
			k8sEndpoint: "https://api.example.com:6443",
			crdName:     "test.example.com",
			expectedURL: "https://api.example.com:6443/apis/apiextensions.k8s.io/v1/customresourcedefinitions/test.example.com",
		},
		{
			name:        "endpoint with path",
			k8sEndpoint: "https://api.example.com/kubernetes",
			crdName:     "test.example.com",
			expectedURL: "https://api.example.com/apis/apiextensions.k8s.io/v1/customresourcedefinitions/test.example.com",
		},
		{
			name:        "complex CRD name",
			k8sEndpoint: "https://api.example.com",
			crdName:     "deployments.apps.openshift.io",
			expectedURL: "https://api.example.com/apis/apiextensions.k8s.io/v1/customresourcedefinitions/deployments.apps.openshift.io",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRT := &mockRoundTripper{
				responseStatus: 200,
				responseBody:   "{}",
			}

			handler := NewCRDSchemaHandler(tt.k8sEndpoint, mockRT)

			req := httptest.NewRequest("GET", fmt.Sprintf("/api/console/crd-schema?name=%s", tt.crdName), nil)
			w := httptest.NewRecorder()

			handler.HandleCRDSchema(w, req)

			if mockRT.requestURL != tt.expectedURL {
				t.Errorf("Expected request URL %s, got %s", tt.expectedURL, mockRT.requestURL)
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

	handler := NewCRDSchemaHandler("https://api.example.com", mockRT)

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
		shouldValidate   bool
	}{
		{
			name:             "empty response body",
			mockResponseBody: "",
			expectedStatus:   200,
			shouldValidate:   false, // Empty response is passed through
		},
		{
			name:             "invalid JSON response",
			mockResponseBody: "invalid json",
			expectedStatus:   200,
			shouldValidate:   false, // Invalid JSON is passed through
		},
		{
			name:             "minimal valid JSON",
			mockResponseBody: `{"kind": "CustomResourceDefinition"}`,
			expectedStatus:   200,
			shouldValidate:   false, // Minimal JSON is passed through
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRT := &mockRoundTripper{
				responseStatus: 200,
				responseBody:   tt.mockResponseBody,
			}

			handler := NewCRDSchemaHandler("https://api.example.com", mockRT)

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

			// Verify Content-Type is set
			if w.Header().Get("Content-Type") != "application/json" {
				t.Errorf("Expected Content-Type 'application/json', got '%s'", w.Header().Get("Content-Type"))
			}
		})
	}
}
