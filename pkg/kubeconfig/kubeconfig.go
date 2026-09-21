package kubeconfig

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"

	authenticationv1 "k8s.io/api/authentication/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
	"k8s.io/klog/v2"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/serverutils"
)

const (
	// resourceTypeServiceAccount downloads a kubeconfig for a ServiceAccount,
	// minting a bound token via the TokenRequest API.
	resourceTypeServiceAccount = "ServiceAccount"
	// resourceTypeUser downloads a kubeconfig for the currently logged-in user,
	// embedding the current session token.
	resourceTypeUser = "User"

	// defaultTokenExpirationSeconds is the default expiration for ServiceAccount
	// bound tokens minted via the TokenRequest API (1 hour).
	defaultTokenExpirationSeconds int64 = 3600

	// caVerifyTimeout bounds the one-time TLS handshake used to check whether the
	// provided cluster CA can verify the public API server's serving certificate.
	caVerifyTimeout = 5 * time.Second
)

// request is the JSON body accepted by the /api/kubeconfig endpoint.
type request struct {
	ResourceType string `json:"resourceType"`
	Name         string `json:"name"`
	Namespace    string `json:"namespace"`
}

// KubeConfigHandler serves downloadable kubeconfig files for ServiceAccounts
// and the currently logged-in user.
type KubeConfigHandler struct {
	// anonClientConfig is a rest.Config with no credentials. It is copied per
	// request and the user's bearer token is injected so that all API calls
	// (e.g. TokenRequest) are performed as the requesting user, which enforces
	// RBAC naturally.
	anonClientConfig *rest.Config
	// apiServerURL is the public/external Kubernetes API server URL embedded in
	// the generated kubeconfig's cluster entry.
	apiServerURL string
	// caData is the PEM-encoded CA bundle embedded in the generated kubeconfig.
	// When empty, the kubeconfig falls back to insecure-skip-tls-verify.
	caData []byte
	// tokenExpirationSeconds is the requested expiration for ServiceAccount
	// bound tokens.
	tokenExpirationSeconds int64

	// newClient builds a typed clientset authenticated with the given bearer
	// token. It is a field so tests can inject a fake clientset.
	newClient func(token string) (kubernetes.Interface, error)
}

// NewKubeConfigHandler creates a KubeConfigHandler. anonymousRoundTripper and
// k8sProxiedEndpoint are used to talk to the API server as the requesting user;
// apiServerURL and caData are embedded into the generated kubeconfig.
func NewKubeConfigHandler(anonymousRoundTripper http.RoundTripper, k8sProxiedEndpoint, apiServerURL string, caData []byte) *KubeConfigHandler {
	anonConfig := &rest.Config{
		Host:      k8sProxiedEndpoint,
		Transport: anonymousRoundTripper,
	}
	h := &KubeConfigHandler{
		anonClientConfig:       anonConfig,
		apiServerURL:           apiServerURL,
		caData:                 resolveClusterCA(apiServerURL, caData),
		tokenExpirationSeconds: defaultTokenExpirationSeconds,
	}
	h.newClient = func(token string) (kubernetes.Interface, error) {
		userConfig := rest.CopyConfig(anonConfig)
		userConfig.BearerToken = token
		return kubernetes.NewForConfig(userConfig)
	}
	return h
}

// Handle serves a downloadable kubeconfig for the requested resource.
func (h *KubeConfigHandler) Handle(user *auth.User, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", http.MethodPost)
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Unsupported method, supported methods are POST"})
		return
	}

	var req request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: fmt.Sprintf("Failed to parse request: %v", err)})
		return
	}

	var (
		token       string
		authInfoKey string
		namespace   string
		err         error
	)

	switch req.ResourceType {
	case resourceTypeServiceAccount:
		if req.Name == "" || req.Namespace == "" {
			serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: "name and namespace are required for a ServiceAccount kubeconfig"})
			return
		}
		token, err = h.requestServiceAccountToken(r.Context(), user, req.Namespace, req.Name)
		if err != nil {
			sendK8sError(w, "Failed to create ServiceAccount token", err)
			return
		}
		authInfoKey = fmt.Sprintf("system:serviceaccount:%s:%s", req.Namespace, req.Name)
		namespace = req.Namespace
	case resourceTypeUser:
		token = user.Token
		if token == "" {
			serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: "no session token is available for the current user; a User kubeconfig cannot be generated when authentication is disabled"})
			return
		}
		authInfoKey = user.Username
		if authInfoKey == "" {
			authInfoKey = "user"
		}
	default:
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: fmt.Sprintf("Unsupported resourceType %q, supported types are ServiceAccount and User", req.ResourceType)})
		return
	}

	kubeConfig, err := h.generateKubeConfig(token, authInfoKey, namespace)
	if err != nil {
		klog.Errorf("Failed to serialize kubeconfig: %v", err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: fmt.Sprintf("Failed to serialize kubeconfig: %v", err)})
		return
	}

	w.Header().Set("Content-Type", "application/yaml")
	w.Header().Set("Content-Disposition", `attachment; filename="kubeconfig"`)
	// The response embeds a bearer token; prevent any caching of the credential.
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusOK)
	if _, err := w.Write(kubeConfig); err != nil {
		klog.Errorf("Failed to write kubeconfig response: %v", err)
	}
}

// requestServiceAccountToken mints a bound token for the given ServiceAccount
// via the TokenRequest API, acting as the requesting user so that RBAC is
// enforced.
func (h *KubeConfigHandler) requestServiceAccountToken(ctx context.Context, user *auth.User, namespace, name string) (string, error) {
	client, err := h.newClient(user.Token)
	if err != nil {
		return "", err
	}

	expiration := h.tokenExpirationSeconds
	tokenRequest := &authenticationv1.TokenRequest{
		Spec: authenticationv1.TokenRequestSpec{
			ExpirationSeconds: &expiration,
		},
	}

	result, err := client.CoreV1().ServiceAccounts(namespace).CreateToken(ctx, name, tokenRequest, metav1.CreateOptions{})
	if err != nil {
		return "", err
	}
	return result.Status.Token, nil
}

// generateKubeConfig builds and serializes a kubeconfig using the client-go
// clientcmd/api types, guaranteeing a structurally valid file.
func (h *KubeConfigHandler) generateKubeConfig(token, authInfoKey, namespace string) ([]byte, error) {
	clusterName := clusterNameFromURL(h.apiServerURL)
	contextName := fmt.Sprintf("%s/%s", clusterName, authInfoKey)

	cluster := clientcmdapi.NewCluster()
	cluster.Server = h.apiServerURL
	if len(h.caData) > 0 {
		cluster.CertificateAuthorityData = h.caData
	} else {
		cluster.InsecureSkipTLSVerify = true
	}

	authInfo := clientcmdapi.NewAuthInfo()
	authInfo.Token = token

	kubeContext := clientcmdapi.NewContext()
	kubeContext.Cluster = clusterName
	kubeContext.AuthInfo = authInfoKey
	if namespace != "" {
		kubeContext.Namespace = namespace
	}

	config := clientcmdapi.NewConfig()
	config.Clusters[clusterName] = cluster
	config.AuthInfos[authInfoKey] = authInfo
	config.Contexts[contextName] = kubeContext
	config.CurrentContext = contextName

	return clientcmd.Write(*config)
}

// resolveClusterCA returns the CA bundle to embed in generated kubeconfigs.
//
// The CA handed to the console is the in-cluster API server CA, which signs the
// internal kubernetes.default.svc endpoint. Generated kubeconfigs, however,
// point at the external/public API server URL, whose serving certificate may be
// signed by a different CA (e.g. a custom certificate configured via
// APIServer.spec.servingCerts.namedCertificates). Embedding a CA that cannot
// verify the public endpoint would produce a silently broken kubeconfig, so we
// verify the CA against the public endpoint once at startup: if verification
// fails with a certificate error, we drop the CA and fall back to
// insecure-skip-tls-verify. A network/connection error is treated as
// inconclusive and the CA is kept, since a transient failure to reach the API
// server at startup should not weaken every generated kubeconfig.
func resolveClusterCA(apiServerURL string, caData []byte) []byte {
	if len(caData) == 0 {
		return nil
	}

	parsed, err := url.Parse(apiServerURL)
	if err != nil || parsed.Host == "" {
		// Can't determine what to verify against; embed the CA as-is.
		return caData
	}

	pool := x509.NewCertPool()
	if !pool.AppendCertsFromPEM(caData) {
		klog.Warning("kubeconfig: cluster CA bundle could not be parsed; falling back to insecure-skip-tls-verify")
		return nil
	}

	host := parsed.Host
	if parsed.Port() == "" {
		host = net.JoinHostPort(host, "443")
	}

	conn, err := tls.DialWithDialer(
		&net.Dialer{Timeout: caVerifyTimeout},
		"tcp",
		host,
		&tls.Config{RootCAs: pool, ServerName: parsed.Hostname()},
	)
	if err != nil {
		var unknownAuthority x509.UnknownAuthorityError
		var hostnameErr x509.HostnameError
		var invalidCert x509.CertificateInvalidError
		if errors.As(err, &unknownAuthority) || errors.As(err, &hostnameErr) || errors.As(err, &invalidCert) {
			klog.Warningf("kubeconfig: cluster CA does not verify the public API server %q (%v); falling back to insecure-skip-tls-verify", apiServerURL, err)
			return nil
		}
		klog.Warningf("kubeconfig: could not verify cluster CA against %q (%v); embedding CA anyway", apiServerURL, err)
		return caData
	}
	conn.Close()
	return caData
}

// clusterNameFromURL derives a stable, human-readable cluster name from the API
// server URL, matching the convention used by `oc login` generated kubeconfigs.
func clusterNameFromURL(apiServerURL string) string {
	parsed, err := url.Parse(apiServerURL)
	if err != nil || parsed.Host == "" {
		return "cluster"
	}
	host := strings.ReplaceAll(parsed.Host, ".", "-")
	host = strings.ReplaceAll(host, ":", "-")
	return host
}

// sendK8sError maps a Kubernetes API error to an appropriate HTTP status code.
func sendK8sError(w http.ResponseWriter, msg string, err error) {
	errMsg := fmt.Sprintf("%s: %v", msg, err)
	klog.Errorf("%s", errMsg)
	code := http.StatusBadGateway
	switch {
	case apierrors.IsForbidden(err):
		code = http.StatusForbidden
	case apierrors.IsNotFound(err):
		code = http.StatusNotFound
	case apierrors.IsUnauthorized(err):
		code = http.StatusUnauthorized
	}
	serverutils.SendResponse(w, code, serverutils.ApiError{Err: errMsg})
}
