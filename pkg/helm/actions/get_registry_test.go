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

func TestGetOCIRegistry_NilConfig(t *testing.T) {
	err := GetOCIRegistry(nil, false, false)
	require.Error(t, err)
	require.Contains(t, err.Error(), "action configuration cannot be nil")
}

func TestGetOCIRegistry_Success(t *testing.T) {
	tests := []struct {
		name          string
		skipTLSVerify bool
		plainHTTP     bool
	}{
		{
			name:          "default options",
			skipTLSVerify: false,
			plainHTTP:     false,
		},
		{
			name:          "with skipTLSVerify",
			skipTLSVerify: true,
			plainHTTP:     false,
		},
		{
			name:          "with plainHTTP",
			skipTLSVerify: false,
			plainHTTP:     true,
		},
		{
			name:          "with both skipTLSVerify and plainHTTP",
			skipTLSVerify: true,
			plainHTTP:     true,
		},
	}
	originalNewRegistryClient := newRegistryClient
	defer func() {
		newRegistryClient = originalNewRegistryClient
	}()

	for _, tt := range tests {
		newRegistryClient = func(options ...registry.ClientOption) (*registry.Client, error) {
			count := 0
			if tt.plainHTTP {
				count += 1
			}
			if tt.skipTLSVerify {
				count += 1
			}
			require.Equal(t, count, len(options)-1, "Expected %d options, got %d", count, len(options))
			return &registry.Client{}, nil
		}
		t.Run(tt.name, func(t *testing.T) {
			store := storage.Init(driver.NewMemory())
			conf := &action.Configuration{
				RESTClientGetter: FakeConfig{},
				Releases:         store,
				KubeClient:       &kubefake.PrintingKubeClient{Out: io.Discard},
				Capabilities:     chartutil.DefaultCapabilities,
			}
			require.Nil(t, conf.RegistryClient, "Registry Client should be nil initially")

			err := GetOCIRegistry(conf, tt.skipTLSVerify, tt.plainHTTP)
			require.NoError(t, err)
			require.NotNil(t, conf.RegistryClient, "Registry Client should not be nil after GetOCIRegistry")
		})
	}
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
