package server

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"sync"

	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/pkg/serverutils"

	"k8s.io/klog/v2"
)

type apiGroupList struct {
	Groups []apiGroup `json:"groups"`
}

type apiGroup struct {
	Name             string            `json:"name"`
	Versions         []apiGroupVersion `json:"versions"`
	PreferredVersion apiGroupVersion   `json:"preferredVersion"`
}

type apiGroupVersion struct {
	GroupVersion string `json:"groupVersion"`
	Version      string `json:"version"`
}

type apiDiscoveryResponse struct {
	Groups        json.RawMessage   `json:"groups"`
	ResourceLists []json.RawMessage `json:"resourceLists"`
}

func apiDiscoveryHandler(k8sProxy *proxy.Proxy) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "only GET is allowed"})
			return
		}

		groupsBody, err := k8sViaProxy(k8sProxy, "/apis", r)
		if err != nil {
			serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: fmt.Sprintf("failed to fetch /apis: %v", err)})
			return
		}

		var groups apiGroupList
		if err := json.Unmarshal(groupsBody, &groups); err != nil {
			serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: "failed to parse /apis response"})
			return
		}

		var paths []string
		for _, group := range groups.Groups {
			for _, version := range group.Versions {
				paths = append(paths, "/apis/"+version.GroupVersion)
			}
		}
		paths = append(paths, "/api/v1")

		results := make([]json.RawMessage, len(paths))
		var wg sync.WaitGroup
		sem := make(chan struct{}, 100)
		wg.Add(len(paths))

		for i, p := range paths {
			sem <- struct{}{}
			go func(idx int, path string) {
				defer wg.Done()
				defer func() { <-sem }()
				body, err := k8sViaProxy(k8sProxy, path, r)
				if err != nil {
					klog.V(4).Infof("api-discovery: skipping %s", path)
					return
				}
				results[idx] = body
			}(i, p)
		}

		wg.Wait()

		resourceLists := make([]json.RawMessage, 0, len(results))
		for _, res := range results {
			if res != nil {
				resourceLists = append(resourceLists, res)
			}
		}

		resp := apiDiscoveryResponse{
			Groups:        groupsBody,
			ResourceLists: resourceLists,
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			klog.Errorf("api-discovery: failed to write response: %v", err)
		}
	}
}

// k8sViaProxy makes an in-process GET request through the k8s proxy.
func k8sViaProxy(handler http.Handler, path string, originalReq *http.Request) (body []byte, err error) {
	req, err := http.NewRequestWithContext(originalReq.Context(), "GET", path, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request for %s", path)
	}

	req.Header = originalReq.Header.Clone()

	rec := httptest.NewRecorder()

	defer func() {
		if p := recover(); p != nil {
			if p == http.ErrAbortHandler {
				err = fmt.Errorf("request aborted for %s", path)
			} else {
				panic(p)
			}
		}
	}()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d for %s", rec.Code, path)
	}

	return io.ReadAll(rec.Body)
}
