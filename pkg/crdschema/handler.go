package crdschema

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
	"strings"

	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/rest"
	"k8s.io/klog/v2"

	"github.com/openshift/console/pkg/serverutils"
)

type CRDSchemaHandler struct {
	anonConfig *rest.Config
}

// CRDPrinterColumnsResponse represents the response structure for printer columns
type CRDPrinterColumnsResponse map[string][]apiextensionsv1.CustomResourceColumnDefinition

var (
	crdGVR = schema.GroupVersionResource{
		Group:    "apiextensions.k8s.io",
		Version:  "v1",
		Resource: "customresourcedefinitions",
	}
)

func NewCRDSchemaHandler(anonConfig *rest.Config) *CRDSchemaHandler {
	return &CRDSchemaHandler{
		anonConfig: anonConfig,
	}
}

func (h *CRDSchemaHandler) HandleCRDSchema(w http.ResponseWriter, r *http.Request) {
	// Validate HTTP method
	if r.Method != http.MethodGet {
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Invalid method: only GET is allowed"})
		return
	}

	// Get the CRD name from the URL path
	crdName := strings.TrimPrefix(r.URL.Path, "/")
	if crdName == "" {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: "CRD name parameter is required"})
		return
	}

	// URL-encode the crdName to prevent path traversal and injection attacks
	encodedCRDName := url.PathEscape(crdName)

	// Create dynamic client with service account authentication
	client, err := h.createDynamicClient()
	if err != nil {
		klog.Errorf("Failed to create dynamic client: %v", err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: "Failed to create Kubernetes client"})
		return
	}

	// Fetch the CRD using dynamic client
	unstructuredCRD, err := client.Resource(crdGVR).Get(context.TODO(), encodedCRDName, metav1.GetOptions{})
	if err != nil {
		klog.Errorf("Failed to get CRD %s: %v", encodedCRDName, err)
		serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{Err: "CRD not found"})
		return
	}

	// Convert unstructured to typed CRD
	var crd apiextensionsv1.CustomResourceDefinition
	if err := h.convertUnstructuredToCRD(unstructuredCRD, &crd); err != nil {
		klog.Errorf("Failed to convert unstructured CRD %s: %v", encodedCRDName, err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: "Failed to parse CRD"})
		return
	}

	// Extract printer columns
	response := h.extractPrinterColumns(&crd)

	// Return the printer columns response
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		klog.Errorf("Failed to encode printer columns response for CRD %s: %v", crdName, err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: "Failed to encode response"})
		return
	}

	klog.V(4).Infof("Successfully returned printer columns for CRD %s", crdName)
}

// createDynamicClient creates a dynamic client with service account authentication
func (h *CRDSchemaHandler) createDynamicClient() (dynamic.Interface, error) {
	client, err := dynamic.NewForConfig(h.anonConfig)
	if err != nil {
		return nil, err
	}
	return client, nil
}

// convertUnstructuredToCRD converts unstructured object to typed CRD using runtime converter
func (h *CRDSchemaHandler) convertUnstructuredToCRD(obj *unstructured.Unstructured, crd *apiextensionsv1.CustomResourceDefinition) error {
	return runtime.DefaultUnstructuredConverter.FromUnstructured(obj.Object, crd)
}

// extractPrinterColumns extracts additional printer columns from the CRD
func (h *CRDSchemaHandler) extractPrinterColumns(crd *apiextensionsv1.CustomResourceDefinition) *CRDPrinterColumnsResponse {
	response := make(CRDPrinterColumnsResponse)

	// Extract per-version printer columns
	for _, version := range crd.Spec.Versions {
		if len(version.AdditionalPrinterColumns) > 0 {
			response[version.Name] = version.AdditionalPrinterColumns
		}
	}

	return &response
}
