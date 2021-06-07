package actions

import (
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart/loader"
	"helm.sh/helm/v3/pkg/release"
)

func InstallChart(ns, name, url string, vals map[string]interface{}, conf *action.Configuration) (*release.Release, error) {
	cmd := action.NewInstall(conf)

	name, chart, err := cmd.NameAndChart([]string{name, url})
	if err != nil {
		return nil, err
	}
	cmd.ReleaseName = name

	cp, err := cmd.ChartPathOptions.LocateChart(chart, settings)
	if err != nil {
		return nil, err
	}

	ch, err := loader.Load(cp)
	if err != nil {
		return nil, err
	}

	// Add chart URL as an annotation before installation
	ch.Metadata.Annotations = make(map[string]string)
	ch.Metadata.Annotations["chart_url"] = url

	cmd.Namespace = ns
	release, err := cmd.Run(ch, vals)
	if err != nil {
		return nil, err
	}
	return release, nil
}
