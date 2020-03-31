package actions

import (
	"errors"
	"fmt"
	"io/ioutil"
	"testing"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chartutil"
	kubefake "helm.sh/helm/v3/pkg/kube/fake"
	"helm.sh/helm/v3/pkg/release"
	"helm.sh/helm/v3/pkg/storage"
	"helm.sh/helm/v3/pkg/storage/driver"
)

func TestRollbackRelease(t *testing.T) {
	tests := []struct {
		name       string
		release    release.Release
		err        error
		rollbackTo int
	}{
		{
			name: "rolling back to existing previous release should rollback successfully",
			release: release.Release{
				Version: 1,
				Name:    "valid-release",
				Info: &release.Info{
					Status: release.StatusDeployed,
				},
			},
			rollbackTo: 1,
		},
		{
			name: "rolling back to invalid release no. should throw an error",
			release: release.Release{
				Version: 1,
				Name:    "valid-release",
				Info: &release.Info{
					Status: release.StatusDeployed,
				},
			},
			err:        errors.New("Revision no. should be more than 0"),
			rollbackTo: 0,
		},
	}

	for _, tt := range tests {
		store := storage.Init(driver.NewMemory())
		t.Run(tt.name, func(t *testing.T) {
			// create fake release
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

			r, err := RollbackRelease(tt.release.Name, tt.rollbackTo, actionConfig)
			if err != nil && err.Error() != tt.err.Error() {
				t.Error(err)
			}
			if err != nil && err.Error() == tt.err.Error() {
				return
			}
			if r.Info.Description != fmt.Sprintf("Rollback to %d", tt.rollbackTo) {
				t.Errorf("Rollback description mismatch received is %s", r.Info.Description)
			}

		})
	}
}

func TestRollbackNonExistRelease(t *testing.T) {
	tests := []struct {
		name        string
		releaseName string
		err         error
		rollbackTo  int
	}{
		{
			name:        "rolling back non exist release should error out with no release found",
			releaseName: "invalid-release",
			err:         ErrReleaseRevisionNotFound,
			rollbackTo:  1,
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

			_, err := RollbackRelease(tt.releaseName, tt.rollbackTo, actionConfig)
			if err != nil && err.Error() != tt.err.Error() {
				t.Error(err)
			}
		})
	}
}
