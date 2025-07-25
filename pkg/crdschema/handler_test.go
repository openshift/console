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

// createMockCRDWithPrinterColumns creates a mock CRD with additional printer columns for testing
func createMockCRDWithPrinterColumns(name string) *apiextensionsv1.CustomResourceDefinition {
	crd := createMockCRD(name)

	// Add printer columns to v1 version
	crd.Spec.Versions[0].AdditionalPrinterColumns = []apiextensionsv1.CustomResourceColumnDefinition{
		{
			Name:        "Status",
			Type:        "string",
			Description: "The status of the resource",
			JSONPath:    ".status.phase",
		},
		{
			Name:        "Age",
			Type:        "date",
			Description: "The age of the resource",
			JSONPath:    ".metadata.creationTimestamp",
		},
	}

	// Add another version with different printer columns
	crd.Spec.Versions = append(crd.Spec.Versions, apiextensionsv1.CustomResourceDefinitionVersion{
		Name:    "v1beta1",
		Served:  true,
		Storage: false,
		AdditionalPrinterColumns: []apiextensionsv1.CustomResourceColumnDefinition{
			{
				Name:        "Ready",
				Type:        "boolean",
				Description: "Whether the resource is ready",
				JSONPath:    ".status.ready",
			},
		},
	})

	return crd
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
				mockCRD := createMockCRDWithPrinterColumns(crdName)
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

			// For successful requests, check that the response contains printer columns
			if !tt.shouldHaveError && w.Code == 200 {
				var response CRDPrinterColumnsResponse
				if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
					t.Errorf("Failed to unmarshal printer columns response: %v", err)
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

			mockCRD := createMockCRD(crdName)
			crdBytes, _ := json.Marshal(mockCRD)

			mockRT := &mockRoundTripper{
				responseStatus: 200,
				responseBody:   string(crdBytes),
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

func TestCRDSchemaHandler_ReturnsPrinterColumns(t *testing.T) {
	// Create CRD with printer columns
	crd := createMockCRDWithPrinterColumns("examples.example.com")

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

	// Verify that we get printer columns back
	var response CRDPrinterColumnsResponse
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Errorf("Failed to unmarshal printer columns response: %v", err)
	}

	// Verify per-version columns
	if response.PerVersion == nil {
		t.Error("Expected PerVersion to be populated")
	}

	// Check v1 columns
	v1Columns, exists := response.PerVersion["v1"]
	if !exists {
		t.Error("Expected v1 version to have printer columns")
	}
	if len(v1Columns) != 2 {
		t.Errorf("Expected 2 printer columns for v1, got %d", len(v1Columns))
	}

	// Verify column details
	if v1Columns[0].Name != "Status" {
		t.Errorf("Expected first column name 'Status', got '%s'", v1Columns[0].Name)
	}
	if v1Columns[0].JSONPath != ".status.phase" {
		t.Errorf("Expected first column JSONPath '.status.phase', got '%s'", v1Columns[0].JSONPath)
	}

	// Check v1beta1 columns
	v1beta1Columns, exists := response.PerVersion["v1beta1"]
	if !exists {
		t.Error("Expected v1beta1 version to have printer columns")
	}
	if len(v1beta1Columns) != 1 {
		t.Errorf("Expected 1 printer column for v1beta1, got %d", len(v1beta1Columns))
	}

	if v1beta1Columns[0].Name != "Ready" {
		t.Errorf("Expected v1beta1 column name 'Ready', got '%s'", v1beta1Columns[0].Name)
	}
}

func TestCRDSchemaHandler_NoPrinterColumns(t *testing.T) {
	// Create CRD without printer columns
	crd := createMockCRD("examples.example.com")

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

	// Verify response structure
	var response CRDPrinterColumnsResponse
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Errorf("Failed to unmarshal printer columns response: %v", err)
	}

	// Should have nil PerVersion when no columns exist
	if response.PerVersion != nil {
		t.Error("Expected PerVersion to be nil when no printer columns exist")
	}
}

func TestCRDSchemaHandler_EdgeCases(t *testing.T) {
	tests := []struct {
		name             string
		mockResponseBody string
		expectedStatus   int
		shouldParseJSON  bool
	}{
		{
			name:             "invalid JSON response",
			mockResponseBody: "invalid json",
			expectedStatus:   500, // Should return internal server error due to JSON parse failure
			shouldParseJSON:  false,
		},
		{
			name:             "empty response body",
			mockResponseBody: "",
			expectedStatus:   500, // Should return internal server error due to JSON parse failure
			shouldParseJSON:  false,
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

			if tt.shouldParseJSON {
				var response CRDPrinterColumnsResponse
				if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
					t.Errorf("Failed to unmarshal response: %v", err)
				}
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
			crdName := extractCRDName(tt.requestPath)

			var mockRT *mockRoundTripper
			if tt.shouldWork {
				mockCRD := createMockCRD(crdName)
				crdBytes, _ := json.Marshal(mockCRD)
				mockRT = &mockRoundTripper{
					responseStatus: 200,
					responseBody:   string(crdBytes),
				}
			} else {
				mockRT = &mockRoundTripper{
					responseStatus: 200,
					responseBody:   `{"kind": "CustomResourceDefinition"}`,
				}
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

func TestExtractPrinterColumns(t *testing.T) {
	handler := &CRDSchemaHandler{}

	t.Run("CRD with printer columns in multiple versions", func(t *testing.T) {
		crd := createMockCRDWithPrinterColumns("test.example.com")
		response := handler.extractPrinterColumns(crd)

		if response.PerVersion == nil {
			t.Error("Expected PerVersion to be populated")
		}

		if len(response.PerVersion) != 2 {
			t.Errorf("Expected 2 versions with printer columns, got %d", len(response.PerVersion))
		}

		// Check v1 version
		v1Columns := response.PerVersion["v1"]
		if len(v1Columns) != 2 {
			t.Errorf("Expected 2 columns for v1, got %d", len(v1Columns))
		}

		// Check v1beta1 version
		v1beta1Columns := response.PerVersion["v1beta1"]
		if len(v1beta1Columns) != 1 {
			t.Errorf("Expected 1 column for v1beta1, got %d", len(v1beta1Columns))
		}
	})

	t.Run("CRD with no printer columns", func(t *testing.T) {
		crd := createMockCRD("test.example.com")
		response := handler.extractPrinterColumns(crd)

		if response.PerVersion != nil {
			t.Error("Expected PerVersion to be nil when no printer columns exist")
		}
	})

	t.Run("CRD with some versions having printer columns", func(t *testing.T) {
		crd := createMockCRD("test.example.com")

		// Add a version with printer columns
		crd.Spec.Versions[0].AdditionalPrinterColumns = []apiextensionsv1.CustomResourceColumnDefinition{
			{
				Name:     "Status",
				Type:     "string",
				JSONPath: ".status.phase",
			},
		}

		// Add a version without printer columns
		crd.Spec.Versions = append(crd.Spec.Versions, apiextensionsv1.CustomResourceDefinitionVersion{
			Name:    "v2",
			Served:  true,
			Storage: false,
			// No AdditionalPrinterColumns
		})

		response := handler.extractPrinterColumns(crd)

		if response.PerVersion == nil {
			t.Error("Expected PerVersion to be populated")
		}

		if len(response.PerVersion) != 1 {
			t.Errorf("Expected 1 version with printer columns, got %d", len(response.PerVersion))
		}

		// Only v1 should have columns
		if _, exists := response.PerVersion["v1"]; !exists {
			t.Error("Expected v1 to have printer columns")
		}

		if _, exists := response.PerVersion["v2"]; exists {
			t.Error("Expected v2 to not have printer columns")
		}
	})
}
