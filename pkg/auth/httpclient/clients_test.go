package httpclient

import (
	"crypto/tls"
	"crypto/x509"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	oscrypto "github.com/openshift/library-go/pkg/crypto"
	"github.com/stretchr/testify/require"
	"k8s.io/apimachinery/pkg/util/sets"
)

// TestClientsTrustAndReload checks that New wires the issuer and proxy CAs
// into Issuer's trust pool while K8s trusts only its own CA and neither of
// the other two, and that rotating a watched CA file updates trust on the
// already-captured client pointer without rebuilding it.
func TestClientsTrustAndReload(t *testing.T) {
	issuerCA, issuerCert := testCA(t)
	proxyCA, proxyCert := testCA(t)
	rotatedCA, rotatedCert := testCA(t)
	k8sCA, k8sCert := testCA(t)

	issuer := testTLSServer(t, issuerCert)
	proxy := testTLSServer(t, proxyCert)
	rotated := testTLSServer(t, rotatedCert)
	k8s := testTLSServer(t, k8sCert)

	dir := t.TempDir()
	issuerPath, proxyPath, k8sPath := filepath.Join(dir, "issuer.pem"), filepath.Join(dir, "proxy.pem"), filepath.Join(dir, "k8s.pem")
	writeCA(t, issuerPath, issuerCA)
	writeCA(t, proxyPath, proxyCA)
	writeCA(t, k8sPath, k8sCA)

	clients, err := New(issuerPath, k8sPath, &ProxyConfig{TrustedCAFilePath: proxyPath})
	require.NoError(t, err)
	t.Cleanup(clients.Issuer.CloseIdleConnections)
	t.Cleanup(clients.K8s.CloseIdleConnections)
	require.Len(t, clients.providers, 2)

	checkGet(t, clients.Issuer, issuer.URL, true)
	checkGet(t, clients.Issuer, proxy.URL, true)
	checkGet(t, clients.Issuer, rotated.URL, false)
	checkGet(t, clients.Issuer, k8s.URL, false)
	checkGet(t, clients.K8s, k8s.URL, true)
	checkGet(t, clients.K8s, issuer.URL, false)
	checkGet(t, clients.K8s, proxy.URL, false)

	// Rotating a watched CA file is picked up by the already-captured client
	// pointer, without rebuilding it (go-oidc pins this pointer at construction).
	client := clients.Issuer
	writeCA(t, proxyPath, rotatedCA)
	require.NoError(t, clients.providers[1].RunOnce(t.Context()))
	require.Same(t, client, clients.Issuer)
	checkGet(t, client, rotated.URL, true)
	checkGet(t, client, proxy.URL, false)
}

// TestClientsDefaults checks the timeout selection (5s absent, 30s once a
// proxy is configured, including an empty one or one with a URL but no CA)
// and that Issuer falls back to system roots with no watched CA providers
// when neither an issuer nor a proxy CA file is configured.
func TestClientsDefaults(t *testing.T) {
	for _, tt := range []struct {
		name    string
		proxy   *ProxyConfig
		timeout time.Duration
	}{
		{"absent", nil, 5 * time.Second},
		{"present empty", &ProxyConfig{}, 30 * time.Second},
		{"URL without CA", &ProxyConfig{HTTPSProxy: "http://proxy.example.com:3128"}, 30 * time.Second},
	} {
		t.Run(tt.name, func(t *testing.T) {
			clients, err := New("", "", tt.proxy)
			require.NoError(t, err)
			require.Empty(t, clients.providers)
			require.Equal(t, tt.timeout, clients.Issuer.Timeout)
			require.Equal(t, 5*time.Second, clients.K8s.Timeout)

			transport := clients.Issuer.Transport.(*http.Transport)
			require.Equal(t, oscrypto.DefaultTLSVersion(), transport.TLSClientConfig.MinVersion)
			require.Equal(t, oscrypto.DefaultCiphers(), transport.TLSClientConfig.CipherSuites)

			systemRoots, err := x509.SystemCertPool()
			require.NoError(t, err)
			require.True(t, systemRoots.Equal(transport.TLSClientConfig.RootCAs))
		})
	}
}

// TestClientsCAFileStartupErrors checks that a missing or invalid CA file
// fails New immediately, for both the issuer CA and the proxy CA, with an
// error naming the offending path and its config key.
func TestClientsCAFileStartupErrors(t *testing.T) {
	missing := filepath.Join(t.TempDir(), "missing.pem")
	invalid := filepath.Join(t.TempDir(), "invalid.pem")
	writeCA(t, invalid, []byte("invalid CA"))
	for _, path := range []string{missing, invalid} {
		_, err := New("", "", &ProxyConfig{TrustedCAFilePath: path})
		require.ErrorContains(t, err, "auth.proxy.trustedCAFilePath")
		require.ErrorContains(t, err, path)

		_, err = New(path, "", nil)
		require.ErrorContains(t, err, "auth.oauthEndpointCAFile")
		require.ErrorContains(t, err, path)
	}
}

// TestClientsRejectsInvalidProxyURL checks that New surfaces ProxyConfig's
// own URL validation as a startup error, rather than silently building a
// client with a broken proxy.
func TestClientsRejectsInvalidProxyURL(t *testing.T) {
	_, err := New("", "", &ProxyConfig{HTTPSProxy: "http://[broken"})
	require.ErrorContains(t, err, "auth.proxy.httpsProxy")
}

// TestIssuerReloadWithoutProxy checks that the issuer CA hot-reloads on its
// own, independent of whether a component proxy is configured at all.
func TestIssuerReloadWithoutProxy(t *testing.T) {
	firstCA, firstCert := testCA(t)
	secondCA, secondCert := testCA(t)
	firstSrv, secondSrv := testTLSServer(t, firstCert), testTLSServer(t, secondCert)

	path := filepath.Join(t.TempDir(), "issuer.pem")
	writeCA(t, path, firstCA)

	clients, err := New(path, "", nil)
	require.NoError(t, err)
	t.Cleanup(clients.Issuer.CloseIdleConnections)

	checkGet(t, clients.Issuer, firstSrv.URL, true)
	checkGet(t, clients.Issuer, secondSrv.URL, false)

	writeCA(t, path, secondCA)

	require.NoError(t, clients.providers[0].RunOnce(t.Context()))
	checkGet(t, clients.Issuer, secondSrv.URL, true)
	checkGet(t, clients.Issuer, firstSrv.URL, false)
}

// TestClientsProxyRouting checks that New wires the configured proxy into
// Issuer's transport but never into K8s's, which keeps its own environment
// resolver.
func TestClientsProxyRouting(t *testing.T) {
	clients, err := New("", "", &ProxyConfig{HTTPSProxy: "http://proxy.example.com:3128"})
	require.NoError(t, err)
	t.Cleanup(clients.Issuer.CloseIdleConnections)
	t.Cleanup(clients.K8s.CloseIdleConnections)

	req := httptest.NewRequest(http.MethodGet, "https://idp.example.com", nil)

	issuerProxy, err := clients.Issuer.Transport.(*http.Transport).Proxy(req)
	require.NoError(t, err)
	require.Equal(t, "http://proxy.example.com:3128", issuerProxy.String())

	k8sProxy, err := clients.K8s.Transport.(*http.Transport).Proxy(req)
	require.NoError(t, err)
	require.Nil(t, k8sProxy)
}

// testCA generates a fresh self-signed CA and a server certificate for
// "issuer.example.test"/127.0.0.1/::1 signed by it, returning the CA's PEM
// bytes (to write to a CA file) and the server's tls.Certificate (to serve).
func testCA(t *testing.T) ([]byte, tls.Certificate) {
	t.Helper()
	caConfig, err := oscrypto.MakeSelfSignedCAConfig(t.Name(), time.Hour)
	require.NoError(t, err)

	ca := &oscrypto.CA{Config: caConfig, SerialGenerator: &oscrypto.RandomSerialGenerator{}}
	serverConfig, err := ca.MakeServerCert(sets.New("issuer.example.test", "127.0.0.1", "::1"), time.Hour)
	require.NoError(t, err)

	caCertPEM, _, err := caConfig.GetPEMBytes()
	require.NoError(t, err)

	certPEM, keyPEM, err := serverConfig.GetPEMBytes()
	require.NoError(t, err)

	cert, err := tls.X509KeyPair(certPEM, keyPEM)
	require.NoError(t, err)
	return caCertPEM, cert
}

// testTLSServer starts an HTTPS server presenting cert, closing the
// connection after every response so each request forces a fresh handshake
// (needed to observe trust changes after a CA reload).
func testTLSServer(t *testing.T, cert tls.Certificate) *httptest.Server {
	t.Helper()
	srv := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Connection", "close") // Require a fresh handshake for every trust assertion.
		w.WriteHeader(http.StatusOK)
	}))
	srv.Config.ErrorLog = log.New(io.Discard, "", 0)
	srv.TLS = &tls.Config{Certificates: []tls.Certificate{cert}}
	srv.StartTLS()
	t.Cleanup(srv.Close)
	return srv
}

func writeCA(t *testing.T, path string, data []byte) {
	t.Helper()
	require.NoError(t, os.WriteFile(path, data, 0600))
}

// checkGet asserts that a GET to target succeeds with the client's current
// trust (trusted), or fails the TLS handshake specifically because the
// server's CA is unknown (!trusted) rather than for some unrelated reason.
func checkGet(t *testing.T, client *http.Client, target string, trusted bool) {
	t.Helper()
	response, err := client.Get(target)
	if !trusted {
		var unknownAuthority x509.UnknownAuthorityError
		require.ErrorAs(t, err, &unknownAuthority)
		return
	}
	require.NoError(t, err)
	require.Equal(t, http.StatusOK, response.StatusCode)
	require.NoError(t, response.Body.Close())
}
