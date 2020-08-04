package server

import (
	"context"
	"crypto/tls"
	"fmt"
	"html/template"
	"io"
	"io/ioutil"
	"k8s.io/client-go/rest"
	"net/http"
	"net/url"
	"os"
	"path"

	"github.com/coreos/dex/api"
	"github.com/coreos/pkg/capnslog"
	"github.com/coreos/pkg/health"

	"github.com/openshift/console/pkg/auth"
	helmhandlerspkg "github.com/openshift/console/pkg/helm/handlers"
	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/pkg/serverutils"
	"github.com/openshift/console/pkg/terminal"
	"github.com/openshift/console/pkg/version"

	graphql "github.com/graph-gophers/graphql-go"
	"github.com/graph-gophers/graphql-go/relay"
	"github.com/rawagner/graphql-transport-ws/graphqlws"

	"github.com/openshift/console/pkg/graphql/resolver"
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
	graphQLEndpoint                = "/api/graphql"
	prometheusProxyEndpoint        = "/api/prometheus"
	prometheusTenancyProxyEndpoint = "/api/prometheus-tenancy"
	alertManagerProxyEndpoint      = "/api/alertmanager"
	meteringProxyEndpoint          = "/api/metering"
	customLogoEndpoint             = "/custom-logo"
	helmChartRepoProxyEndpoint     = "/api/helm/charts/"
	gitopsEndpoint                 = "/api/gitops/"
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
	RequestTokenURL          string `json:"requestTokenURL"`
	KubeAdminLogoutURL       string `json:"kubeAdminLogoutURL"`
	KubeAPIServerURL         string `json:"kubeAPIServerURL"`
	PrometheusBaseURL        string `json:"prometheusBaseURL"`
	PrometheusTenancyBaseURL string `json:"prometheusTenancyBaseURL"`
	AlertManagerBaseURL      string `json:"alertManagerBaseURL"`
	MeteringBaseURL          string `json:"meteringBaseURL"`
	Branding                 string `json:"branding"`
	CustomProductName        string `json:"customProductName"`
	CustomLogoURL            string `json:"customLogoURL"`
	StatuspageID             string `json:"statuspageID"`
	DocumentationBaseURL     string `json:"documentationBaseURL"`
	AlertManagerPublicURL    string `json:"alertManagerPublicURL"`
	GrafanaPublicURL         string `json:"grafanaPublicURL"`
	PrometheusPublicURL      string `json:"prometheusPublicURL"`
	ThanosPublicURL          string `json:"thanosPublicURL"`
	LoadTestFactor           int    `json:"loadTestFactor"`
	InactivityTimeout        int    `json:"inactivityTimeout"`
	GOARCH                   string `json:"GOARCH"`
	GOOS                     string `json:"GOOS"`
	GraphQLBaseURL           string `json:"graphqlBaseURL"`
}

type Server struct {
	K8sProxyConfig       *proxy.Config
	BaseURL              *url.URL
	LogoutRedirect       *url.URL
	PublicDir            string
	TectonicVersion      string
	Auther               *auth.Authenticator
	StaticUser           *auth.User
	KubectlClientID      string
	KubeAPIServerURL     string
	DocumentationBaseURL *url.URL
	Branding             string
	CustomProductName    string
	CustomLogoFile       string
	StatuspageID         string
	LoadTestFactor       int
	DexClient            api.DexClient
	InactivityTimeout    int
	// A client with the correct TLS setup for communicating with the API server.
	K8sClient                        *http.Client
	ThanosProxyConfig                *proxy.Config
	ThanosTenancyProxyConfig         *proxy.Config
	ThanosTenancyProxyForRulesConfig *proxy.Config
	AlertManagerProxyConfig          *proxy.Config
	MeteringProxyConfig              *proxy.Config
	TerminalProxyTLSConfig           *tls.Config
	GitOpsProxyConfig                *proxy.Config
	// A lister for resource listing of a particular kind
	MonitoringDashboardConfigMapLister ResourceLister
	KnativeEventSourceCRDLister        ResourceLister
	KnativeChannelCRDLister            ResourceLister
	GOARCH                             string
	GOOS                               string
	// Monitoring and Logging related URLs
	AlertManagerPublicURL *url.URL
	GrafanaPublicURL      *url.URL
	PrometheusPublicURL   *url.URL
	ThanosPublicURL       *url.URL
}

func (s *Server) authDisabled() bool {
	return s.Auther == nil
}

func (s *Server) prometheusProxyEnabled() bool {
	return s.ThanosTenancyProxyConfig != nil && s.ThanosTenancyProxyForRulesConfig != nil
}

func (s *Server) alertManagerProxyEnabled() bool {
	return s.AlertManagerProxyConfig != nil
}

func (s *Server) meteringProxyEnabled() bool {
	return s.MeteringProxyConfig != nil
}

func (s *Server) gitopsProxyEnabled() bool {
	return s.GitOpsProxyConfig != nil
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
			auth.LoginJSON    `json:",inline"`
			LoginSuccessURL   string `json:"loginSuccessURL"`
			Branding          string `json:"branding"`
			CustomProductName string `json:"customProductName"`
		}{
			LoginJSON:         loginInfo,
			LoginSuccessURL:   successURL,
			Branding:          s.Branding,
			CustomProductName: s.CustomProductName,
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

	if s.CustomLogoFile != "" {
		handleFunc(customLogoEndpoint, func(w http.ResponseWriter, r *http.Request) {
			http.ServeFile(w, r, s.CustomLogoFile)
		})
	}

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

	terminalProxy := terminal.NewProxy(
		s.TerminalProxyTLSConfig,
		s.K8sProxyConfig.TLSClientConfig,
		s.K8sProxyConfig.Endpoint)

	handle(terminal.ProxyEndpoint, authHandlerWithUser(terminalProxy.HandleProxy))
	handleFunc(terminal.AvailableEndpoint, terminalProxy.HandleProxyEnabled)

	graphQLSchema, err := ioutil.ReadFile("pkg/graphql/schema.graphql")
	if err != nil {
		panic(err)
	}
	opts := []graphql.SchemaOpt{graphql.UseFieldResolvers()}
	k8sResolver := resolver.K8sResolver{K8sProxy: k8sProxy}
	rootResolver := resolver.RootResolver{K8sResolver: &k8sResolver}
	schema := graphql.MustParseSchema(string(graphQLSchema), &rootResolver, opts...)
	graphQLHandler := graphqlws.NewHandlerFunc(schema, &relay.Handler{Schema: schema})
	handle("/api/graphql", authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(context.Background(), resolver.HeadersKey, map[string]string{
			"Authorization":     fmt.Sprintf("Bearer %s", user.Token),
			"Impersonate-User":  r.Header.Get("Impersonate-User"),
			"Impersonate-Group": r.Header.Get("Impersonate-Group"),
		})
		graphQLHandler(w, r.WithContext(ctx))
	}))

	if s.prometheusProxyEnabled() {
		// Only proxy requests to the Prometheus API, not the UI.
		var (
			labelSourcePath      = prometheusProxyEndpoint + "/api/v1/label/"
			rulesSourcePath      = prometheusProxyEndpoint + "/api/v1/rules"
			querySourcePath      = prometheusProxyEndpoint + "/api/v1/query"
			queryRangeSourcePath = prometheusProxyEndpoint + "/api/v1/query_range"
			targetAPIPath        = prometheusProxyEndpoint + "/api/"

			tenancyQuerySourcePath      = prometheusTenancyProxyEndpoint + "/api/v1/query"
			tenancyQueryRangeSourcePath = prometheusTenancyProxyEndpoint + "/api/v1/query_range"
			tenancyRulesSourcePath      = prometheusTenancyProxyEndpoint + "/api/v1/rules"
			tenancyTargetAPIPath        = prometheusTenancyProxyEndpoint + "/api/"

			thanosProxy                = proxy.NewProxy(s.ThanosProxyConfig)
			thanosTenancyProxy         = proxy.NewProxy(s.ThanosTenancyProxyConfig)
			thanosTenancyForRulesProxy = proxy.NewProxy(s.ThanosTenancyProxyForRulesConfig)
		)

		// global label, query, and query_range requests have to be proxied via thanos
		handle(querySourcePath, http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, targetAPIPath),
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				thanosProxy.ServeHTTP(w, r)
			})),
		)
		handle(queryRangeSourcePath, http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, targetAPIPath),
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				thanosProxy.ServeHTTP(w, r)
			})),
		)
		handle(labelSourcePath, http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, targetAPIPath),
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				thanosProxy.ServeHTTP(w, r)
			})),
		)

		// alerting (rules) are being proxied via thanos querier
		// such that both in-cluster and user workload alerts appear in console.
		handle(rulesSourcePath, http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, targetAPIPath),
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				thanosProxy.ServeHTTP(w, r)
			})),
		)

		// tenancy queries and query ranges have to be proxied via thanos
		handle(tenancyQuerySourcePath, http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, tenancyTargetAPIPath),
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				thanosTenancyProxy.ServeHTTP(w, r)
			})),
		)
		handle(tenancyQueryRangeSourcePath, http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, tenancyTargetAPIPath),
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				thanosTenancyProxy.ServeHTTP(w, r)
			})),
		)
		// tenancy rules have to be proxied via thanos
		handle(tenancyRulesSourcePath, http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, tenancyTargetAPIPath),
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				thanosTenancyForRulesProxy.ServeHTTP(w, r)
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

	if s.meteringProxyEnabled() {
		meteringProxyAPIPath := meteringProxyEndpoint + "/api/"
		meteringProxy := proxy.NewProxy(s.MeteringProxyConfig)
		handle(meteringProxyAPIPath, http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, meteringProxyAPIPath),
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				meteringProxy.ServeHTTP(w, r)
			})),
		)
	}

	handle("/api/console/monitoring-dashboard-config", authHandler(s.handleMonitoringDashboardConfigmaps))
	handle("/api/console/knative-event-sources", authHandler(s.handleKnativeEventSourceCRDs))
	handle("/api/console/knative-channels", authHandler(s.handleKnativeChannelCRDs))
	handle("/api/console/version", authHandler(s.versionHandler))

	// Helm Endpoints
	helmHandlers := helmhandlerspkg.New(s.KubeAPIServerURL, s.K8sClient.Transport)
	handle("/api/helm/template", authHandlerWithUser(helmHandlers.HandleHelmRenderManifests))
	handle("/api/helm/releases", authHandlerWithUser(helmHandlers.HandleHelmList))
	handle("/api/helm/chart", authHandlerWithUser(helmHandlers.HandleChartGet))
	handle("/api/helm/release/history", authHandlerWithUser(helmHandlers.HandleGetReleaseHistory))
	handle("/api/helm/charts/index.yaml", helmhandlerspkg.NewIndexHandler(func() (*rest.Config, error) {
		if s.StaticUser != nil {
			return &rest.Config{
				Host:        s.KubeAPIServerURL,
				BearerToken: s.StaticUser.Token,
				Transport:   s.K8sClient.Transport,
			}, nil
		}
		return rest.InClusterConfig()
	}))

	handle("/api/helm/release", authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			helmHandlers.HandleGetRelease(user, w, r)
		case http.MethodPost:
			helmHandlers.HandleHelmInstall(user, w, r)
		case http.MethodDelete:
			helmHandlers.HandleUninstallRelease(user, w, r)
		case http.MethodPatch:
			helmHandlers.HandleRollbackRelease(user, w, r)
		case http.MethodPut:
			helmHandlers.HandleUpgradeRelease(user, w, r)
		default:
			w.Header().Set("Allow", "GET, POST, PATCH, PUT, DELETE")
			serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Unsupported method, supported methods are GET, POST, PATCH, PUT, DELETE"})
		}
	}))

	// GitOps proxy endpoints
	if s.gitopsProxyEnabled() {
		gitopsProxy := proxy.NewProxy(s.GitOpsProxyConfig)
		handle(gitopsEndpoint, http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, gitopsEndpoint),
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				gitopsProxy.ServeHTTP(w, r)
			})),
		)
	}

	mux.HandleFunc(s.BaseURL.Path, s.indexHandler)

	return securityHeadersMiddleware(http.Handler(mux))
}

func (s *Server) handleMonitoringDashboardConfigmaps(w http.ResponseWriter, r *http.Request) {
	s.MonitoringDashboardConfigMapLister.HandleResources(w, r)
}

func (s *Server) handleKnativeEventSourceCRDs(w http.ResponseWriter, r *http.Request) {
	s.KnativeEventSourceCRDLister.HandleResources(w, r)
}

func (s *Server) handleKnativeChannelCRDs(w http.ResponseWriter, r *http.Request) {
	s.KnativeChannelCRDLister.HandleResources(w, r)
}

func (s *Server) indexHandler(w http.ResponseWriter, r *http.Request) {
	jsg := &jsGlobals{
		ConsoleVersion:        version.Version,
		AuthDisabled:          s.authDisabled(),
		KubectlClientID:       s.KubectlClientID,
		BasePath:              s.BaseURL.Path,
		LoginURL:              proxy.SingleJoiningSlash(s.BaseURL.String(), authLoginEndpoint),
		LoginSuccessURL:       proxy.SingleJoiningSlash(s.BaseURL.String(), AuthLoginSuccessEndpoint),
		LoginErrorURL:         proxy.SingleJoiningSlash(s.BaseURL.String(), AuthLoginErrorEndpoint),
		LogoutURL:             proxy.SingleJoiningSlash(s.BaseURL.String(), authLogoutEndpoint),
		LogoutRedirect:        s.LogoutRedirect.String(),
		KubeAPIServerURL:      s.KubeAPIServerURL,
		Branding:              s.Branding,
		CustomProductName:     s.CustomProductName,
		StatuspageID:          s.StatuspageID,
		InactivityTimeout:     s.InactivityTimeout,
		DocumentationBaseURL:  s.DocumentationBaseURL.String(),
		AlertManagerPublicURL: s.AlertManagerPublicURL.String(),
		GrafanaPublicURL:      s.GrafanaPublicURL.String(),
		PrometheusPublicURL:   s.PrometheusPublicURL.String(),
		ThanosPublicURL:       s.ThanosPublicURL.String(),
		GOARCH:                s.GOARCH,
		GOOS:                  s.GOOS,
		LoadTestFactor:        s.LoadTestFactor,
		GraphQLBaseURL:        proxy.SingleJoiningSlash(s.BaseURL.Path, graphQLEndpoint),
	}

	if !s.authDisabled() {
		specialAuthURLs := s.Auther.GetSpecialURLs()
		jsg.RequestTokenURL = specialAuthURLs.RequestToken
		jsg.KubeAdminLogoutURL = specialAuthURLs.KubeAdminLogout
	}

	if s.prometheusProxyEnabled() {
		jsg.PrometheusBaseURL = proxy.SingleJoiningSlash(s.BaseURL.Path, prometheusProxyEndpoint)
		jsg.PrometheusTenancyBaseURL = proxy.SingleJoiningSlash(s.BaseURL.Path, prometheusTenancyProxyEndpoint)
	}

	if s.alertManagerProxyEnabled() {
		jsg.AlertManagerBaseURL = proxy.SingleJoiningSlash(s.BaseURL.Path, alertManagerProxyEndpoint)
	}

	if s.meteringProxyEnabled() {
		jsg.MeteringBaseURL = proxy.SingleJoiningSlash(s.BaseURL.Path, meteringProxyEndpoint)
	}

	if !s.authDisabled() {
		s.Auther.SetCSRFCookie(s.BaseURL.Path, &w)
	}

	if s.CustomLogoFile != "" {
		jsg.CustomLogoURL = proxy.SingleJoiningSlash(s.BaseURL.Path, customLogoEndpoint)
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
	serverutils.SendResponse(w, http.StatusOK, struct {
		Version string `json:"version"`
	}{
		Version: version.Version,
	})
}

func notFoundHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotFound)
	w.Write([]byte("not found"))
}

func (s *Server) handleOpenShiftTokenDeletion(user *auth.User, w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Invalid method: only POST is allowed"})
		return
	}

	// Delete the OpenShift OAuthAccessToken.
	path := "/apis/oauth.openshift.io/v1/oauthaccesstokens/" + user.Token
	url := proxy.SingleJoiningSlash(s.K8sProxyConfig.Endpoint.String(), path)
	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: fmt.Sprintf("Failed to create token DELETE request: %v", err)})
		return
	}

	r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
	resp, err := s.K8sClient.Do(req)
	if err != nil {
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: fmt.Sprintf("Failed to delete token: %v", err)})
		return
	}

	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
	resp.Body.Close()
}
