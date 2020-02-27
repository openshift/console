package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/coreos/pkg/capnslog"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/release"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/helm/actions"
	"github.com/openshift/console/pkg/serverutils"
)

var (
	plog = capnslog.NewPackageLogger("github.com/openshift/console", "helm")
)

func New(apiUrl string, transport http.RoundTripper) *helmHandlers {
	return &helmHandlers{
		ApiServerHost:           apiUrl,
		Transport:               transport,
		getActionConfigurations: actions.GetActionConfigurations,
		renderManifests:         actions.RenderManifests,
		installChart:            actions.InstallChart,
		listReleases:            actions.ListReleases,
		getRelease:              actions.GetRelease,
	}
}

// helmHandlers provides handlers to handle helm related requests
type helmHandlers struct {
	ApiServerHost string
	Transport     http.RoundTripper

	// helm action configurator
	getActionConfigurations func(string, string, string, *http.RoundTripper) *action.Configuration

	// helm actions
	renderManifests func(string, string, map[string]interface{}, *action.Configuration) (string, error)
	installChart    func(string, string, string, map[string]interface{}, *action.Configuration) (*release.Release, error)
	listReleases    func(*action.Configuration) ([]*release.Release, error)
	getRelease      func(releaseName string, conf *action.Configuration) (*release.Release, error)
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
	chartName := queryParams.Get("release_name")

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
