package devfile

import "fmt"

const DEVFILE_REGISTRY_PLACEHOLDER_URL = "sample-placeholder"

// GetRegistrySamples returns the list of samples, more specifically
// it gets the content of the index (index.json) of the specified registry.
// This is based on https://github.com/devfile/registry-support/blob/master/registry-library/library/library.go#L61
func GetRegistrySamples(registry string) ([]byte, error) {
	if registry == DEVFILE_REGISTRY_PLACEHOLDER_URL {
		return []byte(SamplePlaceholderJSON), nil
	} else {
		return nil, fmt.Errorf("registry %s is invalid", registry)
	}
}
