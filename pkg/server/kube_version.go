package server

import (
	"errors"

	"k8s.io/client-go/discovery"
	"k8s.io/client-go/rest"
	"k8s.io/klog"
)

func (s *Server) GetKubeVersion(cluster string) string {
	if s.KubeVersion != "" {
		return s.KubeVersion
	}
	config := &rest.Config{
		Host:      s.K8sProxyConfigs[cluster].Endpoint.String(),
		Transport: s.K8sClients[cluster].Transport,
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
