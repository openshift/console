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

const namespacesPath = "/api/v1/namespaces"

// NamespaceLister determines the list of namespaces that a particular user can view.
type NamespaceLister struct {
	// If the user's bearer token doesn't have the ability to list namespaces, this
	// token is used instead to perform the list request. The user will still only
	// see the subset of namespaces they have access to.
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
func (l *NamespaceLister) get(ctx context.Context, bearerToken, path string) (*http.Response, error) {
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

// handleNamespaces is proxy to the /api/v1/namespaces path but handles cases where
// the provided bearer token doesn't have permission to view that endpoint. In these
// cases the method will list all the namespaces, then filter the ones the bearer
// token can view.
func (l *NamespaceLister) handleNamespaces(requestBearerToken string, w http.ResponseWriter, r *http.Request) {
	resp, err := l.get(r.Context(), requestBearerToken, namespacesPath)
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

	// List all namespaces using bridge's root credentials.
	resp, err = l.get(r.Context(), l.BearerToken, namespacesPath)
	if err != nil {
		sendResponse(w, http.StatusBadGateway, apiError{err.Error()})
		return
	}

	if resp.StatusCode != http.StatusOK {
		err := fmt.Errorf("bridge's service account cannot list namespaces: %s", resp.Status)
		sendResponse(w, http.StatusInternalServerError, apiError{err.Error()})
		return
	}

	// Decode the response so we can iterate through the namespaces.
	var namespaces struct {
		Kind       string `json:"kind,omitempty"`
		APIVersion string `json:"apiVersion,omitempty"`
		Metadata   struct {
			SelfLink        string `json:"selfLink,omitempty"`
			ResourceVersion string `json:"resourceVersion,omitempty"`
		} `json:"metadata"`

		Items []*json.RawMessage `json:"items"`
	}
	err = json.NewDecoder(resp.Body).Decode(&namespaces)
	resp.Body.Close()
	if err != nil {
		sendResponse(w, http.StatusInternalServerError, apiError{err.Error()})
		return
	}

	// TODO: (ggreer) use goroutine here
	// Filter any namespaces the user can't see.
	n := 0
	for _, item := range namespaces.Items {
		var ns struct {
			Metadata struct {
				Name string `json:"name"`
			} `json:"metadata"`
		}
		if err := json.Unmarshal([]byte(*item), &ns); err != nil {
			sendResponse(w, http.StatusBadGateway, apiError{err.Error()})
			return
		}

		ok, err := l.canAccessNamespace(r.Context(), requestBearerToken, ns.Metadata.Name)
		if err != nil {
			// TODO: (ggreer) early return if error is 500/502/etc. continue if 401/403
			plog.Printf("error accessing namespace %v: %v", ns.Metadata.Name, err.Error())
		}
		if ok {
			namespaces.Items[n] = item
			n++
		}
	}
	namespaces.Items = namespaces.Items[:n]

	// Rewrite the body.
	body, err := json.Marshal(namespaces)
	if err != nil {
		sendResponse(w, http.StatusInternalServerError, apiError{err.Error()})
		return
	}
	resp.Body = ioutil.NopCloser(bytes.NewReader(body))
	resp.Header.Set("Content-Length", strconv.Itoa(len(body)))

	forwardResponse(w, resp)
}

// canAccessNamespace determines if the lister can access resources in the
// provided namespace.
func (l *NamespaceLister) canAccessNamespace(ctx context.Context, bearerToken, namespace string) (bool, error) {
	if namespace == "" {
		return false, fmt.Errorf("no namespace provided")
	}

	resp, err := l.get(ctx, bearerToken, namespacesPath+"/"+namespace)
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
