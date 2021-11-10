package devfile

import (
	"encoding/json"
	"fmt"
	indexSchema "github.com/devfile/registry-support/index/generator/schema"
	registryLibrary "github.com/devfile/registry-support/registry-library/library"
)

const DEVFILE_REGISTRY_URL = "https://registry.devfile.io"
const DEVFILE_STAGING_REGISTRY_URL = "https://registry.stage.devfile.io"
const ODC_TELEMETRY_CLIENT_NAME = "odcsample"

// GetRegistrySamples returns the list of samples, more specifically
// it gets the content of the index (index.json) of the specified registry.
// This is based on https://github.com/devfile/registry-support/blob/master/registry-library/library/library.go#L61
func GetRegistrySamples(registry string) ([]byte, error) {
	if registry == DEVFILE_REGISTRY_URL || registry == DEVFILE_STAGING_REGISTRY_URL {
		// set registryOption with `user=odcsample` for registry telemetry tracking
		registryOption := registryLibrary.RegistryOptions{User: ODC_TELEMETRY_CLIENT_NAME}

		devfileIndex, err := registryLibrary.GetRegistryIndex(registry, registryOption, indexSchema.SampleDevfileType)
		if err != nil {
			return nil, err
		}
		return json.Marshal(devfileIndex)
	} else {
		return nil, fmt.Errorf("registry %s is invalid", registry)
	}
}
