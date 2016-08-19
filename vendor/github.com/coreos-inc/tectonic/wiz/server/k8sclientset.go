package server

import (
	"path"

	"github.com/Sirupsen/logrus"
	clientset "k8s.io/kubernetes/pkg/client/clientset_generated/release_1_3"
	"k8s.io/kubernetes/pkg/client/restclient"
)

func NewK8sInClusterClientset(logger *logrus.Entry) (*clientset.Clientset, error) {
	clientConfig, err := restclient.InClusterConfig()
	if err != nil {
		return nil, err
	}

	cset, err := clientset.NewForConfig(clientConfig)
	if err != nil {
		logger.WithError(err).Error("Error creating k8s ClientSet")
		return nil, err
	}

	return cset, nil
}

func NewK8sOffClusterClientset(host, credsDir string, logger *logrus.Entry) (*clientset.Clientset, error) {
	clientConfig := &restclient.Config{
		Host: host,
		TLSClientConfig: restclient.TLSClientConfig{
			CertFile: path.Join(credsDir, "admin.pem"),
			KeyFile:  path.Join(credsDir, "admin-key.pem"),
			CAFile:   path.Join(credsDir, "ca.pem"),
		},
	}

	if err := restclient.LoadTLSFiles(clientConfig); err != nil {
		logger.WithError(err).Error("Error loading TLS assets")
		return nil, err
	}

	cset, err := clientset.NewForConfig(clientConfig)
	if err != nil {
		logger.WithError(err).Error("Error creating k8s ClientSet")
		return nil, err
	}

	return cset, nil
}
