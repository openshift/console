package kubeconfig

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	authenticationv1 "k8s.io/api/authentication/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	schema "k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
	k8stesting "k8s.io/client-go/testing"
	"k8s.io/client-go/tools/clientcmd"

	"github.com/openshift/console/pkg/auth"
)

const (
	testAPIServerURL = "https://api.test-cluster.example.com:6443"
	testCAData       = "-----BEGIN CERTIFICATE-----\nTESTCA\n-----END CERTIFICATE-----"
)

func newTestHandler(client kubernetes.Interface, caData []byte) *KubeConfigHandler {
	return &KubeConfigHandler{
		apiServerURL:           testAPIServerURL,
		caData:                 caData,
		tokenExpirationSeconds: defaultTokenExpirationSeconds,
		newClient: func(_ string) (kubernetes.Interface, error) {
			return client, nil
		},
	}
}

func TestGenerateKubeConfig(t *testing.T) {
	h := newTestHandler(nil, []byte(testCAData))

	raw, err := h.generateKubeConfig("my-token", "system:serviceaccount:ns:sa", "ns")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	config, err := clientcmd.Load(raw)
	if err != nil {
		t.Fatalf("generated kubeconfig is not parseable: %v", err)
	}

	if len(config.Clusters) != 1 {
		t.Fatalf("expected exactly 1 cluster, got %d", len(config.Clusters))
	}
	for _, cluster := range config.Clusters {
		if cluster.Server != testAPIServerURL {
			t.Errorf("expected server %q, got %q", testAPIServerURL, cluster.Server)
		}
		if string(cluster.CertificateAuthorityData) != testCAData {
			t.Errorf("expected CA data to be embedded, got %q", string(cluster.CertificateAuthorityData))
		}
		if cluster.InsecureSkipTLSVerify {
			t.Error("expected insecure-skip-tls-verify to be false when CA is present")
		}
	}

	authInfo, ok := config.AuthInfos["system:serviceaccount:ns:sa"]
	if !ok {
		t.Fatal("expected auth info keyed by the service account identity")
	}
	if authInfo.Token != "my-token" {
		t.Errorf("expected token %q, got %q", "my-token", authInfo.Token)
	}

	if config.CurrentContext == "" {
		t.Error("expected current-context to be set")
	}
	ctx, ok := config.Contexts[config.CurrentContext]
	if !ok {
		t.Fatal("current-context does not reference an existing context")
	}
	if ctx.Namespace != "ns" {
		t.Errorf("expected namespace %q, got %q", "ns", ctx.Namespace)
	}
}

func TestGenerateKubeConfigNoCA(t *testing.T) {
	h := newTestHandler(nil, nil)

	raw, err := h.generateKubeConfig("my-token", "user", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	config, err := clientcmd.Load(raw)
	if err != nil {
		t.Fatalf("generated kubeconfig is not parseable: %v", err)
	}
	for _, cluster := range config.Clusters {
		if !cluster.InsecureSkipTLSVerify {
			t.Error("expected insecure-skip-tls-verify to be true when no CA is present")
		}
	}
}

func TestHandleUser(t *testing.T) {
	h := newTestHandler(fake.NewSimpleClientset(), []byte(testCAData))

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/kubeconfig", strings.NewReader(`{"resourceType":"User"}`))
	h.Handle(&auth.User{Username: "alice", Token: "session-token"}, w, r)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	if cd := w.Header().Get("Content-Disposition"); !strings.Contains(cd, "kubeconfig") {
		t.Errorf("expected attachment content-disposition, got %q", cd)
	}

	config, err := clientcmd.Load(w.Body.Bytes())
	if err != nil {
		t.Fatalf("response is not a valid kubeconfig: %v", err)
	}
	authInfo, ok := config.AuthInfos["alice"]
	if !ok {
		t.Fatal("expected auth info keyed by the username")
	}
	if authInfo.Token != "session-token" {
		t.Errorf("expected the current session token to be embedded, got %q", authInfo.Token)
	}
}

func TestHandleServiceAccount(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "serviceaccounts", func(action k8stesting.Action) (bool, runtime.Object, error) {
		return true, &authenticationv1.TokenRequest{
			Status: authenticationv1.TokenRequestStatus{Token: "minted-sa-token"},
		}, nil
	})
	h := newTestHandler(client, []byte(testCAData))

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/kubeconfig", strings.NewReader(`{"resourceType":"ServiceAccount","name":"my-sa","namespace":"my-ns"}`))
	h.Handle(&auth.User{Username: "alice", Token: "session-token"}, w, r)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	config, err := clientcmd.Load(w.Body.Bytes())
	if err != nil {
		t.Fatalf("response is not a valid kubeconfig: %v", err)
	}
	authInfo, ok := config.AuthInfos["system:serviceaccount:my-ns:my-sa"]
	if !ok {
		t.Fatal("expected auth info keyed by the service account identity")
	}
	if authInfo.Token != "minted-sa-token" {
		t.Errorf("expected the minted bound token to be embedded, got %q", authInfo.Token)
	}
}

func TestHandleServiceAccountForbidden(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "serviceaccounts", func(action k8stesting.Action) (bool, runtime.Object, error) {
		return true, nil, apierrors.NewForbidden(schema.GroupResource{Resource: "serviceaccounts"}, "my-sa", nil)
	})
	h := newTestHandler(client, []byte(testCAData))

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/kubeconfig", strings.NewReader(`{"resourceType":"ServiceAccount","name":"my-sa","namespace":"my-ns"}`))
	h.Handle(&auth.User{Username: "alice", Token: "session-token"}, w, r)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d: %s", w.Code, w.Body.String())
	}
}

func TestHandleServiceAccountNotFound(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "serviceaccounts", func(action k8stesting.Action) (bool, runtime.Object, error) {
		return true, nil, apierrors.NewNotFound(schema.GroupResource{Resource: "serviceaccounts"}, "my-sa")
	})
	h := newTestHandler(client, []byte(testCAData))

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/kubeconfig", strings.NewReader(`{"resourceType":"ServiceAccount","name":"my-sa","namespace":"my-ns"}`))
	h.Handle(&auth.User{Username: "alice", Token: "session-token"}, w, r)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d: %s", w.Code, w.Body.String())
	}
}

func TestHandleServiceAccountUnauthorized(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "serviceaccounts", func(action k8stesting.Action) (bool, runtime.Object, error) {
		return true, nil, apierrors.NewUnauthorized("token expired")
	})
	h := newTestHandler(client, []byte(testCAData))

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/kubeconfig", strings.NewReader(`{"resourceType":"ServiceAccount","name":"my-sa","namespace":"my-ns"}`))
	h.Handle(&auth.User{Username: "alice", Token: "session-token"}, w, r)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d: %s", w.Code, w.Body.String())
	}
}

func TestHandleUserEmptyToken(t *testing.T) {
	h := newTestHandler(fake.NewSimpleClientset(), []byte(testCAData))

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/kubeconfig", strings.NewReader(`{"resourceType":"User"}`))
	h.Handle(&auth.User{Username: "alice", Token: ""}, w, r)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 when the current user has no session token, got %d: %s", w.Code, w.Body.String())
	}
}

func TestHandleServiceAccountMissingFields(t *testing.T) {
	h := newTestHandler(fake.NewSimpleClientset(), []byte(testCAData))

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/kubeconfig", strings.NewReader(`{"resourceType":"ServiceAccount","name":"my-sa"}`))
	h.Handle(&auth.User{Username: "alice", Token: "session-token"}, w, r)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", w.Code, w.Body.String())
	}
}

func TestHandleUnsupportedResourceType(t *testing.T) {
	h := newTestHandler(fake.NewSimpleClientset(), []byte(testCAData))

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/kubeconfig", strings.NewReader(`{"resourceType":"Secret","name":"x","namespace":"y"}`))
	h.Handle(&auth.User{Username: "alice", Token: "session-token"}, w, r)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", w.Code, w.Body.String())
	}
}

func TestHandleWrongMethod(t *testing.T) {
	h := newTestHandler(fake.NewSimpleClientset(), []byte(testCAData))

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/api/kubeconfig", nil)
	h.Handle(&auth.User{Username: "alice", Token: "session-token"}, w, r)

	if w.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d: %s", w.Code, w.Body.String())
	}
}

func TestResolveClusterCA(t *testing.T) {
	// Empty CA in, nil out (insecure fallback).
	if got := resolveClusterCA(testAPIServerURL, nil); got != nil {
		t.Errorf("expected nil for empty CA, got %q", string(got))
	}

	// Unparseable API server URL: nothing to verify against, embed CA as-is.
	if got := resolveClusterCA("", []byte(testCAData)); string(got) != testCAData {
		t.Errorf("expected CA to be returned unchanged for an unparseable URL, got %q", string(got))
	}

	// A well-formed URL paired with an unparseable CA bundle drops the CA before
	// any network dial, falling back to insecure.
	if got := resolveClusterCA(testAPIServerURL, []byte("not a pem certificate")); got != nil {
		t.Errorf("expected nil for an unparseable CA bundle, got %q", string(got))
	}
}

func TestClusterNameFromURL(t *testing.T) {
	tests := map[string]string{
		"https://api.test-cluster.example.com:6443": "api-test-cluster-example-com-6443",
		"":                      "cluster",
		"not a url with spaces": "cluster",
	}
	for input, want := range tests {
		if got := clusterNameFromURL(input); got != want {
			t.Errorf("clusterNameFromURL(%q) = %q, want %q", input, got, want)
		}
	}
}
