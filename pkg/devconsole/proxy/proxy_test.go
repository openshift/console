package proxy

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"
)

func TestProxyEndpoint(t *testing.T) {
	tests := []struct {
		testName         string
		request          ProxyRequest
		expectedResponse ProxyResponse
	}{
		{
			testName: "valid GET",
			request: ProxyRequest{
				Url:    "testserver",
				Method: http.MethodGet,
			},
			expectedResponse: ProxyResponse{
				StatusCode: http.StatusOK,
				Headers: http.Header{
					"Content-Type":   {"application/json"},
					"Content-Length": {"15"},
				},
				Body: "Mocked response",
			},
		},
		{
			testName: "valid GET without method",
			request: ProxyRequest{
				Url: "testserver",
			},
			expectedResponse: ProxyResponse{
				StatusCode: http.StatusOK,
				Headers: http.Header{
					"Content-Type":   {"application/json"},
					"Content-Length": {"15"},
				},
				Body: "Mocked response",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.testName, func(t *testing.T) {

			server := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				rw.Header().Add("Content-Type", "application/json")
				rw.WriteHeader(http.StatusOK)
				rw.Write([]byte("Mocked response"))
			}))
			defer server.Close()

			tt.request.Url = server.URL
			body, err := json.Marshal(tt.request)
			if err != nil {
				t.Errorf("Unexpected error: %v", err)
			}

			req, err := http.NewRequest(http.MethodPost, "/proxy", bytes.NewBuffer(body))
			if err != nil {
				t.Errorf("Unexpected error: %v", err)
			}

			actual, err := serve(req)
			if err != nil {
				t.Errorf("Unexpected error: %v", err)
			}
			actual.Headers.Del("Date")
			if !reflect.DeepEqual(tt.expectedResponse, actual) {
				t.Errorf("Response does not match expectation:\n%v\nbut got\n%v", tt.expectedResponse, actual)
			}
		})
	}
}
