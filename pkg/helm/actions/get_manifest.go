package actions

import (
	"helm.sh/helm/v3/pkg/action"
)

func GetReleaseManifest(releaseName string, conf *action.Configuration) (string, error) {
	cmd := action.NewGet(conf)

	releases, err := cmd.Run(releaseName)
	if err != nil {
		return "", err
	}
	return releases.Manifest, nil
}
