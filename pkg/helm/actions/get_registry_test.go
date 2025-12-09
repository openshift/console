package actions

import (
	"errors"
	"io"
	"testing"

	"github.com/stretchr/testify/require"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chartutil"
	kubefake "helm.sh/helm/v3/pkg/kube/fake"
	"helm.sh/helm/v3/pkg/registry"
	"helm.sh/helm/v3/pkg/storage"
	"helm.sh/helm/v3/pkg/storage/driver"
)

func TestGetDefaultOCIRegistry_Success(t *testing.T) {
	store := storage.Init(driver.NewMemory())
	conf := &action.Configuration{
		RESTClientGetter: FakeConfig{},
		Releases:         store,
		KubeClient:       &kubefake.PrintingKubeClient{Out: io.Discard},
		Capabilities:     chartutil.DefaultCapabilities,
	}
	require.Nil(t, conf.RegistryClient, "Registry Client should be nil")

	// Store original values
	originalReleases := conf.Releases
	originalKubeClient := conf.KubeClient
	originalCapabilities := conf.Capabilities

	err := GetDefaultOCIRegistry(conf)
	require.NoError(t, err)
	require.NotNil(t, conf.RegistryClient, "Registry Client should not be nil")

	// Verify other configuration fields are not modified.
	require.Equal(t, originalReleases, conf.Releases, "Releases should not be modified")
	require.Equal(t, originalKubeClient, conf.KubeClient, "KubeClient should not be modified")
	require.Equal(t, originalCapabilities, conf.Capabilities, "Capabilities should not be modified")

}

func TestGetDefaultOCIRegistry_NilConfig(t *testing.T) {
	err := GetDefaultOCIRegistry(nil)
	require.Error(t, err)
	require.Contains(t, err.Error(), "action configuration cannot be nil")
}

func TestGetOCIRegistry_NewClientError(t *testing.T) {
	// Save original function and restore after test
	originalNewRegistryClient := newRegistryClient
	defer func() { newRegistryClient = originalNewRegistryClient }()

	// Mock newRegistryClient to return an error
	newRegistryClient = func(options ...registry.ClientOption) (*registry.Client, error) {
		return nil, errors.New("mock registry client error")
	}

	store := storage.Init(driver.NewMemory())
	conf := &action.Configuration{
		RESTClientGetter: FakeConfig{},
		Releases:         store,
		KubeClient:       &kubefake.PrintingKubeClient{Out: io.Discard},
		Capabilities:     chartutil.DefaultCapabilities,
	}

	err := GetOCIRegistry(conf, false, false)
	require.Error(t, err)
	require.Contains(t, err.Error(), "failed to create registry client")
	require.Contains(t, err.Error(), "mock registry client error")
}
