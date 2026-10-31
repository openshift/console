package terminal

import (
	"net/http"

	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

// createDynamicClient create dynamic client with the configured token to be used
func (p *Proxy) createDynamicClient(token string) (dynamic.Interface, error) {
	config, err := p.getConfig(token)
	if err != nil {
		return nil, err
	}

	client, err := dynamic.NewForConfig(dynamic.ConfigFor(config))
	if err != nil {
		return nil, err
	}
	return client, nil
}

func (p *Proxy) createTypedClient(token string) (*kubernetes.Clientset, error) {
	config, err := p.getConfig(token)
	if err != nil {
		return nil, err
	}

	return kubernetes.NewForConfig(config)
}

func (p *Proxy) getConfig(token string) (*rest.Config, error) {
	// p.TLSClientConfig already carries the correct trust for the current
	// mode (in-cluster service-account CA, or the off-cluster -ca-file /
	// -k8s-mode-off-cluster-skip-verify-tls setting). Passing it via
	// Transport, rather than re-deriving TLSClientConfig from
	// rest.InClusterConfig(), keeps that trust instead of discarding it
	// (rest.InClusterConfig() also fails outright when running off-cluster).
	return &rest.Config{
		// Keep the scheme: client-go defaults a scheme-less host to http://
		// when the rest.Config itself carries no CA data or Insecure flag.
		Host:        p.ClusterEndpoint.String(),
		Transport:   p.clusterTransport(),
		BearerToken: token,
	}, nil
}

// clusterTransport builds (once) and returns the shared http.Transport for
// the terminal's k8s clients. It depends only on the proxy's TLS config,
// which is constant for the proxy's lifetime, and never on the per-request
// bearer token, so a single transport — and with it a single connection
// pool — is shared across requests and clients; building one per request
// would break client transport caching and connection reuse.
func (p *Proxy) clusterTransport() *http.Transport {
	p.transportOnce.Do(func() {
		p.transport = &http.Transport{
			TLSClientConfig: p.TLSClientConfig,
			// Honor HTTP(S)_PROXY/NO_PROXY like the other off-cluster
			// transports (pkg/proxy NewProxy, the plugins asset client),
			// so the terminal also works behind an egress proxy.
			// Deployments that set HTTP_PROXY to a tunnel into another
			// network (e.g. the HyperShift control-plane-side bridge,
			// whose HTTP_PROXY is a konnectivity socks5 tunnel into the
			// guest service network) must NO_PROXY the API server host —
			// which they already need for the k8s proxy transport, since
			// it resolves the same endpoint through the same env vars.
			Proxy: http.ProxyFromEnvironment,
		}
	})
	return p.transport
}
