package server

import (
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"
	"time"

	"golang.org/x/net/context"

	bootcfg "github.com/coreos/coreos-baremetal/bootcfg/client"
	"github.com/coreos/coreos-baremetal/bootcfg/server/serverpb"
)

var (
	defaultTimeout = 30 * time.Second
)

// BootcfgConfig configures a bootcfg client with PEM encoded TLS credentials.
type BootcfgConfig struct {
	Endpoint   string
	CA         []byte
	ClientCert []byte
	ClientKey  []byte
}

// BootcfgClient allows Cluster manifests to be written to the bootcfg service.
type BootcfgClient struct {
	client *bootcfg.Client
}

// NewBootcfgClient returns a new BootcfgClient.
func NewBootcfgClient(config *BootcfgConfig) (*BootcfgClient, error) {
	tlscfg, err := tlsConfig(config.CA, config.ClientCert, config.ClientKey)
	if err != nil {
		return nil, err
	}
	client, err := bootcfg.New(&bootcfg.Config{
		Endpoints:   []string{config.Endpoint},
		DialTimeout: defaultTimeout,
		TLS:         tlscfg,
	})
	if err != nil {
		return nil, err
	}
	return &BootcfgClient{
		client: client,
	}, nil
}

// Close closes the client's connections.
func (c *BootcfgClient) Close() error {
	return c.client.Close()
}

// ClusterManifests writes a Cluster's machine profiles, groups, and templates
// to the bootcfg service. Repeated writes are idempotent.
func (c *BootcfgClient) ClusterManifests(ctx context.Context, cluster Cluster) error {
	// TODO: Parallelize
	ctx, _ = context.WithTimeout(ctx, defaultTimeout)
	for _, profile := range cluster.Profiles() {
		_, err := c.client.Profiles.ProfilePut(ctx, &serverpb.ProfilePutRequest{Profile: profile})
		if err != nil {
			return err
		}
	}

	groups, err := cluster.Groups()
	if err != nil {
		return err
	}
	for _, group := range groups {
		_, err := c.client.Groups.GroupPut(ctx, &serverpb.GroupPutRequest{Group: group})
		if err != nil {
			return err
		}
	}

	for _, asset := range cluster.IgnitionTemplates() {
		_, err := c.client.Ignition.IgnitionPut(ctx, &serverpb.IgnitionPutRequest{
			Name:   asset.Name(),
			Config: asset.Data(),
		})
		if err != nil {
			return err
		}
	}

	return nil
}

// tlsConfig returns a bootcfg client TLS.Config.
func tlsConfig(bootcfgCA, clientCert, clientKey []byte) (*tls.Config, error) {
	// certificate authority for verifying the server
	pool := x509.NewCertPool()
	ok := pool.AppendCertsFromPEM(bootcfgCA)
	if !ok {
		return nil, errors.New("no PEM certificates were parsed")
	}

	// client certificate for authentication
	cert, err := tls.X509KeyPair(clientCert, clientKey)
	if err != nil {
		return nil, err
	}

	return &tls.Config{
		MinVersion: tls.VersionTLS12,
		// CA bundle the client should trust when verifying the server
		RootCAs: pool,
		// Client certificate to authenticate to the server
		Certificates: []tls.Certificate{cert},
	}, nil
}

// ignitionPath returns the Ignition endpoint client machines should use as a
// kernel argument.
func ignitionPath(endpoint string) string {
	return fmt.Sprintf("http://%s/ignition?uuid=${uuid}&mac=${net0/mac:hexhyp}", endpoint)
}

// coreosAssetsPath returns the a bootcfg instance's CoreOS assets endpoint,
// suitable for use as a baseurl by the CoreOS installer.
func coreosAssetsPath(endpoint string) string {
	return fmt.Sprintf("http://%s/assets/coreos", endpoint)
}
