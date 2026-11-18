package terminal

import (
	"crypto/tls"
	"crypto/x509"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"sync/atomic"
	"testing"
)

func TestGetConfig(t *testing.T) {
	endpoint := &url.URL{Scheme: "https", Host: "kube-apiserver.example.svc:6443"}

	t.Run("preserves the configured RootCAs instead of loading the in-cluster CA", func(t *testing.T) {
		pool := x509.NewCertPool()
		tlsConfig := &tls.Config{RootCAs: pool}
		p := &Proxy{TLSClientConfig: tlsConfig, ClusterEndpoint: endpoint}

		got, err := p.getConfig("token")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		transport, ok := got.Transport.(*http.Transport)
		if !ok {
			t.Fatalf("expected *http.Transport, got %T", got.Transport)
		}
		if transport.TLSClientConfig != tlsConfig {
			t.Errorf("expected transport to use the configured TLS config, got %+v", transport.TLSClientConfig)
		}
		if transport.TLSClientConfig.RootCAs != pool {
			t.Error("expected the configured RootCAs to be preserved")
		}
	})

	t.Run("preserves InsecureSkipVerify for off-cluster skip-verify-tls", func(t *testing.T) {
		tlsConfig := &tls.Config{InsecureSkipVerify: true}
		p := &Proxy{TLSClientConfig: tlsConfig, ClusterEndpoint: endpoint}

		got, err := p.getConfig("token")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		transport := got.Transport.(*http.Transport)
		if !transport.TLSClientConfig.InsecureSkipVerify {
			t.Error("expected InsecureSkipVerify to be preserved")
		}
	})

	t.Run("does not call rest.InClusterConfig, so it works off-cluster", func(t *testing.T) {
		// Regression test: getConfig previously called rest.InClusterConfig()
		// whenever InsecureSkipVerify was false, which both discarded any
		// configured RootCAs and fails outright off-cluster (no
		// service-account token file present).
		p := &Proxy{TLSClientConfig: &tls.Config{}, ClusterEndpoint: endpoint}

		if _, err := p.getConfig("token"); err != nil {
			t.Fatalf("expected getConfig to succeed without an in-cluster environment, got: %v", err)
		}
	})

	t.Run("preserves the bearer token and host", func(t *testing.T) {
		p := &Proxy{TLSClientConfig: &tls.Config{}, ClusterEndpoint: endpoint}

		got, err := p.getConfig("my-token")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.BearerToken != "my-token" {
			t.Errorf("expected BearerToken to be preserved, got %q", got.BearerToken)
		}
		if got.Host != endpoint.String() {
			t.Errorf("expected Host %q, got %q", endpoint.String(), got.Host)
		}
	})

	t.Run("honors HTTP(S)_PROXY/NO_PROXY like the other off-cluster transports", func(t *testing.T) {
		p := &Proxy{TLSClientConfig: &tls.Config{}, ClusterEndpoint: endpoint}

		got, err := p.getConfig("token")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		transport := got.Transport.(*http.Transport)
		if transport.Proxy == nil {
			t.Error("expected the transport to honor proxy env vars, got no Proxy function")
		}
	})

	t.Run("shares one transport across requests, keeping tokens per-request", func(t *testing.T) {
		// Regression test: getConfig built a fresh http.Transport per call,
		// so every terminal request got a new connection pool — no
		// connection reuse, and idle connections on the abandoned
		// transports were never closed.
		p := &Proxy{TLSClientConfig: &tls.Config{}, ClusterEndpoint: endpoint}

		got1, err := p.getConfig("token-1")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		got2, err := p.getConfig("token-2")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		if got1.Transport == nil || got1.Transport != got2.Transport {
			t.Error("expected getConfig to reuse a single shared transport across calls")
		}
		if got1.BearerToken != "token-1" || got2.BearerToken != "token-2" {
			t.Errorf("expected bearer tokens to stay per-request, got %q and %q", got1.BearerToken, got2.BearerToken)
		}
	})

	t.Run("reuses a single connection across requests and clients", func(t *testing.T) {
		// Behavioural counterpart to the transport-identity test above: it
		// asserts the property that actually matters (connection reuse)
		// rather than the implementation that currently provides it. It
		// also catches ways of losing reuse that keep a shared transport —
		// DisableKeepAlives, a negative idle-connection limit, a fresh
		// transport per call — without pinning any of them.
		var newConns int32
		server := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusOK)
		}))
		server.Config.ConnState = func(_ net.Conn, state http.ConnState) {
			if state == http.StateNew {
				atomic.AddInt32(&newConns, 1)
			}
		}
		server.StartTLS()
		defer server.Close()

		pool := x509.NewCertPool()
		pool.AddCert(server.Certificate())
		endpoint, err := url.Parse(server.URL)
		if err != nil {
			t.Fatalf("unexpected error parsing test server URL: %v", err)
		}

		p := &Proxy{TLSClientConfig: &tls.Config{RootCAs: pool}, ClusterEndpoint: endpoint}

		// Build a client per request, as HandleProxy does.
		for i := 0; i < 2; i++ {
			cfg, err := p.getConfig("token")
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			resp, err := (&http.Client{Transport: cfg.Transport}).Get(server.URL)
			if err != nil {
				t.Fatalf("unexpected error from test server: %v", err)
			}
			// The body must be drained for the connection to be reused.
			if _, err := io.Copy(io.Discard, resp.Body); err != nil {
				t.Fatalf("unexpected error reading body: %v", err)
			}
			resp.Body.Close()
		}

		if got := atomic.LoadInt32(&newConns); got != 1 {
			t.Errorf("expected the requests to share one connection, got %d new connections", got)
		}
	})

	t.Run("resolves to the https scheme despite TLS living in the Transport", func(t *testing.T) {
		// Regression test: Host was previously set to ClusterEndpoint.Host
		// (no scheme). client-go defaults a scheme-less host to http://
		// when the rest.Config has no CA/cert data and Insecure is unset —
		// none of which apply here, because the TLS trust is carried by the
		// custom Transport instead. The terminal clients would then speak
		// plain HTTP to the API server.
		p := &Proxy{TLSClientConfig: &tls.Config{}, ClusterEndpoint: endpoint}

		cs, err := p.createTypedClient("token")
		if err != nil {
			t.Fatalf("unexpected error building typed client: %v", err)
		}
		u := cs.CoreV1().RESTClient().Get().AbsPath("/healthz").URL()
		if u.Scheme != "https" {
			t.Errorf("expected requests to use the https scheme, got %q (URL: %s)", u.Scheme, u)
		}
	})
}
