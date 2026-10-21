package handlers

import (
	"fmt"

	"helm.sh/helm/v3/pkg/action"
	"k8s.io/client-go/dynamic"
	corev1client "k8s.io/client-go/kubernetes/typed/core/v1"
)

type HandlerClients struct {
	DynamicClient dynamic.Interface
	CoreClient    *corev1client.CoreV1Client
}

func NewHandlerClients(conf *action.Configuration) (*HandlerClients, error) {
	restConfig, err := conf.RESTClientGetter.ToRESTConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to get REST config: %w", err)
	}
	dynamicClient, err := dynamic.NewForConfig(restConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to get dynamic client: %w", err)
	}
	coreClient, err := corev1client.NewForConfig(restConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to get core client: %w", err)
	}
	return &HandlerClients{
		DynamicClient: dynamicClient,
		CoreClient:    coreClient,
	}, nil

}
