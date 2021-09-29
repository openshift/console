package terminal

import (
	"bytes"
	"context"
	"crypto/tls"
	"errors"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/klog"

	"github.com/openshift/console/pkg/auth"
)

const (
	// ProxyEndpoint path that that Proxy is supposed to handle
	ProxyEndpoint = "/api/terminal/proxy/"
	// AvailableEndpoint path used to check if functionality is enabled
	AvailableEndpoint = "/api/terminal/available/"
	// InstalledNamespaceEndpoint path used to get the namespace where the controller is installed
	InstalledNamespaceEndpoint = "/api/terminal/installedNamespace"
	// WorkspaceInitEndpoint is used to initialize a kubeconfig in the workspace
	WorkspaceInitEndpoint = "exec/init"
	// WorkspaceActivityEndpoint is used to prevent idle timeout in a workspace
	WorkspaceActivityEndpoint = "activity/tick"
	// WorkspaceCreatorLabel stores the UID of the user that created the workspace. Only this user should be able to
	// access the workspace
	WorkspaceCreatorLabel = "controller.devfile.io/creator"
	// WorkspaceRestrictedAcccessAnnotation signifies that a workspace expects webhooks to be enabled. If they are not,
	// startup is blocked.
	WorkspaceRestrictedAcccessAnnotation = "controller.devfile.io/restricted-access"
)

// Proxy provides handlers to handle terminal related requests
type Proxy struct {
	// A client with the correct TLS setup for communicating with servers withing cluster.
	workspaceHttpClient *http.Client
	TLSClientConfig     *tls.Config
	ClusterEndpoint     *url.URL
}

func NewProxy(serviceTLS *tls.Config, TLSClientConfig *tls.Config, clusterEndpoint *url.URL) *Proxy {
	return &Proxy{
		workspaceHttpClient: &http.Client{
			Timeout:   10 * time.Second,
			Transport: &http.Transport{TLSClientConfig: serviceTLS},
		},
		TLSClientConfig: TLSClientConfig,
		ClusterEndpoint: clusterEndpoint,
	}
}

var (
	WorkspaceGroupVersionResource = schema.GroupVersionResource{
		Group:    "workspace.devfile.io",
		Version:  "v1alpha1",
		Resource: "devworkspaces",
	}

	UserGroupVersionResource = schema.GroupVersionResource{
		Group:    "user.openshift.io",
		Version:  "v1",
		Resource: "users",
	}
)

// HandleProxy evaluates the namespace and workspace names from URL and after check that
// it's created by the current user - proxies the request there
func (p *Proxy) HandleProxy(user *auth.User, w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		w.Header().Add("Allow", "POST")
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	isWebTerminalOperatorRunning, err := checkWebTerminalOperatorIsRunning()
	if err != nil {
		http.Error(w, "Failed to check web terminal operator state. Cause: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if !isWebTerminalOperatorRunning {
		http.Error(w, "Terminal endpoint is disabled: web terminal operator is not deployed.", http.StatusForbidden)
		return
	}

	ok, namespace, workspaceName, path := stripTerminalAPIPrefix(r.URL.Path)
	if !ok {
		http.NotFound(w, r)
		return
	}

	isClusterAdmin, err := p.isClusterAdmin(user.Token)
	if err != nil {
		http.Error(w, "Failed to check the current users privileges. Cause: "+err.Error(), http.StatusInternalServerError)
		return
	}
	// Cluster admin terminals must live in the openshift-terminal namespace to prevent privilege escalation
	if isClusterAdmin && namespace != "openshift-terminal" {
		http.Error(w, "cluster-admin users must create and use terminals in the openshift-terminal namespace", http.StatusForbidden)
		return
	}

	if path != WorkspaceInitEndpoint && path != WorkspaceActivityEndpoint {
		http.Error(w, "Unsupported path", http.StatusForbidden)
		return
	}

	client, err := p.createDynamicClient(user.Token)
	if err != nil {
		http.Error(w, "Failed to create k8s client for the authenticated user. Cause: "+err.Error(), http.StatusInternalServerError)
		return
	}

	userId := user.ID
	if userId == "" {
		// user id is missing, auth is used that does not support user info propagated, like OpenShift OAuth
		userInfo, err := client.Resource(UserGroupVersionResource).Get(context.TODO(), "~", metav1.GetOptions{})
		if err != nil {
			http.Error(w, "Failed to retrieve the current user info. Cause: "+err.Error(), http.StatusInternalServerError)
			return
		}

		userId = string(userInfo.GetUID())
		if userId == "" {
			// uid is missing. it must be kube:admin
			if "kube:admin" != userInfo.GetName() {
				http.Error(w, "User must have UID to proceed authorization", http.StatusInternalServerError)
				return
			}
		}
	}

	ws, err := client.Resource(WorkspaceGroupVersionResource).Namespace(namespace).Get(context.TODO(), workspaceName, metav1.GetOptions{})
	if err != nil {
		http.Error(w, "Failed to get the requested workspace. Cause: "+err.Error(), http.StatusForbidden)
		return
	}

	creator := ws.GetLabels()[WorkspaceCreatorLabel]
	if creator != userId {
		http.Error(w, "User is not a owner of the requested workspace", http.StatusForbidden)
		return
	}

	restrictAccess := ws.GetAnnotations()[WorkspaceRestrictedAcccessAnnotation]
	if restrictAccess != "true" {
		http.Error(w, "Workspace must have restricted access annotation", http.StatusForbidden)
		return
	}

	terminalHost, err := p.getBaseTerminalHost(ws)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if terminalHost.Scheme != "https" {
		http.Error(w, "Workspace is not served over https", http.StatusForbidden)
		return
	}

	terminalHost.Path = path
	if path == WorkspaceInitEndpoint {
		p.handleExecInit(terminalHost, user.Token, r, w)
	} else if path == WorkspaceActivityEndpoint {
		p.handleActivity(terminalHost, user.Token, w)
	} else {
		http.Error(w, "Unknown path", http.StatusForbidden)
	}
}

func (p *Proxy) HandleProxyEnabled(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		w.Header().Set("Allow", "GET")
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	isWebTerminalOperatorInstalled, err := checkWebTerminalOperatorIsInstalled()
	if err != nil {
		klog.Errorf("Failed to check if the web terminal operator is installed: %s", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	if !isWebTerminalOperatorInstalled {
		klog.Error("web terminal operator is not installed")
		w.WriteHeader(http.StatusServiceUnavailable)
		return
	}
	isWebTerminalOperatorRunning, err := checkWebTerminalOperatorIsRunning()
	if err != nil {
		klog.Errorf("Failed to check if web terminal operator is running: %s", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	if !isWebTerminalOperatorRunning {
		w.WriteHeader(http.StatusServiceUnavailable)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (p *Proxy) HandleTerminalInstalledNamespace(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		w.Header().Set("Allow", "GET")
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	subscription, err := getWebTerminalSubscriptions()
	if err != nil {
		klog.Errorf("Failed to check the web terminal subscription: %s", err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}

	operatorNamespace, err := getWebTerminalNamespace(subscription)
	if err != nil {
		klog.Errorf("Failed to get the namespace of the web terminal subscription: %s", err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}

	w.Write([]byte(operatorNamespace))
}

func (p *Proxy) handleExecInit(host *url.URL, token string, r *http.Request, w http.ResponseWriter) {
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read body of request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	wkspReq, err := http.NewRequest(http.MethodPost, host.String(), ioutil.NopCloser(bytes.NewReader(body)))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	wkspReq.Header.Set("Content-type", "application/json")
	wkspReq.Header.Set("X-Forwarded-Access-Token", token)

	p.proxyToWorkspace(wkspReq, w)
}

func (p *Proxy) handleActivity(host *url.URL, token string, w http.ResponseWriter) {
	wkspReq, err := http.NewRequest(http.MethodPost, host.String(), nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	wkspReq.Header.Set("X-Forwarded-Access-Token", token)
	p.proxyToWorkspace(wkspReq, w)
}

// stripTerminalAPIPrefix strips path prefix that is expected for Terminal API request
func stripTerminalAPIPrefix(requestPath string) (ok bool, namespace string, workspaceName string, path string) {
	// URL is supposed to have the following format
	// ->   /api/terminal/proxy/{namespace}/{workspace-name}/{path} < optional
	// -> 0 / 1 /    2   /  3  /    4      /        5       /  6
	segments := strings.SplitN(requestPath, "/", 7)
	if len(segments) < 6 {
		return false, "", "", ""
	} else {
		namespace = segments[4]
		workspaceName = segments[5]
		if len(segments) == 7 {
			path = segments[6]
		}
		return true, namespace, workspaceName, path
	}
}

// getBaseTerminalHost evaluates ideUrl from the specified workspace and extract host from it
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
		return nil, errors.New("failed to parse workspace ideUrl " + ideUrl)
	}

	terminalHost, err := url.Parse(terminalUrl.Scheme + "://" + terminalUrl.Host)
	if err != nil {
		return nil, errors.New("failed to parse workspace ideUrl host " + ideUrl)
	}

	return terminalHost, nil
}

func (p *Proxy) proxyToWorkspace(wkspReq *http.Request, w http.ResponseWriter) {
	wkspResp, err := p.workspaceHttpClient.Do(wkspReq)
	if err != nil {
		http.Error(w, "Failed to proxy request. Cause: "+err.Error(), http.StatusInternalServerError)
		return
	}

	for k, vv := range wkspResp.Header {
		for _, v := range vv {
			w.Header().Add(k, v)
		}
	}
	w.WriteHeader(wkspResp.StatusCode)

	_, err = io.Copy(w, wkspResp.Body)
	if err != nil {
		panic(http.ErrAbortHandler)
	}
	_ = wkspResp.Body.Close()
}
