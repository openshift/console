package actions

import (
	"crypto/tls"
	"fmt"
	"net/http"

	"helm.sh/helm/v4/pkg/registry"
)

// newRegistryClient is a package-level variable to allow mocking in tests
var newRegistryClient = registry.NewClient

type UserCredentials struct {
	Username string
	Password string
}

func GetOCIRegistry(skipTLSVerify bool, plainHTTP bool, userCredentials *UserCredentials) (*registry.Client, error) {
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
	if userCredentials != nil {
		opts = append(opts, registry.ClientOptBasicAuth(userCredentials.Username, userCredentials.Password))
	}
	registryClient, err := newRegistryClient(opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to create registry client: %w", err)
	}
	return registryClient, nil

}

func GetDefaultOCIRegistry() (*registry.Client, error) {
	return GetOCIRegistry(false, false, nil)
}
