package actions

import (
	"fmt"

	"helm.sh/helm/v4/pkg/action"
	chart "helm.sh/helm/v4/pkg/chart/v2"
	releaseV1 "helm.sh/helm/v4/pkg/release/v1"
)

func ListReleases(conf *action.Configuration, limitInfo bool) ([]*releaseV1.Release, error) {
	cmd := action.NewList(conf)
	cmd.StateMask = action.ListAll
	results, err := cmd.Run()
	if err != nil {
		return nil, err
	}
	if results == nil {
		return make([]*releaseV1.Release, 0), nil
	}

	releases := make([]*releaseV1.Release, 0, len(results))
	for _, r := range results {
		rel, ok := r.(*releaseV1.Release)
		if !ok {
			return nil, fmt.Errorf("unexpected release type %T", r)
		}
		releases = append(releases, rel)
	}

	if limitInfo {
		limited := make([]*releaseV1.Release, 0, len(releases))
		for _, rel := range releases {
			info := releaseV1.Release{
				Name:      rel.Name,
				Version:   rel.Version,
				Namespace: rel.Namespace,
				Info:      rel.Info,
			}
			if rel.Chart != nil {
				info.Chart = &chart.Chart{
					Metadata: rel.Chart.Metadata,
				}
			}
			limited = append(limited, &info)
		}
		return limited, nil
	}
	return releases, nil
}
