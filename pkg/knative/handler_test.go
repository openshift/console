package knative

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	dynamicfake "k8s.io/client-go/dynamic/fake"
)

func TestGetServiceEndpoints(t *testing.T) {

	tests := []struct {
		testName  string
		svcName   string
		namespace string
		expected  string
		route     *unstructured.Unstructured
	}{
		{
			testName:  "valid route",
			svcName:   "hello-func-node",
			namespace: "default",
			expected:  "https://hello-func-node.apps.openshift.com",
			route: &unstructured.Unstructured{
				Object: map[string]interface{}{
					"apiVersion": "serving.knative.dev/v1",
					"kind":       "Route",
					"metadata": map[string]interface{}{
						"name":      "hello-func-node",
						"namespace": "default",
						"labels": map[string]interface{}{
							"serving.knative.dev/service": "hello-func-node",
						},
					},
					"status": map[string]interface{}{
						"url": "https://hello-func-node.apps.openshift.com",
					},
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.testName, func(t *testing.T) {
			dynamicClient := dynamicfake.NewSimpleDynamicClient(runtime.NewScheme(), tt.route)
			url, err := getServiceEndpoints(dynamicClient, tt.namespace, tt.svcName)
			if err != nil {
				t.Errorf("Unexpected error: %s", err)
			}
			assert.Equal(t, tt.expected, url)
		})
	}
}

func TestInvokeService(t *testing.T) {

	tests := []struct {
		testName    string
		svcName     string
		namespace   string
		expected    string
		requestBody InvokeServiceRequestBody
		route       *unstructured.Unstructured
	}{
		{
			testName:  "success invoke",
			svcName:   "hello-func-node",
			namespace: "default",
			expected:  "{\"message\": \"Hello world\"}",
			requestBody: InvokeServiceRequestBody{
				AllowInsecure: true,
				Body: InvokeBody{
					InvokeMessage:     "{\"message\": \"Hello world\"}",
					InvokeFormat:      "http",
					InvokeContentType: "application/json",
					InvokeHeader:      http.Header{},
				},
			},
			route: &unstructured.Unstructured{
				Object: map[string]interface{}{
					"apiVersion": "serving.knative.dev/v1",
					"kind":       "Route",
					"metadata": map[string]interface{}{
						"name":      "hello-func-node",
						"namespace": "default",
						"labels": map[string]interface{}{
							"serving.knative.dev/service": "hello-func-node",
						},
					},
					"status": map[string]interface{}{
						"url": "https://hello-func-node.apps.openshift.com",
					},
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.testName, func(t *testing.T) {

			server := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				rw.Header().Add("Content-Type", "application/json")
				rw.WriteHeader(http.StatusOK)
				rw.Write([]byte(`{"message": "Hello world"}`))
			}))

			defer server.Close()

			tt.route.Object["status"] = map[string]interface{}{
				"url": server.URL,
			}

			dynamicClient := dynamicfake.NewSimpleDynamicClient(runtime.NewScheme(), tt.route)

			requestBytes, err := json.Marshal(tt.requestBody)
			if err != nil {
				t.Errorf("Unexpected error: %s", err)
			}

			req := httptest.NewRequest(http.MethodPost, "/bar", bytes.NewBuffer(requestBytes))
			req.Header.Set("Content-Type", "application/json")

			actual, err := invokeService(dynamicClient, tt.namespace, tt.svcName, req)
			if err != nil {
				t.Errorf("Unexpected error: %s", err)
			}

			assert.Equal(t, tt.expected, actual.Body)

		})
	}
}
