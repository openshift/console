package plugins

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path"
	"strings"

	"k8s.io/klog"

	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/pkg/serverconfig"
	"github.com/openshift/console/pkg/serverutils"
	oscrypto "github.com/openshift/library-go/pkg/crypto"
)

type PluginsHandler struct {
	Client             *http.Client
	PluginsEndpointMap map[string]string
	PublicDir          string
}

type PluginsProxyServiceHandler struct {
	ConsoleEndpoint string
	ProxyConfig     *proxy.Config
	Authorize       bool
}

func NewPluginsProxyServiceHandler(consoleEndpoint string, serviceEndpoint *url.URL, tlsClientConfig *tls.Config, authorize bool) *PluginsProxyServiceHandler {
	return &PluginsProxyServiceHandler{
		ConsoleEndpoint: consoleEndpoint,
		ProxyConfig: &proxy.Config{
			TLSClientConfig: tlsClientConfig,
			HeaderBlacklist: proxy.HeaderBlacklist,
			Endpoint:        serviceEndpoint,
		},
		Authorize: authorize,
	}
}

func NewPluginsHandler(client *http.Client, pluginsEndpointMap map[string]string, publicDir string) *PluginsHandler {
	return &PluginsHandler{
		Client:             client,
		PluginsEndpointMap: pluginsEndpointMap,
		PublicDir:          publicDir,
	}
}

func ParsePluginProxyConfig(proxyConfig string) (*serverconfig.Proxy, error) {
	pluginProxy := &serverconfig.Proxy{}
	err := json.Unmarshal([]byte(proxyConfig), pluginProxy)
	if err != nil {
		errMsg := fmt.Sprintf("Error unmarshaling ConsoleConfig proxy field: %v", err)
		klog.Error(errMsg)
		return nil, fmt.Errorf(errMsg)
	}
	return pluginProxy, nil
}

func GetPluginProxyServiceHandlers(proxyConfig *serverconfig.Proxy, defaultTLSConfig *tls.Config, pluginProxyEndpoint string) ([]*PluginsProxyServiceHandler, error) {
	var proxyServiceHandlers []*PluginsProxyServiceHandler
	for _, service := range proxyConfig.Services {
		pluginProxyTLS := defaultTLSConfig.Clone()
		// if case custom CA cert is defined use it instead of the default one
		if len(service.CACertificate) != 0 {
			customCA := x509.NewCertPool()
			pluginProxyTLS = oscrypto.SecureTLSConfig(&tls.Config{
				RootCAs: customCA,
			})
			if !pluginProxyTLS.RootCAs.AppendCertsFromPEM([]byte(service.CACertificate)) {
				errMsg := fmt.Sprintf("Error parsing CA cert for %s service", service.Endpoint)
				klog.Error(errMsg)
				return nil, fmt.Errorf(errMsg)
			}
		}
		serviceEndpoint, err := url.Parse(service.Endpoint)
		if err != nil {
			errMsg := fmt.Sprintf("Error parsing %q service endpoint", service.Endpoint)
			klog.Error(errMsg)
			return nil, fmt.Errorf(errMsg)
		}
		proxyServiceHandlers = append(proxyServiceHandlers, NewPluginsProxyServiceHandler(service.ConsoleAPIPath, serviceEndpoint, pluginProxyTLS, service.Authorize))
	}
	return proxyServiceHandlers, nil
}

func (p *PluginsHandler) HandleI18nResources(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		w.Header().Set("Allow", "GET")
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Method unsupported, the only supported methods is GET"})
		return
	}

	query := r.URL.Query()
	lang := query.Get("lng")
	// In case of the dynamic plugins, the namespace should contain name of the plugin prefixed with 'plugin__' prefix.
	// eg. 'plugin__helm' will fetch `locales/{lang}/plugin__helm.json` from the plugin service
	namespace := query.Get("ns")
	if lang == "" || namespace == "" {
		errMsg := fmt.Sprintf("GET request %q is missing 'lng' or 'ns' query parameter", r.URL.String())
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	if !strings.HasPrefix(namespace, "plugin__") {
		http.ServeFile(w, r, path.Join(p.PublicDir, "locales", lang, fmt.Sprintf("%s.json", namespace)))
		return
	}
	// In case of dynamic-plugin we need to trim the "plugin__" prefix, since we are using the ConsolePlugin CR's name
	// as key when looking for the plugin's Service endpoint.
	pluginName := strings.TrimPrefix(namespace, "plugin__")

	pluginServiceRequestURL, err := p.getServiceRequestURL(pluginName)
	if err != nil {
		errMsg := err.Error()
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: errMsg})
		return
	}
	pluginServiceRequestURL.Path = path.Join(pluginServiceRequestURL.Path, "locales", lang, fmt.Sprintf("%s.json", namespace))

	p.proxyPluginRequest(pluginServiceRequestURL, pluginName, w, r)
}

func (p *PluginsHandler) HandlePluginAssets(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		w.Header().Set("Allow", "GET")
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Method unsupported, the only supported methods is GET"})
		return
	}
	pluginName, pluginAssetPath := parsePluginNameAndAssetPath(r.URL.Path)
	pluginServiceRequestURL, err := p.getServiceRequestURL(pluginName)
	if err != nil {
		errMsg := err.Error()
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: errMsg})
		return
	}
	pluginServiceRequestURL.Path = path.Join(pluginServiceRequestURL.Path, pluginAssetPath)

	p.proxyPluginRequest(pluginServiceRequestURL, pluginName, w, r)
}

func (p *PluginsHandler) proxyPluginRequest(requestURL *url.URL, pluginName string, w http.ResponseWriter, orignalRequest *http.Request) {
	newRequest, err := http.NewRequest("GET", requestURL.String(), nil)
	if err != nil {
		errMsg := fmt.Sprintf("failed to create GET request for %q plugin: %v", pluginName, err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: errMsg})
		return
	}

	proxy.CopyRequestHeaders(orignalRequest, newRequest)

	resp, err := p.Client.Do(newRequest)
	if err != nil {
		errMsg := fmt.Sprintf("GET request for %q plugin failed: %v", pluginName, err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: errMsg})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		errMsg := fmt.Sprintf("GET request for %q plugin failed with %d status code", pluginName, resp.StatusCode)
		klog.Error(errMsg)
		serverutils.SendResponse(w, resp.StatusCode, serverutils.ApiError{Err: errMsg})
		return
	}

	// filter unwanted headers from the response
	proxy.FilterHeaders(resp)
	// copy headers from the plugin's server response
	for key, value := range resp.Header {
		for _, v := range value {
			w.Header().Add(key, v)
		}
	}

	_, err = io.Copy(w, resp.Body)
	if err != nil {
		errMsg := fmt.Sprintf("failed sending HTTP response body from %q plugin: %v", pluginName, err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: errMsg})
		return
	}
}

func (p *PluginsHandler) HandleCheckUpdates(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		w.Header().Set("Allow", "GET")
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Method unsupported, the only supported methods is GET"})
		return
	}
	pluginsList := make([]string, 0, len(p.PluginsEndpointMap))
	for k := range p.PluginsEndpointMap {
		pluginsList = append(pluginsList, k)
	}
	serverutils.SendResponse(w, http.StatusOK, struct {
		ConsoleCommit string   `json:"consoleCommit"`
		Plugins       []string `json:"plugins"`
	}{
		ConsoleCommit: os.Getenv("SOURCE_GIT_COMMIT"),
		Plugins:       pluginsList,
	})
}

func (p *PluginsHandler) getServiceRequestURL(pluginName string) (*url.URL, error) {
	pluginEndpoint, ok := p.PluginsEndpointMap[pluginName]
	if !ok {
		return nil, fmt.Errorf("failed to get endpoint for %q plugin", pluginName)
	}
	serviceRequestURL, err := url.Parse(pluginEndpoint)
	if err != nil {
		return nil, fmt.Errorf("failed to parse %q endpoint for %q plugin", pluginEndpoint, pluginName)
	}
	return serviceRequestURL, nil
}

// parsePluginNameAndAssetPath will parse the plugin name and the asset path from the
// eg. `/api/plugins/console-demo-plugin/plugin-manifest.json`
// - handler itself will remove  `api/plugins/` prefix from the request
// - `console-demo-plugin/plugin-manifest.json` will be parsed by this function, where
// the first part is the plugin name and the rest is the path to the requested asset.
func parsePluginNameAndAssetPath(urlPath string) (string, string) {
	nameAndAssetPath := strings.SplitN(urlPath, "/", 2)
	if len(nameAndAssetPath) < 2 {
		return nameAndAssetPath[0], ""
	}
	return nameAndAssetPath[0], nameAndAssetPath[1]
}
