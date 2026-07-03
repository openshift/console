package actions

import (
	"context"
	"fmt"
	"strings"

	"github.com/openshift/console/pkg/helm/metrics"
	"helm.sh/helm/v4/pkg/action"
	"helm.sh/helm/v4/pkg/kube"
	releasecommon "helm.sh/helm/v4/pkg/release"
	releaseV1 "helm.sh/helm/v4/pkg/release/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	corev1client "k8s.io/client-go/kubernetes/typed/core/v1"
	"k8s.io/klog/v2"
)

func UninstallRelease(name string, conf *action.Configuration) (*releasecommon.UninstallReleaseResponse, error) {
	client := action.NewUninstall(conf)
	client.WaitStrategy = kube.LegacyStrategy
	resp, err := client.Run(name)
	if err != nil {
		if strings.Compare("no release provided", err.Error()) != 0 {
			return nil, ErrReleaseNotFound
		}
		return nil, err
	}

	if rel, ok := resp.Release.(*releaseV1.Release); ok && rel != nil {
		ch := rel.Chart
		if ch != nil && ch.Metadata != nil && ch.Metadata.Name != "" && ch.Metadata.Version != "" {
			metrics.HandleconsoleHelmUninstallsTotal(ch.Metadata.Name, ch.Metadata.Version)
		}
	}

	return resp, nil
}

func UninstallReleaseAsync(name string, ns string, version string, conf *action.Configuration, coreClient corev1client.CoreV1Interface) error {
	client := action.NewUninstall(conf)
	client.WaitStrategy = kube.LegacyStrategy
	go func() {
		resp, err := client.Run(name)
		if err != nil {
			klog.Errorf("Failed to uninstall helm release %s/%s: %v", ns, name, err)
			return
		}
		if resp == nil {
			return
		}
		if rel, ok := resp.Release.(*releaseV1.Release); ok && rel != nil {
			ch := rel.Chart
			if ch != nil && ch.Metadata != nil && ch.Metadata.Name != "" && ch.Metadata.Version != "" {
				metrics.HandleconsoleHelmUninstallsTotal(ch.Metadata.Name, ch.Metadata.Version)
			}
		}
	}()
	secretName := fmt.Sprintf("sh.helm.release.v1.%v.v%v", name, version)
	_, err := coreClient.Secrets(ns).Get(context.TODO(), secretName, metav1.GetOptions{})
	if err != nil {
		return ErrReleaseNotFound
	}
	return err
}
