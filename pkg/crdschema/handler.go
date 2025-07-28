package crdschema

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"

	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	"k8s.io/klog/v2"

	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/pkg/serverutils"
)

type CRDSchemaHandler struct {
	k8sProxy *proxy.Proxy
}

// CRDPrinterColumnsResponse represents the response structure for printer columns
type CRDPrinterColumnsResponse map[string][]apiextensionsv1.CustomResourceColumnDefinition

func NewCRDSchemaHandler(k8sProxy *proxy.Proxy) *CRDSchemaHandler {
	return &CRDSchemaHandler{
		k8sProxy: k8sProxy,
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

	// Create a new request to fetch the full CRD
	// URL-encode the crdName to prevent path traversal and injection attacks
	encodedCRDName := url.PathEscape(crdName)
	crdURL := fmt.Sprintf("/apis/apiextensions.k8s.io/v1/customresourcedefinitions/%s", encodedCRDName)

	// Create a new request for the CRD
	crdReq := httptest.NewRequest(http.MethodGet, crdURL, nil)
	// Copy headers from original request
	for name, values := range r.Header {
		for _, value := range values {
			crdReq.Header.Add(name, value)
		}
	}

	// Create a response recorder to capture the proxy response
	recorder := httptest.NewRecorder()

	// Use the proxy to fetch the CRD
	h.k8sProxy.ServeHTTP(recorder, crdReq)

	// Check if the proxy request was successful
	if recorder.Code != http.StatusOK {
		// Forward the error response from the proxy
		w.WriteHeader(recorder.Code)
		w.Header().Set("Content-Type", recorder.Header().Get("Content-Type"))
		_, err := w.Write(recorder.Body.Bytes())
		if err != nil {
			klog.Errorf("Failed to write error response for CRD %s: %v", crdName, err)
		}
		return
	}

	// Parse the CRD response
	var crd apiextensionsv1.CustomResourceDefinition
	if err := json.Unmarshal(recorder.Body.Bytes(), &crd); err != nil {
		klog.Errorf("Failed to parse CRD response for %s: %v", crdName, err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: "Failed to parse CRD response"})
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

// extractPrinterColumns extracts additional printer columns from the CRD
func (h *CRDSchemaHandler) extractPrinterColumns(crd *apiextensionsv1.CustomResourceDefinition) *CRDPrinterColumnsResponse {
	response := make(CRDPrinterColumnsResponse)

	// Extract per-version printer columns
	for _, version := range crd.Spec.Versions {
		if len(version.AdditionalPrinterColumns) > 0 {
			response[version.Name] = version.AdditionalPrinterColumns
		}
	}

	// If no columns exist, return nil instead of empty map
	if len(response) == 0 {
		return nil
	}

	return &response
}
