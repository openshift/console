package actions

import (
	"helm.sh/helm/v4/pkg/action"
	chart "helm.sh/helm/v4/pkg/chart/v2"
	"helm.sh/helm/v4/pkg/chart/v2/loader"
	"k8s.io/klog/v2"

	"github.com/openshift/console/pkg/helm/fetcherr"
)

func locateChart(opts *action.ChartPathOptions, location string) (string, error) {
	path, err := opts.LocateChart(location, settings)
	if err != nil {
		klog.V(4).Infof("chart locate failed: %v", err)
		return "", fetcherr.SanitizeChartLocateError(err)
	}
	return path, nil
}

func loadLocatedChart(path string) (*chart.Chart, error) {
	loaded, err := loader.Load(path)
	if err != nil {
		klog.V(4).Infof("chart load failed for %s: %v", path, err)
		return nil, fetcherr.SanitizeChartLoadError(err)
	}
	return loaded, nil
}
