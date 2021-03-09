package terminal

import (
	"context"

	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

var (
	OperatorAPIResource = &schema.GroupVersionResource{
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
	operatorsNamespace      = "openshift-operators"
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
		if errors.IsNotFound(err) {
			return false, nil
		}
		return false, err
	}

	_, err = client.AdmissionregistrationV1().ValidatingWebhookConfigurations().Get(context.TODO(), webhookName, metav1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

// checkWebTerminalOperatorIsInstalled checks to see that a web-terminal-operator is installed on the cluster
func checkWebTerminalOperatorIsInstalled() (bool, error) {
	config, err := rest.InClusterConfig()
	if err != nil {
		return false, err
	}

	config.GroupVersion = OperatorGroupVersion
	config.APIPath = "apis"

	client, err := dynamic.NewForConfig(config)
	if err != nil {
		return false, err
	}

	_, err = client.Resource(*OperatorAPIResource).Namespace(operatorsNamespace).Get(context.TODO(), webTerminalOperatorName, metav1.GetOptions{})
	if err != nil {
		// Web Terminal subscription is not found but it's technically not a real error so we don't want to propogate it. Just say that the operator is not installed
		if errors.IsNotFound(err) {
			return false, nil
		}

		return false, err
	}

	return true, nil
}
