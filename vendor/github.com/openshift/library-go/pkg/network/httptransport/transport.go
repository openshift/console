package httptransport

import (
	"cmp"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"
	"net/http"
	"net/url"

	utilnet "k8s.io/apimachinery/pkg/util/net"
	"k8s.io/apiserver/pkg/server/dynamiccertificates"
	clientcert "k8s.io/client-go/util/cert"

	libcrypto "github.com/openshift/library-go/pkg/crypto"
)

// Option configures an outbound HTTP transport.
type Option func(*Config) error

// Config holds the transport config. It has no exported fields; it's public so that library users
// can write their own Option by composing the existing ones, e.g. to load a CA bundle from a ConfigMap:
//
//	func WithConfigMapCA(configMap *corev1.ConfigMap) httptransport.Option {
//		return func(config *httptransport.Config) error {
//			return httptransport.WithCAData(configMap.Name, []byte(configMap.Data["ca-bundle.crt"]))(config)
//		}
//	}
type Config struct {
	basePool           *x509.CertPool
	staticCAs          [][]*x509.Certificate
	caContentProviders []dynamiccertificates.CAContentProvider
	clientCertificates []tls.Certificate
	proxyConfigured    bool
	proxyFunc          func(*http.Request) (*url.URL, error)
	disableHTTP2       bool
	tlsMinVersion      uint16
	tlsCipherSuites    []uint16
}

// WithCAContentProvider adds a CA content provider to the transport's trust pool.
// The transport registers for provider notifications and rebuilds itself
// when the provider reports a change. It may be supplied multiple times.
//
// The provider content must be PEM-encoded certificates; empty content is ignored.
// Invalid content fails NewRoundTripper, while invalid content seen on a later
// rebuild is logged and the previous transport is kept.
//
// The transport can't unregister from the provider, so it stays reachable for as
// long as the provider does. Build one round tripper and share it rather than
// building one per client or request.
//
// AddListener on the dynamiccertificates providers (e.g. DynamicFileCAContent,
// ConfigMapCAController) races with a provider that is already running. Call
// NewRoundTripper before starting the provider's Run.
func WithCAContentProvider(provider dynamiccertificates.CAContentProvider) Option {
	return func(config *Config) error {
		if provider == nil {
			return errors.New("CA content provider must not be nil")
		}
		config.caContentProviders = append(config.caContentProviders, provider)
		return nil
	}
}

// WithCAData adds certificates from PEM-encoded data to the transport's trust pool.
// Empty data is ignored. It may be supplied multiple times.
func WithCAData(name string, pemData []byte) Option {
	return func(config *Config) error {
		if len(pemData) == 0 {
			return nil
		}

		certificates, err := clientcert.ParseCertsPEM(pemData)
		if err != nil {
			return fmt.Errorf("failed to parse CA certificates from %q: %w", name, err)
		}
		config.staticCAs = append(config.staticCAs, certificates)
		return nil
	}
}

// WithCAFile adds certificates from a PEM-encoded file to the transport's trust pool.
// An empty path is ignored. It may be supplied multiple times.
//
// The file is read only during transport construction; use WithCAContentProvider for dynamically reloaded content.
func WithCAFile(name, path string) Option {
	return func(config *Config) error {
		if len(path) == 0 {
			return nil
		}

		certificates, err := clientcert.CertsFromFile(path)
		if err != nil {
			return fmt.Errorf("failed to load CA certificates from %q at %q: %w", name, path, err)
		}
		config.staticCAs = append(config.staticCAs, certificates)
		return nil
	}
}

// WithCertPool uses a snapshot of pool as the base trust pool instead of the system certificate pool.
// A nil pool retains the default system trust pool. It may be supplied multiple times; the last one wins.
func WithCertPool(pool *x509.CertPool) Option {
	return func(config *Config) error {
		if pool != nil {
			config.basePool = pool.Clone()
		} else {
			config.basePool = nil
		}
		return nil
	}
}

// WithClientCertificateFile configures a client certificate from a PEM-encoded certificate file and private key file.
// The files are read only during transport construction. This option may be supplied multiple times;
// crypto/tls then presents the first certificate accepted by the server's certificate request.
func WithClientCertificateFile(certFile, keyFile string) Option {
	return func(config *Config) error {
		if (len(certFile) == 0) != (len(keyFile) == 0) {
			return errors.New("certFile and keyFile must be specified together")
		}
		if len(certFile) == 0 {
			return nil
		}

		certificate, err := tls.LoadX509KeyPair(certFile, keyFile)
		if err != nil {
			return fmt.Errorf("failed to load client certificate from %q and key from %q: %w", certFile, keyFile, err)
		}
		config.clientCertificates = append(config.clientCertificates, certificate)
		return nil
	}
}

// WithProxyFunc configures proxy resolution. A nil function disables proxying altogether.
// If this option is omitted, the transport uses the standard proxy environment variables.
// It may be supplied multiple times; the last one wins.
func WithProxyFunc(proxyFunc func(*http.Request) (*url.URL, error)) Option {
	return func(config *Config) error {
		config.proxyConfigured = true
		config.proxyFunc = proxyFunc
		return nil
	}
}

// WithTLSMinVersion sets the minimum TLS version the transport offers.
// It may be supplied multiple times; the last one wins.
func WithTLSMinVersion(version uint16) Option {
	return func(config *Config) error {
		if version == 0 {
			return errors.New("WithTLSMinVersion requires a non-zero TLS version")
		}
		config.tlsMinVersion = version
		return nil
	}
}

// WithTLSCipherSuites sets the cipher suites offered for TLS 1.2, 1.1, and 1.0 connections.
// TLS 1.3 suites are not configurable in crypto/tls. It may be supplied multiple times; the last one wins.
func WithTLSCipherSuites(cipherSuites []uint16) Option {
	return func(config *Config) error {
		if len(cipherSuites) == 0 {
			return errors.New("WithTLSCipherSuites requires at least one cipher suite")
		}
		config.tlsCipherSuites = append([]uint16(nil), cipherSuites...)
		return nil
	}
}

// WithDisabledHTTP2 restricts the transport to HTTP/1.1, including after CA reload.
// Use it when an HTTPS proxy advertises HTTP/2 but requires HTTP/1.1 CONNECT.
func WithDisabledHTTP2() Option {
	return func(config *Config) error {
		config.disableHTTP2 = true
		return nil
	}
}

// NewRoundTripper constructs an outbound HTTP round tripper from the supplied
// options. By default, it trusts the system certificate pool, honors the
// standard proxy environment variables (NO_PROXY may contain CIDRs), and applies
// the OpenShift-wide TLS defaults (minimum version and cipher suites) from
// pkg/crypto.DefaultTLSVersion and pkg/crypto.DefaultCiphers. Other transport
// defaults come from k8s.io/apimachinery/pkg/util/net.SetTransportDefaults,
// including its DISABLE_HTTP2, HTTP2_READ_IDLE_TIMEOUT_SECONDS and
// HTTP2_PING_TIMEOUT_SECONDS environment variables.
//
// A rebuild after a CA change affects new connections only. Idle connections
// of the replaced transport are closed, but connections in use, e.g. long-running
// HTTP/2 streams, keep the trust they were established with until they close.
//
// The concrete type of the returned http.RoundTripper is not part of the API.
// When no CA content provider is supplied it is a static *http.Transport; when
// one or more providers are supplied it is a wrapper that atomically rebuilds
// the underlying transport whenever a provider reports a change. The wrapper
// forwards only RoundTrip and CloseIdleConnections, so
// http.Client.CloseIdleConnections works in either case, but a type assertion
// to *http.Transport fails for the wrapper. Callers must not rely on one.
func NewRoundTripper(opts ...Option) (http.RoundTripper, error) {
	var config Config
	for i, option := range opts {
		if err := option(&config); err != nil {
			return nil, fmt.Errorf("applying transport option %d failed: %w", i, err)
		}
	}

	if len(config.caContentProviders) == 0 {
		return config.newHTTPTransport()
	}

	roundTripper := &dynamicTransport{config: &config}

	// Build once before registering, so that invalid configuration fails here
	// without leaving a listener registered on the providers (they have no way
	// to remove it). Publishing this transport before registering also
	// guarantees that RoundTrip always has one to use.
	transport, err := config.newHTTPTransport()
	if err != nil {
		return nil, err
	}
	roundTripper.transport.Store(transport)

	// TODO: Drop the WithCAContentProvider note about calling NewRoundTripper
	// before the provider runs once https://github.com/kubernetes/kubernetes/pull/144118
	// is vendored.
	for _, provider := range config.caContentProviders {
		provider.AddListener(roundTripper)
	}

	// Rebuild after the providers are registered, otherwise we can potentially
	// lose change events that happened since the build above. This goes through
	// the same locked path as asynchronous rebuilds, so it cannot overwrite a
	// transport built from fresher content. If it fails, the transport built
	// above is retained.
	roundTripper.rebuild()
	return roundTripper, nil
}

func (config *Config) newHTTPTransport() (*http.Transport, error) {
	rootCAs, err := config.newCertPool()
	if err != nil {
		return nil, err
	}

	// The slices taken from config are never modified after the options are
	// applied, so the transports can share them.
	tlsConfig := &tls.Config{
		RootCAs:      rootCAs,
		Certificates: config.clientCertificates,
		MinVersion:   cmp.Or(config.tlsMinVersion, libcrypto.DefaultTLSVersion()),
		CipherSuites: config.tlsCipherSuites,
	}
	if len(tlsConfig.CipherSuites) == 0 {
		tlsConfig.CipherSuites = libcrypto.DefaultCiphers()
	}

	if config.disableHTTP2 {
		tlsConfig.NextProtos = []string{"http/1.1"}
	}

	transport := utilnet.SetTransportDefaults(&http.Transport{TLSClientConfig: tlsConfig})
	if config.proxyConfigured {
		transport.Proxy = config.proxyFunc
	}
	return transport, nil
}

func (config *Config) newCertPool() (*x509.CertPool, error) {
	var rootCAs *x509.CertPool
	if config.basePool != nil {
		rootCAs = config.basePool.Clone()
	} else {
		var err error
		rootCAs, err = x509.SystemCertPool()
		if err != nil {
			return nil, fmt.Errorf("loading system certificate pool failed: %w", err)
		}
		if rootCAs == nil {
			rootCAs = x509.NewCertPool()
		}
	}

	for _, certificates := range config.staticCAs {
		for _, certificate := range certificates {
			rootCAs.AddCert(certificate)
		}
	}

	for _, provider := range config.caContentProviders {
		content := provider.CurrentCABundleContent()
		if len(content) == 0 {
			continue
		}

		certificates, err := clientcert.ParseCertsPEM(content)
		if err != nil {
			return nil, fmt.Errorf("failed to parse CA content from provider %q: %w", provider.Name(), err)
		}

		for _, certificate := range certificates {
			rootCAs.AddCert(certificate)
		}
	}

	return rootCAs, nil
}
