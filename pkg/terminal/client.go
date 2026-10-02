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
		Host:        p.ClusterEndpoint.Host,
		Transport:   &http.Transport{TLSClientConfig: p.TLSClientConfig},
		BearerToken: token,
	}, nil
}
