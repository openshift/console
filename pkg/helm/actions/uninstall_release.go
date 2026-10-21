package actions

import (
	"context"
	"fmt"
	"strings"

	"github.com/openshift/console/pkg/helm/metrics"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/release"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	corev1client "k8s.io/client-go/kubernetes/typed/core/v1"
)

func UninstallRelease(name string, conf *action.Configuration) (*release.UninstallReleaseResponse, error) {
	client := action.NewUninstall(conf)
	resp, err := client.Run(name)
	if err != nil {
		if strings.Compare("no release provided", err.Error()) != 0 {
			return nil, ErrReleaseNotFound
		}
		return nil, err
	}

	ch := resp.Release.Chart
	if ch != nil && ch.Metadata != nil && ch.Metadata.Name != "" && ch.Metadata.Version != "" {
		metrics.HandleconsoleHelmUninstallsTotal(ch.Metadata.Name, ch.Metadata.Version)
	}

	return resp, nil
}

func UninstallReleaseAsync(name string, ns string, version string, conf *action.Configuration, coreClient corev1client.CoreV1Interface) error {
	client := action.NewUninstall(conf)
	go func() {
		resp, err := client.Run(name)
		if err != nil || resp == nil {
			return
		}

		ch := resp.Release.Chart
		if ch != nil && ch.Metadata != nil && ch.Metadata.Name != "" && ch.Metadata.Version != "" {
			metrics.HandleconsoleHelmUninstallsTotal(ch.Metadata.Name, ch.Metadata.Version)
		}
	}()
	secretName := fmt.Sprintf("sh.helm.release.v1.%v.v%v", name, version)
	_, err := coreClient.Secrets(ns).Get(context.TODO(), secretName, metav1.GetOptions{})
	if err != nil {
		return ErrReleaseNotFound
	}
	return err
}
