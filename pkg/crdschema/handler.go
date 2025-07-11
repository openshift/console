package crdschema

import (
	"fmt"
	"net/http"

	"k8s.io/klog/v2"

	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/pkg/serverutils"
)

type CRDSchemaHandler struct {
	k8sProxy *proxy.Proxy
}

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

	// Get the CRD name from the query parameter
	crdName := r.URL.Query().Get("name")
	if crdName == "" {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: "CRD name parameter is required"})
		return
	}

	// Transform the request path to Kubernetes API format
	r.URL.Path = fmt.Sprintf("/apis/apiextensions.k8s.io/v1/customresourcedefinitions/%s", crdName)
	r.URL.RawQuery = "" // Remove the query parameters

	// Use the existing k8sProxy to handle the request
	h.k8sProxy.ServeHTTP(w, r)

	klog.V(4).Infof("Successfully proxied CRD request for %s", crdName)
}
