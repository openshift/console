package crdschema

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
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

	// Create dynamic client
	client, err := dynamic.NewForConfig(h.anonConfig)
	if err != nil {
		h.sendError(w, http.StatusInternalServerError, "Failed to create Kubernetes client", "Failed to create dynamic client: %v", err)
		return
	}

	// Define CRD resource
	crdGVR := schema.GroupVersionResource{
		Group:    "apiextensions.k8s.io",
		Version:  "v1",
		Resource: "customresourcedefinitions",
	}

	// Fetch the CRD using dynamic client
	unstructuredCRD, err := client.Resource(crdGVR).Get(context.TODO(), crdName, metav1.GetOptions{})
	if err != nil {
		h.sendError(w, http.StatusNotFound, "CRD not found", "Failed to get CRD %s: %v", crdName, err)
		return
	}

	// Convert unstructured to typed CRD
	var crd apiextensionsv1.CustomResourceDefinition
	if err := runtime.DefaultUnstructuredConverter.FromUnstructured(unstructuredCRD.Object, &crd); err != nil {
		h.sendError(w, http.StatusInternalServerError, "Failed to parse CRD", "Failed to convert unstructured CRD %s: %v", crdName, err)
		return
	}

	// Extract printer columns
	response := h.extractPrinterColumns(&crd)

	// Return the printer columns response
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		h.sendError(w, http.StatusInternalServerError, "Failed to encode response", "Failed to encode printer columns response for CRD %s: %v", crdName, err)
		return
	}

	klog.V(4).Infof("Successfully returned printer columns for CRD %s", crdName)
}

// sendError consolidates error handling
func (h *CRDSchemaHandler) sendError(w http.ResponseWriter, statusCode int, userMsg string, logMsg string, args ...interface{}) {
	klog.Errorf(logMsg, args...)
	serverutils.SendResponse(w, statusCode, serverutils.ApiError{Err: userMsg})
}

// extractPrinterColumns extracts additional printer columns from the CRD
func (h *CRDSchemaHandler) extractPrinterColumns(crd *apiextensionsv1.CustomResourceDefinition) CRDPrinterColumnsResponse {
	response := make(CRDPrinterColumnsResponse)

	// Extract per-version printer columns
	for _, version := range crd.Spec.Versions {
		if len(version.AdditionalPrinterColumns) > 0 {
			response[version.Name] = version.AdditionalPrinterColumns
		}
	}

	return response
}
