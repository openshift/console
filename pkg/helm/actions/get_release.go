package actions

import (
	"fmt"

	"helm.sh/helm/v4/pkg/action"
	releasev1 "helm.sh/helm/v4/pkg/release/v1"
)

func GetRelease(releaseName string, conf *action.Configuration) (*releasev1.Release, error) {
	cmd := action.NewGet(conf)

	releases, err := cmd.Run(releaseName)
	if err != nil {
		return nil, err
	}
	rel, ok := releases.(*releasev1.Release)
	if !ok {
		return nil, fmt.Errorf("unexpected release type %T", releases)
	}
	return rel, nil
}
