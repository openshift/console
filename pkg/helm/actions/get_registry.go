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

// registryClientOptions returns the same options used by GetOCIRegistry for TLS / plain-HTTP behavior.
func registryClientOptions(skipTLSVerify, plainHTTP bool) []registry.ClientOption {
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
	return opts
}

// RegistryClientWithBasicAuth builds a registry.Client with the same TLS/plain-HTTP settings as
// GetDefaultOCIRegistry (skipTLSVerify=false, plainHTTP=false) plus OCI basic auth.
// Helm's OCI getter uses Configuration.RegistryClient when set and does not apply ChartPathOptions
// username/password to that client; credentials must be set on the registry client via ClientOptBasicAuth.
func RegistryClientWithBasicAuth(skipTLSVerify, plainHTTP bool, username, password string) (*registry.Client, error) {
	opts := registryClientOptions(skipTLSVerify, plainHTTP)
	opts = append(opts, registry.ClientOptBasicAuth(username, password))
	return newRegistryClient(opts...)
}

func GetDefaultOCIRegistry(conf *action.Configuration) error {
	return GetOCIRegistry(conf, false, false)
}

func GetOCIRegistry(conf *action.Configuration, skipTLSVerify bool, plainHTTP bool) error {
	if conf == nil {
		return fmt.Errorf("action configuration cannot be nil")
	}
	registryClient, err := newRegistryClient(registryClientOptions(skipTLSVerify, plainHTTP)...)
	if err != nil {
		return fmt.Errorf("failed to create registry client: %w", err)
	}
	conf.RegistryClient = registryClient
	return nil
}
