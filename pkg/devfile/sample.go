package devfile

import (
	"encoding/json"
	"fmt"
	indexSchema "github.com/devfile/registry-support/index/generator/schema"
	registryLibrary "github.com/devfile/registry-support/registry-library/library"
)

const DEVFILE_REGISTRY_URL = "https://registry.devfile.io"

// GetRegistrySamples returns the list of samples, more specifically
// it gets the content of the index (index.json) of the specified registry.
// This is based on https://github.com/devfile/registry-support/blob/master/registry-library/library/library.go#L61
func GetRegistrySamples(registry string) ([]byte, error) {
	if registry == DEVFILE_REGISTRY_URL {
		devfileIndex, err := registryLibrary.GetRegistryIndex(registry, registryLibrary.RegistryOptions{}, indexSchema.SampleDevfileType)
		if err != nil {
			return nil, err
		}
		return json.Marshal(devfileIndex)
	} else {
		return nil, fmt.Errorf("registry %s is invalid", registry)
	}
}
