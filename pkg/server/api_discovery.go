package server

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"sync"
	"time"

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

func apiDiscoveryHandler(proxyConfig *proxy.Config) http.HandlerFunc {
	var tlsConfig *tls.Config
	if proxyConfig.TLSClientConfig != nil {
		tlsConfig = proxyConfig.TLSClientConfig.Clone()
	}
	transport := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   30 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		TLSClientConfig:     tlsConfig,
		TLSHandshakeTimeout: 10 * time.Second,
		MaxIdleConnsPerHost: 100,
		ForceAttemptHTTP2:   true,
	}

	client := &http.Client{Transport: transport}
	endpoint := proxyConfig.Endpoint

	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "only GET is allowed"})
			return
		}

		groupsBody, err := k8sFetch(client, endpoint, "/apis", r)
		if err != nil {
			serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: fmt.Sprintf("failed to fetch /apis: %v", err)})
			return
		}

		var groups apiGroupList
		if err := json.Unmarshal(groupsBody, &groups); err != nil {
			serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: fmt.Sprintf("failed to parse /apis: %v", err)})
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
		wg.Add(len(paths))

		for i, p := range paths {
			go func(idx int, path string) {
				defer wg.Done()
				body, err := k8sFetch(client, endpoint, path, r)
				if err != nil {
					klog.V(4).Infof("api-discovery: skipping %s: %v", path, err)
					return
				}
				results[idx] = body
			}(i, p)
		}

		wg.Wait()

		var resourceLists []json.RawMessage
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

func k8sFetch(client *http.Client, endpoint *url.URL, path string, originalReq *http.Request) ([]byte, error) {
	url := proxy.SingleJoiningSlash(endpoint.String(), path)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Forward auth headers from the original request
	if auth := originalReq.Header.Get("Authorization"); auth != "" {
		req.Header.Set("Authorization", auth)
	}
	if user := originalReq.Header.Get("Impersonate-User"); user != "" {
		req.Header.Set("Impersonate-User", user)
		for _, group := range originalReq.Header.Values("Impersonate-Group") {
			req.Header.Add("Impersonate-Group", group)
		}
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d for %s", resp.StatusCode, path)
	}

	return io.ReadAll(resp.Body)
}

