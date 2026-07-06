package actions

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/openshift/api/helm/v1beta1"
	"github.com/openshift/console/pkg/helm/metrics"
	"helm.sh/helm/v4/pkg/action"
	helmchart "helm.sh/helm/v4/pkg/chart"
	chart "helm.sh/helm/v4/pkg/chart/v2"
	"helm.sh/helm/v4/pkg/chart/v2/loader"
	"helm.sh/helm/v4/pkg/kube"
	releasev1 "helm.sh/helm/v4/pkg/release/v1"
	kv1 "k8s.io/api/core/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/dynamic"
	corev1client "k8s.io/client-go/kubernetes/typed/core/v1"
)

func UpgradeRelease(
	releaseNamespace string,
	releaseName string,
	chartUrl string,
	vals map[string]interface{},
	conf *action.Configuration,
	dynamicClient dynamic.Interface,
	coreClient corev1client.CoreV1Interface,
	fileCleanUp bool,
	indexEntry string,
) (*releasev1.Release, error) {
	client := action.NewUpgrade(conf)
	client.ServerSideApply = "false"
	client.WaitStrategy = kube.HookOnlyStrategy
	client.Namespace = releaseNamespace
	var ch *chart.Chart
	var cp, chartLocation string
	var chartInfo *ChartInfo

	rel, err := GetRelease(releaseName, conf)
	if err != nil {
		// if there is no release exist then return generic error
		if strings.Contains(err.Error(), "no revision for release") {
			return nil, ErrReleaseRevisionNotFound
		}
		return nil, err
	}

	// Before proceeding, check if chart URL is present as an annotation
	if rel.Chart.Metadata.Annotations != nil {
		if chart_url, ok := rel.Chart.Metadata.Annotations["chart_url"]; chartUrl == "" && ok {
			chartUrl = chart_url
		}
	}

	var tlsFiles []*os.File
	// if url is not provided then we expect user trying to upgrade release with the same
	// version of chart but with the different values
	if chartUrl == "" {
		ch = rel.Chart
	} else {
		if indexEntry == "" || releaseNamespace == "" {
			chartInfo, err = getChartInfoFromChartUrl(chartUrl, releaseNamespace, dynamicClient, coreClient)
			if err != nil {
				return nil, err
			}
		} else {
			chartInfo = getChartInfoFromIndexEntry(indexEntry, releaseNamespace, chartUrl)
		}

		if chartInfo.RepositoryName != "" {
			connectionConfig, isClusterScoped, err := getRepositoryConnectionConfig(chartInfo.RepositoryName, releaseNamespace, dynamicClient)
			if err != nil {
				return nil, err
			}
			if isClusterScoped {
				clusterConnectionConfig := connectionConfig.(v1beta1.ConnectionConfig)
				tlsFiles, err = setUpAuthentication(&client.ChartPathOptions, &clusterConnectionConfig, coreClient)
				if err != nil {
					return nil, fmt.Errorf("error setting up authentication: %v", err)
				}
			} else {
				namespaceConnectionConfig := connectionConfig.(v1beta1.ConnectionConfigNamespaceScoped)
				tlsFiles, err = setUpAuthenticationProject(&client.ChartPathOptions, &namespaceConnectionConfig, coreClient, client.Namespace)
				if err != nil {
					return nil, fmt.Errorf("error setting up authentication: %v", err)
				}
			}
		}
		chartLocation = chartUrl
		client.ChartPathOptions.Version = chartInfo.Version
		cp, err = client.ChartPathOptions.LocateChart(chartLocation, settings)
		if err != nil {
			return nil, err
		}
		ch, err = loader.Load(cp)
		if err != nil {
			return nil, err
		}
	}

	if err := checkChartDependencies(ch); err != nil {
		return nil, err
	}

	// Ensure chart URL and installation method are properly set in the upgrade chart
	if chartUrl != "" {
		if ch.Metadata.Annotations == nil {
			ch.Metadata.Annotations = make(map[string]string)
		}
		ch.Metadata.Annotations["chart_url"] = chartUrl
		if inst, ok := rel.Chart.Metadata.Annotations["installation"]; ok {
			ch.Metadata.Annotations["installation"] = inst
		}
	}

	result, err := client.Run(releaseName, ch, vals)
	if err != nil {
		return nil, err
	}
	rel, ok := result.(*releasev1.Release)
	if !ok {
		return nil, fmt.Errorf("unexpected release type %T", result)
	}

	if ch.Metadata.Name != "" && ch.Metadata.Version != "" {
		metrics.HandleconsoleHelmUpgradesTotal(ch.Metadata.Name, ch.Metadata.Version)
	}
	// remove all the tls related files created by this process
	defer func() {
		if fileCleanUp == false {
			return
		}
		for _, f := range tlsFiles {
			os.Remove(f.Name())
		}
	}()
	return rel, nil
}

func UpgradeReleaseAsync(
	releaseNamespace string,
	releaseName string,
	chartUrl string,
	vals map[string]interface{},
	conf *action.Configuration,
	dynamicClient dynamic.Interface,
	coreClient corev1client.CoreV1Interface,
	fileCleanUp bool,
	indexEntry string,
	basicAuthSecretName string,
) (*kv1.Secret, error) {
	client := action.NewUpgrade(conf)
	client.ServerSideApply = "false"
	client.WaitStrategy = kube.HookOnlyStrategy
	client.Namespace = releaseNamespace
	var ch *chart.Chart
	var cp, chartLocation string
	var chartInfo *ChartInfo

	rel, err := GetRelease(releaseName, conf)
	if err != nil {
		// if there is no release exist then return generic error
		if strings.Contains(err.Error(), "no revision for release") {
			return nil, ErrReleaseRevisionNotFound
		}
		return nil, err
	}

	auth_secret := basicAuthSecretName
	// Before proceeding, check if chart URL is present as an annotation
	if rel.Chart.Metadata != nil && rel.Chart.Metadata.Annotations != nil {
		if chart_url, ok := rel.Chart.Metadata.Annotations["chart_url"]; chartUrl == "" && ok {
			chartUrl = chart_url
		}
		if auth_secret == "" {
			if authSecret, ok := rel.Chart.Metadata.Annotations[helmAuthSecretAnnotation]; ok {
				auth_secret = authSecret
			}
		}
	}

	var tlsFiles []*os.File
	// if url is not provided then we expect user trying to upgrade release with the same
	// version of chart but with the different values
	if chartUrl == "" {
		ch = rel.Chart
	} else {
		if indexEntry == "" || releaseNamespace == "" {
			chartInfo, err = getChartInfoFromChartUrl(chartUrl, releaseNamespace, dynamicClient, coreClient)
			if err != nil {
				return nil, err
			}
		} else {
			chartInfo = getChartInfoFromIndexEntry(indexEntry, releaseNamespace, chartUrl)
		}

		if chartInfo.RepositoryName != "" {
			connectionConfig, isClusterScoped, err := getRepositoryConnectionConfig(chartInfo.RepositoryName, releaseNamespace, dynamicClient)
			if err != nil {
				return nil, err
			}
			if isClusterScoped {
				clusterConnectionConfig := connectionConfig.(v1beta1.ConnectionConfig)
				tlsFiles, err = setUpAuthentication(&client.ChartPathOptions, &clusterConnectionConfig, coreClient)
				if err != nil {
					return nil, fmt.Errorf("error setting up authentication: %v", err)
				}
			} else {
				namespaceConnectionConfig := connectionConfig.(v1beta1.ConnectionConfigNamespaceScoped)
				tlsFiles, err = setUpAuthenticationProject(&client.ChartPathOptions, &namespaceConnectionConfig, coreClient, client.Namespace)
				if err != nil {
					return nil, fmt.Errorf("error setting up authentication: %v", err)
				}
			}
		}
		if auth_secret != "" {
			userCredentials, err := GetUserCredentials(coreClient, releaseNamespace, auth_secret)
			if err != nil {
				return nil, fmt.Errorf("failed to get user credentials Secret %s for release upgrade %s/%s: %v", auth_secret, releaseNamespace, releaseName, err)
			} else {
				if err := applyBasicAuthFromUserCredentials(&client.ChartPathOptions, client, userCredentials); err != nil {
					return nil, fmt.Errorf("failed to apply auth from Secret %s for release upgrade %s/%s: %v", auth_secret, releaseNamespace, releaseName, err)
				}
			}
		}
		chartLocation = chartUrl
		client.ChartPathOptions.Version = chartInfo.Version
		cp, err = client.ChartPathOptions.LocateChart(chartLocation, settings)
		if err != nil {
			if auth_secret == "" && (strings.Contains(err.Error(), "401") || strings.Contains(err.Error(), "unauthorized")) {
				return nil, fmt.Errorf("failed to upgrade helm release: %w; registry requires authentication - select a Secret with \"username\" and \"password\" keys for basic authentication", err)
			}
			return nil, err
		}
		ch, err = loader.Load(cp)
		if err != nil {
			return nil, err
		}
	}

	if err := checkChartDependencies(ch); err != nil {
		return nil, err
	}

	// Ensure chart URL is properly set in the upgrade chart
	if ch.Metadata == nil {
		ch.Metadata = &chart.Metadata{}
	}
	if ch.Metadata.Annotations == nil {
		ch.Metadata.Annotations = make(map[string]string)
	}
	if chartUrl != "" {
		ch.Metadata.Annotations["chart_url"] = chartUrl
		if inst, ok := rel.Chart.Metadata.Annotations["installation"]; ok {
			ch.Metadata.Annotations["installation"] = inst
		}
		addAuthSecretAnnotation(ch, auth_secret)
	}
	go func() {
		_, err := client.Run(releaseName, ch, vals)
		if err != nil {
			createSecret(releaseNamespace, releaseName, rel.Version+1, coreClient, err)
			time.Sleep(15 * time.Second)
			coreClient.Secrets(releaseNamespace).Delete(context.TODO(), releaseName, v1.DeleteOptions{})
		} else {
			if ch.Metadata.Name != "" && ch.Metadata.Version != "" {
				metrics.HandleconsoleHelmUpgradesTotal(ch.Metadata.Name, ch.Metadata.Version)
			}
		}
		// remove all the tls related files created by this process
		defer func() {
			if fileCleanUp == false {
				return
			}
			for _, f := range tlsFiles {
				os.Remove(f.Name())
			}
		}()
	}()
	secret, err := getSecret(releaseNamespace, releaseName, rel.Version+1, coreClient)
	if err != nil {
		return nil, err
	}
	return &secret, nil
}

func checkChartDependencies(ch *chart.Chart) error {
	deps := ch.Metadata.Dependencies
	if len(deps) == 0 {
		return nil
	}
	reqs := make([]helmchart.Dependency, len(deps))
	for i, d := range deps {
		reqs[i] = d
	}
	return action.CheckDependencies(ch, reqs)
}
