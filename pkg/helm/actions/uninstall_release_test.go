package actions

import (
	"errors"
	"fmt"
	"io"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"helm.sh/helm/v4/pkg/action"
	"helm.sh/helm/v4/pkg/chart/common"
	kubefake "helm.sh/helm/v4/pkg/kube/fake"
	rcommon "helm.sh/helm/v4/pkg/release/common"
	releaseV1 "helm.sh/helm/v4/pkg/release/v1"
	"helm.sh/helm/v4/pkg/storage"
	"helm.sh/helm/v4/pkg/storage/driver"
	k8sfake "k8s.io/client-go/kubernetes/fake"
)

func TestUninstallRelease(t *testing.T) {
	tests := []struct {
		name    string
		release *releaseV1.Release
	}{
		{
			name: "successful release uninstall should remove release installed",
			release: &releaseV1.Release{
				Name: "test-release",
				Info: &releaseV1.Info{
					Status: rcommon.StatusDeployed,
				},
			},
		},
	}

	for _, tt := range tests {
		store := storage.Init(driver.NewMemory())
		t.Run(tt.name, func(t *testing.T) {
			actionConfig := &action.Configuration{
				Releases:     store,
				KubeClient:   &kubefake.PrintingKubeClient{Out: io.Discard},
				Capabilities: common.DefaultCapabilities,
			}
			// create fake release
			err := store.Create(tt.release)
			if err != nil {
				t.Error(err)
			}
			resp, err := UninstallRelease(tt.release.Name, actionConfig)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if resp != nil {
				if rel, ok := resp.Release.(*releaseV1.Release); ok && rel.Info.Status != rcommon.StatusUninstalled {
					t.Error(errors.New("Release status is not uninstalled"))
				}
			}
		})
	}
}

func TestUninstallInvalidRelease(t *testing.T) {
	tests := []struct {
		name    string
		release *releaseV1.Release
		err     error
	}{
		{
			name: "non exist release uninstall should error out with no release found",
			release: &releaseV1.Release{
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
				KubeClient:   &kubefake.PrintingKubeClient{Out: io.Discard},
				Capabilities: common.DefaultCapabilities,
			}
			resp, err := UninstallRelease(tt.release.Name, actionConfig)
			if err == nil {
				t.Fatal("expected error but got nil")
			}
			if err.Error() != tt.err.Error() {
				t.Errorf("expected error %q, got %q", tt.err, err)
			}
			if resp != nil {
				if rel, ok := resp.Release.(*releaseV1.Release); ok && rel.Info.Status != rcommon.StatusUninstalled {
					t.Error(errors.New("Release status is not uninstalled"))
				}
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
		release      *releaseV1.Release
	}{
		{
			name:         "successful release uninstall should remove release installed",
			requireError: false,
			createSecret: true,
			releaseName:  "test-release",
			namespace:    "default",
			version:      "1",
			release: &releaseV1.Release{
				Name: "test-release",
				Info: &releaseV1.Info{
					Status: rcommon.StatusDeployed,
				},
			},
		},
	}

	for _, tt := range tests {
		store := storage.Init(driver.NewMemory())
		t.Run(tt.name, func(t *testing.T) {
			actionConfig := &action.Configuration{
				Releases:     store,
				KubeClient:   &kubefake.PrintingKubeClient{Out: io.Discard},
				Capabilities: common.DefaultCapabilities,
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
		release     *releaseV1.Release
		version     string
		namespace   string
		releaseName string
		err         error
	}{
		{
			name: "non exist release uninstall should error out with no release found",
			release: &releaseV1.Release{
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
				KubeClient:   &kubefake.PrintingKubeClient{Out: io.Discard},
				Capabilities: common.DefaultCapabilities,
			}
			clientInterface := k8sfake.NewSimpleClientset()
			coreClient := clientInterface.CoreV1()
			err := UninstallReleaseAsync(tt.releaseName, tt.namespace, tt.version, actionConfig, coreClient)
			require.Error(t, err)
		})
	}
}
