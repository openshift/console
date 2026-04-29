package olm

import (
	"fmt"
	"net/http"
	"os"
	"sync"
	"time"

	"k8s.io/klog/v2"
)

type bearerTokenRoundTripper struct {
	tokenFile string
	delegate  http.RoundTripper

	mu          sync.Mutex
	cachedToken string
	cachedAt    time.Time
}

const tokenCacheDuration = 1 * time.Minute

func NewBearerTokenRoundTripper(tokenFile string, delegate http.RoundTripper) http.RoundTripper {
	return &bearerTokenRoundTripper{
		tokenFile: tokenFile,
		delegate:  delegate,
	}
}

func (rt *bearerTokenRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	token, err := rt.readToken()
	if err != nil {
		klog.Errorf("Cannot read service account token from %s: %v", rt.tokenFile, err)
		return nil, fmt.Errorf("failed to read service account token: %w", err)
	}

	clone := req.Clone(req.Context())
	clone.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	return rt.delegate.RoundTrip(clone)
}

func (rt *bearerTokenRoundTripper) readToken() (string, error) {
	rt.mu.Lock()
	defer rt.mu.Unlock()

	if rt.cachedToken != "" && time.Since(rt.cachedAt) < tokenCacheDuration {
		return rt.cachedToken, nil
	}

	data, err := os.ReadFile(rt.tokenFile)
	if err != nil {
		return "", err
	}

	rt.cachedToken = string(data)
	rt.cachedAt = time.Now()
	return rt.cachedToken, nil
}
