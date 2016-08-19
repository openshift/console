package server

import (
	"github.com/Sirupsen/logrus"
	"k8s.io/kubernetes/pkg/api"
	clientset "k8s.io/kubernetes/pkg/client/clientset_generated/release_1_3"
)

type k8sStatusChecker struct {
	logger *logrus.Entry
	cset   *clientset.Clientset
}

func NewK8sStatusChecker(logger *logrus.Entry, cset *clientset.Clientset) (*k8sStatusChecker, error) {
	return &k8sStatusChecker{
		logger: logger,
		cset:   cset,
	}, nil
}

func (k *k8sStatusChecker) Check() error {
	if _, err := k.cset.Core().Namespaces().List(api.ListOptions{}); err != nil {
		return err
	}

	return nil
}
