package actions

import (
	"fmt"
	"io"
	"testing"

	"helm.sh/helm/v4/pkg/action"
	"helm.sh/helm/v4/pkg/chart/common"
	kubefake "helm.sh/helm/v4/pkg/kube/fake"
	rcommon "helm.sh/helm/v4/pkg/release/common"
	releaseV1 "helm.sh/helm/v4/pkg/release/v1"
	"helm.sh/helm/v4/pkg/storage"
	"helm.sh/helm/v4/pkg/storage/driver"
)

func TestGetReleaseHistory(t *testing.T) {
	tests := []struct {
		name     string
		release  releaseV1.Release
		err      error
		versions []int
	}{
		{
			name: "existing release should return list of particular release history",
			release: releaseV1.Release{
				Version: 1,
				Name:    "valid-release",
				Info: &releaseV1.Info{
					Status: rcommon.StatusDeployed,
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
				KubeClient:   &kubefake.PrintingKubeClient{Out: io.Discard},
				Capabilities: common.DefaultCapabilities,
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
				t.Error("Total no of versions should be " + fmt.Sprint(len(tt.versions)))
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
		release      releaseV1.Release
		err          error
		noOfVersions int
	}{
		{
			name: "non exist release history should throw an error",
			release: releaseV1.Release{
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
				KubeClient:   &kubefake.PrintingKubeClient{Out: io.Discard},
				Capabilities: common.DefaultCapabilities,
			}

			resp, err := GetReleaseHistory(tt.release.Name, actionConfig)
			if err.Error() != tt.err.Error() {
				t.Error(err)
			}
			if tt.noOfVersions != len(resp) {
				t.Error("Total no of versions should be " + fmt.Sprint(tt.noOfVersions))
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
