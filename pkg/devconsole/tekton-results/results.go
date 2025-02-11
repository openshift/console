package tektonresults

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/devconsole/common"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

var (
	TektonResultsResource = &schema.GroupVersionResource{
		Group:    "operator.tekton.dev",
		Version:  "v1alpha1",
		Resource: "tektonresults",
	}
	TektonResultsAPIRoute = &schema.GroupVersionResource{
		Group:    "route.openshift.io",
		Version:  "v1",
		Resource: "routes",
	}
	cachedTektonResultsHost string = ""
)

func isLocalhost(r *http.Request) (bool, error) {
	host := r.RemoteAddr
	switch {
	case host == "::1":
		return true, nil
	case host == "[::1]":
		return true, nil
	}
	h, p, err := net.SplitHostPort(host)

	// addrError helps distinguish between errors of form
	// "no colon in address" and "too many colons in address".
	// The former is fine as the host string need not have a
	// port. Latter needs to be handled.
	addrError := &net.AddrError{
		Err:  "missing port in address",
		Addr: host,
	}
	if err != nil {
		if err.Error() != addrError.Error() {
			return false, err
		}
		// host string without any port specified
		h = host
	} else if len(p) == 0 {
		return false, errors.New("invalid host name format")
	}

	// use ipv4 dotted decimal for further checking
	if h == "localhost" {
		h = "127.0.0.1"
	}
	ip := net.ParseIP(h)

	return ip.IsLoopback(), nil
}

func getTRHost(r *http.Request, dynamicClient *dynamic.DynamicClient) (string, error) {
	// If running on localhost, use the route to get the host.
	// Required for local development.
	localHost, err := isLocalhost(r)
	if err != nil {
		return "", err
	}
	if localHost {
		route, err := dynamicClient.Resource(*TektonResultsAPIRoute).Namespace("openshift-pipelines").Get(context.TODO(), "tekton-results-api-service", metav1.GetOptions{})
		if err != nil {
			return "", err
		}
		cachedTektonResultsHost, isHostPresent, err := unstructured.NestedString(route.Object, "spec", "host")
		if err != nil || !isHostPresent {
			return "", err
		}
		return cachedTektonResultsHost, nil
	}

	if cachedTektonResultsHost != "" {
		return cachedTektonResultsHost, nil
	}

	host, err := dynamicClient.Resource(*TektonResultsResource).Get(context.TODO(), "result", metav1.GetOptions{})
	if err != nil {
		return "", err
	}
	targetNamespace, isTargetNsPresent, err := unstructured.NestedString(host.Object, "spec", "targetNamespace")
	if err != nil || !isTargetNsPresent {
		targetNamespace = ""
	}
	serverPort, isPortPresent, err := unstructured.NestedString(host.Object, "spec", "server_port")
	if err != nil || !isPortPresent {
		serverPort = "8080"
	}
	tlsHostname, isTLSHostnamePresent, err := unstructured.NestedString(host.Object, "spec", "tls_hostname_override")
	if err != nil || !isTLSHostnamePresent {
		tlsHostname = ""
	}

	if tlsHostname != "" {
		cachedTektonResultsHost = fmt.Sprintf("%s:%s", tlsHostname, serverPort)
	} else if targetNamespace != "" && serverPort != "" {
		cachedTektonResultsHost = fmt.Sprintf("tekton-results-api-service.%s.svc.cluster.local:%s", targetNamespace, serverPort)
	} else {
		cachedTektonResultsHost = fmt.Sprintf("tekton-results-api-service.openshift-pipelines.svc.cluster.local:%s", serverPort)
	}
	return cachedTektonResultsHost, nil
}

func GetTektonResults(r *http.Request, user *auth.User, dynamicClient *dynamic.DynamicClient) (common.DevConsoleCommonResponse, error) {
	var request TektonResultsRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to parse request: %v", err)
	}

	TEKTON_RESULTS_HOST, err := getTRHost(r, dynamicClient)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to get TektonResults host: %v", err)
	}

	TEKTON_RESULTS_URL := fmt.Sprintf("https://%s/apis/results.tekton.dev/v1alpha2/parents/%s/results/-/records?%s", TEKTON_RESULTS_HOST, request.SearchNamespace, request.SearchParams)

	var serviceRequest *http.Request
	serviceRequest, err = http.NewRequest(http.MethodGet, TEKTON_RESULTS_URL, nil)

	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to create request: %v", err)
	}

	if request.AllowAuthHeader {
		serviceRequest.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
	}

	var serviceTransport *http.Transport
	if request.AllowInsecure {
		serviceTransport = &http.Transport{
			Proxy: http.ProxyFromEnvironment,
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		}
	} else {
		serviceTransport = &http.Transport{
			Proxy: http.ProxyFromEnvironment,
		}
	}
	serviceClient := &http.Client{
		Transport: serviceTransport,
	}

	serviceResponse, err := serviceClient.Do(serviceRequest)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to send request: %v", err)
	}
	defer serviceResponse.Body.Close()
	serviceResponseBody, err := io.ReadAll(serviceResponse.Body)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to read response body: %v", err)
	}

	return common.DevConsoleCommonResponse{
		StatusCode: serviceResponse.StatusCode,
		Headers:    serviceResponse.Header,
		Body:       string(serviceResponseBody),
	}, nil

}

func GetResultsSummary(r *http.Request, user *auth.User, dynamicClient *dynamic.DynamicClient) (common.DevConsoleCommonResponse, error) {
	var request SummaryRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to parse request: %v", err)
	}

	TEKTON_RESULTS_HOST, err := getTRHost(r, dynamicClient)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to get TektonResults host: %v", err)
	}

	SUMMARY_URL := fmt.Sprintf("https://%s/apis/results.tekton.dev/v1alpha2/parents/%s/results/-/records/summary?%s", TEKTON_RESULTS_HOST, request.SearchNamespace, request.SearchParams)

	var serviceRequest *http.Request
	serviceRequest, err = http.NewRequest(http.MethodGet, SUMMARY_URL, nil)

	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to create request: %v", err)
	}

	if request.AllowAuthHeader {
		serviceRequest.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
	}

	var serviceTransport *http.Transport
	if request.AllowInsecure {
		serviceTransport = &http.Transport{
			Proxy: http.ProxyFromEnvironment,
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		}
	} else {
		serviceTransport = &http.Transport{
			Proxy: http.ProxyFromEnvironment,
		}
	}
	serviceClient := &http.Client{
		Transport: serviceTransport,
	}

	serviceResponse, err := serviceClient.Do(serviceRequest)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to send request: %v", err)
	}
	defer serviceResponse.Body.Close()
	serviceResponseBody, err := io.ReadAll(serviceResponse.Body)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to read response body: %v", err)
	}

	return common.DevConsoleCommonResponse{
		StatusCode: serviceResponse.StatusCode,
		Headers:    serviceResponse.Header,
		Body:       string(serviceResponseBody),
	}, nil
}

func GetTaskRunLog(r *http.Request, user *auth.User, dynamicClient *dynamic.DynamicClient) (common.DevConsoleCommonResponse, error) {
	var request TaskRunLogRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to parse request: %v", err)
	}

	TEKTON_RESULTS_HOST, err := getTRHost(r, dynamicClient)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to get TektonResults host: %v", err)
	}

	TASKRUN_LOG_URL := fmt.Sprintf("https://%s/apis/results.tekton.dev/v1alpha2/parents/%s", TEKTON_RESULTS_HOST, request.TaskRunPath)

	var serviceRequest *http.Request
	serviceRequest, err = http.NewRequest(http.MethodGet, TASKRUN_LOG_URL, nil)

	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to create request: %v", err)
	}

	if request.AllowAuthHeader {
		serviceRequest.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
	}

	var serviceTransport *http.Transport
	if request.AllowInsecure {
		serviceTransport = &http.Transport{
			Proxy: http.ProxyFromEnvironment,
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		}
	} else {
		serviceTransport = &http.Transport{
			Proxy: http.ProxyFromEnvironment,
		}
	}
	serviceClient := &http.Client{
		Transport: serviceTransport,
	}

	serviceResponse, err := serviceClient.Do(serviceRequest)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to send request: %v", err)
	}
	defer serviceResponse.Body.Close()
	serviceResponseBody, err := io.ReadAll(serviceResponse.Body)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to read response body: %v", err)
	}

	return common.DevConsoleCommonResponse{
		StatusCode: serviceResponse.StatusCode,
		Headers:    serviceResponse.Header,
		Body:       string(serviceResponseBody),
	}, nil

}
