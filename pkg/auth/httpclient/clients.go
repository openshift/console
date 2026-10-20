package httpclient

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/openshift/library-go/pkg/network/httptransport"
	"k8s.io/apiserver/pkg/server/dynamiccertificates"
)

// Clients isolates issuer routing and trust from Kubernetes metadata discovery.
type Clients struct {
	Issuer *http.Client
	K8s    *http.Client

	providers []*dynamiccertificates.DynamicFileCAContent
}

type namedFile struct {
	name string
	path string
}

// New builds both clients and registers all CA listeners before Run can start.
// The issuer client trusts system roots plus the dynamically loaded issuer and
// proxy bundles. Kubernetes discovery uses only its static additional CA bundle.
func New(issuerCAFile, k8sCAFile string, proxy *ProxyConfig) (*Clients, error) {
	clients := &Clients{}

	var opts []httptransport.Option
	timeout := 5 * time.Second
	var caFiles []namedFile
	if len(issuerCAFile) > 0 {
		caFiles = append(caFiles, namedFile{name: "auth.oauthEndpointCAFile", path: issuerCAFile})
	}

	if proxy != nil {
		if err := proxy.Validate(); err != nil {
			return nil, fmt.Errorf("invalid proxy config: %w", err)
		}

		opts = append(opts, httptransport.WithProxyFunc(proxy.ProxyFunc()))
		timeout = 30 * time.Second
		if len(proxy.TrustedCAFilePath) > 0 {
			caFiles = append(caFiles, namedFile{name: "auth.proxy.trustedCAFilePath", path: proxy.TrustedCAFilePath})
		}
	}

	for _, caFile := range caFiles {
		provider, err := dynamiccertificates.NewDynamicCAContentFromFile(caFile.name, caFile.path)
		if err != nil {
			return nil, fmt.Errorf("loading %s at %q: %w", caFile.name, caFile.path, err)
		}

		clients.providers = append(clients.providers, provider)
		opts = append(opts, httptransport.WithCAContentProvider(provider))
	}

	issuerTransport, err := httptransport.NewRoundTripper(opts...)
	if err != nil {
		return nil, fmt.Errorf("creating issuer transport: %w", err)
	}

	k8sTransport, err := httptransport.NewRoundTripper(
		httptransport.WithCAFile("Kubernetes API CA", k8sCAFile),
	)
	if err != nil {
		return nil, fmt.Errorf("creating Kubernetes discovery transport: %w", err)
	}

	clients.Issuer = &http.Client{Transport: issuerTransport, Timeout: timeout}
	clients.K8s = &http.Client{Transport: k8sTransport, Timeout: 5 * time.Second}
	return clients, nil
}

// Run starts CA watchers and returns immediately. Cancel ctx to stop them.
func (c *Clients) Run(ctx context.Context) {
	for _, provider := range c.providers {
		go provider.Run(ctx, 1)
	}
}
