package actions

import (
	"fmt"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/registry"
)

func GetDefaultOCIRegistry(conf *action.Configuration) error {
	if conf == nil {
		return fmt.Errorf("action configuration cannot be nil")
	}
	registryclient, err := registry.NewClient(registry.ClientOptDebug(false))
	if err != nil {
		return fmt.Errorf("failed to create registry client: %w", err)
	}
	conf.RegistryClient = registryclient
	return nil
}
