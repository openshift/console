package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/helm/actions"
	"github.com/openshift/console/pkg/helm/chartproxy"
	"github.com/openshift/console/pkg/helm/chartverifier"
	"github.com/openshift/console/pkg/serverutils"
	"github.com/openshift/console/pkg/version"
	"helm.sh/helm/v3/pkg/action"
	"k8s.io/client-go/rest"
)

// helmHandlers provides handlers to handle helm related requests
type verifierHandlers struct {
	ApiServerHost           string
	Transport               http.RoundTripper
	getActionConfigurations func(string, string, string, *http.RoundTripper) *action.Configuration
	newProxy                func(bearerToken string) (chartproxy.Proxy, error)
	chartVerifier           func(charturl string, values map[string]interface{}, conf *action.Configuration) (string, error)
}

func NewVerifierHandler(apiUrl string, transport http.RoundTripper, kubeversionGetter version.KubeVersionGetter) *verifierHandlers {
	h := &verifierHandlers{
		ApiServerHost:           apiUrl,
		Transport:               transport,
		getActionConfigurations: actions.GetActionConfigurations,
		chartVerifier:           chartverifier.ChartVerifier,
	}

	h.newProxy = func(bearerToken string) (getter chartproxy.Proxy, err error) {
		return chartproxy.New(func() (*rest.Config, error) {
			return h.restConfig(bearerToken), nil
		}, kubeversionGetter)
	}

	return h
}
func (h *verifierHandlers) restConfig(bearerToken string) *rest.Config {
	return &rest.Config{
		Host:        h.ApiServerHost,
		BearerToken: bearerToken,
		Transport:   h.Transport,
	}
}
func (h *verifierHandlers) HandleChartVerifier(user *auth.User, w http.ResponseWriter, r *http.Request) {
	var req HelmVerifierRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: fmt.Sprintf("Failed to parse request: %v", err)})
		return
	}
	conf := h.getActionConfigurations(h.ApiServerHost, "default", user.Token, &h.Transport)
	resp, err := h.chartVerifier(req.ChartUrl, req.Values, conf)
	if err != nil {
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: fmt.Sprintf("Failed to verify chart: %v", err)})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(resp))
}
