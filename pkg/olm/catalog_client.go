package olm

import (
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/openshift/console/pkg/proxy"
)

type CatalogdClientInterface interface {
	FetchAll(catalog, baseUrl, ifModifiedSince string, maxAge time.Duration) (*http.Response, error)
}

// CatalogFetcher is responsible for fetching catalog data.
type CatalogdClient struct {
	httpClient  *http.Client
	proxyConfig *proxy.Config
}

func NewCatalogdClient(httpClient *http.Client, proxyConfig *proxy.Config) *CatalogdClient {
	return &CatalogdClient{
		httpClient:  httpClient,
		proxyConfig: proxyConfig,
	}
}

// FetchAll fetches fbc from the catalogd all endpoint
func (c *CatalogdClient) FetchAll(catalog, baseURL, ifModifiedSince string, maxAge time.Duration) (*http.Response, error) {
	var (
		requestURL string
		err        error
	)

	requestURL, err = c.buildCatalogdURL(catalog, baseURL, CatalogdAllEndpoint)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(http.MethodGet, requestURL, nil)
	if err != nil {
		return nil, err
	}

	if ifModifiedSince != "" {
		req.Header.Set("If-Modified-Since", ifModifiedSince)
		req.Header.Set("Cache-Control", fmt.Sprintf("max-age=%d", int64(maxAge.Seconds())))
	}
	return c.httpClient.Do(req)
}

func (c *CatalogdClient) buildCatalogdURL(catalog, baseURL, endpoint string) (string, error) {
	if c.proxyConfig != nil {
		return fmt.Sprintf("%s/catalogs/%s%s", c.proxyConfig.Endpoint.String(), catalog, endpoint), nil
	}
	if baseURL == "" {
		return "", fmt.Errorf("baseURL or proxy configuration is required")
	}
	return url.JoinPath(baseURL, endpoint)
}
