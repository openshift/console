package terminal

import (
	"context"
	"errors"
	k8sErrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

var (
	OperatorAPISubscriptionResource = &schema.GroupVersionResource{
		Group:    "operators.coreos.com",
		Version:  "v1alpha1",
		Resource: "subscriptions",
	}

	OperatorGroupVersion = &schema.GroupVersion{
		Group:   "operators.coreos.com",
		Version: "v1alpha1",
	}
)

const (
	webhookName             = "controller.devfile.io"
	webTerminalOperatorName = "web-terminal"
)

// checkWebTerminalOperatorIsRunning checks if the workspace operator is running and webhooks are enabled,
// which is a prerequisite for sending a user's token to a workspace.
func checkWebTerminalOperatorIsRunning() (bool, error) {
	config, err := rest.InClusterConfig()
	if err != nil {
		return false, err
	}
	client, err := kubernetes.NewForConfig(config)
	if err != nil {
		return false, err
	}

	_, err = client.AdmissionregistrationV1().MutatingWebhookConfigurations().Get(context.TODO(), webhookName, metav1.GetOptions{})
	if err != nil {
		if k8sErrors.IsNotFound(err) {
			return false, nil
		}
		return false, err
	}

	_, err = client.AdmissionregistrationV1().ValidatingWebhookConfigurations().Get(context.TODO(), webhookName, metav1.GetOptions{})
	if err != nil {
		if k8sErrors.IsNotFound(err) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

// checkWebTerminalOperatorIsInstalled checks to see that a web-terminal-operator is installed on the cluster
func checkWebTerminalOperatorIsInstalled() (bool, error) {

	_, err := GetWebTerminalSubscriptions()
	if err != nil {
		// Web Terminal subscription is not found but it's technically not a real error so we don't want to propogate it. Just say that the operator is not installed
		if k8sErrors.IsNotFound(err) {
			return false, nil
		}

		return false, err
	}
	return true, nil
}

func GetWebTerminalSubscriptions() (*unstructured.UnstructuredList, error) {
	config, err := rest.InClusterConfig()
	if err != nil {
		return nil, err
	}

	config.GroupVersion = OperatorGroupVersion
	config.APIPath = "apis"

	client, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, err
	}
	subs, err := client.Resource(*OperatorAPISubscriptionResource).List(context.TODO(), metav1.ListOptions{
		FieldSelector: "metadata.name=" + webTerminalOperatorName,
	})
	if err != nil {
		return subs, err
	}
	return subs, err
}

func GetWebTerminalNamespace(subs *unstructured.UnstructuredList) (string, error) {
	if len(subs.Items) > 1 {
		return "", errors.New("found multiple subscriptions for web-terminal when only one should be found")
	}

	webTerminalSubscription := subs.Items[0]
	namespace := webTerminalSubscription.GetNamespace()

	return namespace, nil
}
