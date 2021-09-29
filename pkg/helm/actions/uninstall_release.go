package actions

import (
	"strings"

	"github.com/openshift/console/pkg/helm/metrics"
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

	ch := resp.Release.Chart
	if ch != nil && ch.Metadata != nil && ch.Metadata.Name != "" && ch.Metadata.Version != "" {
		metrics.HandleconsoleHelmUninstallsTotal(ch.Metadata.Name, ch.Metadata.Version)
	}

	return resp, nil
}
