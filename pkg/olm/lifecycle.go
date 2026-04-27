package olm

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"

	"k8s.io/klog/v2"

	"github.com/openshift/console/pkg/serverutils"
)

// k8sNameRegex validates strict DNS label names (namespaces, service names).
var k8sNameRegex = regexp.MustCompile(`^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?$`)

// catalogNameRegex allows dots and underscores since lifecycleServiceURL sanitizes them.
var catalogNameRegex = regexp.MustCompile(`^[a-z0-9][a-z0-9.\-_]{0,61}[a-z0-9]$`)

func isValidK8sName(s string) bool {
	return k8sNameRegex.MatchString(s)
}

func isValidCatalogName(s string) bool {
	return catalogNameRegex.MatchString(s)
}

func lifecycleServiceURL(catalogNamespace, catalogName string) string {
	serviceName := strings.ReplaceAll(catalogName, ".", "-")
	serviceName = strings.ReplaceAll(serviceName, "_", "-")
	serviceName = strings.ToLower(serviceName)
	serviceName = fmt.Sprintf("%s-lifecycle-server", serviceName)
	if len(serviceName) > 63 {
		serviceName = serviceName[:63]
		serviceName = strings.TrimRight(serviceName, "-")
	}
	return fmt.Sprintf("https://%s.%s.svc:8443", serviceName, catalogNamespace)
}

func (o *OLMHandler) lifecycleHandler(w http.ResponseWriter, r *http.Request) {
	catalogNamespace := r.PathValue("catalogNamespace")
	catalogName := r.PathValue("catalogName")
	packageName := r.PathValue("packageName")

	klog.Infof("[lifecycle] Received request: catalogNamespace=%q catalogName=%q packageName=%q", catalogNamespace, catalogName, packageName)

	if !isValidK8sName(catalogNamespace) {
		klog.Infof("[lifecycle] Invalid catalogNamespace: %q", catalogNamespace)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: "invalid catalogNamespace"})
		return
	}

	if !isValidCatalogName(catalogName) {
		klog.Infof("[lifecycle] Invalid catalogName: %q", catalogName)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: "invalid catalogName"})
		return
	}

	if packageName == "" {
		klog.Infof("[lifecycle] Missing packageName")
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: "packageName is required"})
		return
	}

	if o.lifecycleClient == nil {
		klog.Infof("[lifecycle] lifecycleClient is nil — service not configured")
		serverutils.SendResponse(w, http.StatusServiceUnavailable, serverutils.ApiError{Err: "lifecycle service not configured"})
		return
	}

	serviceURL := lifecycleServiceURL(catalogNamespace, catalogName)
	requestURL := fmt.Sprintf("%s/api/v1alpha1/lifecycles/%s", serviceURL, url.PathEscape(packageName))
	klog.Infof("[lifecycle] Proxying to upstream: %s", requestURL)

	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, requestURL, nil)
	if err != nil {
		klog.Errorf("[lifecycle] Failed to create lifecycle request: %v", err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: fmt.Sprintf("failed to create request: %v", err)})
		return
	}

	resp, err := o.lifecycleClient.Do(req)
	if err != nil {
		klog.Infof("[lifecycle] Upstream request failed for %s/%s: %v", catalogName, packageName, err)
		serverutils.SendResponse(w, http.StatusServiceUnavailable, serverutils.ApiError{Err: "lifecycle service unavailable"})
		return
	}
	defer resp.Body.Close()

	klog.Infof("[lifecycle] Upstream response: status=%d content-type=%q", resp.StatusCode, resp.Header.Get("Content-Type"))

	if ct := resp.Header.Get("Content-Type"); ct != "" {
		w.Header().Set("Content-Type", ct)
	}
	w.WriteHeader(resp.StatusCode)
	if _, err := io.Copy(w, resp.Body); err != nil {
		klog.Errorf("[lifecycle] Failed to write lifecycle response: %v", err)
	}
}
