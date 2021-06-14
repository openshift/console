package actions

import (
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chart/loader"
	"helm.sh/helm/v3/pkg/release"
	"k8s.io/client-go/util/retry"
)

func InstallChart(ns, name, url string, vals map[string]interface{}, conf *action.Configuration) (*release.Release, error) {
	var release *release.Release

	err := retry.RetryOnConflict(retry.DefaultRetry, func() error {
		cmd := action.NewInstall(conf)

		releaseName, chartName, err := cmd.NameAndChart([]string{name, url})
		if err != nil {
			return err
		}
		cmd.ReleaseName = releaseName

		cp, err := cmd.ChartPathOptions.LocateChart(chartName, settings)
		if err != nil {
			return err
		}

		ch, err := loader.Load(cp)
		if err != nil {
			return err
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
		release, err = cmd.Run(ch, vals)

		// Cleanup failed release before re-Run
		if err != nil {
			UninstallRelease(name, conf)
		}
		return err
	})

	if err != nil {
		return nil, err
	}
	return release, nil
}
