package actions

import (
	"strings"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chart/loader"
	"helm.sh/helm/v3/pkg/release"
)

func UpgradeRelease(ns, name, url string, vals map[string]interface{}, conf *action.Configuration) (*release.Release, error) {
	client := action.NewUpgrade(conf)
	client.Namespace = ns

	var ch *chart.Chart

	rel, err := GetRelease(name, conf)
	if err != nil {
		// if there is no release exist then return generic error
		if strings.Contains(err.Error(), "no revision for release") {
			return nil, ErrReleaseRevisionNotFound
		}
		return nil, err
	}
	// if url is not provided then we expect user trying to upgrade release with the same
	// version of chart but with the different values
	if url == "" {
		ch = rel.Chart
	} else {
		cp, err := client.ChartPathOptions.LocateChart(url, settings)
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

	return client.Run(name, ch, vals)
}
