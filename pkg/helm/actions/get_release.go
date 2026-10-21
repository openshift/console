package actions

import (
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/release"
)

func GetRelease(releaseName string, conf *action.Configuration) (*release.Release, error) {
	cmd := action.NewGet(conf)

	releases, err := cmd.Run(releaseName)
	if err != nil {
		return nil, err
	}
	return releases, nil
}
