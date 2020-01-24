package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/coreos/pkg/capnslog"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/helm/actions"
	"github.com/openshift/console/pkg/serverutils"
)

var (
	plog = capnslog.NewPackageLogger("github.com/openshift/console", "helm")
)

// HelmHandlers provides handlers to handle helm related requests
type HelmHandlers struct {
	ApiServerHost string
	Transport     http.RoundTripper
}

func (h *HelmHandlers) HandleHelmRenderManifests(user *auth.User, w http.ResponseWriter, r *http.Request) {
	var req HelmRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	conf := actions.GetActionConfigurations(h.ApiServerHost, req.Namespace, user.Token, &h.Transport)
	resp, err := actions.RenderManifests(req.Name, req.ChartUrl, req.Values, conf)
	if err != nil {
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{fmt.Sprintf("Failed to render manifests: %v", err)})
	}

	w.Header().Set("Content-Type", "text/yaml")
	w.Write([]byte(resp))
}

func (h *HelmHandlers) HandleHelmInstall(user *auth.User, w http.ResponseWriter, r *http.Request) {
	var req HelmRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{fmt.Sprintf("Failed to parse request: %v", err)})
		return
	}

	conf := actions.GetActionConfigurations(h.ApiServerHost, req.Namespace, user.Token, &h.Transport)
	resp, err := actions.InstallChart(req.Namespace, req.Name, req.ChartUrl, req.Values, conf)
	if err != nil {
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{fmt.Sprintf("Failed to install helm chart: %v", err)})
	}

	w.Header().Set("Content-Type", "application/json")
	res, _ := json.Marshal(resp)
	w.Write(res)
}

func (h *HelmHandlers) HandleHelmList(user *auth.User, w http.ResponseWriter, r *http.Request) {
	params := r.URL.Query()
	ns := params.Get("ns")

	conf := actions.GetActionConfigurations(h.ApiServerHost, ns, user.Token, &h.Transport)
	resp, err := actions.ListReleases(conf)
	if err != nil {
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{fmt.Sprintf("Failed to list helm releases: %v", err)})
	}

	w.Header().Set("Content-Type", "application/json")

	res, _ := json.Marshal(resp)
	w.Write(res)
}
