package tektonresults

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/devconsole/common"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/klog/v2"
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
	tlsCertPath             string = "/var/serving-cert/tls.crt"
)

var client *http.Client

func Client() (*http.Client, error) {
	if client == nil {
		// Load the CA certificate
		caCert, err := os.ReadFile(tlsCertPath)
		if err != nil {
			return nil, fmt.Errorf("failed to read CA certificate: %v", err)
		}

		// Create a CertPool and add the CA certificate
		caCertPool := x509.NewCertPool()
		if !caCertPool.AppendCertsFromPEM(caCert) {
			return nil, fmt.Errorf("failed to append CA certificate")
		}

		serviceTransport := &http.Transport{
			Proxy: http.ProxyFromEnvironment,
			TLSClientConfig: &tls.Config{
				RootCAs: caCertPool,
			},
		}

		client = &http.Client{
			Transport: serviceTransport,
		}
	}
	return client, nil
}

func getTRHost(ctx context.Context, dynamicClient *dynamic.DynamicClient, k8sMode string) (string, error) {
	if k8sMode == "off-cluster" {
		route, err := dynamicClient.Resource(*TektonResultsAPIRoute).Namespace("openshift-pipelines").Get(ctx, "tekton-results-api-service", metav1.GetOptions{})
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

	host, err := dynamicClient.Resource(*TektonResultsResource).Get(ctx, "result", metav1.GetOptions{})
	if err != nil {
		return "", err
	}
	targetNamespace, isTargetNsPresent, err := unstructured.NestedString(host.Object, "spec", "targetNamespace")
	if err != nil || !isTargetNsPresent {
		klog.Errorf("spec.targetNamespace not found in TektonResults resource")
		targetNamespace = ""
	}
	serverPort, isPortPresent, err := unstructured.NestedString(host.Object, "spec", "server_port")
	if err != nil || !isPortPresent {
		klog.Errorf("spec.server_port not found in TektonResults resource. Using default port 8080")
		serverPort = "8080"
	}
	tlsHostname, isTLSHostnamePresent, err := unstructured.NestedString(host.Object, "spec", "tls_hostname_override")
	if err != nil || !isTLSHostnamePresent {
		klog.Errorf("spec.tls_hostname_override not found in TektonResults resource")
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

func makeHTTPRequest(ctx context.Context, url, userToken string) (common.DevConsoleCommonResponse, error) {
	serviceRequest, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)

	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to create request: %v", err)
	}

	// Needed for TektonResults API
	serviceRequest.Header.Set("Authorization", fmt.Sprintf("Bearer %s", userToken))

	serviceClient, err := Client()
	if err != nil {
		return common.DevConsoleCommonResponse{}, err
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

func GetTektonResults(r *http.Request, user *auth.User, dynamicClient *dynamic.DynamicClient, k8sMode string) (common.DevConsoleCommonResponse, error) {
	var request TektonResultsRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to parse request: %v", err)
	}
	TEKTON_RESULTS_HOST, err := getTRHost(r.Context(), dynamicClient, k8sMode)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to get TektonResults host: %v", err)
	}

	parsedParams, err := url.ParseQuery(request.SearchParams)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("error parsing search params: %v", err)
	}

	TEKTON_RESULTS_URL := fmt.Sprintf("https://%s/apis/results.tekton.dev/v1alpha2/parents/%s/results/-/records?%s",
		TEKTON_RESULTS_HOST,
		url.PathEscape(request.SearchNamespace),
		parsedParams.Encode(),
	)

	return makeHTTPRequest(r.Context(), TEKTON_RESULTS_URL, user.Token)
}

func GetResultsSummary(r *http.Request, user *auth.User, dynamicClient *dynamic.DynamicClient, k8sMode string) (common.DevConsoleCommonResponse, error) {
	var request SummaryRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to parse request: %v", err)
	}
	TEKTON_RESULTS_HOST, err := getTRHost(r.Context(), dynamicClient, k8sMode)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to get TektonResults host: %v", err)
	}

	parsedParams, err := url.ParseQuery(request.SearchParams)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("error parsing search params: %v", err)
	}

	SUMMARY_URL := fmt.Sprintf("https://%s/apis/results.tekton.dev/v1alpha2/parents/%s/results/-/records/summary?%s",
		TEKTON_RESULTS_HOST,
		url.PathEscape(request.SearchNamespace),
		parsedParams.Encode(),
	)

	return makeHTTPRequest(r.Context(), SUMMARY_URL, user.Token)
}

func GetTaskRunLog(r *http.Request, user *auth.User, dynamicClient *dynamic.DynamicClient, k8sMode string) (common.DevConsoleCommonResponse, error) {
	var request TaskRunLogRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to parse request: %v", err)
	}
	TEKTON_RESULTS_HOST, err := getTRHost(r.Context(), dynamicClient, k8sMode)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to get TektonResults host: %v", err)
	}

	TASKRUN_LOG_URL := fmt.Sprintf("https://%s/apis/results.tekton.dev/v1alpha2/parents/%s",
		TEKTON_RESULTS_HOST,
		request.TaskRunPath,
	)

	return makeHTTPRequest(r.Context(), TASKRUN_LOG_URL, user.Token)
}
