package handlers

import (
	"helm.sh/helm/v3/pkg/action"
	"k8s.io/client-go/dynamic"
	corev1client "k8s.io/client-go/kubernetes/typed/core/v1"
	"k8s.io/client-go/rest"
)

func DynamicClient(conf *rest.Config) (dynamic.Interface, error) {
	client, err := dynamic.NewForConfig(conf)
	if err != nil {
		return nil, err
	}
	return client, nil
}

func NewCoreClient(conf *action.Configuration) (*corev1client.CoreV1Client, error) {
	restConfig, err := conf.RESTClientGetter.ToRESTConfig()
	if err != nil {
		return nil, err
	}
	return corev1client.NewForConfig(restConfig)
}
