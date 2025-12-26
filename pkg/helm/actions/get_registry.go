package actions

import (
	"crypto/tls"
	"fmt"
	"net/http"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/registry"
)

func GetDefaultOCIRegistry(conf *action.Configuration) error {
	return GetOCIRegistry(conf, false, false)
}

func GetOCIRegistry(conf *action.Configuration, insecure bool, plainHTTP bool) error {
	if conf == nil {
		return fmt.Errorf("action configuration cannot be nil")
	}
	opts := []registry.ClientOption{
		registry.ClientOptDebug(false),
	}
	if plainHTTP {
		opts = append(opts, registry.ClientOptPlainHTTP())
	}
	if insecure {
		httpClient := &http.Client{
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{
					InsecureSkipVerify: true,
				},
			},
		}
		opts = append(opts, registry.ClientOptHTTPClient(httpClient))
	}
	registryClient, err := registry.NewClient(opts...)
	if err != nil {
		return fmt.Errorf("failed to create registry client: %w", err)
	}
	conf.RegistryClient = registryClient
	return nil
}
