package actions

import (
	"crypto/tls"
	"fmt"
	"net/http"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/registry"
)

// newRegistryClient is a package-level variable to allow mocking in tests
var newRegistryClient = registry.NewClient

func GetDefaultOCIRegistry(conf *action.Configuration) error {
	return GetOCIRegistry(conf, false, false)
}

func GetOCIRegistry(conf *action.Configuration, skipTLSVerify bool, plainHTTP bool) error {
	if conf == nil {
		return fmt.Errorf("action configuration cannot be nil")
	}
	opts := []registry.ClientOption{
		registry.ClientOptDebug(false),
	}
	if plainHTTP {
		opts = append(opts, registry.ClientOptPlainHTTP())
	}
	if skipTLSVerify {
		transport := http.DefaultTransport.(*http.Transport).Clone()
		transport.TLSClientConfig = &tls.Config{
			InsecureSkipVerify: true,
		}
		opts = append(opts, registry.ClientOptHTTPClient(&http.Client{Transport: transport}))
	}
	registryClient, err := newRegistryClient(opts...)
	if err != nil {
		return fmt.Errorf("failed to create registry client: %w", err)
	}
	conf.RegistryClient = registryClient
	return nil
}
