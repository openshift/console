package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"math/big"
	"net/http"
	"os"
	"path/filepath"
	"testing"
	"time"

	"k8s.io/client-go/rest"
)

func TestAnonymousK8SClientConfig(t *testing.T) {
	// Mirrors the off-cluster proxied config: trust lives on an explicit
	// Transport, and rest.AnonymousClientConfig does not copy Transport.
	source := &rest.Config{
		Host:      "https://kube-apiserver.example.svc:6443",
		Transport: &http.Transport{},
	}

	t.Run("with ca-file sets CAFile so a CA-aware transport can be built", func(t *testing.T) {
		got := anonymousK8SClientConfig(source, "/var/run/guest-ca/ca.crt", false)

		if got.Transport != nil {
			t.Errorf("expected nil Transport (so TransportFor builds a CA-aware one), got %T", got.Transport)
		}
		if got.TLSClientConfig.CAFile != "/var/run/guest-ca/ca.crt" {
			t.Errorf("expected CAFile to be set, got %q", got.TLSClientConfig.CAFile)
		}
		if got.Host != source.Host {
			t.Errorf("expected Host %q to be preserved, got %q", source.Host, got.Host)
		}
	})

	t.Run("without ca-file leaves CAFile empty", func(t *testing.T) {
		got := anonymousK8SClientConfig(source, "", false)

		if got.TLSClientConfig.CAFile != "" {
			t.Errorf("expected empty CAFile when no ca-file provided, got %q", got.TLSClientConfig.CAFile)
		}
	})

	t.Run("does not override an existing CAFile (e.g. in-cluster service account CA)", func(t *testing.T) {
		inClusterSource := &rest.Config{
			Host: "https://kubernetes.default.svc",
			TLSClientConfig: rest.TLSClientConfig{
				CAFile: "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt",
			},
		}

		got := anonymousK8SClientConfig(inClusterSource, "/some/other/ca-file", false)

		if got.TLSClientConfig.CAFile != "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt" {
			t.Errorf("expected in-cluster CAFile to be preserved, got %q", got.TLSClientConfig.CAFile)
		}
	})

	t.Run("skip-verify-tls is propagated to the anonymous config", func(t *testing.T) {
		got := anonymousK8SClientConfig(source, "", true)

		if !got.Insecure {
			t.Error("expected Insecure to be true when skip-verify-tls is set")
		}
	})

	t.Run("result is accepted by rest.TransportFor", func(t *testing.T) {
		// rest.TransportFor rejects a config that both carries a custom
		// Transport and requests CA trust; this guards against reintroducing
		// that combination (the original bug's inverse).
		cfg := anonymousK8SClientConfig(source, testCAFile(t), false)
		if _, err := rest.TransportFor(cfg); err != nil {
			t.Fatalf("rest.TransportFor rejected the anonymous config: %v", err)
		}
	})
}

// testCAFile writes a valid PEM-encoded CA certificate to a temp file and
// returns its path.
func testCAFile(t *testing.T) string {
	t.Helper()

	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("failed to generate key: %v", err)
	}
	tmpl := &x509.Certificate{
		SerialNumber:          big.NewInt(1),
		Subject:               pkix.Name{CommonName: "test-ca"},
		NotBefore:             time.Now().Add(-time.Hour),
		NotAfter:              time.Now().Add(time.Hour),
		IsCA:                  true,
		KeyUsage:              x509.KeyUsageCertSign,
		BasicConstraintsValid: true,
	}
	der, err := x509.CreateCertificate(rand.Reader, tmpl, tmpl, &key.PublicKey, key)
	if err != nil {
		t.Fatalf("failed to create certificate: %v", err)
	}
	pemBytes := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der})

	path := filepath.Join(t.TempDir(), "ca.crt")
	if err := os.WriteFile(path, pemBytes, 0o600); err != nil {
		t.Fatalf("failed to write test CA: %v", err)
	}
	return path
}
