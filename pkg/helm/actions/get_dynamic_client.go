package actions

import (
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/rest"
)

func DynamicClient(conf *rest.Config) (dynamic.Interface, error) {
	client, err := dynamic.NewForConfig(conf)
	if err != nil {
		return nil, err
	}
	return client, nil
}
