package proxy

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"
	"time"

	"github.com/openshift/console/pkg/auth"
)

var user = &auth.User{
	ID:       "test-id",
	Username: "test-user",
	Token:    "test-token",
}

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
					"Authorization":  {user.Token},
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
					"Authorization":  {user.Token},
				},
				Body: "Mocked response",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.testName, func(t *testing.T) {

			server := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				rw.Header().Add("Content-Type", "application/json")
				rw.Header().Add("Authorization", user.Token)
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

			actual, err := serve(req, user)
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

func TestProxyCancellation(t *testing.T) {
	serverRequestCancelled := make(chan bool, 1)

	waitServer := &http.Server{
		Addr: ":8000",
		Handler: http.HandlerFunc(func(_ http.ResponseWriter, request *http.Request) {
			t.Log("Received request")
			sleep, cancel := context.WithTimeout(t.Context(), 1*time.Second)
			defer cancel()

			select {
			case <-sleep.Done():
				serverRequestCancelled <- false
			case <-request.Context().Done():
				serverRequestCancelled <- true
			}
		}),
	}

	go func(t *testing.T) {
		// always returns error. ErrServerClosed on graceful close
		if err := waitServer.ListenAndServe(); err != http.ErrServerClosed {
			// unexpected error. port in use?
			t.Logf("ListenAndServe(): %v", err)
		}
	}(t)

	defer func() {
		waitServer.Shutdown(t.Context())
	}()

	requestBody, _ := json.Marshal(ProxyRequest{
		Method: "GET",
		Url:    "http://127.0.0.1:8000",
	})
	requestCtx, cancel := context.WithTimeout(t.Context(), 5*time.Millisecond)
	defer cancel()

	request, err := http.NewRequestWithContext(
		requestCtx,
		"POST",
		"http://127.0.0.1:8080/proxy/internet",
		bytes.NewBuffer(requestBody),
	)
	if err != nil {
		t.Fatal(err)
	}

	Handler(&auth.User{}, httptest.NewRecorder(), request)

	// Ensure the test does not last more than one second, in the event that the
	// test-server's handler does not receive the request somehow
	go func() {
		time.Sleep(1 * time.Second)
		serverRequestCancelled <- false
	}()

	if !<-serverRequestCancelled {
		t.Fatal("Server's request was not cancelled after the client's request timeout expired")
	}
}
