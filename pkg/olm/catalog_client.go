package olm

import (
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/openshift/console/pkg/proxy"
	"k8s.io/klog/v2"
)

type CatalogdClientInterface interface {
	FetchAll(catalog, baseUrl, ifModifiedSince string, maxAge time.Duration) (*http.Response, error)
	FetchMetas(catalogName string, baseURL string, r *http.Request) (*http.Response, error)
	FetchPackageIcon(catalog, baseURL, packageName string) (*http.Response, error)
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

// FetchMetas fetches fbc from the catalogd metas endpoint
func (c *CatalogdClient) FetchMetas(catalog string, baseURL string, r *http.Request) (*http.Response, error) {
	var (
		requestURL string
		err        error
	)

	requestURL, err = c.buildCatalogdURL(catalog, baseURL, CatalogdMetasEndpoint)
	if err != nil {
		return nil, err
	}

	query := r.URL.Query()
	queryParams := query.Encode()

	if queryParams != "" {
		requestURL = fmt.Sprintf("%s?%s", requestURL, queryParams)
	}

	req, err := http.NewRequest(r.Method, requestURL, nil)
	if err != nil {
		return nil, err
	}

	klog.V(4).Infof("%s %s", req.Method, req.URL.String())
	return c.httpClient.Do(req)
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

// FetchPackageIcon fetches package metadata from catalogd to extract icon data.
// It queries the metas endpoint with schema=olm.package and name=packageName filters.
func (c *CatalogdClient) FetchPackageIcon(catalog, baseURL, packageName string) (*http.Response, error) {
	requestURL, err := c.buildCatalogdURL(catalog, baseURL, CatalogdMetasEndpoint)
	if err != nil {
		return nil, err
	}

	// Add query parameters to filter for the specific package
	parsedURL, err := url.Parse(requestURL)
	if err != nil {
		return nil, err
	}
	query := parsedURL.Query()
	query.Set("schema", "olm.package")
	query.Set("name", packageName)
	parsedURL.RawQuery = query.Encode()

	req, err := http.NewRequest(http.MethodGet, parsedURL.String(), nil)
	if err != nil {
		return nil, err
	}

	klog.V(4).Infof("Fetching package icon: %s %s", req.Method, req.URL.String())
	return c.httpClient.Do(req)
}
