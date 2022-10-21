package server

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/openshift/console/pkg/serverutils"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/rest"
	"k8s.io/klog"
)

func (s *Server) GetKubeVersion(cluster string) string {
	if s.KubeVersion != "" {
		return s.KubeVersion
	}
	config := &rest.Config{
		Host:      s.LocalK8sProxyConfig.Endpoint.String(),
		Transport: s.LocalK8sClient.Transport,
	}

	if cluster != serverutils.LocalClusterName {
		config = &rest.Config{
			Host: s.ManagedClusterProxyConfig.Endpoint.String(),
			Transport: &http.Transport{
				TLSClientConfig: s.ManagedClusterProxyConfig.TLSClientConfig,
			},
			APIPath: fmt.Sprintf("/%s", cluster),
		}
	}

	kubeVersion, err := kubeVersion(config)
	if err != nil {
		kubeVersion = ""
		klog.Warningf("Failed to get cluster k8s version from api server %s", err.Error())
	}
	s.KubeVersion = kubeVersion
	return s.KubeVersion
}

func kubeVersion(config *rest.Config) (string, error) {
	client, err := discovery.NewDiscoveryClientForConfig(config)
	if err != nil {
		return "", err
	}

	kubeVersion, err := client.ServerVersion()
	if err != nil {
		return "", err
	}

	if kubeVersion != nil {
		return kubeVersion.String(), nil
	}
	return "", errors.New("failed to get kubernetes version")
}
