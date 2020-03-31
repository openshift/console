package actions

import (
	"errors"
	"strings"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/release"
)

func RollbackRelease(releaseName string, revision int, conf *action.Configuration) (*release.Release, error) {
	if revision <= 0 {
		return nil, errors.New("Revision no. should be more than 0")
	}
	client := action.NewRollback(conf)
	client.Version = revision
	err := client.Run(releaseName)
	if err != nil {
		// if there is no release exist then return generic error
		if strings.Contains(err.Error(), "no revision for release") {
			return nil, ErrReleaseRevisionNotFound
		}
		return nil, err
	}
	return GetRelease(releaseName, conf)
}
