package actions

import (
	"helm.sh/helm/v4/pkg/action"
	chart "helm.sh/helm/v4/pkg/chart/v2"
	release "helm.sh/helm/v4/pkg/release/v1"
)

func ListReleases(conf *action.Configuration, limitInfo bool) ([]*release.Release, error) {
	cmd := action.NewList(conf)
	cmd.StateMask = action.ListAll
	releases, err := cmd.Run()
	if err != nil {
		return nil, err
	}
	if releases == nil {
		rs := make([]*release.Release, 0)
		return rs, nil
	}
	limitedReleaseInformation := make([]*release.Release, 0)
	if limitInfo != false {
		for _, rel := range releases {
			releaseInformation := release.Release{
				Name:      rel.Name,
				Version:   rel.Version,
				Namespace: rel.Namespace,
				Info:      rel.Info,
				Chart: &chart.Chart{
					Metadata: rel.Chart.Metadata,
				},
			}
			limitedReleaseInformation = append(limitedReleaseInformation, &releaseInformation)
		}
		return limitedReleaseInformation, nil
	}
	return releases, nil
}
