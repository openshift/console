package knative

import (
	"context"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/serverutils"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/rest"
	"k8s.io/klog"
)

type KnativeHandler struct {
	TrimURLPrefix string
	K8sClient     *http.Client
	K8sEndpoint   string
}

func (h *KnativeHandler) Handle(user *auth.User, w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(strings.TrimPrefix(r.URL.Path, h.TrimURLPrefix), "/"), "/")

	// * /namespaces/{namespace}/services/{service}/*
	if len(parts) >= 4 && parts[0] == "namespaces" && parts[2] == "services" {
		namespace := parts[1]
		service := parts[3]
		var handler (func(user *auth.User, namespace string, service string, w http.ResponseWriter, r *http.Request) (interface{}, error))

		// GET /namespaces/{namespace}/services/{service}
		if r.Method == http.MethodGet && len(parts) == 4 {
			handler = h.GetService
		} else
		// GET /namespaces/{namespace}/services/{service}/routes
		if r.Method == http.MethodGet && len(parts) == 5 && parts[4] == "routes" {
			handler = h.GetServiceRoutes
		} else
		// GET /namespaces/{namespace}/services/{service}/endpoints
		if r.Method == http.MethodGet && len(parts) == 5 && parts[4] == "endpoints" {
			handler = h.GetServiceEndpoints
		} else
		// GET /namespaces/{namespace}/services/{service}/invoke
		if r.Method == http.MethodGet && len(parts) == 5 && parts[4] == "invoke" {
			serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Invalid method: only POST is allowed"})
			return
		}
		// POST /namespaces/{namespace}/services/{service}/invoke
		if r.Method == http.MethodPost && len(parts) == 5 && parts[4] == "invoke" {
			handler = h.InvokeService
		}

		if handler != nil {
			result, err := handler(user, namespace, service, w, r)
			if err != nil {
				serverutils.SendResponse(w, http.StatusInternalServerError, err)
				return
			}
			serverutils.SendResponse(w, http.StatusOK, result)
			return
		}
	}

	serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{Err: "not found"})
}

func (h *KnativeHandler) GetService(user *auth.User, namespace string, service string, w http.ResponseWriter, r *http.Request) (interface{}, error) {
	klog.Infof("GetService for namespace %q and service %q", namespace, service)

	context := context.TODO()
	config := &rest.Config{
		Host:        h.K8sEndpoint,
		Transport:   h.K8sClient.Transport,
		BearerToken: user.Token,
	}
	client, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, err
	}
	version := r.URL.Query().Get("version")
	if version == "" {
		version = "v1"
	}
	resource := schema.GroupVersionResource{
		Group:    "serving.knative.dev",
		Version:  version,
		Resource: "services",
	}
	knService, err := client.Resource(resource).Namespace(namespace).Get(context, service, v1.GetOptions{})
	if err != nil {
		return nil, err
	}

	return knService, nil
}

func (h *KnativeHandler) GetServiceRoutes(user *auth.User, namespace string, service string, w http.ResponseWriter, r *http.Request) (interface{}, error) {
	klog.Infof("GetServiceRoutes for namespace %q and service %q", namespace, service)

	context := context.TODO()
	config := &rest.Config{
		Host:        h.K8sEndpoint,
		Transport:   h.K8sClient.Transport,
		BearerToken: user.Token,
	}
	client, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, err
	}
	version := r.URL.Query().Get("version")
	if version == "" {
		version = "v1"
	}
	resource := schema.GroupVersionResource{
		Group:    "serving.knative.dev",
		Version:  version,
		Resource: "routes",
	}
	knRoutes, err := client.Resource(resource).Namespace(namespace).List(context, v1.ListOptions{
		LabelSelector: "serving.knative.dev/service=" + service,
	})
	if err != nil {
		return nil, err
	}

	return knRoutes, err
}

func (h *KnativeHandler) GetServiceEndpoints(user *auth.User, namespace string, service string, w http.ResponseWriter, r *http.Request) (interface{}, error) {
	klog.Infof("GetServiceEndpoints for namespace %q and service %q", namespace, service)

	context := context.TODO()
	config := &rest.Config{
		Host:        h.K8sEndpoint,
		Transport:   h.K8sClient.Transport,
		BearerToken: user.Token,
	}
	client, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, err
	}
	version := r.URL.Query().Get("version")
	if version == "" {
		version = "v1"
	}
	resource := schema.GroupVersionResource{
		Group:    "serving.knative.dev",
		Version:  version,
		Resource: "routes",
	}
	knRoutes, err := client.Resource(resource).Namespace(namespace).List(context, v1.ListOptions{
		LabelSelector: "serving.knative.dev/service=" + service,
	})
	if err != nil {
		return nil, err
	}

	klog.Infof("knRoutes: %v", knRoutes)
	klog.Infof("   items: %v", knRoutes.Items)

	if len(knRoutes.Items) == 0 {
		serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{Err: "not found"})
		return nil, nil
	}

	url, _, err := unstructured.NestedString(knRoutes.Items[0].Object, "status", "url")
	if err != nil {
		return nil, err
	}
	return map[string]string{
		"url": url,
	}, nil
}

type InvokeServiceRequestBody struct {
	AllowInsecure bool                `json:"allowInsecure,omitempty"`
	Method        string              `json:"method,omitempty"`
	Query         map[string][]string `json:"query,omitempty"`
	Header        http.Header         `json:"header,omitempty"`
	Body          string              `json:"body,omitempty"`
}

type InvokeServiceResponseBody struct {
	Status     string      `json:"status,omitempty"`     // e.g. "200 OK"
	StatusCode int         `json:"statusCode,omitempty"` // e.g. 200
	Header     http.Header `json:"header,omitempty"`
	Body       string      `json:"body,omitempty"`
}

func (h *KnativeHandler) InvokeService(user *auth.User, namespace string, service string, w http.ResponseWriter, r *http.Request) (interface{}, error) {
	klog.Infof("InvokeService for namespace %q and service %q", namespace, service)

	context := context.TODO()
	config := &rest.Config{
		Host:        h.K8sEndpoint,
		Transport:   h.K8sClient.Transport,
		BearerToken: user.Token,
	}
	client, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, err
	}
	version := r.URL.Query().Get("version")
	if version == "" {
		version = "v1"
	}
	resource := schema.GroupVersionResource{
		Group:    "serving.knative.dev",
		Version:  version,
		Resource: "routes",
	}
	knRoutes, err := client.Resource(resource).Namespace(namespace).List(context, v1.ListOptions{
		LabelSelector: "serving.knative.dev/service=" + service,
	})
	if err != nil {
		return nil, err
	}

	if len(knRoutes.Items) == 0 {
		serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{Err: "not found"})
		return nil, nil
	}

	url, _, err := unstructured.NestedString(knRoutes.Items[0].Object, "status", "url")
	if err != nil {
		return nil, err
	}

	klog.Infof("url: %v", url)

	var invokeRequest InvokeServiceRequestBody
	err = json.NewDecoder(r.Body).Decode(&invokeRequest)
	if err != nil {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: fmt.Sprintf("Failed to parse request: %v", err)})
		return nil, nil
	}

	klog.Infof("invokeRequest: %v", invokeRequest)

	method := invokeRequest.Method
	if method == "" && invokeRequest.Body != "" {
		method = http.MethodPost
	} else if method == "" {
		method = http.MethodGet
	}

	serviceRequest, err := http.NewRequest(method, url, strings.NewReader(invokeRequest.Body))
	if err != nil {
		return nil, err
	}
	query := serviceRequest.URL.Query()
	for key, values := range invokeRequest.Query {
		for _, value := range values {
			query.Add(key, value)
		}
	}
	serviceRequest.URL.RawQuery = query.Encode()

	serviceRequest.Header = invokeRequest.Header

	klog.Infof("serviceRequest: %v", serviceRequest)

	var serviceClient *http.Client
	if invokeRequest.AllowInsecure {
		serviceTransport := &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		}
		serviceClient = &http.Client{
			Transport: serviceTransport,
		}
	} else {
		serviceClient = &http.Client{}
	}

	serviceResponse, err := serviceClient.Do(serviceRequest)
	if err != nil {
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: fmt.Sprintf("Gateway error: %v", err)})
		return nil, nil
	}

	serviceResponseBody, err := io.ReadAll(serviceResponse.Body)
	if err != nil {
		return nil, err
	}
	defer serviceResponse.Body.Close()

	serviceResponseBase64 := base64.StdEncoding.EncodeToString(serviceResponseBody)

	return InvokeServiceResponseBody{
		Status:     serviceResponse.Status,
		StatusCode: serviceResponse.StatusCode,
		Header:     serviceResponse.Header,
		Body:       serviceResponseBase64,
	}, nil
}
