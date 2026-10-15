package terminal

import (
	"crypto/tls"
	"crypto/x509"
	"net/http"
	"net/url"
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
		if got.Host != endpoint.Host {
			t.Errorf("expected Host %q, got %q", endpoint.Host, got.Host)
		}
	})
}
