package actions

import (
	"io/ioutil"
	"testing"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chartutil"
	kubefake "helm.sh/helm/v3/pkg/kube/fake"
	"helm.sh/helm/v3/pkg/release"
	"helm.sh/helm/v3/pkg/storage"
	"helm.sh/helm/v3/pkg/storage/driver"
)

func TestGetReleaseHistory(t *testing.T) {
	tests := []struct {
		name     string
		release  release.Release
		err      error
		versions []int
	}{
		{
			name: "existing release should return list of particular release history",
			release: release.Release{
				Version: 1,
				Name:    "valid-release",
				Info: &release.Info{
					Status: release.StatusDeployed,
				},
			},
			err:      nil,
			versions: []int{1, 2},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// create fake release
			store := storage.Init(driver.NewMemory())
			actionConfig := &action.Configuration{
				Releases:     store,
				KubeClient:   &kubefake.PrintingKubeClient{Out: ioutil.Discard},
				Capabilities: chartutil.DefaultCapabilities,
				Log:          func(format string, v ...interface{}) {},
			}

			err := store.Create(&tt.release)
			if err != nil {
				t.Error(err)
			}

			tt.release.Version = 2
			store.Create(&tt.release)

			resp, err := GetReleaseHistory(tt.release.Name, actionConfig)
			if err != tt.err {
				t.Error(err)
			}

			if len(tt.versions) != len(resp) {
				t.Error("Total no of versions should be " + string(len(tt.versions)))
			}
			for _, history := range resp {
				if history.Name != tt.release.Name {
					t.Error("Release name isn't matching")
				}
				// version check
				if !contains(tt.versions, history.Version) {
					t.Errorf("Version no. mismatch received %d", history.Version)
				}
			}
		})
	}
}

func TestNonExistGetReleaseHistory(t *testing.T) {
	tests := []struct {
		name         string
		release      release.Release
		err          error
		noOfVersions int
	}{
		{
			name: "non exist release history should throw an error",
			release: release.Release{
				Name: "invalid-release",
			},
			noOfVersions: 0,
			err:          ErrReleaseNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := storage.Init(driver.NewMemory())
			actionConfig := &action.Configuration{
				Releases:     store,
				KubeClient:   &kubefake.PrintingKubeClient{Out: ioutil.Discard},
				Capabilities: chartutil.DefaultCapabilities,
				Log:          func(format string, v ...interface{}) {},
			}

			resp, err := GetReleaseHistory(tt.release.Name, actionConfig)
			if err.Error() != tt.err.Error() {
				t.Error(err)
			}
			if tt.noOfVersions != len(resp) {
				t.Error("Total no of versions should be " + string(tt.noOfVersions))
			}
		})
	}
}

func contains(arr []int, no int) bool {
	for _, a := range arr {
		if a == no {
			return true
		}
	}
	return false
}
