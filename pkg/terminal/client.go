package terminal

import (
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

// createDynamicClient create dynamic client with the configured token to be used
func (p *Proxy) createDynamicClient(token string) (dynamic.Interface, error) {
	var tlsClientConfig rest.TLSClientConfig
	if p.TLSClientConfig.InsecureSkipVerify {
		// off-cluster mode
		tlsClientConfig.Insecure = true
	} else {
		inCluster, err := rest.InClusterConfig()
		if err != nil {
			return nil, err
		}
		tlsClientConfig = inCluster.TLSClientConfig
	}

	config := &rest.Config{
		Host:            p.ClusterEndpoint.Host,
		TLSClientConfig: tlsClientConfig,
		BearerToken:     token,
	}

	client, err := dynamic.NewForConfig(dynamic.ConfigFor(config))
	if err != nil {
		return nil, err
	}
	return client, nil
}

func (p *Proxy) createTypedClient(token string) (*kubernetes.Clientset, error) {
	var tlsClientConfig rest.TLSClientConfig
	if p.TLSClientConfig.InsecureSkipVerify {
		// off-cluster mode
		tlsClientConfig.Insecure = true
	} else {
		inCluster, err := rest.InClusterConfig()
		if err != nil {
			return nil, err
		}
		tlsClientConfig = inCluster.TLSClientConfig
	}

	config := &rest.Config{
		Host:            p.ClusterEndpoint.Host,
		TLSClientConfig: tlsClientConfig,
		BearerToken:     token,
	}

	return kubernetes.NewForConfig(config)
}