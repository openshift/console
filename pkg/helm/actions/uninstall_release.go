package actions

import (
	"strings"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/release"
)

func UninstallRelease(name string, conf *action.Configuration) (*release.UninstallReleaseResponse, error) {
	client := action.NewUninstall(conf)
	resp, err := client.Run(name)
	if err != nil {
		if strings.Compare("no release provided", err.Error()) != 0 {
			return nil, ErrReleaseNotFound
		}
		return nil, err
	}
	return resp, nil
}
