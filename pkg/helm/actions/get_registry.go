package actions

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"time"

	"helm.sh/helm/v4/pkg/registry"

	"github.com/openshift/console/pkg/helm/utils"
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
		registry.ClientOptHTTPClient(&http.Client{Transport: ociTransport(skipTLSVerify)}),
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

// ociTransport is the HTTP transport used for registry requests. The dial is
// pinned to an address from one lookup. The destination is checked before a
// proxy is selected, including after a redirect, because a configured proxy
// is the address DialContext receives.
func ociTransport(skipTLSVerify bool) *http.Transport {
	transport := http.DefaultTransport.(*http.Transport).Clone()
	dialer := &net.Dialer{Timeout: 30 * time.Second, KeepAlive: 30 * time.Second}
	transport.DialContext = func(ctx context.Context, network, addr string) (net.Conn, error) {
		return utils.DialPinnedContext(ctx, dialer, network, addr)
	}
	if skipTLSVerify {
		transport.TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
	}
	proxy := transport.Proxy
	if proxy == nil {
		proxy = http.ProxyFromEnvironment
	}
	transport.Proxy = func(req *http.Request) (*url.URL, error) {
		if err := validateOCIRegistryRequest(req); err != nil {
			return nil, err
		}
		return proxy(req)
	}
	return transport
}

// validateOCIRegistryRequest rejects a registry request whose host is
// disallowed.
func validateOCIRegistryRequest(req *http.Request) error {
	if req == nil || req.URL == nil {
		return errors.New("nil registry URL")
	}
	if utils.RequestHostDisallowed(req) {
		return utils.ErrDisallowedHost
	}
	return nil
}
