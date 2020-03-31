package actions

import (
	"errors"
	"io/ioutil"
	"testing"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chartutil"
	kubefake "helm.sh/helm/v3/pkg/kube/fake"
	"helm.sh/helm/v3/pkg/release"
	"helm.sh/helm/v3/pkg/storage"
	"helm.sh/helm/v3/pkg/storage/driver"
)

func TestUninstallRelease(t *testing.T) {
	tests := []struct {
		name    string
		release *release.Release
		err     error
	}{
		{
			name: "successful release uninstall should remove release and dependant resources",
			release: &release.Release{
				Name: "test-release",
				Info: &release.Info{
					Status: release.StatusDeployed,
				},
			},
		},
	}

	for _, tt := range tests {
		store := storage.Init(driver.NewMemory())
		t.Run(tt.name, func(t *testing.T) {
			actionConfig := &action.Configuration{
				Releases:     store,
				KubeClient:   &kubefake.PrintingKubeClient{Out: ioutil.Discard},
				Capabilities: chartutil.DefaultCapabilities,
				Log:          func(format string, v ...interface{}) {},
			}
			// create fake release
			err := store.Create(tt.release)
			if err != nil {
				t.Error(err)
			}
			resp, err := UninstallRelease(tt.release.Name, actionConfig)
			if err != nil && err.Error() != tt.err.Error() {
				t.Error(err)
			}
			if resp != nil && resp.Release.Info.Status != release.StatusUninstalled {
				t.Error(errors.New("Release status is not uninstalled"))
			}
		})
	}
}

func TestUninstallInvalidRelease(t *testing.T) {
	tests := []struct {
		name    string
		release *release.Release
		err     error
	}{
		{
			name: "non exist release uninstall should error out with no release found",
			release: &release.Release{
				Name: "invalid-release",
			},
			err: errors.New("no release provided"),
		},
	}

	for _, tt := range tests {
		store := storage.Init(driver.NewMemory())
		t.Run(tt.name, func(t *testing.T) {
			actionConfig := &action.Configuration{
				Releases:     store,
				KubeClient:   &kubefake.PrintingKubeClient{Out: ioutil.Discard},
				Capabilities: chartutil.DefaultCapabilities,
				Log:          func(format string, v ...interface{}) {},
			}
			resp, err := UninstallRelease(tt.release.Name, actionConfig)
			if err == nil && tt.err != nil {
				t.Error(err)
			}
			if err != nil && err.Error() != tt.err.Error() {
				t.Error(err)
			}
			if resp != nil && resp.Release.Info.Status != release.StatusUninstalled {
				t.Error(errors.New("Release status is not uninstalled"))
			}
		})
	}
}
