package actions

import (
	"fmt"

	"helm.sh/helm/v4/pkg/action"
	releaseV1 "helm.sh/helm/v4/pkg/release/v1"
)

func GetReleaseHistory(name string, conf *action.Configuration) ([]*releaseV1.Release, error) {
	client := action.NewHistory(conf)

	results, err := client.Run(name)
	if err != nil {
		return nil, err
	}
	if results == nil {
		return nil, ErrReleaseNotFound
	}

	releases := make([]*releaseV1.Release, 0, len(results))
	for _, r := range results {
		rel, ok := r.(*releaseV1.Release)
		if !ok {
			return nil, fmt.Errorf("unexpected release type %T", r)
		}
		releases = append(releases, rel)
	}

	return releases, nil
}
