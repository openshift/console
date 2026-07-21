package webhooks

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMakeHTTPRequest_HeaderFiltering(t *testing.T) {
	var receivedHeaders http.Header
	ts := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedHeaders = r.Header.Clone()
		w.WriteHeader(http.StatusOK)
		io.WriteString(w, "ok")
	}))
	defer ts.Close()

	originalClient := client
	client = ts.Client()
	defer func() { client = originalClient }()

	denyList := []string{"Cookie", "X-CSRFToken"}

	tests := []struct {
		name        string
		headerKey   string
		shouldBlock bool
	}{
		{"exact match Cookie", "Cookie", true},
		{"lowercase cookie", "cookie", true},
		{"uppercase COOKIE", "COOKIE", true},
		{"mixed case cOoKiE", "cOoKiE", true},
		{"exact X-CSRFToken", "X-CSRFToken", true},
		{"lowercase x-csrftoken", "x-csrftoken", true},
		{"webhook-denied Authorization", "Authorization", true},
		{"webhook-denied authorization lowercase", "authorization", true},
		{"webhook-denied Host", "Host", true},
		{"allowed header Content-Type", "Content-Type", false},
		{"allowed header Accept", "Accept", false},
		{"allowed header X-Custom", "X-Custom-Header", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			receivedHeaders = nil
			headers := http.Header{}
			headers.Set(tt.headerKey, "test-value")

			_, err := makeHTTPRequest(context.Background(), ts.URL+"/test", headers, []byte("{}"), denyList)
			assert.NoError(t, err)

			canonicalKey := http.CanonicalHeaderKey(tt.headerKey)
			if tt.shouldBlock {
				assert.Empty(t, receivedHeaders.Values(canonicalKey),
					"header %q should have been blocked but was forwarded", tt.headerKey)
			} else {
				assert.Equal(t, "test-value", receivedHeaders.Get(canonicalKey),
					"header %q should have been forwarded but was stripped", tt.headerKey)
			}
		})
	}
}

func TestMakeHTTPRequest_ResponseSizeLimit(t *testing.T) {
	largeBody := strings.Repeat("x", maxResponseBodySize+100)
	ts := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		io.WriteString(w, largeBody)
	}))
	defer ts.Close()

	originalClient := client
	client = ts.Client()
	defer func() { client = originalClient }()

	_, err := makeHTTPRequest(context.Background(), ts.URL+"/test", http.Header{}, []byte("{}"), nil)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "exceeds maximum allowed size")
}

func TestMakeHTTPRequest_NormalResponse(t *testing.T) {
	ts := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Test", "response-header")
		w.WriteHeader(http.StatusCreated)
		io.WriteString(w, `{"id": 123}`)
	}))
	defer ts.Close()

	originalClient := client
	client = ts.Client()
	defer func() { client = originalClient }()

	resp, err := makeHTTPRequest(context.Background(), ts.URL+"/test", http.Header{}, []byte("{}"), nil)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)
	assert.Equal(t, `{"id": 123}`, resp.Body)
	assert.Equal(t, "response-header", resp.Headers.Get("X-Test"))
}
