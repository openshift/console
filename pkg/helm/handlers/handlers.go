package handlers

import (
	"encoding/json"
	"fmt"
	"github.com/openshift/console/pkg/helm/chartproxy"

	"net/http"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/helm/actions"
	"github.com/openshift/console/pkg/serverutils"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/release"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/yaml"
)

func New(apiUrl string, transport http.RoundTripper) *helmHandlers {
	h := &helmHandlers{
		ApiServerHost:           apiUrl,
		Transport:               transport,
		getActionConfigurations: actions.GetActionConfigurations,
		renderManifests:         actions.RenderManifests,
		installChart:            actions.InstallChart,
		listReleases:            actions.ListReleases,
		getRelease:              actions.GetRelease,
		getChart:                actions.GetChart,
		upgradeRelease:          actions.UpgradeRelease,
		uninstallRelease:        actions.UninstallRelease,
		rollbackRelease:         actions.RollbackRelease,
		getReleaseHistory:       actions.GetReleaseHistory,
	}
	h.newProxy = func(bearerToken string) (getter chartproxy.Proxy, err error) {
		return chartproxy.New(func() (*rest.Config, error) {
			return h.restConfig(bearerToken), nil
		})
	}
	return h
}

// helmHandlers provides handlers to handle helm related requests
type helmHandlers struct {
	ApiServerHost string
	Transport     http.RoundTripper

	// helm action configurator
	getActionConfigurations func(string, string, string, *http.RoundTripper) *action.Configuration

	// helm actions
	renderManifests   func(string, string, map[string]interface{}, *action.Configuration) (string, error)
	installChart      func(string, string, string, map[string]interface{}, *action.Configuration) (*release.Release, error)
	listReleases      func(*action.Configuration) ([]*release.Release, error)
	upgradeRelease    func(string, string, string, map[string]interface{}, *action.Configuration) (*release.Release, error)
	uninstallRelease  func(string, *action.Configuration) (*release.UninstallReleaseResponse, error)
	rollbackRelease   func(string, int, *action.Configuration) (*release.Release, error)
	getRelease        func(string, *action.Configuration) (*release.Release, error)
	getChart          func(chartUrl string, conf *action.Configuration) (*chart.Chart, error)
	getReleaseHistory func(releaseName string, conf *action.Configuration) ([]*release.Release, error)
	newProxy          func(bearerToken string) (chartproxy.Proxy, error)
}

func (h *helmHandlers) restConfig(bearerToken string) *rest.Config {
	return &rest.Config{
		Host:        h.ApiServerHost,
		BearerToken: bearerToken,
		Transport:   h.Transport,
	}
}

func (h *helmHandlers) HandleHelmRenderManifests(user *auth.User, w http.ResponseWriter, r *http.Request) {
	var req HelmRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	conf := h.getActionConfigurations(h.ApiServerHost, req.Namespace, user.Token, &h.Transport)
	resp, err := h.renderManifests(req.Name, req.ChartUrl, req.Values, conf)
	if err != nil {
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: fmt.Sprintf("Failed to render manifests: %v", err)})
		return
	}

	w.Header().Set("Content-Type", "text/yaml")
	w.Write([]byte(resp))
}

func (h *helmHandlers) HandleHelmInstall(user *auth.User, w http.ResponseWriter, r *http.Request) {
	var req HelmRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: fmt.Sprintf("Failed to parse request: %v", err)})
		return
	}

	conf := h.getActionConfigurations(h.ApiServerHost, req.Namespace, user.Token, &h.Transport)
	resp, err := h.installChart(req.Namespace, req.Name, req.ChartUrl, req.Values, conf)
	if err != nil {
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: fmt.Sprintf("Failed to install helm chart: %v", err)})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	res, _ := json.Marshal(resp)
	w.Write(res)
}

func (h *helmHandlers) HandleHelmList(user *auth.User, w http.ResponseWriter, r *http.Request) {
	params := r.URL.Query()
	ns := params.Get("ns")

	conf := h.getActionConfigurations(h.ApiServerHost, ns, user.Token, &h.Transport)
	resp, err := h.listReleases(conf)
	if err != nil {
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: fmt.Sprintf("Failed to list helm releases: %v", err)})
		return
	}

	w.Header().Set("Content-Type", "application/json")

	res, _ := json.Marshal(resp)
	w.Write(res)
}

func (h *helmHandlers) HandleGetRelease(user *auth.User, w http.ResponseWriter, r *http.Request) {
	queryParams := r.URL.Query()
	ns := queryParams.Get("ns")
	chartName := queryParams.Get("name")

	conf := h.getActionConfigurations(h.ApiServerHost, ns, user.Token, &h.Transport)
	release, err := h.getRelease(chartName, conf)
	if err != nil {
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: fmt.Sprintf("Failed to find helm release: %v", err)})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	rawManifest, err := json.Marshal(release)
	if err != nil {
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: fmt.Sprintf("Failed to find helm release: %v", err)})
		return
	}
	w.Write(rawManifest)
}

func (h *helmHandlers) HandleChartGet(user *auth.User, w http.ResponseWriter, r *http.Request) {
	params := r.URL.Query()
	chartUrl := params.Get("url")

	// scope request to default namespace
	conf := h.getActionConfigurations(h.ApiServerHost, "default", user.Token, &h.Transport)
	resp, err := h.getChart(chartUrl, conf)
	if err != nil {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: fmt.Sprintf("Failed to retrieve chart: %v", err)})
		return
	}

	w.Header().Set("Content-Type", "application/json")

	res, _ := json.Marshal(resp)
	w.Write(res)
}

func (h *helmHandlers) HandleUpgradeRelease(user *auth.User, w http.ResponseWriter, r *http.Request) {
	var req HelmRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: fmt.Sprintf("Failed to parse request: %v", err)})
		return
	}

	conf := h.getActionConfigurations(h.ApiServerHost, req.Namespace, user.Token, &h.Transport)
	resp, err := h.upgradeRelease(req.Namespace, req.Name, req.ChartUrl, req.Values, conf)
	if err != nil {
		if err.Error() == actions.ErrReleaseRevisionNotFound.Error() {
			serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{Err: fmt.Sprintf("Failed to rollback helm releases: %v", err)})
			return
		}
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: fmt.Sprintf("Failed to upgrade helm release: %v", err)})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	res, _ := json.Marshal(resp)
	w.Write(res)
}

func (h *helmHandlers) HandleUninstallRelease(user *auth.User, w http.ResponseWriter, r *http.Request) {
	params := r.URL.Query()
	ns := params.Get("ns")
	rel := params.Get("name")

	conf := h.getActionConfigurations(h.ApiServerHost, ns, user.Token, &h.Transport)
	resp, err := h.uninstallRelease(rel, conf)
	if err != nil {
		if err.Error() == actions.ErrReleaseNotFound.Error() {
			serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{Err: fmt.Sprintf("Failed to uninstall helm release: %v", err)})
			return
		}
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: fmt.Sprintf("Failed to uninstall helm release: %v", err)})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	res, _ := json.Marshal(resp)
	w.Write(res)
}

func (h *helmHandlers) HandleRollbackRelease(user *auth.User, w http.ResponseWriter, r *http.Request) {
	var req HelmRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: fmt.Sprintf("Failed to parse request: %v", err)})
		return
	}

	conf := h.getActionConfigurations(h.ApiServerHost, req.Namespace, user.Token, &h.Transport)
	rel, err := h.rollbackRelease(req.Name, req.Version, conf)
	if err != nil {
		if err.Error() == actions.ErrReleaseRevisionNotFound.Error() {
			serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{Err: fmt.Sprintf("Failed to rollback helm releases: %v", err)})
			return
		}
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: fmt.Sprintf("Failed to rollback helm releases: %v", err)})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	res, _ := json.Marshal(rel)
	w.Write(res)
}

func (h *helmHandlers) HandleGetReleaseHistory(user *auth.User, w http.ResponseWriter, r *http.Request) {
	params := r.URL.Query()
	name := params.Get("name")
	ns := params.Get("ns")
	conf := h.getActionConfigurations(h.ApiServerHost, ns, user.Token, &h.Transport)
	rels, err := h.getReleaseHistory(name, conf)
	if err != nil {
		if err.Error() == actions.ErrReleaseNotFound.Error() {
			serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{Err: fmt.Sprintf("Failed to list helm release history: %v", err)})
			return
		}
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: fmt.Sprintf("Failed to list helm release history: %v", err)})
		return
	}
	res, _ := json.Marshal(rels)
	w.Header().Set("Content-Type", "application/json")
	w.Write(res)
}

func (h *helmHandlers) HandleIndexFile(user *auth.User, w http.ResponseWriter, r *http.Request) {
	proxy, err := h.newProxy(user.Token)

	if err != nil {
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: fmt.Sprintf("Failed to get k8s config: %v", err)})
		return
	}

	w.Header().Set("Content-Type", "application/yaml")
	w.Header().Set("Cache-Control", "no-store, must-revalidate")

	indexFile, err := proxy.IndexFile()

	if err != nil {
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: fmt.Sprintf("Failed to get index file: %v", err)})
		return
	}

	out, err := yaml.Marshal(indexFile)

	if err != nil {
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: fmt.Sprintf("Failed to deserialize index file to yaml: %v", err)})
		return
	}

	w.Write(out)
}
