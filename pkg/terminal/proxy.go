package terminal

import (
	"crypto/tls"
	"errors"
	"net/http"
	"net/url"
	"strings"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/rest"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/proxy"
)

const (
	//Endpoint that Proxy is supposed to handle
	Endpoint = "/api/terminal/"
)

// Proxy provides handlers to handle terminal related requests
type Proxy struct {
	TLSClientConfig *tls.Config
	ClusterEndpoint *url.URL
}

var (
	WorkspaceGroupVersionResource = schema.GroupVersionResource{
		Group:    "workspace.che.eclipse.org",
		Version:  "v1alpha1",
		Resource: "workspaces",
	}

	UserGroupVersionResource = schema.GroupVersionResource{
		Group:    "user.openshift.io",
		Version:  "v1",
		Resource: "users",
	}
)

// Handle evaluates the namespace and workspace names from URL and after check that
// it's created by the current user - proxies the request there
func (p *Proxy) Handle(user *auth.User, w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case
		"GET",
		"HEAD",
		"OPTIONS",
		"TRACE":
		//These methods are considered as not vulnerable for CSRF attack, so the corresponding CSRF token check is skipped.
		// But in terminal-proxy we must make sure that it's a request made by OpenShift Console
		// before proxying request with passed token
		w.WriteHeader(http.StatusForbidden)
		return
	}

	ok, namespace, workspaceName, path := stripTerminalAPIPrefix(r.URL.Path)
	if !ok {
		http.NotFound(w, r)
		return
	}

	client, err := p.createDynamicClient(user.Token)
	if err != nil {
		http.Error(w, "Failed to create k8s client for the authenticated user. Cause: "+err.Error(), http.StatusInternalServerError)
		return
	}

	userId := user.ID
	if userId == "" {
		//user id is missing, auth is used that does not support user info propagated, like OpenShift OAuth
		userInfo, err := client.Resource(UserGroupVersionResource).Get("~", metav1.GetOptions{})
		if err != nil {
			http.Error(w, "Failed to retrieve the current user info. Cause: "+err.Error(), http.StatusInternalServerError)
			return
		}

		userId = string(userInfo.GetUID())
		if userId == "" {
			//uid is missing. it must be kube:admin
			if "kube:admin" != userInfo.GetName() {
				http.Error(w, "User must have UID to proceed authorization", http.StatusInternalServerError)
				return
			}
		}
	}

	ws, err := client.Resource(WorkspaceGroupVersionResource).Namespace(namespace).Get(workspaceName, metav1.GetOptions{})
	if err != nil {
		http.Error(w, "Failed to get the requested workspace. Cause: "+err.Error(), http.StatusForbidden)
		return
	}

	creator := ws.GetAnnotations()["org.eclipse.che.workspace/creator"]
	if creator != userId {
		http.Error(w, "User is not a owner of the requested workspace", http.StatusForbidden)
		return
	}

	terminalHost, err := p.getBaseTerminalHost(ws)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	p.proxyToWorkspace(terminalHost, path, user.Token, r, w)
}

//stripTerminalAPIPrefix strips path prefix that is expected for Terminal API request
func stripTerminalAPIPrefix(requestPath string) (ok bool, namespace string, workspaceName string, path string) {
	// URL is supposed to have the following format
	// ->   /api/terminal/{namespace}/{workspace-name}/{path} < optional
	// -> 0 / 1 /    2   /    3      /        4       / 5
	segments := strings.SplitN(requestPath, "/", 6)
	if len(segments) < 5 {
		return false, "", "", ""
	} else {
		namespace = segments[3]
		workspaceName = segments[4]
		if len(segments) == 6 {
			path = segments[5]
		}
		return true, namespace, workspaceName, path
	}
}

//getBaseTerminalHost evaluates ideUrl from the specified workspace and extract host from it
func (p *Proxy) getBaseTerminalHost(ws *unstructured.Unstructured) (*url.URL, error) {
	ideUrl, success, err := unstructured.NestedString(ws.UnstructuredContent(), "status", "ideUrl")
	if !success {
		return nil, errors.New("the specified workspace does not have ideUrl in its status")
	}
	if err != nil {
		return nil, errors.New("failed to evaluate ide URL for the specified workspace. Cause: " + err.Error())
	}

	terminalUrl, err := url.Parse(ideUrl)
	if err != nil {
		return nil, errors.New("Failed to parse workspace ideUrl " + ideUrl)
	}

	terminalHost, err := url.Parse(terminalUrl.Scheme + "://" + terminalUrl.Host)
	if err != nil {
		return nil, errors.New("Failed to parse workspace ideUrl host " + ideUrl)
	}

	return terminalHost, nil
}

func (p *Proxy) proxyToWorkspace(workspaceIdeHost *url.URL, path string, token string, r *http.Request, w http.ResponseWriter) {
	r2 := new(http.Request)
	*r2 = *r
	r2.URL = new(url.URL)
	*r2.URL = *r.URL

	r2.Header.Set("X-Forwarded-Access-Token", token)

	r2.URL.Path = path

	//TODO a new proxy per request is created. Must be revised and probably changed
	terminalProxy := proxy.NewProxy(&proxy.Config{
		Endpoint:        workspaceIdeHost,
		TLSClientConfig: p.TLSClientConfig,
	})

	terminalProxy.ServeHTTP(w, r2)
}

//createDynamicClient create dynamic client with the configured token to be used
func (p *Proxy) createDynamicClient(token string) (dynamic.Interface, error) {
	var tlsClientConfig rest.TLSClientConfig
	if p.TLSClientConfig.InsecureSkipVerify {
		//off-cluster mode
		tlsClientConfig.Insecure = true
	} else {
		inCluster, err := rest.InClusterConfig()
		if err != nil {
			return nil, err
		}
		tlsClientConfig = inCluster.TLSClientConfig
	}

	config := &rest.Config{
		Host:            p.ClusterEndpoint.Host,
		TLSClientConfig: tlsClientConfig,
		BearerToken:     token,
	}

	client, err := dynamic.NewForConfig(dynamic.ConfigFor(config))
	if err != nil {
		return nil, err
	}
	return client, nil
}
