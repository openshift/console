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

	t.Run("ca-file and skip-verify-tls together does not crash rest.TransportFor", func(t *testing.T) {
		// rest.TransportFor errors out when a config carries both a CA and
		// Insecure=true. -ca-file and -k8s-mode-off-cluster-skip-verify-tls
		// are commonly set together (see examples/run-bridge.sh), so this
		// combination must not produce that error.
		got := anonymousK8SClientConfig(source, testCAFile(t), true)

		if !got.Insecure {
			t.Error("expected Insecure to be true")
		}
		if got.TLSClientConfig.CAFile != "" {
			t.Errorf("expected CAFile to be left empty when Insecure is true, got %q", got.TLSClientConfig.CAFile)
		}
		if _, err := rest.TransportFor(got); err != nil {
			t.Fatalf("rest.TransportFor rejected the anonymous config: %v", err)
		}
	})
}

func TestOffClusterProxyTLSConfigs(t *testing.T) {
	t.Run("falls back to the KAS pool when service-ca-file is unset", func(t *testing.T) {
		caFile, _ := writeTestCAFile(t, "ca.crt")

		k8sCfg, serviceCfg := offClusterProxyTLSConfigs(caFile, "", false)

		if serviceCfg != k8sCfg {
			t.Error("expected the service config to be the same config as the KAS config when service-ca-file is unset")
		}
		if !serviceCfg.RootCAs.Equal(k8sCfg.RootCAs) {
			t.Error("expected the service pool to trust the KAS CA")
		}
	})

	t.Run("uses a distinct pool for each CA when both are set", func(t *testing.T) {
		kasCAFile, kasCert := writeTestCAFile(t, "kas-ca.crt")
		serviceCAFile, serviceCert := writeTestCAFile(t, "service-ca.crt")

		k8sCfg, serviceCfg := offClusterProxyTLSConfigs(kasCAFile, serviceCAFile, false)

		if serviceCfg == k8sCfg {
			t.Fatal("expected distinct configs when both CA files are set")
		}
		if !poolContainsSubject(k8sCfg.RootCAs, kasCert.RawSubject) {
			t.Error("expected the KAS pool to trust the KAS CA")
		}
		if poolContainsSubject(k8sCfg.RootCAs, serviceCert.RawSubject) {
			t.Error("expected the KAS pool to not trust the service CA")
		}
		if !poolContainsSubject(serviceCfg.RootCAs, serviceCert.RawSubject) {
			t.Error("expected the service pool to trust the service CA")
		}
		if poolContainsSubject(serviceCfg.RootCAs, kasCert.RawSubject) {
			t.Error("expected the service pool to not trust the KAS CA")
		}
	})

	t.Run("propagates skip-verify-tls to both configs", func(t *testing.T) {
		k8sCfg, serviceCfg := offClusterProxyTLSConfigs("", "", true)

		if !k8sCfg.InsecureSkipVerify {
			t.Error("expected the KAS config to have InsecureSkipVerify set")
		}
		if !serviceCfg.InsecureSkipVerify {
			t.Error("expected the service config to have InsecureSkipVerify set")
		}
	})

	t.Run("leaves RootCAs nil when no CA files are provided", func(t *testing.T) {
		k8sCfg, serviceCfg := offClusterProxyTLSConfigs("", "", false)

		if k8sCfg.RootCAs != nil {
			t.Error("expected a nil RootCAs (system trust store) when ca-file is unset")
		}
		if serviceCfg.RootCAs != nil {
			t.Error("expected a nil RootCAs (system trust store) when service-ca-file is unset")
		}
	})
}

func TestMustLoadCAPool(t *testing.T) {
	t.Run("valid PEM file returns a pool containing the CA", func(t *testing.T) {
		path, cert := writeTestCAFile(t, "ca.crt")

		pool := mustLoadCAPool(path)

		if !poolContainsSubject(pool, cert.RawSubject) {
			t.Error("expected pool to contain the loaded CA's subject")
		}
	})

	t.Run("bundle with two certs loads both", func(t *testing.T) {
		path := filepath.Join(t.TempDir(), "bundle.crt")
		certA := generateTestCA(t, "ca-a")
		certB := generateTestCA(t, "ca-b")
		bundle := append(encodeCertPEM(certA), encodeCertPEM(certB)...)
		if err := os.WriteFile(path, bundle, 0o600); err != nil {
			t.Fatalf("failed to write bundle: %v", err)
		}

		pool := mustLoadCAPool(path)

		if !poolContainsSubject(pool, certA.RawSubject) || !poolContainsSubject(pool, certB.RawSubject) {
			t.Error("expected pool to contain both bundled CAs")
		}
	})
}

// writeTestCAFile generates a self-signed CA certificate, writes it (PEM
// encoded) to a temp file named fileName, and returns the file's path along
// with the parsed certificate.
func writeTestCAFile(t *testing.T, fileName string) (string, *x509.Certificate) {
	t.Helper()

	cert := generateTestCA(t, fileName)
	path := filepath.Join(t.TempDir(), fileName)
	if err := os.WriteFile(path, encodeCertPEM(cert), 0o600); err != nil {
		t.Fatalf("failed to write test CA: %v", err)
	}
	return path, cert
}

// generateTestCA creates a self-signed CA certificate with the given common
// name and returns its parsed form.
func generateTestCA(t *testing.T, commonName string) *x509.Certificate {
	t.Helper()

	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("failed to generate key: %v", err)
	}
	tmpl := &x509.Certificate{
		SerialNumber:          big.NewInt(1),
		Subject:               pkix.Name{CommonName: commonName},
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
	cert, err := x509.ParseCertificate(der)
	if err != nil {
		t.Fatalf("failed to parse certificate: %v", err)
	}
	return cert
}

func encodeCertPEM(cert *x509.Certificate) []byte {
	return pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: cert.Raw})
}

func poolContainsSubject(pool *x509.CertPool, subject []byte) bool {
	for _, s := range pool.Subjects() { //nolint:staticcheck // Subjects is deprecated but sufficient for this test comparison.
		if string(s) == string(subject) {
			return true
		}
	}
	return false
}

// testCAFile writes a valid PEM-encoded CA certificate to a temp file and
// returns its path.
func testCAFile(t *testing.T) string {
	t.Helper()
	path, _ := writeTestCAFile(t, "ca.crt")
	return path
}
