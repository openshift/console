package knative

import (
	"context"
	"crypto/tls"
	"io"

	"encoding/json"
	"fmt"

	"net/http"
	"strings"

	cloudevents "github.com/cloudevents/sdk-go/v2"
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
	trimURLPrefix string
	k8sClient     *http.Client
	k8sEndpoint   string
}

func NewKnativeHandler(trimURLPrefix string, k8sClient *http.Client, k8sEndpoint string) *KnativeHandler {
	return &KnativeHandler{
		trimURLPrefix,
		k8sClient,
		k8sEndpoint,
	}
}

func (h *KnativeHandler) generateClient(user *auth.User) (dynamic.Interface, error) {
	config := &rest.Config{
		Host:        h.k8sEndpoint,
		Transport:   h.k8sClient.Transport,
		BearerToken: user.Token,
	}
	client, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("Error creating dynamic client: %v", err)
	}
	return client, nil
}

func (h *KnativeHandler) Handle(user *auth.User, w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(strings.TrimPrefix(r.URL.Path, h.trimURLPrefix), "/"), "/")

	if len(parts) >= 4 && parts[0] == "namespaces" && parts[2] == "services" {
		namespace := parts[1]
		service := parts[3]

		// GET /namespaces/{namespace}/services/{service}/invoke
		if r.Method == http.MethodGet && len(parts) == 5 && parts[4] == "invoke" {
			serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Invalid method: only POST is allowed"})
			return
		}

		// GET /namespaces/{namespace}/services/{service}/endpoints
		if r.Method == http.MethodGet && len(parts) == 5 && parts[4] == "endpoints" {
			client, err := h.generateClient(user)
			if err != nil {
				klog.Errorf("Error creating dynamic client: %v", err)
				serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: err.Error()})
				return
			}
			url, err := getServiceEndpoints(client, namespace, service)
			if err != nil {
				klog.Errorf("Error Fetching Route URL for Knative Service: %v", err)
				serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: err.Error()})
				return
			}
			serverutils.SendResponse(w, http.StatusOK, json.RawMessage(fmt.Sprintf(`{"url": "%s"}`, url)))
			return
		}

		// POST /namespaces/{namespace}/services/{service}/invoke
		if r.Method == http.MethodPost && len(parts) == 5 && parts[4] == "invoke" {
			client, err := h.generateClient(user)
			if err != nil {
				klog.Errorf("Error creating dynamic client: %v", err)
				serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: err.Error()})
				return
			}
			response, err := invokeService(client, namespace, service, r)
			if err != nil {
				klog.Errorf("Error During Knative Function Invokation: %v", err)
				serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: err.Error()})
				return
			}
			serverutils.SendResponse(w, http.StatusOK, response)
			return
		}
	}
}

func getServiceEndpoints(client dynamic.Interface, namespace string, service string) (url string, err error) {

	resource := schema.GroupVersionResource{
		Group:    "serving.knative.dev",
		Version:  "v1",
		Resource: "routes",
	}
	knRoutes, err := client.Resource(resource).Namespace(namespace).List(context.Background(), v1.ListOptions{
		LabelSelector: "serving.knative.dev/service=" + service,
	})
	if err != nil {
		return "", fmt.Errorf("Error fetching routes: %v", err)
	}

	if len(knRoutes.Items) == 0 {
		return "", fmt.Errorf("No routes found for service %s", service)
	}

	url, _, err = unstructured.NestedString(knRoutes.Items[0].Object, "status", "url")
	if err != nil {
		return "", fmt.Errorf("Error fetching route url: %v", err)
	}

	return url, nil
}

func invokeService(client dynamic.Interface, namespace string, service string, r *http.Request) (InvokeServiceResponseBody, error) {

	var invokeRequest InvokeServiceRequestBody
	err := json.NewDecoder(r.Body).Decode(&invokeRequest)
	if err != nil {
		return InvokeServiceResponseBody{}, fmt.Errorf("Failed to parse request: %v", err)
	}
	endpoint, err := getServiceEndpoints(client, namespace, service)
	if err != nil {
		return InvokeServiceResponseBody{}, fmt.Errorf("Error fetching route url for service %s: %v", service, err)
	}
	if invokeRequest.Body.InvokeFormat == "" {
		return InvokeServiceResponseBody{}, fmt.Errorf("Missing invoke format")
	}

	switch invokeRequest.Body.InvokeFormat {
	case "http":
		return sendPost(invokeRequest, endpoint)
	case "ce":
		return sendEvent(invokeRequest, endpoint)
	default:
		return InvokeServiceResponseBody{}, fmt.Errorf("Unsupported invoke format")
	}
}

func sendEvent(invokeRequest InvokeServiceRequestBody, endpoint string) (invokeResponse InvokeServiceResponseBody, err error) {

	event := cloudevents.NewEvent()

	if _, ok := invokeRequest.Body.InvokeHeader["ce-id"]; ok {
		event.SetID(invokeRequest.Body.InvokeHeader["ce-id"][0])
	}

	if _, ok := invokeRequest.Body.InvokeHeader["ce-specversion"]; ok {
		event.SetSpecVersion(invokeRequest.Body.InvokeHeader["ce-specversion"][0])
	}

	if _, ok := invokeRequest.Body.InvokeHeader["ce-source"]; ok {
		event.SetSource(invokeRequest.Body.InvokeHeader["ce-source"][0])
	}

	if _, ok := invokeRequest.Body.InvokeHeader["ce-type"]; ok {
		event.SetType(invokeRequest.Body.InvokeHeader["ce-type"][0])
	}

	if invokeRequest.Body.InvokeMessage != "" {
		if err = event.SetData(invokeRequest.Body.InvokeContentType, invokeRequest.Body.InvokeMessage); err != nil {
			return InvokeServiceResponseBody{}, fmt.Errorf("Failed to set data: %v", err)
		}
	}

	var ceServiceClient cloudevents.Client
	if invokeRequest.AllowInsecure {
		serviceTransport := &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		}
		ceServiceClient, err = cloudevents.NewClientHTTP(cloudevents.WithTarget(endpoint),
			cloudevents.WithRoundTripper(serviceTransport))
	} else {
		ceServiceClient, err = cloudevents.NewClientHTTP(cloudevents.WithTarget(endpoint))
	}

	if err != nil {
		return InvokeServiceResponseBody{}, fmt.Errorf("Failed to create client: %v", err)
	}

	evt, result := ceServiceClient.Request(cloudevents.ContextWithTarget(context.Background(), endpoint), event)

	if cloudevents.IsUndelivered(result) {
		return InvokeServiceResponseBody{}, fmt.Errorf("Failed to send: %v", result)
	}

	if evt == nil {
		return InvokeServiceResponseBody{}, fmt.Errorf("No event returned")
	}

	var cevent CloudEventResponse
	bytes, err := json.Marshal(evt)
	if err != nil {
		return InvokeServiceResponseBody{}, fmt.Errorf("Error fetching event response: %v", err)
	}
	json.Unmarshal(bytes, &cevent)

	ceventBodyData, err := json.Marshal(cevent.Data)
	if err != nil {
		return InvokeServiceResponseBody{}, fmt.Errorf("Error fetching event response body: %v", err)
	}

	var ceventHeader = make(http.Header)
	ceventHeader["Content-Type"] = []string{cevent.Datacontenttype}
	ceventHeader["ID"] = []string{cevent.ID}
	ceventHeader["Spec-Version"] = []string{cevent.Specversion}
	ceventHeader["Source"] = []string{cevent.Source}
	ceventHeader["Type"] = []string{cevent.Type}
	ceventHeader["Date"] = []string{cevent.Time}

	klog.Infof("CloudEvent Service Invoke response: %v", string(ceventBodyData))
	return InvokeServiceResponseBody{
		Status:     http.StatusText(http.StatusOK),
		StatusCode: http.StatusOK,
		Header:     ceventHeader,
		Body:       string(ceventBodyData),
	}, nil
}

func sendPost(invokeRequest InvokeServiceRequestBody, endpoint string) (invokeResponse InvokeServiceResponseBody, err error) {
	serviceRequest, err := http.NewRequest(http.MethodPost, endpoint, strings.NewReader(invokeRequest.Body.InvokeMessage))
	if err != nil {
		return InvokeServiceResponseBody{}, fmt.Errorf("Failed to create request: %v", err)
	}

	query := serviceRequest.URL.Query()
	for key, values := range invokeRequest.Body.InvokeQuery {
		for _, value := range values {
			query.Add(key, value)
		}
	}
	serviceRequest.URL.RawQuery = query.Encode()

	serviceRequest.Header.Add("Content-Type", invokeRequest.Body.InvokeContentType)
	for key, values := range invokeRequest.Body.InvokeHeader {
		for _, value := range values {
			serviceRequest.Header.Add(key, value)
		}
	}

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
		return InvokeServiceResponseBody{}, fmt.Errorf("Failed to invoke service: %v", err)
	}
	defer serviceResponse.Body.Close()
	serviceResponseBody, err := io.ReadAll(serviceResponse.Body)
	if err != nil {
		return InvokeServiceResponseBody{}, fmt.Errorf("Failed to read response body: %v", err)
	}
	klog.Infof("HTTP Service Invoke response: %v", string(serviceResponseBody))
	return InvokeServiceResponseBody{
		Status:     serviceResponse.Status,
		StatusCode: serviceResponse.StatusCode,
		Header:     serviceResponse.Header,
		Body:       string(serviceResponseBody),
	}, nil
}
