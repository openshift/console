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
	"regexp"
	"slices"
	"strings"

	"k8s.io/klog/v2"

	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/pkg/serverconfig"
	"github.com/openshift/console/pkg/serverutils"
	oscrypto "github.com/openshift/library-go/pkg/crypto"
)

// i18nResourceNameRegexp restricts the user-supplied 'lng' and 'ns' query
// parameters to simple identifiers. Legitimate values are locale codes (e.g.
// "en", "zh-CN") and namespace names (e.g. "public", "plugin__helm"), none of
// which contain path separators or "." segments. Rejecting anything else
// prevents path traversal both when serving local translation files and when
// building the request path proxied to a plugin service.
var i18nResourceNameRegexp = regexp.MustCompile(`^[A-Za-z0-9_-]+$`)

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
			// The Origin header can trigger CORS checks automatically for some HTTP servers,
			// causing requests to fail. We already perform CSRF token checks in the console middleware
			// before forwarding requests to the plugin, so there is no CSRF exposure.
			HeaderBlacklist: []string{"Cookie", "X-CSRFToken", "Origin"},
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
		err := fmt.Errorf("error unmarshaling ConsoleConfig proxy field: %w", err)
		klog.Error(err.Error())
		return nil, err
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
				err := fmt.Errorf("failed to parse CA cert for %q service", service.Endpoint)
				klog.Error(err.Error())
				return nil, err
			}
		}
		serviceEndpoint, err := url.Parse(service.Endpoint)
		if err != nil {
			err := fmt.Errorf("failed to parse service endpoint %q: %w", service.Endpoint, err)
			klog.Error(err.Error())
			return nil, err
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

	// Reject values containing path separators or "." segments before they are
	// used to build a filesystem path or a plugin-service request path. Without
	// this, "lng" or "ns" values such as "../../.." allow reading arbitrary
	// *.json files from the pod or traversing against a plugin backend.
	if !i18nResourceNameRegexp.MatchString(lang) || !i18nResourceNameRegexp.MatchString(namespace) {
		errMsg := fmt.Sprintf("GET request %q has an invalid 'lng' or 'ns' query parameter", r.URL.String())
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	if !strings.HasPrefix(namespace, "plugin__") {
		// Serve the translation file confined to PublicDir/locales via os.Root so
		// that, even if the validation above is ever loosened, the open cannot
		// escape the locales directory. See https://go.dev/blog/osroot.
		localesRoot, err := os.OpenRoot(path.Join(p.PublicDir, "locales"))
		if err != nil {
			klog.Errorf("failed to open locales directory: %v", err)
			serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{Err: "locale resource not found"})
			return
		}
		defer localesRoot.Close()

		file, err := localesRoot.Open(path.Join(lang, fmt.Sprintf("%s.json", namespace)))
		if err != nil {
			klog.Errorf("failed to open locale resource %q/%q: %v", lang, namespace, err)
			serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{Err: "locale resource not found"})
			return
		}
		defer file.Close()

		stat, err := file.Stat()
		if err != nil || stat.IsDir() {
			serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{Err: "locale resource not found"})
			return
		}

		http.ServeContent(w, r, stat.Name(), stat.ModTime(), file)
		return
	}
	// In case of dynamic-plugin we need to trim the "plugin__" prefix, since we are using the ConsolePlugin CR's name
	// as key when looking for the plugin's Service endpoint.
	pluginName := strings.TrimPrefix(namespace, "plugin__")

	pluginServiceRequestURL, err := p.getServiceRequestURL(pluginName)
	if err != nil {
		errMsg := err.Error()
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{Err: errMsg})
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

	// Reject asset paths containing ".." segments before they are joined into
	// the plugin-service request path. path.Join cleans "..", so a value such as
	// "console-demo-plugin/../../foo" would otherwise resolve above the plugin's
	// asset root and let an authenticated user traverse against the plugin
	// backend. Mirrors the confinement applied to i18n resource requests.
	if !isSafeAssetPath(pluginAssetPath) {
		errMsg := fmt.Sprintf("GET request %q has an invalid asset path", r.URL.String())
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	pluginServiceRequestURL, err := p.getServiceRequestURL(pluginName)
	if err != nil {
		errMsg := err.Error()
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{Err: errMsg})
		return
	}
	pluginServiceRequestURL.Path = path.Join(pluginServiceRequestURL.Path, pluginAssetPath)

	p.proxyPluginRequest(pluginServiceRequestURL, pluginName, w, r)
}

// isSafeAssetPath reports whether an asset path is safe to append to a plugin
// service URL. It rejects absolute paths and any path containing a ".." segment,
// which would otherwise allow traversal above the plugin's asset root after
// path.Join cleans the result. An empty path is allowed (it addresses the
// plugin service root).
func isSafeAssetPath(assetPath string) bool {
	if assetPath == "" {
		return true
	}
	if strings.HasPrefix(assetPath, "/") {
		return false
	}
	return !slices.Contains(strings.Split(assetPath, "/"), "..")
}

func (p *PluginsHandler) proxyPluginRequest(requestURL *url.URL, pluginName string, w http.ResponseWriter, originalRequest *http.Request) {
	newRequest, err := http.NewRequest("GET", requestURL.String(), nil)
	if err != nil {
		errMsg := fmt.Sprintf("failed to create GET request for %q plugin: %v", pluginName, err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: errMsg})
		return
	}

	newRequest.Header = originalRequest.Header.Clone()
	for _, h := range []string{"Cookie", "X-CSRFToken"} {
		newRequest.Header.Del(h)
	}

	resp, err := p.Client.Do(newRequest)
	if err != nil {
		errMsg := fmt.Sprintf("failed to send GET request for %q plugin: %v", pluginName, err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: errMsg})
		return
	}
	defer resp.Body.Close()

	// filter unwanted headers from the response
	proxy.FilterHeaders(resp)
	// copy headers from the plugin's server response
	for key, value := range resp.Header {
		for _, v := range value {
			w.Header().Add(key, v)
		}
	}

	// Make sure to copy status code from the plugin service response
	w.WriteHeader(resp.StatusCode)

	_, err = io.Copy(w, resp.Body)
	if err != nil {
		errMsg := fmt.Sprintf("failed sending HTTP response body from %q plugin: %v", pluginName, err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: errMsg})
		return
	}
}

func (p *PluginsHandler) GetPluginsList() []string {
	pluginsList := make([]string, 0, len(p.PluginsEndpointMap))
	for k := range p.PluginsEndpointMap {
		pluginsList = append(pluginsList, k)
	}
	return pluginsList
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
