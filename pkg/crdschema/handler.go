package crdschema

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"k8s.io/klog/v2"

	"github.com/openshift/console/pkg/serverutils"
)

type CRDSchemaHandler struct {
	k8sEndpoint  string
	roundTripper http.RoundTripper
}

func NewCRDSchemaHandler(k8sEndpoint string, roundTripper http.RoundTripper) *CRDSchemaHandler {
	return &CRDSchemaHandler{
		k8sEndpoint:  k8sEndpoint,
		roundTripper: roundTripper,
	}
}

func (h *CRDSchemaHandler) HandleCRDSchema(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Invalid method: only GET is allowed"})
		return
	}

	// Get the CRD name from the query parameter
	crdName := r.URL.Query().Get("name")
	if crdName == "" {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: "CRD name parameter is required"})
		return
	}

	// Construct the URL object to fetch the specific CRD
	requestURL, err := url.Parse(h.k8sEndpoint)
	if err != nil {
		klog.Errorf("Failed to parse k8s endpoint: %v", err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: "Failed to construct request URL"})
		return
	}

	// Set the path to that specific CRD
	requestURL.Path = fmt.Sprintf("/apis/apiextensions.k8s.io/v1/customresourcedefinitions/%s", crdName)

	// Build the request
	req, err := http.NewRequestWithContext(context.TODO(), "GET", requestURL.String(), nil)
	if err != nil {
		klog.Errorf("Failed to create GET request for CRD %s: %v", crdName, err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: "Failed to create request"})
		return
	}

	// Actually send the request by using the round tripper
	resp, err := h.roundTripper.RoundTrip(req)
	if err != nil {
		klog.Errorf("Failed to fetch CRD %s: %v", crdName, err)
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: "Failed to fetch CRD from Kubernetes API"})
		return
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusNotFound:
		serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{Err: fmt.Sprintf("CRD %s not found", crdName)})
		return
	case http.StatusForbidden:
		klog.Errorf("Access denied when fetching CRD %s", crdName)
		serverutils.SendResponse(w, http.StatusForbidden, serverutils.ApiError{Err: "Access denied to CRD resource"})
		return
	case http.StatusOK:
		// continue processing
	default:
		klog.Errorf("Unexpected status code %d when fetching CRD %s", resp.StatusCode, crdName)
		serverutils.SendResponse(w, resp.StatusCode, serverutils.ApiError{Err: fmt.Sprintf("Unexpected response: %s", resp.Status)})
		return
	}

	// The request returned successfully, now read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		klog.Errorf("Failed to read response body for CRD %s: %v", crdName, err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: "Failed to read response"})
		return
	}

	// Return the complete CRD definition as JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(body)

	klog.V(4).Infof("Successfully fetched CRD definition for %s", crdName)
}
