package actions

import (
	"fmt"
	"os"

	"github.com/openshift/api/helm/v1beta1"
	"github.com/openshift/console/pkg/helm/metrics"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chart/loader"
	"helm.sh/helm/v3/pkg/release"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	corev1client "k8s.io/client-go/kubernetes/typed/core/v1"
)

var (
	helmChartRepositoryClusterGVK = schema.GroupVersionResource{
		Group:    "helm.openshift.io",
		Version:  "v1beta1",
		Resource: "helmchartrepositories",
	}
	helmChartRepositoryNamespaceGVK = schema.GroupVersionResource{
		Group:    "helm.openshift.io",
		Version:  "v1beta1",
		Resource: "projecthelmchartrepositories",
	}
)

func InstallChart(ns, name, url string, vals map[string]interface{}, conf *action.Configuration, client dynamic.Interface, coreClient corev1client.CoreV1Interface, fileCleanUp bool, indexEntry string) (*release.Release, error) {
	var err error
	var chartInfo *ChartInfo
	var cp, chartLocation string
	cmd := action.NewInstall(conf)
	// tlsFiles contain references of files to be removed once the chart
	// operation depending on those files is finished.
	tlsFiles := []*os.File{}
	if indexEntry == "" {
		chartInfo, err = getChartInfoFromChartUrl(url, ns, client, coreClient)
		if err != nil {
			return nil, err
		}
	} else {
		chartInfo = getChartInfoFromIndexEntry(indexEntry, ns, url)
	}

	connectionConfig, isClusterScoped, err := getRepositoryConnectionConfig(chartInfo.RepositoryName, ns, client)
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
		tlsFiles, err = setUpAuthenticationProject(&cmd.ChartPathOptions, &namespaceConnectionConfig, coreClient, ns)
		if err != nil {
			return nil, fmt.Errorf("error setting up authentication: %v", err)
		}
	}
	cmd.ReleaseName = name
	if len(tlsFiles) == 0 {
		chartLocation = url
	} else {
		chartLocation = chartInfo.Name
	}

	cmd.ChartPathOptions.Version = chartInfo.Version
	cp, err = cmd.ChartPathOptions.LocateChart(chartLocation, settings)
	if err != nil {
		return nil, fmt.Errorf("error locating chart: %v", err)
	}
	ch, err := loader.Load(cp)
	if err != nil {
		return nil, err
	}

	// Add chart URL as an annotation before installation
	if ch.Metadata == nil {
		ch.Metadata = new(chart.Metadata)
	}
	if ch.Metadata.Annotations == nil {
		ch.Metadata.Annotations = make(map[string]string)
	}
	ch.Metadata.Annotations["chart_url"] = url

	cmd.Namespace = ns
	release, err := cmd.Run(ch, vals)
	if err != nil {
		return nil, err
	}

	if ch.Metadata.Name != "" && ch.Metadata.Version != "" {
		metrics.HandleconsoleHelmInstallsTotal(ch.Metadata.Name, ch.Metadata.Version)
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
	return release, nil
}

func InstallChartAsync(ns, name, url string, vals map[string]interface{}, conf *action.Configuration, client dynamic.Interface, coreClient corev1client.CoreV1Interface, fileCleanUp bool, indexEntry string) (*Secret, error) {
	var err error
	var chartInfo *ChartInfo
	var cp, chartLocation string
	cmd := action.NewInstall(conf)
	// tlsFiles contain references of files to be removed once the chart
	// operation depending on those files is finished.
	tlsFiles := []*os.File{}
	if indexEntry == "" {
		chartInfo, err = getChartInfoFromChartUrl(url, ns, client, coreClient)
		if err != nil {
			return nil, err
		}
	} else {
		chartInfo = getChartInfoFromIndexEntry(indexEntry, ns, url)
	}

	connectionConfig, isClusterScoped, err := getRepositoryConnectionConfig(chartInfo.RepositoryName, ns, client)
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
		tlsFiles, err = setUpAuthenticationProject(&cmd.ChartPathOptions, &namespaceConnectionConfig, coreClient, ns)
		if err != nil {
			return nil, fmt.Errorf("error setting up authentication: %v", err)
		}
	}
	cmd.ReleaseName = name
	if len(tlsFiles) == 0 {
		chartLocation = url
	} else {
		chartLocation = chartInfo.Name
	}
	cmd.ChartPathOptions.Version = chartInfo.Version
	cp, err = cmd.ChartPathOptions.LocateChart(chartLocation, settings)
	if err != nil {
		return nil, fmt.Errorf("error locating chart: %v", err)
	}
	ch, err := loader.Load(cp)
	if err != nil {
		return nil, err
	}

	// Add chart URL as an annotation before installation
	if ch.Metadata == nil {
		ch.Metadata = new(chart.Metadata)
	}
	if ch.Metadata.Annotations == nil {
		ch.Metadata.Annotations = make(map[string]string)
	}
	ch.Metadata.Annotations["chart_url"] = url

	cmd.Namespace = ns
	go func() {
		_, err := cmd.Run(ch, vals)
		if err != nil {
			createSecret(ns, name, 1, coreClient, err)
		}
		if err == nil {
			if ch.Metadata.Name != "" && ch.Metadata.Version != "" {
				metrics.HandleconsoleHelmInstallsTotal(ch.Metadata.Name, ch.Metadata.Version)
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
	secret, err := getSecret(ns, name, 1, coreClient)
	if err != nil {
		return nil, err
	}
	return &secret, nil
}
