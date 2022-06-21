package server

import (
	"context"
	"crypto/sha256"
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"html/template"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"path"
	"strings"
	"time"

	"github.com/coreos/pkg/health"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"k8s.io/klog"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/graphql/resolver"
	helmhandlerspkg "github.com/openshift/console/pkg/helm/handlers"
	"github.com/openshift/console/pkg/plugins"
	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/pkg/serverconfig"
	"github.com/openshift/console/pkg/serverutils"
	"github.com/openshift/console/pkg/terminal"
	"github.com/openshift/console/pkg/usersettings"
	"github.com/openshift/console/pkg/version"

	graphql "github.com/graph-gophers/graphql-go"
	"github.com/graph-gophers/graphql-go/relay"
	"github.com/rawagner/graphql-transport-ws/graphqlws"
)

const (
	indexPageTemplateName              = "index.html"
	tokenizerPageTemplateName          = "tokener.html"
	multiclusterLogoutPageTemplateName = "multicluster-logout.html"

	authLoginEndpoint                = "/auth/login"
	AuthLoginCallbackEndpoint        = "/auth/callback"
	AuthLoginSuccessEndpoint         = "/"
	AuthLoginErrorEndpoint           = "/error"
	authLogoutEndpoint               = "/auth/logout"
	authLogoutMulticlusterEndpoint   = "/api/logout/multicluster"
	k8sProxyEndpoint                 = "/api/kubernetes/"
	graphQLEndpoint                  = "/api/graphql"
	prometheusProxyEndpoint          = "/api/prometheus"
	prometheusTenancyProxyEndpoint   = "/api/prometheus-tenancy"
	alertManagerProxyEndpoint        = "/api/alertmanager"
	alertManagerTenancyProxyEndpoint = "/api/alertmanager-tenancy"
	meteringProxyEndpoint            = "/api/metering"
	customLogoEndpoint               = "/custom-logo"
	helmChartRepoProxyEndpoint       = "/api/helm/charts/"
	gitopsEndpoint                   = "/api/gitops/"
	devfileEndpoint                  = "/api/devfile/"
	devfileSamplesEndpoint           = "/api/devfile/samples/"
	pluginAssetsEndpoint             = "/api/plugins/"
	pluginProxyEndpoint              = "/api/proxy/"
	localesEndpoint                  = "/locales/resource.json"
	updatesEndpoint                  = "/api/check-updates"
	operandsListEndpoint             = "/api/list-operands/"
	accountManagementEndpoint        = "/api/accounts_mgmt/"
	sha256Prefix                     = "sha256~"
)

type jsGlobals struct {
	ConsoleVersion             string                     `json:"consoleVersion"`
	AuthDisabled               bool                       `json:"authDisabled"`
	KubectlClientID            string                     `json:"kubectlClientID"`
	BasePath                   string                     `json:"basePath"`
	LoginURL                   string                     `json:"loginURL"`
	LoginSuccessURL            string                     `json:"loginSuccessURL"`
	LoginErrorURL              string                     `json:"loginErrorURL"`
	LogoutURL                  string                     `json:"logoutURL"`
	LogoutRedirect             string                     `json:"logoutRedirect"`
	MulticlusterLogoutRedirect string                     `json:"multiclusterLogoutRedirect"`
	RequestTokenURL            string                     `json:"requestTokenURL"`
	KubeAdminLogoutURL         string                     `json:"kubeAdminLogoutURL"`
	KubeAPIServerURL           string                     `json:"kubeAPIServerURL"`
	PrometheusBaseURL          string                     `json:"prometheusBaseURL"`
	PrometheusTenancyBaseURL   string                     `json:"prometheusTenancyBaseURL"`
	AlertManagerBaseURL        string                     `json:"alertManagerBaseURL"`
	MeteringBaseURL            string                     `json:"meteringBaseURL"`
	Branding                   string                     `json:"branding"`
	CustomProductName          string                     `json:"customProductName"`
	CustomLogoURL              string                     `json:"customLogoURL"`
	StatuspageID               string                     `json:"statuspageID"`
	DocumentationBaseURL       string                     `json:"documentationBaseURL"`
	AlertManagerPublicURL      string                     `json:"alertManagerPublicURL"`
	GrafanaPublicURL           string                     `json:"grafanaPublicURL"`
	PrometheusPublicURL        string                     `json:"prometheusPublicURL"`
	ThanosPublicURL            string                     `json:"thanosPublicURL"`
	LoadTestFactor             int                        `json:"loadTestFactor"`
	InactivityTimeout          int                        `json:"inactivityTimeout"`
	GOARCH                     string                     `json:"GOARCH"`
	GOOS                       string                     `json:"GOOS"`
	GraphQLBaseURL             string                     `json:"graphqlBaseURL"`
	DevCatalogCategories       string                     `json:"developerCatalogCategories"`
	UserSettingsLocation       string                     `json:"userSettingsLocation"`
	AddPage                    string                     `json:"addPage"`
	ConsolePlugins             []string                   `json:"consolePlugins"`
	I18nNamespaces             []string                   `json:"i18nNamespaces"`
	QuickStarts                string                     `json:"quickStarts"`
	ProjectAccessClusterRoles  string                     `json:"projectAccessClusterRoles"`
	Clusters                   []string                   `json:"clusters"`
	ControlPlaneTopology       string                     `json:"controlPlaneTopology"`
	Telemetry                  serverconfig.MultiKeyValue `json:"telemetry"`
	ReleaseVersion             string                     `json:"releaseVersion"`
}

type Server struct {
	K8sProxyConfigs      map[string]*proxy.Config
	BaseURL              *url.URL
	LogoutRedirect       *url.URL
	PublicDir            string
	TectonicVersion      string
	Authers              map[string]*auth.Authenticator
	StaticUser           *auth.User
	ServiceAccountToken  string
	KubectlClientID      string
	KubeAPIServerURL     string
	KubeVersion          string
	DocumentationBaseURL *url.URL
	Branding             string
	CustomProductName    string
	CustomLogoFile       string
	ControlPlaneTopology string
	StatuspageID         string
	LoadTestFactor       int
	InactivityTimeout    int
	ReleaseVersion       string
	// Map that contains list of enabled plugins and their endpoints.
	EnabledConsolePlugins serverconfig.MultiKeyValue
	I18nNamespaces        []string
	PluginProxy           string
	// Clients with the correct TLS setup for communicating with the API servers.
	K8sClients                       map[string]*http.Client
	ThanosProxyConfig                *proxy.Config
	ThanosTenancyProxyConfig         *proxy.Config
	ThanosTenancyProxyForRulesConfig *proxy.Config
	AlertManagerProxyConfig          *proxy.Config
	AlertManagerTenancyProxyConfig   *proxy.Config
	MeteringProxyConfig              *proxy.Config
	TerminalProxyTLSConfig           *tls.Config
	PluginsProxyTLSConfig            *tls.Config
	GitOpsProxyConfig                *proxy.Config
	ClusterManagementProxyConfig     *proxy.Config
	// A lister for resource listing of a particular kind
	MonitoringDashboardConfigMapLister ResourceLister
	KnativeEventSourceCRDLister        ResourceLister
	KnativeChannelCRDLister            ResourceLister
	GOARCH                             string
	GOOS                               string
	// Monitoring and Logging related URLs
	AlertManagerPublicURL     *url.URL
	GrafanaPublicURL          *url.URL
	PrometheusPublicURL       *url.URL
	ThanosPublicURL           *url.URL
	DevCatalogCategories      string
	UserSettingsLocation      string
	QuickStarts               string
	AddPage                   string
	ProjectAccessClusterRoles string
	Telemetry                 serverconfig.MultiKeyValue
}

func (s *Server) authDisabled() bool {
	return s.getLocalAuther() == nil
}

func (s *Server) prometheusProxyEnabled() bool {
	return len(s.K8sProxyConfigs) == 1 && s.ThanosTenancyProxyConfig != nil && s.ThanosTenancyProxyForRulesConfig != nil
}

func (s *Server) alertManagerProxyEnabled() bool {
	return s.AlertManagerProxyConfig != nil && s.AlertManagerTenancyProxyConfig != nil
}

func (s *Server) meteringProxyEnabled() bool {
	return s.MeteringProxyConfig != nil
}

func (s *Server) gitopsProxyEnabled() bool {
	return s.GitOpsProxyConfig != nil
}

func (s *Server) getLocalAuther() *auth.Authenticator {
	return s.Authers[serverutils.LocalClusterName]
}

func (s *Server) getLocalK8sProxyConfig() *proxy.Config {
	return s.K8sProxyConfigs[serverutils.LocalClusterName]
}

func (s *Server) getLocalK8sClient() *http.Client {
	return s.K8sClients[serverutils.LocalClusterName]
}

func (s *Server) HTTPHandler() http.Handler {
	mux := http.NewServeMux()

	if len(s.BaseURL.Scheme) > 0 && len(s.BaseURL.Host) > 0 {
		for cluster := range s.K8sProxyConfigs {
			s.K8sProxyConfigs[cluster].Origin = fmt.Sprintf("%s://%s", s.BaseURL.Scheme, s.BaseURL.Host)
		}
	}

	localAuther := s.getLocalAuther()
	localK8sProxyConfig := s.getLocalK8sProxyConfig()
	localK8sClient := s.getLocalK8sClient()
	k8sProxies := make(map[string]*proxy.Proxy)
	for cluster, proxyConfig := range s.K8sProxyConfigs {
		k8sProxies[cluster] = proxy.NewProxy(proxyConfig)
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
		return authMiddleware(s.Authers, hf)
	}
	authHandlerWithUser := func(hf func(*auth.User, http.ResponseWriter, *http.Request)) http.Handler {
		return authMiddlewareWithUser(s.Authers, hf)
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
		handleFunc(authLoginEndpoint, localAuther.LoginFunc)
		handleFunc(authLogoutEndpoint, localAuther.LogoutFunc)
		handleFunc(authLogoutMulticlusterEndpoint, s.handleLogoutMulticluster)
		handleFunc(AuthLoginCallbackEndpoint, localAuther.CallbackFunc(fn))
		handle("/api/openshift/delete-token", authHandlerWithUser(s.handleOpenShiftTokenDeletion))
		for clusterName, clusterAuther := range s.Authers {
			if clusterAuther != nil {
				handleFunc(fmt.Sprintf("%s/%s", authLoginEndpoint, clusterName), clusterAuther.LoginFunc)
				handleFunc(fmt.Sprintf("%s/%s", AuthLoginCallbackEndpoint, clusterName), clusterAuther.CallbackFunc(fn))
			}
		}
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

	handle(k8sProxyEndpoint, http.StripPrefix(
		proxy.SingleJoiningSlash(s.BaseURL.Path, k8sProxyEndpoint),
		authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
			cluster := serverutils.GetCluster(r)
			k8sProxy, k8sProxyFound := k8sProxies[cluster]

			if !k8sProxyFound {
				klog.Errorf("Bad Request. Invalid cluster: %v", cluster)
				w.WriteHeader(http.StatusBadRequest)
				return
			}

			r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
			k8sProxy.ServeHTTP(w, r)
		})),
	)

	handleFunc(devfileEndpoint, s.devfileHandler)
	handleFunc(devfileSamplesEndpoint, s.devfileSamplesHandler)

	terminalProxy := terminal.NewProxy(
		s.TerminalProxyTLSConfig,
		localK8sProxyConfig.TLSClientConfig,
		localK8sProxyConfig.Endpoint)

	handle(terminal.ProxyEndpoint, authHandlerWithUser(terminalProxy.HandleProxy))
	handleFunc(terminal.AvailableEndpoint, terminalProxy.HandleProxyEnabled)
	handleFunc(terminal.InstalledNamespaceEndpoint, terminalProxy.HandleTerminalInstalledNamespace)

	graphQLSchema, err := ioutil.ReadFile("pkg/graphql/schema.graphql")
	if err != nil {
		panic(err)
	}
	opts := []graphql.SchemaOpt{graphql.UseFieldResolvers()}
	k8sResolver := resolver.K8sResolver{K8sProxy: k8sProxies[serverutils.LocalClusterName]}
	rootResolver := resolver.RootResolver{K8sResolver: &k8sResolver}
	schema := graphql.MustParseSchema(string(graphQLSchema), &rootResolver, opts...)
	handler := graphqlws.NewHandler()
	handler.InitPayload = resolver.InitPayload
	graphQLHandler := handler.NewHandlerFunc(schema, &relay.Handler{Schema: schema})
	handle("/api/graphql", authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(context.Background(), resolver.HeadersKey, map[string]string{
			"Authorization": fmt.Sprintf("Bearer %s", user.Token),
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
			targetsSourcePath    = prometheusProxyEndpoint + "/api/v1/targets"
			metadataSourcePath   = prometheusProxyEndpoint + "/api/v1/metadata"
			seriesSourcePath     = prometheusProxyEndpoint + "/api/v1/series"
			labelsSourcePath     = prometheusProxyEndpoint + "/api/v1/labels"
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
		handle(targetsSourcePath, http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, targetAPIPath),
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				thanosProxy.ServeHTTP(w, r)
			})),
		)
		handle(metadataSourcePath, http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, targetAPIPath),
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				thanosProxy.ServeHTTP(w, r)
			})),
		)
		handle(seriesSourcePath, http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, targetAPIPath),
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				thanosProxy.ServeHTTP(w, r)
			})),
		)
		handle(labelsSourcePath, http.StripPrefix(
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
		var (
			alertManagerProxyAPIPath        = alertManagerProxyEndpoint + "/api/"
			alertManagerTenancyProxyAPIPath = alertManagerTenancyProxyEndpoint + "/api/"

			alertManagerProxy        = proxy.NewProxy(s.AlertManagerProxyConfig)
			alertManagerTenancyProxy = proxy.NewProxy(s.AlertManagerTenancyProxyConfig)
		)

		handle(alertManagerProxyAPIPath, http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, alertManagerProxyAPIPath),
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				alertManagerProxy.ServeHTTP(w, r)
			})),
		)

		handle(alertManagerTenancyProxyAPIPath, http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, alertManagerTenancyProxyAPIPath),
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				alertManagerTenancyProxy.ServeHTTP(w, r)
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

	clusterManagementProxy := proxy.NewProxy(s.ClusterManagementProxyConfig)
	handle(accountManagementEndpoint, http.StripPrefix(
		s.BaseURL.Path,
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			clusterManagementProxy.ServeHTTP(w, r)
		})),
	)

	// List operator operands endpoint
	operandsListHandler := &OperandsListHandler{
		APIServerURL: s.KubeAPIServerURL,
		Client:       localK8sClient,
	}

	handle(operandsListEndpoint, http.StripPrefix(
		proxy.SingleJoiningSlash(s.BaseURL.Path, operandsListEndpoint),
		authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
			operandsListHandler.OperandsListHandler(user, w, r)
		}),
	))

	handle("/api/console/monitoring-dashboard-config", authHandler(s.handleMonitoringDashboardConfigmaps))
	handle("/api/console/knative-event-sources", authHandler(s.handleKnativeEventSourceCRDs))
	handle("/api/console/knative-channels", authHandler(s.handleKnativeChannelCRDs))
	handle("/api/console/version", authHandler(s.versionHandler))

	// User settings
	userSettingHandler := usersettings.UserSettingsHandler{
		K8sProxyConfig:      localK8sProxyConfig,
		Client:              localK8sClient,
		Endpoint:            localK8sProxyConfig.Endpoint.String(),
		ServiceAccountToken: s.ServiceAccountToken,
	}
	handle("/api/console/user-settings", authHandlerWithUser(userSettingHandler.HandleUserSettings))

	helmHandlers := helmhandlerspkg.New(localK8sProxyConfig.Endpoint.String(), localK8sClient.Transport, s)

	pluginsHandler := plugins.NewPluginsHandler(
		&http.Client{
			// 120 seconds matches the webpack require timeout.
			// Plugins are loaded asynchronously, so this doesn't block page load.
			Timeout:   120 * time.Second,
			Transport: &http.Transport{TLSClientConfig: s.PluginsProxyTLSConfig},
		},
		s.EnabledConsolePlugins,
		s.PublicDir,
	)

	handleFunc(localesEndpoint, func(w http.ResponseWriter, r *http.Request) {
		pluginsHandler.HandleI18nResources(w, r)
	})

	handle(pluginAssetsEndpoint, http.StripPrefix(
		proxy.SingleJoiningSlash(s.BaseURL.Path, pluginAssetsEndpoint),
		authHandler(func(w http.ResponseWriter, r *http.Request) {
			pluginsHandler.HandlePluginAssets(w, r)
		}),
	))

	if len(s.PluginProxy) != 0 {
		proxyConfig, err := plugins.ParsePluginProxyConfig(s.PluginProxy)
		if err != nil {
			klog.Fatalf("Error parsing plugin proxy config: %s", err)
			os.Exit(1)
		}
		proxyServiceHandlers, err := plugins.GetPluginProxyServiceHandlers(proxyConfig, s.PluginsProxyTLSConfig, pluginProxyEndpoint)
		if err != nil {
			klog.Fatalf("Error getting plugin proxy handlers: %s", err)
			os.Exit(1)
		}
		if len(proxyServiceHandlers) != 0 {
			klog.Infoln("The following console endpoints are now proxied to these services:")
		}
		for _, proxyServiceHandler := range proxyServiceHandlers {
			klog.Infof(" - %s -> %s\n", proxyServiceHandler.ConsoleEndpoint, proxyServiceHandler.ProxyConfig.Endpoint)
			serviceProxy := proxy.NewProxy(proxyServiceHandler.ProxyConfig)
			f := func(w http.ResponseWriter, r *http.Request) {
				serviceProxy.ServeHTTP(w, r)
			}
			var h http.Handler
			if proxyServiceHandler.Authorize {
				h = authHandler(f)
			} else {
				h = http.HandlerFunc(f)
			}
			handle(proxyServiceHandler.ConsoleEndpoint, http.StripPrefix(
				proxy.SingleJoiningSlash(s.BaseURL.Path, proxyServiceHandler.ConsoleEndpoint),
				h,
			))
		}
	}

	handle(updatesEndpoint, authHandler(pluginsHandler.HandleCheckUpdates))

	// Helm Endpoints
	metricsHandler := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Requests from prometheus-k8s have the access token in headers instead of cookies.
			// This allows metric requests with proper tokens in either headers or cookies.
			if r.URL.Path == "/metrics" {
				openshiftSessionCookieName := "openshift-session-token"
				openshiftSessionCookieValue := r.Header.Get("Authorization")
				r.AddCookie(&http.Cookie{Name: openshiftSessionCookieName, Value: openshiftSessionCookieValue})
			}
			next.ServeHTTP(w, r)
		})
	}

	handle("/metrics", metricsHandler(authHandler(func(w http.ResponseWriter, r *http.Request) {
		promhttp.Handler().ServeHTTP(w, r)
	})))

	handle("/api/helm/template", authHandlerWithUser(helmHandlers.HandleHelmRenderManifests))
	handle("/api/helm/releases", authHandlerWithUser(helmHandlers.HandleHelmList))
	handle("/api/helm/chart", authHandlerWithUser(helmHandlers.HandleChartGet))
	handle("/api/helm/release/history", authHandlerWithUser(helmHandlers.HandleGetReleaseHistory))
	handle("/api/helm/charts/index.yaml", authHandlerWithUser(helmHandlers.HandleIndexFile))

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
	if serverutils.IsUnsupportedBrowser(r) {
		serverutils.SendUnsupportedBrowserResponse(w, s.Branding)
		return
	}

	plugins := make([]string, 0, len(s.EnabledConsolePlugins))
	for plugin := range s.EnabledConsolePlugins {
		plugins = append(plugins, plugin)
	}

	clusters := make([]string, 0, len(s.K8sProxyConfigs))
	for cluster := range s.K8sProxyConfigs {
		clusters = append(clusters, cluster)
	}

	jsg := &jsGlobals{
		ConsoleVersion:             version.Version,
		AuthDisabled:               s.authDisabled(),
		KubectlClientID:            s.KubectlClientID,
		BasePath:                   s.BaseURL.Path,
		LoginURL:                   proxy.SingleJoiningSlash(s.BaseURL.String(), authLoginEndpoint),
		LoginSuccessURL:            proxy.SingleJoiningSlash(s.BaseURL.String(), AuthLoginSuccessEndpoint),
		LoginErrorURL:              proxy.SingleJoiningSlash(s.BaseURL.String(), AuthLoginErrorEndpoint),
		LogoutURL:                  proxy.SingleJoiningSlash(s.BaseURL.String(), authLogoutEndpoint),
		LogoutRedirect:             s.LogoutRedirect.String(),
		MulticlusterLogoutRedirect: proxy.SingleJoiningSlash(s.BaseURL.String(), authLogoutMulticlusterEndpoint),
		KubeAPIServerURL:           s.KubeAPIServerURL,
		Branding:                   s.Branding,
		CustomProductName:          s.CustomProductName,
		ControlPlaneTopology:       s.ControlPlaneTopology,
		StatuspageID:               s.StatuspageID,
		InactivityTimeout:          s.InactivityTimeout,
		DocumentationBaseURL:       s.DocumentationBaseURL.String(),
		AlertManagerPublicURL:      s.AlertManagerPublicURL.String(),
		GrafanaPublicURL:           s.GrafanaPublicURL.String(),
		PrometheusPublicURL:        s.PrometheusPublicURL.String(),
		ThanosPublicURL:            s.ThanosPublicURL.String(),
		GOARCH:                     s.GOARCH,
		GOOS:                       s.GOOS,
		LoadTestFactor:             s.LoadTestFactor,
		GraphQLBaseURL:             proxy.SingleJoiningSlash(s.BaseURL.Path, graphQLEndpoint),
		DevCatalogCategories:       s.DevCatalogCategories,
		UserSettingsLocation:       s.UserSettingsLocation,
		ConsolePlugins:             plugins,
		I18nNamespaces:             s.I18nNamespaces,
		QuickStarts:                s.QuickStarts,
		AddPage:                    s.AddPage,
		ProjectAccessClusterRoles:  s.ProjectAccessClusterRoles,
		Clusters:                   clusters,
		Telemetry:                  s.Telemetry,
		ReleaseVersion:             s.ReleaseVersion,
	}

	localAuther := s.getLocalAuther()

	if !s.authDisabled() {
		specialAuthURLs := localAuther.GetSpecialURLs()
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
		localAuther.SetCSRFCookie(s.BaseURL.Path, &w)
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

	// Proxy request to correct cluster
	cluster := serverutils.GetCluster(r)
	k8sProxy, k8sProxyFound := s.K8sProxyConfigs[cluster]
	k8sClient, k8sClientFound := s.K8sClients[cluster]
	if !k8sProxyFound || !k8sClientFound {
		klog.Errorf("Bad Request. Invalid cluster: %v", cluster)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	tokenName := user.Token
	if strings.HasPrefix(tokenName, sha256Prefix) {
		tokenName = tokenToObjectName(tokenName)
	}

	// Delete the OpenShift OAuthAccessToken.
	path := "/apis/oauth.openshift.io/v1/oauthaccesstokens/" + tokenName
	url := proxy.SingleJoiningSlash(k8sProxy.Endpoint.String(), path)
	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: fmt.Sprintf("Failed to create token DELETE request: %v", err)})
		return
	}

	r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
	resp, err := k8sClient.Do(req)
	if err != nil {
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: fmt.Sprintf("Failed to delete token: %v", err)})
		return
	}

	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
	resp.Body.Close()
}

func (s *Server) handleLogoutMulticluster(w http.ResponseWriter, r *http.Request) {
	for cluster, auther := range s.Authers {
		cookieName := auth.GetCookieName(cluster)
		if cookie, _ := r.Cookie(cookieName); cookie != nil {
			clearedCookie := http.Cookie{
				Name:     cookie.Name,
				Value:    "",
				MaxAge:   0,
				HttpOnly: cookie.HttpOnly,
				Path:     auther.GetCookiePath(),
				Secure:   cookie.Secure,
			}
			klog.Infof("Deleting cookie %v", cookie.Name)
			http.SetCookie(w, &clearedCookie)
		}
	}

	jsg := struct {
		BasePath          string `json:"basePath"`
		Branding          string `json:"branding"`
		CustomProductName string `json:"customProductName"`
	}{
		BasePath:          s.BaseURL.Path,
		Branding:          s.Branding,
		CustomProductName: s.CustomProductName,
	}
	tpl := template.New(multiclusterLogoutPageTemplateName)
	tpl.Delims("[[", "]]")
	tpls, err := tpl.ParseFiles(path.Join(s.PublicDir, multiclusterLogoutPageTemplateName))
	if err != nil {
		fmt.Printf("%v not found in configured public-dir path: %v", multiclusterLogoutPageTemplateName, err)
		os.Exit(1)
	}

	if err := tpls.ExecuteTemplate(w, multiclusterLogoutPageTemplateName, jsg); err != nil {
		fmt.Printf("%v", err)
		os.Exit(1)
	}
}

// tokenToObjectName returns the oauthaccesstokens object name for the given raw token,
// i.e. the sha256 hash prefixed with "sha256~".
func tokenToObjectName(token string) string {
	name := strings.TrimPrefix(token, sha256Prefix)
	h := sha256.Sum256([]byte(name))
	return sha256Prefix + base64.RawURLEncoding.EncodeToString(h[0:])
}
