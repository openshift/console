package actions

import (
	"fmt"
	"os"

	"github.com/openshift/api/helm/v1beta1"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chart/loader"

	"k8s.io/client-go/dynamic"
	corev1client "k8s.io/client-go/kubernetes/typed/core/v1"
)

func GetChart(url string, conf *action.Configuration, repositoryNamespace string, client dynamic.Interface, coreClient corev1client.CoreV1Interface, filesCleanup bool, indexEntry string) (*chart.Chart, error) {
	var err error
	var chartInfo *ChartInfo
	var chartLocation, chartPath string
	tlsFiles := []*os.File{}
	cmd := action.NewInstall(conf)
	if repositoryNamespace == "" {
		chartLocation, err := cmd.ChartPathOptions.LocateChart(url, settings)
		if err != nil {
			return nil, err
		}
		return loader.Load(chartLocation)
	}
	chartInfo = getChartInfoFromIndexEntry(indexEntry, repositoryNamespace, url)
	connectionConfig, isClusterScoped, err := getRepositoryConnectionConfig(chartInfo.RepositoryName, chartInfo.RepositoryNamespace, client)
	if err != nil {
		return nil, err
	}
	if isClusterScoped {
		clusterConnectionConfig := connectionConfig.(v1beta1.ConnectionConfig)
		tlsFiles, err = setUpAuthentication(&cmd.ChartPathOptions, &clusterConnectionConfig, coreClient)
		if err != nil {
			return nil, fmt.Errorf("error setting up authentication: %v", err)
		}
	} else {
		namespaceConnectionConfig := connectionConfig.(v1beta1.ConnectionConfigNamespaceScoped)
		tlsFiles, err = setUpAuthenticationProject(&cmd.ChartPathOptions, &namespaceConnectionConfig, coreClient, repositoryNamespace)
		if err != nil {
			return nil, fmt.Errorf("error setting up authentication: %v", err)
		}
	}

	if len(tlsFiles) == 0 {
		chartLocation = url
	} else {
		chartLocation = chartInfo.Name
	}

	cmd.ChartPathOptions.Version = chartInfo.Version
	chartPath, err = cmd.ChartPathOptions.LocateChart(chartLocation, settings)
	if err != nil {
		return nil, fmt.Errorf("error locating chart: %v", err)
	}
	defer func() {
		if filesCleanup == false {
			return
		}
		for _, f := range tlsFiles {
			os.Remove(f.Name())
		}
	}()
	return loader.Load(chartPath)
}
