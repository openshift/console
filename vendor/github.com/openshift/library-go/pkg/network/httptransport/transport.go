package httptransport

import (
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

// Config holds the transport config. It's public so that library users can create their own Option,
// e.g. load CA from a ConfigMap and return WithCAData.
type Config struct {
	basePoolSet        bool
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

// WithCAContentProvider adds a CA content provider to the transport's trust
// pool. The transport registers for provider notifications and rebuilds itself
// when the provider reports a change. It may be supplied multiple times; every
// provider's current bundle is added to the pool.
func WithCAContentProvider(provider dynamiccertificates.CAContentProvider) Option {
	return func(config *Config) error {
		config.caContentProviders = append(config.caContentProviders, provider)
		return nil
	}
}

// WithCAData adds certificates from PEM-encoded data to the transport's trust
// pool. Empty data is ignored. The name identifies the source in errors. It may
// be supplied multiple times; certificates are added to the pool.
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

// WithCAFile adds certificates from a PEM-encoded file to the transport's
// trust pool. An empty path is ignored. The file is read only during transport
// construction; use WithCAContentProvider for dynamically reloaded content. It
// may be supplied multiple times; certificates are added to the pool.
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

// WithCertPool uses a snapshot of pool as the base trust pool instead of the
// system certificate pool. A nil pool retains the default system trust pool.
// At most one WithCertPool option may be supplied.
func WithCertPool(pool *x509.CertPool) Option {
	return func(config *Config) error {
		if config.basePoolSet {
			return errors.New("WithCertPool may only be specified once")
		}
		config.basePoolSet = true
		if pool != nil {
			config.basePool = pool.Clone()
		}
		return nil
	}
}

// WithClientCertificateFile configures a client certificate from a PEM-encoded
// certificate file and private key file. Both paths must be supplied together.
// The files are read only during transport construction. This option may be
// supplied multiple times; certificates retain option order.
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

// WithProxyFunc explicitly configures proxy resolution. A nil function
// disables proxying altogether. If this option is omitted, the transport uses the standard
// proxy environment variables. It may be supplied multiple times; the last one wins.
func WithProxyFunc(proxyFunc func(*http.Request) (*url.URL, error)) Option {
	return func(config *Config) error {
		config.proxyConfigured = true
		config.proxyFunc = proxyFunc
		return nil
	}
}

// WithTLSMinVersion sets the minimum TLS version the transport offers.
func WithTLSMinVersion(version uint16) Option {
	return func(config *Config) error {
		if version == 0 {
			return errors.New("WithTLSMinVersion requires a non-zero TLS version")
		}
		config.tlsMinVersion = version
		return nil
	}
}

// WithTLSCipherSuites sets the cipher suites offered for TLS 1.2, 1.1, and 1.0 connection.
// TLS 1.3 suites are not configurable in crypto/tls.
func WithTLSCipherSuites(cipherSuites []uint16) Option {
	return func(config *Config) error {
		if len(cipherSuites) == 0 {
			return errors.New("WithTLSCipherSuites requires at least one cipher suite")
		}
		config.tlsCipherSuites = append([]uint16(nil), cipherSuites...)
		return nil
	}
}

// WithDisableHTTP2 restricts the transport to HTTP/1.1, including after CA reload.
// Use it when an HTTPS proxy advertises HTTP/2 but requires HTTP/1.1 CONNECT.
func WithDisableHTTP2() Option {
	return func(config *Config) error {
		config.disableHTTP2 = true
		return nil
	}
}

// NewRoundTripper constructs an outbound HTTP round tripper from the supplied
// options. By default, it trusts the system certificate pool, honors the
// standard proxy environment variables, and applies the OpenShift-wide TLS
// defaults (minimum version and cipher suites) from pkg/crypto.DefaultTLSVersion
// and pkg/crypto.DefaultCiphers.
//
// The concrete type of the returned http.RoundTripper is not part of the API.
// When no CA content provider is supplied it is a static *http.Transport; when
// one or more providers are supplied it is a wrapper that atomically rebuilds
// the underlying transport whenever a provider reports a change. The wrapper
// forwards CloseIdleConnections, so http.Client.CloseIdleConnections works in
// either case.
//
// Callers own the lifecycle of supplied CA content providers and must register
// all transports (by constructing them) before starting the dynamic providers,
// so no change notification is missed between construction and registration.
func NewRoundTripper(opts ...Option) (http.RoundTripper, error) {
	var config Config
	for i, option := range opts {
		if err := option(&config); err != nil {
			return nil, fmt.Errorf("applying transport option %d failed: %w", i, err)
		}
	}

	transport, err := config.newHTTPTransport()
	if err != nil {
		return nil, err
	}
	if len(config.caContentProviders) == 0 {
		return transport, nil
	}

	roundTripper := &dynamicTransport{config: &config}
	roundTripper.transport.Store(transport)

	for _, provider := range config.caContentProviders {
		provider.AddListener(roundTripper)
	}

	return roundTripper, nil
}

func (config *Config) newHTTPTransport() (*http.Transport, error) {
	rootCAs, err := config.newCertPool()
	if err != nil {
		return nil, err
	}

	tlsConfig := &tls.Config{
		RootCAs:      rootCAs,
		MinVersion:   libcrypto.DefaultTLSVersion(),
		CipherSuites: libcrypto.DefaultCiphers(),
	}
	if len(config.clientCertificates) > 0 {
		tlsConfig.Certificates = append([]tls.Certificate(nil), config.clientCertificates...)
	}
	if config.tlsMinVersion > 0 {
		tlsConfig.MinVersion = config.tlsMinVersion
	}
	if len(config.tlsCipherSuites) > 0 {
		tlsConfig.CipherSuites = append([]uint16(nil), config.tlsCipherSuites...)
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
