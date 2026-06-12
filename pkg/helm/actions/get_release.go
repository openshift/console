package actions

import (
	"helm.sh/helm/v4/pkg/action"
	release "helm.sh/helm/v4/pkg/release/v1"
)

func GetRelease(releaseName string, conf *action.Configuration) (*release.Release, error) {
	cmd := action.NewGet(conf)

	releases, err := cmd.Run(releaseName)
	if err != nil {
		return nil, err
	}
	return releases.(*release.Release), nil
}
