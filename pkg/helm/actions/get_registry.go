package actions

import (
	"context"
	"crypto/tls"
	"fmt"
	"net"
	"net/http"
	"time"

	"helm.sh/helm/v4/pkg/registry"

	"github.com/openshift/console/pkg/utils"
)

// newRegistryClient is a package-level variable to allow mocking in tests
var newRegistryClient = registry.NewClient

type UserCredentials struct {
	Username string
	Password string
}

func GetOCIRegistry(skipTLSVerify bool, plainHTTP bool, userCredentials *UserCredentials) (*registry.Client, error) {
	transport := http.DefaultTransport.(*http.Transport).Clone()
	dialer := &net.Dialer{Timeout: 30 * time.Second, KeepAlive: 30 * time.Second}
	transport.DialContext = func(ctx context.Context, network, addr string) (net.Conn, error) {
		return utils.DialPinnedContext(ctx, dialer, network, addr)
	}
	if skipTLSVerify {
		transport.TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
	}
	opts := []registry.ClientOption{
		registry.ClientOptDebug(false),
		registry.ClientOptHTTPClient(&http.Client{Transport: transport}),
	}
	if plainHTTP {
		opts = append(opts, registry.ClientOptPlainHTTP())
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
