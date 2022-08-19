package actions

import (
	"fmt"
	"os"
	"strings"

	"github.com/openshift/api/helm/v1beta1"
	"github.com/openshift/console/pkg/helm/metrics"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chart/loader"
	"helm.sh/helm/v3/pkg/release"
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
) (*release.Release, error) {
	client := action.NewUpgrade(conf)
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
		if len(tlsFiles) == 0 {
			chartLocation = chartUrl
		} else {
			chartLocation = chartInfo.Name
		}
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

	if req := ch.Metadata.Dependencies; req != nil {
		if err := action.CheckDependencies(ch, req); err != nil {
			return nil, err
		}
	}

	// Ensure chart URL is properly set in the upgrade chart
	if chartUrl != "" {
		if ch.Metadata.Annotations == nil {
			ch.Metadata.Annotations = make(map[string]string)
		}
		ch.Metadata.Annotations["chart_url"] = chartUrl
	}

	rel, err = client.Run(releaseName, ch, vals)
	if err != nil {
		return nil, err
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
