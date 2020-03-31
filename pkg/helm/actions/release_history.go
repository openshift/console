package actions

import (
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/release"
)

func GetReleaseHistory(name string, conf *action.Configuration) ([]*release.Release, error) {
	client := action.NewHistory(conf)

	history, err := client.Run(name)
	if err != nil {
		return nil, err
	}
	if history == nil {
		return nil, ErrReleaseNotFound
	}

	return history, nil
}
