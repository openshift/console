package server

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"strconv"
)

// ResourceLister determines the list of resources (of a particular kind) that a particular user
// can view.
type ResourceLister struct {
	// The path at which the resources can be found under the Kubernetes API.
	ResourcesPath string

	// If the user's bearer token doesn't have the ability to list the resources, this
	// token is used instead to perform the list request. The user will still only
	// see the subset of resources they have access to.
	BearerToken string

	// Endpoint of the API server.
	K8sEndpoint string

	// A client with the correct TLS setup for communicating with the API server.
	// It should not use client credentials.
	Client *http.Client

	// TODO(ericchiang): Determine if it's worth caching results.
}

// get performs an HTTP request on the following path, using the provided bearer
// token for authentication.
func (l *ResourceLister) get(ctx context.Context, bearerToken, path string) (*http.Response, error) {
	req, err := http.NewRequest("GET", l.K8sEndpoint+path, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %v", err)
	}
	if bearerToken != "" {
		req.Header.Set("Authorization", "Bearer "+bearerToken)
	}
	return l.Client.Do(req.WithContext(ctx))
}

// forwardResponse copies a response to a response writer.
func forwardResponse(w http.ResponseWriter, r *http.Response) {
	for k, vv := range r.Header {
		for _, v := range vv {
			// TODO: (kans) its not safe to copy every header. eg: HTTP/2 blacklists some headers
			w.Header().Add(k, v)
		}
	}
	w.WriteHeader(r.StatusCode)
	io.Copy(w, r.Body)
	r.Body.Close()
}

// handleResources is proxy to the given resource path but handles cases where
// the provided bearer token doesn't have permission to view that endpoint. In these
// cases the method will list all the resources, then filter the ones the bearer
// token can view.
func (l *ResourceLister) handleResources(requestBearerToken string, w http.ResponseWriter, r *http.Request) {
	// dev mode of some sort most likely
	rsURL := l.ResourcesPath + "?" + r.URL.RawQuery
	if requestBearerToken == "" {
		plog.Printf("no request bearer token")
		resp, err := l.get(r.Context(), l.BearerToken, rsURL)
		if err != nil {
			sendResponse(w, http.StatusBadGateway, apiError{err.Error()})
			return
		}
		forwardResponse(w, resp)
		return
	}

	resp, err := l.get(r.Context(), requestBearerToken, rsURL)
	if err != nil {
		sendResponse(w, http.StatusBadGateway, apiError{err.Error()})
		return
	}

	if resp.StatusCode != http.StatusForbidden && resp.StatusCode != http.StatusUnauthorized {
		// Forward any responses that aren't auth-z rejections.
		forwardResponse(w, resp)
		return
	}

	// Drain response body so the connection gets reused.
	io.Copy(ioutil.Discard, resp.Body)
	resp.Body.Close()

	// List all resources using bridge's root credentials.
	resp, err = l.get(r.Context(), l.BearerToken, rsURL)
	if err != nil {
		sendResponse(w, http.StatusBadGateway, apiError{err.Error()})
		return
	}

	if resp.StatusCode != http.StatusOK {
		err := fmt.Errorf("bridge's service account cannot list resources via %s: %s", l.ResourcesPath, resp.Status)
		sendResponse(w, http.StatusInternalServerError, apiError{err.Error()})
		return
	}

	// Decode the response so we can iterate through the resources.
	var resources struct {
		Kind       string `json:"kind,omitempty"`
		APIVersion string `json:"apiVersion,omitempty"`
		Metadata   struct {
			SelfLink        string `json:"selfLink,omitempty"`
			ResourceVersion string `json:"resourceVersion,omitempty"`
		} `json:"metadata"`

		Items []*json.RawMessage `json:"items"`
		// Items user doesn't have access to. One day we may expose this
		RestrictedItems []*json.RawMessage `json:"restrictedItems"`
	}
	err = json.NewDecoder(resp.Body).Decode(&resources)
	resp.Body.Close()
	if err != nil {
		sendResponse(w, http.StatusInternalServerError, apiError{err.Error()})
		return
	}

	// TODO: (ggreer) use goroutine here
	// Filter any resources the user can't see.
	n := 0
	for _, item := range resources.Items {
		var rs struct {
			Metadata struct {
				Name string `json:"name"`
			} `json:"metadata"`
		}
		if err := json.Unmarshal([]byte(*item), &rs); err != nil {
			sendResponse(w, http.StatusBadGateway, apiError{err.Error()})
			return
		}

		ok, err := l.canAccessResource(r.Context(), requestBearerToken, rs.Metadata.Name)
		if err != nil {
			// TODO: (ggreer) early return if error is 500/502/etc. continue if 401/403
			plog.Printf("error accessing resource %v: %v", rs.Metadata.Name, err.Error())
		}
		if ok {
			resources.Items[n] = item
			n++
		} else {
			resources.RestrictedItems = append(resources.RestrictedItems, item)
		}
	}
	resources.Items = resources.Items[:n]

	// Rewrite the body.
	body, err := json.Marshal(resources)
	if err != nil {
		sendResponse(w, http.StatusInternalServerError, apiError{err.Error()})
		return
	}
	resp.Body = ioutil.NopCloser(bytes.NewReader(body))
	resp.Header.Set("Content-Length", strconv.Itoa(len(body)))

	forwardResponse(w, resp)
}

// canAccessResource determines if the lister can access the specified resource.
func (l *ResourceLister) canAccessResource(ctx context.Context, bearerToken, resource string) (bool, error) {
	if resource == "" {
		return false, fmt.Errorf("no resource provided")
	}

	resp, err := l.get(ctx, bearerToken, l.ResourcesPath+"/"+resource)
	if err != nil {
		return false, fmt.Errorf("GET request failed: %v", err)
	}

	defer func() {
		// Drain response body so the connection gets reused.
		io.Copy(ioutil.Discard, resp.Body)
		resp.Body.Close()
	}()

	if resp.StatusCode == http.StatusOK {
		return true, nil
	}
	if resp.StatusCode == http.StatusForbidden {
		return false, nil
	}

	return false, fmt.Errorf("bad response from kubernetes API: %s", resp.Status)
}
