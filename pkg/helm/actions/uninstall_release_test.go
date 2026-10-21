package actions

import (
	"errors"
	"fmt"
	"io/ioutil"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chartutil"
	kubefake "helm.sh/helm/v3/pkg/kube/fake"
	"helm.sh/helm/v3/pkg/release"
	"helm.sh/helm/v3/pkg/storage"
	"helm.sh/helm/v3/pkg/storage/driver"
	k8sfake "k8s.io/client-go/kubernetes/fake"
)

func TestUninstallRelease(t *testing.T) {
	tests := []struct {
		name    string
		release *release.Release
	}{
		{
			name: "successful release uninstall should remove release installed",
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
			err: ErrReleaseNotFound,
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
			if err != nil && err.Error() != tt.err.Error() {
				t.Error(err)
			}
			if resp != nil && resp.Release.Info.Status != release.StatusUninstalled {
				t.Error(errors.New("Release status is not uninstalled"))
			}
		})
	}
}

func TestUninstallReleaseAsync(t *testing.T) {
	tests := []struct {
		name         string
		createSecret bool
		version      string
		namespace    string
		requireError bool
		releaseName  string
		release      *release.Release
	}{
		{
			name:         "successful release uninstall should remove release installed",
			requireError: false,
			createSecret: true,
			releaseName:  "test-release",
			namespace:    "default",
			version:      "1",
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
			clientInterface := k8sfake.NewSimpleClientset()
			coreClient := clientInterface.CoreV1()
			if tt.requireError == false {
				secretsDriver := driver.NewSecrets(coreClient.Secrets(tt.namespace))
				time.Sleep(10 * time.Second)
				err = secretsDriver.Create(fmt.Sprintf("sh.helm.release.v1.%v.v1", tt.releaseName), tt.release)
				require.NoError(t, err)
			}

			err = UninstallReleaseAsync(tt.release.Name, tt.namespace, tt.version, actionConfig, coreClient)
			require.Nil(t, err)
		})
	}
}

func TestUninstallInvalidReleaseAsync(t *testing.T) {
	tests := []struct {
		name        string
		release     *release.Release
		version     string
		namespace   string
		releaseName string
		err         error
	}{
		{
			name: "non exist release uninstall should error out with no release found",
			release: &release.Release{
				Name: "invalid-release",
			},
			namespace:   "default",
			version:     "1",
			releaseName: "invalid-release",
			err:         ErrReleaseNotFound,
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
			clientInterface := k8sfake.NewSimpleClientset()
			coreClient := clientInterface.CoreV1()
			err := UninstallReleaseAsync(tt.releaseName, tt.namespace, tt.version, actionConfig, coreClient)
			require.Error(t, err)
		})
	}
}
