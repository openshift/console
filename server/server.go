package server

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"net/url"
	"os"
	"path"

	"github.com/coreos/dex/api"
	"github.com/coreos/pkg/capnslog"
	"github.com/coreos/pkg/health"

	"github.com/openshift/console/auth"
	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/version"

	"github.com/gorilla/handlers"
)

const (
	indexPageTemplateName     = "index.html"
	tokenizerPageTemplateName = "tokener.html"

	authLoginEndpoint              = "/auth/login"
	AuthLoginCallbackEndpoint      = "/auth/callback"
	AuthLoginSuccessEndpoint       = "/"
	AuthLoginErrorEndpoint         = "/error"
	authLogoutEndpoint             = "/auth/logout"
	k8sProxyEndpoint               = "/api/kubernetes/"
	prometheusProxyEndpoint        = "/api/prometheus"
	prometheusTenancyProxyEndpoint = "/api/prometheus-tenancy"
	alertManagerProxyEndpoint      = "/api/alertmanager"
)

var (
	plog = capnslog.NewPackageLogger("github.com/openshift/console", "server")
)

type jsGlobals struct {
	ConsoleVersion           string `json:"consoleVersion"`
	AuthDisabled             bool   `json:"authDisabled"`
	KubectlClientID          string `json:"kubectlClientID"`
	BasePath                 string `json:"basePath"`
	LoginURL                 string `json:"loginURL"`
	LoginSuccessURL          string `json:"loginSuccessURL"`
	LoginErrorURL            string `json:"loginErrorURL"`
	LogoutURL                string `json:"logoutURL"`
	LogoutRedirect           string `json:"logoutRedirect"`
	KubeAdminLogoutURL       string `json:"kubeAdminLogoutURL"`
	KubeAPIServerURL         string `json:"kubeAPIServerURL"`
	PrometheusBaseURL        string `json:"prometheusBaseURL"`
	PrometheusTenancyBaseURL string `json:"prometheusTenancyBaseURL"`
	AlertManagerBaseURL      string `json:"alertManagerBaseURL"`
	Branding                 string `json:"branding"`
	DocumentationBaseURL     string `json:"documentationBaseURL"`
	GoogleTagManagerID       string `json:"googleTagManagerID"`
	LoadTestFactor           int    `json:"loadTestFactor"`
}

type Server struct {
	K8sProxyConfig       *proxy.Config
	BaseURL              *url.URL
	LogoutRedirect       *url.URL
	PublicDir            string
	TectonicVersion      string
	TectonicCACertFile   string
	Auther               *auth.Authenticator
	StaticUser           *auth.User
	KubectlClientID      string
	KubeAPIServerURL     string
	DocumentationBaseURL *url.URL
	Branding             string
	GoogleTagManagerID   string
	LoadTestFactor       int
	DexClient            api.DexClient
	// A client with the correct TLS setup for communicating with the API server.
	K8sClient                    *http.Client
	PrometheusProxyConfig        *proxy.Config
	PrometheusTenancyProxyConfig *proxy.Config
	AlertManagerProxyConfig      *proxy.Config
}

func (s *Server) authDisabled() bool {
	return s.Auther == nil
}

func (s *Server) prometheusProxyEnabled() bool {
	return s.PrometheusProxyConfig != nil && s.PrometheusTenancyProxyConfig != nil
}

func (s *Server) alertManagerProxyEnabled() bool {
	return s.AlertManagerProxyConfig != nil
}

func (s *Server) HTTPHandler() http.Handler {
	mux := http.NewServeMux()

	if len(s.BaseURL.Scheme) > 0 && len(s.BaseURL.Host) > 0 {
		s.K8sProxyConfig.Origin = fmt.Sprintf("%s://%s", s.BaseURL.Scheme, s.BaseURL.Host)
	}
	handle := func(path string, handler http.Handler) {
		mux.Handle(proxy.SingleJoiningSlash(s.BaseURL.Path, path), handler)
	}

	handleFunc := func(path string, handler http.HandlerFunc) { handle(path, handler) }

	fn := func(loginInfo auth.LoginJSON, successURL string, w http.ResponseWriter) {
		jsg := struct {
			auth.LoginJSON  `json:",inline"`
			LoginSuccessURL string `json:"loginSuccessURL"`
			Branding        string `json:"branding"`
		}{
			LoginJSON:       loginInfo,
			LoginSuccessURL: successURL,
			Branding:        s.Branding,
		}

		tpl := template.New(tokenizerPageTemplateName)
		tpl.Delims("[[", "]]")
		tpls, err := tpl.ParseFiles(path.Join(s.PublicDir, tokenizerPageTemplateName))
		if err != nil {
			fmt.Printf("%v not found in configured public-dir path: %v", tokenizerPageTemplateName, err)
			os.Exit(1)
		}

		if err := tpls.ExecuteTemplate(w, tokenizerPageTemplateName, jsg); err != nil {
			fmt.Printf("%v", err)
			os.Exit(1)
		}
	}

	authHandler := func(hf http.HandlerFunc) http.Handler {
		return authMiddleware(s.Auther, hf)
	}
	authHandlerWithUser := func(hf func(*auth.User, http.ResponseWriter, *http.Request)) http.Handler {
		return authMiddlewareWithUser(s.Auther, hf)
	}

	if s.authDisabled() {
		authHandler = func(hf http.HandlerFunc) http.Handler {
			return hf
		}
		authHandlerWithUser = func(hf func(*auth.User, http.ResponseWriter, *http.Request)) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				hf(s.StaticUser, w, r)
			})
		}
	}

	if !s.authDisabled() {
		handleFunc(authLoginEndpoint, s.Auther.LoginFunc)
		handleFunc(authLogoutEndpoint, s.Auther.LogoutFunc)
		handleFunc(AuthLoginCallbackEndpoint, s.Auther.CallbackFunc(fn))

		handle("/api/openshift/delete-token", authHandlerWithUser(s.handleOpenShiftTokenDeletion))
	}

	handleFunc("/api/", notFoundHandler)

	staticHandler := http.StripPrefix(proxy.SingleJoiningSlash(s.BaseURL.Path, "/static/"), http.FileServer(http.Dir(s.PublicDir)))
	handle("/static/", gzipHandler(securityHeadersMiddleware(staticHandler)))

	// Scope of Service Worker needs to be higher than the requests it is intercepting (https://stackoverflow.com/a/35780776/6909941)
	handleFunc("/load-test.sw.js", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, path.Join(s.PublicDir, "load-test.sw.js"))
	})

	handleFunc("/health", health.Checker{
		Checks: []health.Checkable{},
	}.ServeHTTP)

	k8sProxy := proxy.NewProxy(s.K8sProxyConfig)
	handle(k8sProxyEndpoint, http.StripPrefix(
		proxy.SingleJoiningSlash(s.BaseURL.Path, k8sProxyEndpoint),
		authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
			r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
			k8sProxy.ServeHTTP(w, r)
		})),
	)

	if s.prometheusProxyEnabled() {
		// Only proxy requests to the Prometheus API, not the UI.
		prometheusProxyAPIPath := prometheusProxyEndpoint + "/api/"
		prometheusProxy := proxy.NewProxy(s.PrometheusProxyConfig)
		handle(prometheusProxyAPIPath, http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, prometheusProxyAPIPath),
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				prometheusProxy.ServeHTTP(w, r)
			})),
		)
		prometheusTenancyProxyAPIPath := prometheusTenancyProxyEndpoint + "/api/"
		prometheusTenancyProxy := proxy.NewProxy(s.PrometheusTenancyProxyConfig)
		handle(prometheusTenancyProxyAPIPath, http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, prometheusTenancyProxyAPIPath),
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				prometheusTenancyProxy.ServeHTTP(w, r)
			})),
		)
	}

	if s.alertManagerProxyEnabled() {
		alertManagerProxyAPIPath := alertManagerProxyEndpoint + "/api/"
		alertManagerProxy := proxy.NewProxy(s.AlertManagerProxyConfig)
		handle(alertManagerProxyAPIPath, http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, alertManagerProxyAPIPath),
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				alertManagerProxy.ServeHTTP(w, r)
			})),
		)
	}

	handle("/api/tectonic/version", authHandler(s.versionHandler))
	mux.HandleFunc(s.BaseURL.Path, s.indexHandler)

	// TODO: control this via a high log level to ensure that we don't leak tokens
	return handlers.LoggingHandler(os.Stdout, securityHeadersMiddleware(http.Handler(mux)))
	// return securityHeadersMiddleware(http.Handler(mux))
}

func sendResponse(rw http.ResponseWriter, code int, resp interface{}) {
	enc, err := json.Marshal(resp)
	if err != nil {
		plog.Printf("Failed JSON-encoding HTTP response: %v", err)
		rw.WriteHeader(http.StatusInternalServerError)
		return
	}

	rw.Header().Set("Content-Type", "application/json")
	rw.WriteHeader(code)

	_, err = rw.Write(enc)
	if err != nil {
		plog.Errorf("Failed sending HTTP response body: %v", err)
	}
}

type apiError struct {
	Err string `json:"error"`
}

func (s *Server) indexHandler(w http.ResponseWriter, r *http.Request) {
	jsg := &jsGlobals{
		ConsoleVersion:       version.Version,
		AuthDisabled:         s.authDisabled(),
		KubectlClientID:      s.KubectlClientID,
		BasePath:             s.BaseURL.Path,
		LoginURL:             proxy.SingleJoiningSlash(s.BaseURL.String(), authLoginEndpoint),
		LoginSuccessURL:      proxy.SingleJoiningSlash(s.BaseURL.String(), AuthLoginSuccessEndpoint),
		LoginErrorURL:        proxy.SingleJoiningSlash(s.BaseURL.String(), AuthLoginErrorEndpoint),
		LogoutURL:            proxy.SingleJoiningSlash(s.BaseURL.String(), authLogoutEndpoint),
		LogoutRedirect:       s.LogoutRedirect.String(),
		KubeAPIServerURL:     s.KubeAPIServerURL,
		Branding:             s.Branding,
		DocumentationBaseURL: s.DocumentationBaseURL.String(),
		GoogleTagManagerID:   s.GoogleTagManagerID,
		LoadTestFactor:       s.LoadTestFactor,
	}

	if !s.authDisabled() {
		jsg.KubeAdminLogoutURL = s.Auther.GetKubeAdminLogoutURL()
	}

	if s.prometheusProxyEnabled() {
		jsg.PrometheusBaseURL = proxy.SingleJoiningSlash(s.BaseURL.Path, prometheusProxyEndpoint)
		jsg.PrometheusTenancyBaseURL = proxy.SingleJoiningSlash(s.BaseURL.Path, prometheusTenancyProxyEndpoint)
	}

	if s.alertManagerProxyEnabled() {
		jsg.AlertManagerBaseURL = proxy.SingleJoiningSlash(s.BaseURL.Path, alertManagerProxyEndpoint)
	}

	if !s.authDisabled() {
		s.Auther.SetCSRFCookie(s.BaseURL.Path, &w)
	}

	tpl := template.New(indexPageTemplateName)
	tpl.Delims("[[", "]]")
	tpls, err := tpl.ParseFiles(path.Join(s.PublicDir, indexPageTemplateName))
	if err != nil {
		fmt.Printf("index.html not found in configured public-dir path: %v", err)
		os.Exit(1)
	}

	if err := tpls.ExecuteTemplate(w, indexPageTemplateName, jsg); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (s *Server) versionHandler(w http.ResponseWriter, r *http.Request) {
	sendResponse(w, http.StatusOK, struct {
		Version        string `json:"version"`
		ConsoleVersion string `json:"consoleVersion"`
	}{
		Version:        s.TectonicVersion,
		ConsoleVersion: version.Version,
	})
}

func notFoundHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotFound)
	w.Write([]byte("not found"))
}

func (s *Server) handleOpenShiftTokenDeletion(user *auth.User, w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendResponse(w, http.StatusMethodNotAllowed, apiError{"Invalid method: only POST is allowed"})
		return
	}

	// Delete the OpenShift OAuthAccessToken.
	path := "/apis/oauth.openshift.io/v1/oauthaccesstokens/" + user.Token
	url := proxy.SingleJoiningSlash(s.K8sProxyConfig.Endpoint.String(), path)
	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		sendResponse(w, http.StatusInternalServerError, apiError{fmt.Sprintf("Failed to create token DELETE request: %v", err)})
		return
	}

	r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
	resp, err := s.K8sClient.Do(req)
	if err != nil {
		sendResponse(w, http.StatusBadGateway, apiError{fmt.Sprintf("Failed to delete token: %v", err)})
		return
	}

	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
	resp.Body.Close()
}
