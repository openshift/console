package oauth2

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

type authRoundTripperFunc func(*http.Request) (*http.Response, error)

func (f authRoundTripperFunc) RoundTrip(r *http.Request) (*http.Response, error) {
	return f(r)
}

func TestCompleteHTTPClients(t *testing.T) {
	wantIssuer := &http.Client{Timeout: time.Second}
	wantK8s := &http.Client{Timeout: 2 * time.Second}
	completed, err := (&Config{IssuerClient: wantIssuer, K8sClient: wantK8s}).Complete()
	require.NoError(t, err)
	require.Same(t, wantIssuer, completed.IssuerClient)
	require.Same(t, wantK8s, completed.K8sClient)
	require.Same(t, wantIssuer, newUnstartedAuthenticator(completed).issuerClient)
}

// TestOpenShiftDiscoveryHTTPClients asserts that AuthSourceOpenShift keeps
// K8sClient and IssuerClient on their distinct, non-interchangeable roles:
// K8sClient must be the only one used for the GET against
// /.well-known/oauth-authorization-server, and IssuerClient must be the only
// one used for the subsequent HEAD probe of the discovered issuer URL (and is
// also the client exposed on the authenticator for code exchange/refresh).
// Each fake RoundTripper errors on any request it doesn't expect, so the
// requests succeeding and landing on the right counters proves no mix-up.
func TestOpenShiftDiscoveryHTTPClients(t *testing.T) {
	var metadataRequests, issuerRequests atomic.Int32
	k8sClient := &http.Client{Transport: authRoundTripperFunc(func(r *http.Request) (*http.Response, error) {
		if r.Method != http.MethodGet || r.URL.String() != "https://kubernetes.example.test/.well-known/oauth-authorization-server" {
			return nil, fmt.Errorf("unexpected Kubernetes request: %s %s", r.Method, r.URL)
		}
		metadataRequests.Add(1)
		w := httptest.NewRecorder()
		(&mockOpenShiftProvider{issuer: "https://oauth.example.test"}).handleDiscovery(w, r)
		return w.Result(), nil
	})}
	issuerClient := &http.Client{Transport: authRoundTripperFunc(func(r *http.Request) (*http.Response, error) {
		if r.Method != http.MethodHead || r.URL.String() != "https://oauth.example.test" {
			return nil, fmt.Errorf("unexpected issuer request: %s %s", r.Method, r.URL)
		}
		issuerRequests.Add(1)
		return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(strings.NewReader("")), Header: make(http.Header)}, nil
	})}
	authenticator, err := NewOAuth2Authenticator(t.Context(), &Config{
		AuthSource:   AuthSourceOpenShift,
		IssuerURL:    "https://kubernetes.example.test",
		ClientID:     "console",
		ClientSecret: "secret",
		IssuerClient: issuerClient,
		K8sClient:    k8sClient,
	})
	require.NoError(t, err)
	require.Same(t, issuerClient, authenticator.issuerClient)
	require.GreaterOrEqual(t, metadataRequests.Load(), int32(1))
	require.GreaterOrEqual(t, issuerRequests.Load(), int32(1))
}
