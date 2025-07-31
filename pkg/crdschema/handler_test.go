package crdschema

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/dynamic/fake"
	"k8s.io/client-go/rest"

	"github.com/openshift/console/pkg/serverutils"
)

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

// testableHandler wraps the CRDSchemaHandler to allow injecting a mock client
type testableHandler struct {
	*CRDSchemaHandler
	mockClient dynamic.Interface
}

func (h *testableHandler) HandleCRDSchema(w http.ResponseWriter, r *http.Request) {
	// Override the client creation in the original method logic
	if r.Method != http.MethodGet {
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Invalid method: only GET is allowed"})
		return
	}

	crdName := strings.TrimPrefix(r.URL.Path, "/")
	if crdName == "" {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: "CRD name parameter is required"})
		return
	}

	// Use mock client instead of creating a real one
	client := h.mockClient

	crdGVR := schema.GroupVersionResource{
		Group:    "apiextensions.k8s.io",
		Version:  "v1",
		Resource: "customresourcedefinitions",
	}

	unstructuredCRD, err := client.Resource(crdGVR).Get(r.Context(), crdName, metav1.GetOptions{})
	if err != nil {
		h.sendError(w, http.StatusNotFound, "CRD not found", "Failed to get CRD %s: %v", crdName, err)
		return
	}

	var crd apiextensionsv1.CustomResourceDefinition
	if err := runtime.DefaultUnstructuredConverter.FromUnstructured(unstructuredCRD.Object, &crd); err != nil {
		h.sendError(w, http.StatusInternalServerError, "Failed to parse CRD", "Failed to convert unstructured CRD %s: %v", crdName, err)
		return
	}

	response := h.extractPrinterColumns(&crd)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		h.sendError(w, http.StatusInternalServerError, "Failed to encode response", "Failed to encode printer columns response for CRD %s: %v", crdName, err)
		return
	}
}

// createMockHandler creates a testable handler with a mock client
func createMockHandler(crds ...*apiextensionsv1.CustomResourceDefinition) *testableHandler {
	scheme := runtime.NewScheme()
	apiextensionsv1.AddToScheme(scheme)

	objects := []runtime.Object{}
	for _, crd := range crds {
		unstructuredCRD, _ := runtime.DefaultUnstructuredConverter.ToUnstructured(crd)
		obj := &unstructured.Unstructured{Object: unstructuredCRD}
		obj.SetGroupVersionKind(schema.GroupVersionKind{
			Group:   "apiextensions.k8s.io",
			Version: "v1",
			Kind:    "CustomResourceDefinition",
		})
		objects = append(objects, obj)
	}

	mockClient := fake.NewSimpleDynamicClient(scheme, objects...)

	config := &rest.Config{Host: "https://mock-k8s-api.example.com"}
	handler := NewCRDSchemaHandler(config)

	return &testableHandler{
		CRDSchemaHandler: handler,
		mockClient:       mockClient,
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
		requestPath     string
		crdExists       bool
		expectedStatus  int
		expectedError   string
		shouldHaveError bool
	}{
		{
			name:           "successful request",
			method:         "GET",
			requestPath:    "/examples.example.com",
			crdExists:      true,
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
			name:           "CRD not found",
			method:         "GET",
			requestPath:    "/nonexistent.example.com",
			crdExists:      false,
			expectedStatus: 404,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var handler *testableHandler

			if tt.crdExists {
				crdName := strings.TrimPrefix(tt.requestPath, "/")
				mockCRD := createMockCRDWithPrinterColumns(crdName)
				handler = createMockHandler(mockCRD)
			} else {
				handler = createMockHandler() // Empty handler with no CRDs
			}

			req := httptest.NewRequest(tt.method, tt.requestPath, nil)
			req = req.WithContext(context.Background())
			w := httptest.NewRecorder()

			handler.HandleCRDSchema(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			if tt.shouldHaveError {
				contentType := w.Header().Get("Content-Type")
				if contentType != "application/json" {
					t.Errorf("Expected Content-Type 'application/json', got '%s'", contentType)
				}

				apiError, err := parseErrorResponse(w.Body.Bytes())
				if err != nil {
					t.Errorf("Failed to parse error response: %v", err)
				}
				if !strings.Contains(apiError.Err, tt.expectedError) {
					t.Errorf("Expected error to contain '%s', got '%s'", tt.expectedError, apiError.Err)
				}
			}

			if !tt.shouldHaveError && w.Code == 200 {
				var response CRDPrinterColumnsResponse
				if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
					t.Errorf("Failed to unmarshal printer columns response: %v", err)
				}

				if len(response) == 0 {
					t.Error("Expected response to contain printer columns")
				}
			}
		})
	}
}

func TestCRDSchemaHandler_ReturnsPrinterColumns(t *testing.T) {
	crd := createMockCRDWithPrinterColumns("examples.example.com")
	handler := createMockHandler(crd)

	req := httptest.NewRequest("GET", "/examples.example.com", nil)
	w := httptest.NewRecorder()

	handler.HandleCRDSchema(w, req)

	if w.Code != 200 {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response CRDPrinterColumnsResponse
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Errorf("Failed to unmarshal printer columns response: %v", err)
	}

	if response == nil {
		t.Error("Expected response to be populated")
	}

	// Check v1 columns
	v1Columns, exists := response["v1"]
	if !exists {
		t.Error("Expected v1 version to have printer columns")
	}
	if len(v1Columns) != 2 {
		t.Errorf("Expected 2 printer columns for v1, got %d", len(v1Columns))
	}

	if v1Columns[0].Name != "Status" {
		t.Errorf("Expected first column name 'Status', got '%s'", v1Columns[0].Name)
	}
	if v1Columns[0].JSONPath != ".status.phase" {
		t.Errorf("Expected first column JSONPath '.status.phase', got '%s'", v1Columns[0].JSONPath)
	}

	// Check v1beta1 columns
	v1beta1Columns, exists := response["v1beta1"]
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
	crd := createMockCRD("examples.example.com")
	handler := createMockHandler(crd)

	req := httptest.NewRequest("GET", "/examples.example.com", nil)
	w := httptest.NewRecorder()

	handler.HandleCRDSchema(w, req)

	if w.Code != 200 {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response CRDPrinterColumnsResponse
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Errorf("Failed to unmarshal printer columns response: %v", err)
	}

	if len(response) != 0 {
		t.Error("Expected response to be empty when no printer columns exist")
	}
}

func TestExtractPrinterColumns(t *testing.T) {
	config := &rest.Config{Host: "https://test"}
	handler := NewCRDSchemaHandler(config)

	t.Run("CRD with printer columns in multiple versions", func(t *testing.T) {
		crd := createMockCRDWithPrinterColumns("test.example.com")
		response := handler.extractPrinterColumns(crd)

		if len(response) != 2 {
			t.Errorf("Expected 2 versions with printer columns, got %d", len(response))
		}

		// Check v1 version
		v1Columns := response["v1"]
		if len(v1Columns) != 2 {
			t.Errorf("Expected 2 columns for v1, got %d", len(v1Columns))
		}

		// Check v1beta1 version
		v1beta1Columns := response["v1beta1"]
		if len(v1beta1Columns) != 1 {
			t.Errorf("Expected 1 column for v1beta1, got %d", len(v1beta1Columns))
		}
	})

	t.Run("CRD with no printer columns", func(t *testing.T) {
		crd := createMockCRD("test.example.com")
		response := handler.extractPrinterColumns(crd)

		if len(response) != 0 {
			t.Error("Expected response to be empty when no printer columns exist")
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

		if len(response) != 1 {
			t.Errorf("Expected 1 version with printer columns, got %d", len(response))
		}

		// Only v1 should have columns
		if _, exists := response["v1"]; !exists {
			t.Error("Expected v1 to have printer columns")
		}

		if _, exists := response["v2"]; exists {
			t.Error("Expected v2 to not have printer columns")
		}
	})
}
