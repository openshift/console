package actions

import (
	"fmt"

	"helm.sh/helm/v4/pkg/action"
	chart "helm.sh/helm/v4/pkg/chart/v2"
	release "helm.sh/helm/v4/pkg/release/v1"
)

func ListReleases(conf *action.Configuration, limitInfo bool) ([]*release.Release, error) {
	cmd := action.NewList(conf)
	cmd.StateMask = action.ListAll
	results, err := cmd.Run()
	if err != nil {
		return nil, err
	}
	if results == nil {
		return make([]*release.Release, 0), nil
	}

	releases := make([]*release.Release, 0, len(results))
	for _, r := range results {
		rel, ok := r.(*release.Release)
		if !ok {
			return nil, fmt.Errorf("unexpected release type %T", r)
		}
		releases = append(releases, rel)
	}

	if limitInfo {
		limited := make([]*release.Release, 0, len(releases))
		for _, rel := range releases {
			info := release.Release{
				Name:      rel.Name,
				Version:   rel.Version,
				Namespace: rel.Namespace,
				Info:      rel.Info,
				Chart: &chart.Chart{
					Metadata: rel.Chart.Metadata,
				},
			}
			limited = append(limited, &info)
		}
		return limited, nil
	}
	return releases, nil
}
