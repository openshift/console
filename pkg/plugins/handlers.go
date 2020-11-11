package plugins

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path"
	"strings"

	"k8s.io/klog"

	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/pkg/serverutils"
)

type PluginsHandler struct {
	Client             *http.Client
	PluginsEndpointMap map[string]string
}

func NewPluginsHandler(client *http.Client, token string, pluginsEndpointMap map[string]string) *PluginsHandler {
	return &PluginsHandler{
		Client:             client,
		PluginsEndpointMap: pluginsEndpointMap,
	}
}

func (p *PluginsHandler) HandlePlugins(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		w.Header().Set("Allow", "GET")
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Method unsupported, the only supported methods is GET"})
		return
	}
	pluginName, pluginAssetPath := parsePluginNameAndAssetPath(r.URL.Path)
	serviceRequestURL, err := p.getServiceRequestURL(pluginName)
	if err != nil {
		errMsg := err.Error()
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: errMsg})
		return
	}
	serviceRequestURL.Path = path.Join(serviceRequestURL.Path, pluginAssetPath)

	resp, err := p.Client.Get(serviceRequestURL.String())
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
