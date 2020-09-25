package server

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func createTypeMeta(kind string, APIVersion string) metav1.TypeMeta {
	return metav1.TypeMeta{
		Kind:       kind,
		APIVersion: APIVersion,
	}
}

func createObjectMeta(name, namespace string, labels, annotations map[string]string) metav1.ObjectMeta {

	objectMeta := metav1.ObjectMeta{
		Name:        name,
		Namespace:   namespace,
		Labels:      labels,
		Annotations: annotations,
	}

	return objectMeta
}

func addmap(a map[string]string, b map[string]string) map[string]string {
	for k, v := range b {
		a[k] = v
	}

	return a
}
