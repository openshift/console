package terminal

import (
	"context"

	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

const (
	webhookName = "controller.devfile.io"
)

// workspaceOperatorIsRunning checks if the workspace operator is running and webhooks are enabled,
// which is a prerequisite for sending a user's token to a workspace.
func workspaceOperatorIsRunning() (bool, error) {
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
