package actions

import (
	"fmt"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/registry"
)

// newRegistryClient is a package-level variable to allow mocking in tests
var newRegistryClient = registry.NewClient

func GetDefaultOCIRegistry(conf *action.Configuration) error {
	return GetOCIRegistry(conf, false, false)
}

func GetOCIRegistry(conf *action.Configuration, insecure bool, plainHTTP bool) error {
	if conf == nil {
		return fmt.Errorf("action configuration cannot be nil")
	}
	registryclient, err := newRegistryClient(registry.ClientOptDebug(false))
	if err != nil {
		return fmt.Errorf("failed to create registry client: %w", err)
	}
	conf.RegistryClient = registryclient
	return nil
}
