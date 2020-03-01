package actions

import (
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chart/loader"
)

func GetChart(url string, conf *action.Configuration) (*chart.Chart, error) {

	cmd := action.NewInstall(conf)

	chartLocation, err := cmd.ChartPathOptions.LocateChart(url, settings)
	if err != nil {
		return nil, err
	}

	return loader.Load(chartLocation)
}
