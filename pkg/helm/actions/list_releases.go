package actions

import (
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/release"
)

func ListReleases(conf *action.Configuration) ([]*release.Release, error) {
	cmd := action.NewList(conf)

	releases, err := cmd.Run()
	if err != nil {
		return nil, err
	}
	if releases == nil {
		rs := make([]*release.Release, 0)
		return rs, nil
	}
	return releases, nil
}
