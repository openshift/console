package server

import (
	"github.com/Sirupsen/logrus"
	apierrors "k8s.io/kubernetes/pkg/api/errors"
	v1 "k8s.io/kubernetes/pkg/api/v1"
	clientset "k8s.io/kubernetes/pkg/client/clientset_generated/release_1_3"
)

type k8sWriter struct {
	logger *logrus.Entry
	cset   *clientset.Clientset
}

func NewK8sWriter(logger *logrus.Entry, cset *clientset.Clientset) (*k8sWriter, error) {
	return &k8sWriter{
		logger: logger,
		cset:   cset,
	}, nil
}

func (k *k8sWriter) WriteNamespaces(namespaces []v1.Namespace) error {
	core := k.cset.Core()
	var gotErr error
	for _, ns := range namespaces {
		_, err := core.Namespaces().Create(&ns)
		if err != nil {
			if apierrors.IsAlreadyExists(err) {
				k.logger.WithField("Namespace", ns.Name).Info("Namespace already exists")
				continue
			}
			k.logger.WithError(err).Error("Error creating namespace")
			gotErr = err
		} else {
			k.logger.WithField("Namespace", ns.Name).Info("Created Namespace")
		}
	}
	return gotErr
}

func (k *k8sWriter) WriteConfigMaps(cMaps []v1.ConfigMap) error {
	core := k.cset.Core()
	var gotErr error
	for _, cm := range cMaps {
		_, err := core.ConfigMaps(cm.ObjectMeta.Namespace).Create(&cm)
		if err != nil {
			if apierrors.IsAlreadyExists(err) {
				k.logger.WithField("ConfigMap", cm.Name).Info("ConfigMap already exists")
				continue
			}
			k.logger.WithError(err).Error("Error creating config map")
			gotErr = err
		} else {
			k.logger.WithField("ConfigMap", cm.Name).Info("Created ConfigMap")
		}
	}
	return gotErr
}

func (k *k8sWriter) WriteSecrets(secrets []v1.Secret) error {
	core := k.cset.Core()
	var gotErr error
	for _, sc := range secrets {
		_, err := core.Secrets(sc.ObjectMeta.Namespace).Create(&sc)
		if err != nil {
			if apierrors.IsAlreadyExists(err) {
				k.logger.WithField("Secret", sc.Name).Info("Secret already exists")
				continue
			}
			k.logger.WithError(err).Error("Error creating secret")
			gotErr = err
		} else {
			k.logger.WithField("Secret", sc.Name).Info("Created Secret")
		}
	}
	return gotErr
}
