package server

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"net/url"
	"os"
	"path"
	"strings"
	"time"

	"github.com/coreos/pkg/health"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/klog/v2"

	operatorv1 "github.com/openshift/api/operator/v1"
	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/auth/csrfverifier"
	"github.com/openshift/console/pkg/auth/sessions"
	"github.com/openshift/console/pkg/crdschema"
	devconsole "github.com/openshift/console/pkg/devconsole"
	"github.com/openshift/console/pkg/devfile"
	gql "github.com/openshift/console/pkg/graphql"
	"github.com/openshift/console/pkg/graphql/resolver"
	helmhandlerspkg "github.com/openshift/console/pkg/helm/handlers"
	"github.com/openshift/console/pkg/knative"
	"github.com/openshift/console/pkg/olm"
	"github.com/openshift/console/pkg/plugins"
	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/pkg/serverconfig"
	"github.com/openshift/console/pkg/serverutils"
	"github.com/openshift/console/pkg/terminal"
	"github.com/openshift/console/pkg/usage"
	"github.com/openshift/console/pkg/usersettings"
	"github.com/openshift/console/pkg/utils"
	"github.com/openshift/console/pkg/version"

	graphql "github.com/graph-gophers/graphql-go"
	"github.com/rawagner/graphql-transport-ws/graphqlws"
)

// Public constants
const (
	AuthLoginCallbackEndpoint = "/auth/callback"
	AuthLoginErrorEndpoint    = "/auth/error"
	AuthLoginSuccessEndpoint  = "/"
)

// Private constants
const (
	accountManagementEndpoint             = "/api/accounts_mgmt/"
	alertManagerProxyEndpoint             = "/api/alertmanager"
	alertManagerTenancyProxyEndpoint      = "/api/alertmanager-tenancy"
	alertmanagerUserWorkloadProxyEndpoint = "/api/alertmanager-user-workload"
	authLoginEndpoint                     = "/auth/login"
	authLogoutEndpoint                    = "/api/console/logout"
	catalogdEndpoint                      = "/api/catalogd/"
	customLogoEndpoint                    = "/custom-logo"
	devfileEndpoint                       = "/api/devfile/"
	devfileSamplesEndpoint                = "/api/devfile/samples/"
	gitopsEndpoint                        = "/api/gitops/"
	graphQLEndpoint                       = "/api/graphql"
	helmChartRepoProxyEndpoint            = "/api/helm/charts/"
	indexPageTemplateName                 = "index.html"
	k8sProxyEndpoint                      = "/api/kubernetes/"
	knativeProxyEndpoint                  = "/api/console/knative/"
	devConsoleEndpoint                    = "/api/dev-console/"
	localesEndpoint                       = "/locales/resource.json"
	packageManifestEndpoint               = "/api/check-package-manifest/"
	operandsListEndpoint                  = "/api/list-operands/"
	pluginAssetsEndpoint                  = "/api/plugins/"
	pluginProxyEndpoint                   = "/api/proxy/"
	prometheusProxyEndpoint               = "/api/prometheus"
	prometheusTenancyProxyEndpoint        = "/api/prometheus-tenancy"
	copyLoginEndpoint                     = "/api/copy-login-commands"
	sha256Prefix                          = "sha256~"
	tokenizerPageTemplateName             = "tokener.html"
	updatesEndpoint                       = "/api/check-updates"
	crdSchemaEndpoint                     = "/api/console/crd-columns/"
)

type CustomFaviconPath struct {
	CustomFaviconDarkThemePath  string `json:"darkThemePath"`
	CustomFaviconLightThemePath string `json:"lightThemePath"`
}

type jsGlobals struct {
	AddPage                         string                     `json:"addPage"`
	AlertManagerBaseURL             string                     `json:"alertManagerBaseURL"`
	AlertManagerPublicURL           string                     `json:"alertManagerPublicURL"`
	AlertmanagerUserWorkloadBaseURL string                     `json:"alertmanagerUserWorkloadBaseURL"`
	AuthDisabled                    bool                       `json:"authDisabled"`
	BasePath                        string                     `json:"basePath"`
	Branding                        string                     `json:"branding"`
	Capabilities                    []operatorv1.Capability    `json:"capabilities"`
	ConsolePlugins                  []string                   `json:"consolePlugins"`
	ConsoleVersion                  string                     `json:"consoleVersion"`
	ContentSecurityPolicy           string                     `json:"contentSecurityPolicy"`
	ControlPlaneTopology            string                     `json:"controlPlaneTopology"`
	CopiedCSVsDisabled              bool                       `json:"copiedCSVsDisabled"`
	CustomFaviconsConfigured        bool                       `json:"customFaviconsConfigured"`
	CustomLogosConfigured           bool                       `json:"customLogosConfigured"`
	CustomLogoURL                   string                     `json:"customLogoURL"`
	CustomProductName               string                     `json:"customProductName"`
	DevCatalogCategories            string                     `json:"developerCatalogCategories"`
	DevCatalogTypes                 string                     `json:"developerCatalogTypes"`
	DocumentationBaseURL            string                     `json:"documentationBaseURL"`
	GOARCH                          string                     `json:"GOARCH"`
	GOOS                            string                     `json:"GOOS"`
	GrafanaPublicURL                string                     `json:"grafanaPublicURL"`
	GraphQLBaseURL                  string                     `json:"graphqlBaseURL"`
	I18nNamespaces                  []string                   `json:"i18nNamespaces"`
	InactivityTimeout               int                        `json:"inactivityTimeout"`
	KubeAdminLogoutURL              string                     `json:"kubeAdminLogoutURL"`
	KubeAPIServerURL                string                     `json:"kubeAPIServerURL"`
	K8sMode                         string                     `json:"k8sMode"`
	LoadTestFactor                  int                        `json:"loadTestFactor"`
	LoginErrorURL                   string                     `json:"loginErrorURL"`
	LoginSuccessURL                 string                     `json:"loginSuccessURL"`
	LoginURL                        string                     `json:"loginURL"`
	LogoutRedirect                  string                     `json:"logoutRedirect"`
	LogoutURL                       string                     `json:"logoutURL"`
	NodeArchitectures               []string                   `json:"nodeArchitectures"`
	NodeOperatingSystems            []string                   `json:"nodeOperatingSystems"`
	Perspectives                    string                     `json:"perspectives"`
	ProjectAccessClusterRoles       string                     `json:"projectAccessClusterRoles"`
	PrometheusBaseURL               string                     `json:"prometheusBaseURL"`
	PrometheusPublicURL             string                     `json:"prometheusPublicURL"`
	PrometheusTenancyBaseURL        string                     `json:"prometheusTenancyBaseURL"`
	QuickStarts                     string                     `json:"quickStarts"`
	ReleaseVersion                  string                     `json:"releaseVersion"`
	StatuspageID                    string                     `json:"statuspageID"`
	Telemetry                       serverconfig.MultiKeyValue `json:"telemetry"`
	ThanosPublicURL                 string                     `json:"thanosPublicURL"`
	UserSettingsLocation            string                     `json:"userSettingsLocation"`
	DevConsoleProxyAvailable        bool                       `json:"devConsoleProxyAvailable"`
}

type Server struct {
	AddPage                             string
	AlertManagerProxyConfig             *proxy.Config
	AlertManagerPublicURL               *url.URL
	AlertManagerTenancyHost             string
	AlertManagerTenancyProxyConfig      *proxy.Config
	AlertManagerUserWorkloadHost        string
	AlertManagerUserWorkloadProxyConfig *proxy.Config
	AnonymousInternalProxiedK8SRT       http.RoundTripper
	AuthDisabled                        bool
	Authenticator                       auth.Authenticator
	AuthMetrics                         *auth.Metrics
	BaseURL                             *url.URL
	Branding                            string
	Capabilities                        []operatorv1.Capability
	CatalogdProxyConfig                 *proxy.Config
	CatalogService                      *olm.CatalogService
	ClusterManagementProxyConfig        *proxy.Config
	CookieEncryptionKey                 []byte
	CookieAuthenticationKey             []byte
	ContentSecurityPolicyEnabled        bool
	ContentSecurityPolicy               serverconfig.MultiKeyValue
	ControlPlaneTopology                string
	CopiedCSVsDisabled                  bool
	CSRFVerifier                        *csrfverifier.CSRFVerifier
	CustomLogoFiles                     serverconfig.LogosKeyValue
	CustomFaviconFiles                  serverconfig.LogosKeyValue
	CustomProductName                   string
	DevCatalogCategories                string
	DevCatalogTypes                     string
	DocumentationBaseURL                *url.URL
	GitOpsProxyConfig                   *proxy.Config
	GOARCH                              string
	GOOS                                string
	GrafanaPublicURL                    *url.URL
	I18nNamespaces                      []string
	InactivityTimeout                   int
	InternalProxiedK8SClientConfig      *rest.Config
	K8sMode                             string
	K8sModeOffClusterSkipVerifyTLS      bool
	K8sProxyConfig                      *proxy.Config
	ProxyHeaderDenyList                 []string
	KnativeChannelCRDLister             ResourceLister
	KnativeEventSourceCRDLister         ResourceLister
	KubeAPIServerURL                    string // JS global only. Not used for proxying.
	KubeVersion                         string
	LoadTestFactor                      int
	MonitoringDashboardConfigMapLister  ResourceLister
	NodeArchitectures                   []string
	NodeOperatingSystems                []string
	Perspectives                        string
	PluginProxy                         string
	PluginsProxyTLSConfig               *tls.Config
	ProjectAccessClusterRoles           string
	PrometheusPublicURL                 *url.URL
	PublicDir                           string
	QuickStarts                         string
	ReleaseVersion                      string
	ServiceClient                       *http.Client
	StatuspageID                        string
	TectonicVersion                     string
	Telemetry                           serverconfig.MultiKeyValue
	TerminalProxyTLSConfig              *tls.Config
	ThanosProxyConfig                   *proxy.Config
	ThanosPublicURL                     *url.URL
	ThanosTenancyProxyConfig            *proxy.Config
	ThanosTenancyProxyForRulesConfig    *proxy.Config
	TokenReviewer                       *auth.TokenReviewer
	UserSettingsLocation                string
	EnabledPlugins                      serverconfig.MultiKeyValue
	EnabledPluginsOrder                 []string
	DevConsoleProxyAvailable            bool
	OLMHandler                          *http.Handler
}

func disableDirectoryListing(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// If the request is for a directory, return a 404.
		// Directory path is expected to end with a slash or be empty,
		// since we are stripping the '/static/' prefix from the path.
		if strings.HasSuffix(r.URL.Path, "/") || r.URL.Path == "" {

			http.NotFound(w, r)
			return
		}
		handler.ServeHTTP(w, r)
	})
}

func (s *Server) prometheusProxyEnabled() bool {
	return s.ThanosProxyConfig != nil && s.ThanosTenancyProxyConfig != nil && s.ThanosTenancyProxyForRulesConfig != nil
}

func (s *Server) alertManagerProxyEnabled() bool {
	return s.AlertManagerProxyConfig != nil && s.AlertManagerTenancyProxyConfig != nil
}

func (s *Server) gitopsProxyEnabled() bool {
	return s.GitOpsProxyConfig != nil
}

func (s *Server) HTTPHandler() (http.Handler, error) {
	if s.Authenticator == nil {
		return s.NoAuthConfiguredHandler(), nil
	}

	internalProxiedK8SClient, err := kubernetes.NewForConfig(s.InternalProxiedK8SClientConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to set up internal k8s client: %w", err)
	}
	internalProxiedK8SRT, err := rest.TransportFor(s.InternalProxiedK8SClientConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to set up internal k8s roundtripper: %v", err)
	}
	internalProxiedDynamic, err := dynamic.NewForConfig(s.InternalProxiedK8SClientConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to set up a dynamic client: %w", err)
	}

	mux := http.NewServeMux()
	k8sProxy := proxy.NewProxy(s.K8sProxyConfig)
	k8sProxyURL := s.K8sProxyConfig.Endpoint.String()
	handle := func(path string, handler http.Handler) {
		mux.Handle(proxy.SingleJoiningSlash(s.BaseURL.Path, path), handler)
	}

	handleFunc := func(path string, handler http.HandlerFunc) { handle(path, handler) }

	fn := func(loginInfo sessions.LoginJSON, successURL string, w http.ResponseWriter) {
		templateData := struct {
			sessions.LoginJSON `json:",inline"`
			LoginSuccessURL    string `json:"loginSuccessURL"`
			Branding           string `json:"branding"`
			CustomProductName  string `json:"customProductName"`
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
			klog.Fatalf("%v not found in configured public-dir path: %v", tokenizerPageTemplateName, err)
		}

		if err := tpls.ExecuteTemplate(w, tokenizerPageTemplateName, templateData); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}

	authenticator := s.Authenticator
	authHandler := func(h http.HandlerFunc) http.HandlerFunc {
		return authMiddleware(authenticator, s.CSRFVerifier, h)
	}

	// Deprecated: Use authMiddleware and auth.GetUserFromContext instead so that we can make better
	// use of the ServeHTTP function on the http.Handler interface, and make it easier to pass around
	// handler functions with the correct signature.
	authHandlerWithUser := func(h HandlerWithUser) http.HandlerFunc {
		return authMiddleware(s.Authenticator, s.CSRFVerifier, func(w http.ResponseWriter, r *http.Request) {
			user := auth.GetUserFromRequestContext(r)
			if user == nil {
				klog.Errorf("user not found in context")
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			h(user, w, r)
		})
	}

	// For requests where Authorization header with valid Bearer token is expected
	bearerTokenReviewHandler := func(h http.HandlerFunc) http.HandlerFunc {
		return withBearerTokenReview(s.TokenReviewer, h)
	}

	handleFunc(authLoginEndpoint, s.Authenticator.LoginFunc)
	handleFunc(authLogoutEndpoint, allowMethod(http.MethodPost, s.handleLogout))
	handleFunc(AuthLoginCallbackEndpoint, s.Authenticator.CallbackFunc(fn))
	handle(copyLoginEndpoint, authHandler(s.handleCopyLogin))

	handleFunc("/api/", notFoundHandler)

	staticHandler := http.StripPrefix(proxy.SingleJoiningSlash(s.BaseURL.Path, "/static/"), disableDirectoryListing(http.FileServer(http.Dir(s.PublicDir))))
	handle("/static/", gzipHandler(securityHeadersMiddleware(staticHandler)))

	if s.CustomLogoFiles != nil {
		handleFunc(customLogoEndpoint, func(w http.ResponseWriter, r *http.Request) {
			serverconfig.CustomLogosHandler(w, r, s.CustomLogoFiles, s.CustomFaviconFiles)
		})
	}

	// Scope of Service Worker needs to be higher than the requests it is intercepting (https://stackoverflow.com/a/35780776/6909941)
	handleFunc("/load-test.sw.js", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, path.Join(s.PublicDir, "load-test.sw.js"))
	})

	handleFunc("/health", health.Checker{
		Checks: []health.Checkable{},
	}.ServeHTTP)

	handle(catalogdEndpoint, s.CatalogdHandler())

	handle(k8sProxyEndpoint, http.StripPrefix(
		proxy.SingleJoiningSlash(s.BaseURL.Path, k8sProxyEndpoint),
		authHandler(k8sProxy.ServeHTTP),
	))

	handleFunc(devfileEndpoint, devfile.DevfileHandler)
	handleFunc(devfileSamplesEndpoint, devfile.DevfileSamplesHandler)

	terminalProxy := terminal.NewProxy(
		s.TerminalProxyTLSConfig,
		s.K8sProxyConfig.TLSClientConfig,
		s.K8sProxyConfig.Endpoint)

	handle(terminal.ProxyEndpoint, authHandlerWithUser(terminalProxy.HandleProxy))
	handleFunc(terminal.AvailableEndpoint, terminalProxy.HandleProxyEnabled)
	handleFunc(terminal.InstalledNamespaceEndpoint, terminalProxy.HandleTerminalInstalledNamespace)

	graphQLSchema, err := os.ReadFile("pkg/graphql/schema.graphql")
	if err != nil {
		panic(err)
	}
	opts := []graphql.SchemaOpt{graphql.UseFieldResolvers(), graphql.DisableIntrospection()}
	k8sResolver := resolver.K8sResolver{K8sProxy: k8sProxy}
	rootResolver := resolver.RootResolver{K8sResolver: &k8sResolver}
	schema := graphql.MustParseSchema(string(graphQLSchema), &rootResolver, opts...)
	handler := graphqlws.NewHandler()
	handler.InitPayload = resolver.InitPayload
	graphQLHandler := handler.NewHandlerFunc(schema, gql.NewHttpHandler(schema))
	handle("/api/graphql", authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(context.Background(), resolver.HeadersKey, map[string]interface{}{
			"Authorization": fmt.Sprintf("Bearer %s", user.Token),
		})
		graphQLHandler(w, r.WithContext(ctx))
	}))

	if s.prometheusProxyEnabled() {
		// Only proxy requests to the Prometheus API, not the UI.
		var (
			labelSourcePath             = prometheusProxyEndpoint + "/api/v1/label/"
			rulesSourcePath             = prometheusProxyEndpoint + "/api/v1/rules"
			querySourcePath             = prometheusProxyEndpoint + "/api/v1/query"
			queryRangeSourcePath        = prometheusProxyEndpoint + "/api/v1/query_range"
			targetsSourcePath           = prometheusProxyEndpoint + "/api/v1/targets"
			metadataSourcePath          = prometheusProxyEndpoint + "/api/v1/metadata"
			seriesSourcePath            = prometheusProxyEndpoint + "/api/v1/series"
			labelsSourcePath            = prometheusProxyEndpoint + "/api/v1/labels"
			targetAPIPath               = prometheusProxyEndpoint + "/api/"
			tenancyQuerySourcePath      = prometheusTenancyProxyEndpoint + "/api/v1/query"
			tenancyQueryRangeSourcePath = prometheusTenancyProxyEndpoint + "/api/v1/query_range"
			tenancyLabelSourcePath      = prometheusTenancyProxyEndpoint + "/api/v1/label/"
			tenancyRulesSourcePath      = prometheusTenancyProxyEndpoint + "/api/v1/rules"
			tenancyTargetAPIPath        = prometheusTenancyProxyEndpoint + "/api/"
			thanosProxy                 = proxy.NewProxy(s.ThanosProxyConfig)
			thanosTenancyProxy          = proxy.NewProxy(s.ThanosTenancyProxyConfig)
			thanosTenancyForRulesProxy  = proxy.NewProxy(s.ThanosTenancyProxyForRulesConfig)
		)

		handleThanosRequest := http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, targetAPIPath),
			authHandler(thanosProxy.ServeHTTP),
		)

		handleThanosTenancyRequest := http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, tenancyTargetAPIPath),
			authHandler(thanosTenancyProxy.ServeHTTP),
		)

		handleThanosTenancyForRulesRequest := http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, tenancyTargetAPIPath),
			authHandler(thanosTenancyForRulesProxy.ServeHTTP))

		// global label, query, and query_range requests have to be proxied via thanos
		handle(querySourcePath, handleThanosRequest)
		handle(queryRangeSourcePath, handleThanosRequest)
		handle(labelSourcePath, handleThanosRequest)
		handle(targetsSourcePath, handleThanosRequest)
		handle(metadataSourcePath, handleThanosRequest)
		handle(seriesSourcePath, handleThanosRequest)
		handle(labelsSourcePath, handleThanosRequest)

		// alerting (rules) are being proxied via thanos querier
		// such that both in-cluster and user workload alerts appear in console.
		handle(rulesSourcePath, handleThanosRequest)

		// tenancy queries and query ranges have to be proxied via thanos
		handle(tenancyQuerySourcePath, handleThanosTenancyRequest)
		handle(tenancyQueryRangeSourcePath, handleThanosTenancyRequest)
		handle(tenancyLabelSourcePath, handleThanosTenancyRequest)

		// tenancy rules have to be proxied via thanos
		handle(tenancyRulesSourcePath, handleThanosTenancyForRulesRequest)
	}

	if s.alertManagerProxyEnabled() {
		var (
			alertManagerProxyAPIPath             = alertManagerProxyEndpoint + "/api/"
			alertManagerUserWorkloadProxyAPIPath = alertmanagerUserWorkloadProxyEndpoint + "/api/"
			alertManagerTenancyProxyAPIPath      = alertManagerTenancyProxyEndpoint + "/api/"

			alertManagerProxy             = proxy.NewProxy(s.AlertManagerProxyConfig)
			alertManagerUserWorkloadProxy = proxy.NewProxy(s.AlertManagerUserWorkloadProxyConfig)
			alertManagerTenancyProxy      = proxy.NewProxy(s.AlertManagerTenancyProxyConfig)
		)

		handle(alertManagerProxyAPIPath, http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, alertManagerProxyAPIPath),
			authHandler(alertManagerProxy.ServeHTTP),
		))

		handle(alertManagerUserWorkloadProxyAPIPath, http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, alertManagerUserWorkloadProxyAPIPath),
			authHandler(alertManagerUserWorkloadProxy.ServeHTTP),
		))

		handle(alertManagerTenancyProxyAPIPath, http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, alertManagerTenancyProxyAPIPath),
			authHandler(alertManagerTenancyProxy.ServeHTTP),
		))
	}

	clusterManagementProxy := proxy.NewProxy(s.ClusterManagementProxyConfig)
	handle(accountManagementEndpoint, http.StripPrefix(
		s.BaseURL.Path,
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			clusterManagementProxy.ServeHTTP(w, r)
		})),
	)

	olmHandler := olm.NewOLMHandler(
		k8sProxyURL,
		&http.Client{
			Transport: internalProxiedK8SRT,
		},
		s.CatalogService,
	)

	handle("/api/olm/", authHandler(olmHandler.ServeHTTP))

	handle("/api/console/monitoring-dashboard-config", authHandler(s.handleMonitoringDashboardConfigmaps))
	// Knative
	trimURLPrefix := proxy.SingleJoiningSlash(s.BaseURL.Path, knativeProxyEndpoint)
	knativeHandler := knative.NewKnativeHandler(
		s.AnonymousInternalProxiedK8SRT,
		k8sProxyURL,
		trimURLPrefix,
	)

	handle(knativeProxyEndpoint, authHandlerWithUser(knativeHandler.Handle))
	// TODO: move the knative-event-sources and knative-channels handler into the knative module.
	handle("/api/console/knative-event-sources", authHandler(s.handleKnativeEventSourceCRDs))
	handle("/api/console/knative-channels", authHandler(s.handleKnativeChannelCRDs))

	// Dev-Console Endpoints
	handle(devConsoleEndpoint, http.StripPrefix(
		proxy.SingleJoiningSlash(s.BaseURL.Path, devConsoleEndpoint),
		authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
			devconsole.Handler(user, w, r, internalProxiedDynamic, s.K8sMode, s.ProxyHeaderDenyList)
		})),
	)

	// User settings
	userSettingHandler := usersettings.NewUserSettingsHandler(internalProxiedK8SClient, s.AnonymousInternalProxiedK8SRT, k8sProxyURL)

	handle("/api/console/user-settings", authHandlerWithUser(userSettingHandler.HandleUserSettings))

	// Helm
	helmHandlers := helmhandlerspkg.New(k8sProxyURL, internalProxiedK8SRT, s)
	verifierHandler := helmhandlerspkg.NewVerifierHandler(k8sProxyURL, internalProxiedK8SRT, s)
	handle("/api/helm/verify", authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			verifierHandler.HandleChartVerifier(user, w, r)
		default:
			w.Header().Set("Allow", "POST")
			serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Unsupported method, supported methods are POST"})
		}
	}))

	// Plugins
	pluginsHandler := plugins.NewPluginsHandler(
		&http.Client{
			// 120 seconds matches the webpack require timeout.
			// Plugins are loaded asynchronously, so this doesn't block page load.
			Timeout:   120 * time.Second,
			Transport: &http.Transport{TLSClientConfig: s.PluginsProxyTLSConfig},
		},
		s.EnabledPlugins,
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
		}
		proxyServiceHandlers, err := plugins.GetPluginProxyServiceHandlers(proxyConfig, s.PluginsProxyTLSConfig, pluginProxyEndpoint)
		if err != nil {
			klog.Fatalf("Error getting plugin proxy handlers: %s", err)
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

	handle(updatesEndpoint, authHandler(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "GET" {
			w.Header().Set("Allow", "GET")
			serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Method unsupported, the only supported methods is GET"})
			return
		}
		serverutils.SendResponse(w, http.StatusOK, struct {
			ConsoleCommit         string                  `json:"consoleCommit"`
			Plugins               []string                `json:"plugins"`
			Capabilities          []operatorv1.Capability `json:"capabilities,omitempty"`
			ContentSecurityPolicy string                  `json:"contentSecurityPolicy,omitempty"`
		}{
			ConsoleCommit:         os.Getenv("SOURCE_GIT_COMMIT"),
			Plugins:               pluginsHandler.GetPluginsList(),
			Capabilities:          s.Capabilities,
			ContentSecurityPolicy: s.ContentSecurityPolicy.String(),
		})
	}))

	// Metrics
	config := &serverconfig.Config{
		Plugins: s.EnabledPlugins,
		Customization: serverconfig.Customization{
			Perspectives: []serverconfig.Perspective{},
		},
	}
	if len(s.Perspectives) > 0 {
		err := json.Unmarshal([]byte(s.Perspectives), &config.Customization.Perspectives)
		if err != nil {
			klog.Errorf("Unable to parse perspective JSON: %v", err)
		}
	}

	serverconfigMetrics := serverconfig.NewMetrics(config)
	serverconfigMetrics.MonitorPlugins(internalProxiedDynamic)
	usageMetrics := usage.NewMetrics()
	usageMetrics.MonitorUsers(internalProxiedK8SClient)
	prometheus.MustRegister(serverconfigMetrics.GetCollectors()...)
	prometheus.MustRegister(usageMetrics.GetCollectors()...)
	prometheus.MustRegister(s.AuthMetrics.GetCollectors()...)

	handle("/metrics", bearerTokenReviewHandler(func(w http.ResponseWriter, r *http.Request) {
		promhttp.Handler().ServeHTTP(w, r)
	}))
	handleFunc("/api/metrics/usage", authHandler(func(w http.ResponseWriter, r *http.Request) {
		usage.Handle(usageMetrics, w, r)
	}))

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

	handle("/api/helm/release/async", authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			helmHandlers.HandleHelmInstallAsync(user, w, r)
		case http.MethodPut:
			helmHandlers.HandleUpgradeReleaseAsync(user, w, r)
		case http.MethodDelete:
			helmHandlers.HandleUninstallReleaseAsync(user, w, r)
		default:
			w.Header().Set("Allow", "POST, PUT , DELETE")
			serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Unsupported method, supported methods are POST, PUT , DELETE"})
		}
	}))

	// GitOps proxy endpoints
	if s.gitopsProxyEnabled() {
		gitopsProxy := proxy.NewProxy(s.GitOpsProxyConfig)
		handle(gitopsEndpoint, http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, gitopsEndpoint),
			authHandler(gitopsProxy.ServeHTTP)),
		)
	}

	handle("/api/console/version", authHandler(s.versionHandler))

	// CRD Schema
	// NOTE: We are using the InternalProxiedK8SClientConfig service account to make the Kubernetes API request
	// This endpoint is accessible to ALL logged in users, even if the user does not have the RBAC role to the CRD
	// Therefore only the printer columns are returned, not the full CRD
	crdSchemaHandler := crdschema.NewCRDSchemaHandler(s.InternalProxiedK8SClientConfig)
	handle(crdSchemaEndpoint, http.StripPrefix(
		proxy.SingleJoiningSlash(s.BaseURL.Path, crdSchemaEndpoint),
		authHandler(crdSchemaHandler.HandleCRDSchema),
	))

	mux.HandleFunc(s.BaseURL.Path, s.indexHandler)

	return securityHeadersMiddleware(http.Handler(mux)), nil
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

	indexPageScriptNonce, err := utils.RandomString(32)
	if err != nil {
		panic(err)
	}

	if s.ContentSecurityPolicyEnabled {
		cspDirectives, err := utils.BuildCSPDirectives(
			s.K8sMode,
			s.ContentSecurityPolicy,
			indexPageScriptNonce,
			r.Header.Get("Test-CSP-Reporting-Endpoint"),
		)
		if err != nil {
			klog.Fatalf("Error building Content Security Policy directives: %s", err)
		}
		w.Header().Set("Content-Security-Policy-Report-Only", strings.Join(cspDirectives, "; "))
	}

	jsg := &jsGlobals{
		AddPage:                   s.AddPage,
		AlertManagerPublicURL:     s.AlertManagerPublicURL.String(),
		AuthDisabled:              s.Authenticator.IsStatic(),
		BasePath:                  s.BaseURL.Path,
		Branding:                  s.Branding,
		Capabilities:              s.Capabilities,
		ConsolePlugins:            s.EnabledPluginsOrder,
		ConsoleVersion:            version.Version,
		ControlPlaneTopology:      s.ControlPlaneTopology,
		CopiedCSVsDisabled:        s.CopiedCSVsDisabled,
		CustomFaviconsConfigured:  !s.CustomFaviconFiles.IsEmpty(),
		CustomLogosConfigured:     !s.CustomLogoFiles.IsEmpty(),
		CustomProductName:         s.CustomProductName,
		DevCatalogCategories:      s.DevCatalogCategories,
		DevCatalogTypes:           s.DevCatalogTypes,
		DocumentationBaseURL:      s.DocumentationBaseURL.String(),
		GOARCH:                    s.GOARCH,
		GOOS:                      s.GOOS,
		GrafanaPublicURL:          s.GrafanaPublicURL.String(),
		GraphQLBaseURL:            proxy.SingleJoiningSlash(s.BaseURL.Path, graphQLEndpoint),
		I18nNamespaces:            s.I18nNamespaces,
		InactivityTimeout:         s.InactivityTimeout,
		K8sMode:                   s.K8sMode,
		KubeAdminLogoutURL:        s.Authenticator.GetSpecialURLs().KubeAdminLogout,
		KubeAPIServerURL:          s.KubeAPIServerURL,
		LoadTestFactor:            s.LoadTestFactor,
		LoginErrorURL:             proxy.SingleJoiningSlash(s.BaseURL.String(), AuthLoginErrorEndpoint),
		LoginSuccessURL:           proxy.SingleJoiningSlash(s.BaseURL.String(), AuthLoginSuccessEndpoint),
		LoginURL:                  proxy.SingleJoiningSlash(s.BaseURL.String(), authLoginEndpoint),
		LogoutRedirect:            s.Authenticator.LogoutRedirectURL(),
		LogoutURL:                 authLogoutEndpoint,
		NodeArchitectures:         s.NodeArchitectures,
		NodeOperatingSystems:      s.NodeOperatingSystems,
		Perspectives:              s.Perspectives,
		ProjectAccessClusterRoles: s.ProjectAccessClusterRoles,
		PrometheusPublicURL:       s.PrometheusPublicURL.String(),
		QuickStarts:               s.QuickStarts,
		ReleaseVersion:            s.ReleaseVersion,
		StatuspageID:              s.StatuspageID,
		Telemetry:                 s.Telemetry,
		ThanosPublicURL:           s.ThanosPublicURL.String(),
		UserSettingsLocation:      s.UserSettingsLocation,
		DevConsoleProxyAvailable:  true,
	}

	if s.prometheusProxyEnabled() {
		jsg.PrometheusBaseURL = proxy.SingleJoiningSlash(s.BaseURL.Path, prometheusProxyEndpoint)
		jsg.PrometheusTenancyBaseURL = proxy.SingleJoiningSlash(s.BaseURL.Path, prometheusTenancyProxyEndpoint)
	}

	if s.alertManagerProxyEnabled() {
		jsg.AlertManagerBaseURL = proxy.SingleJoiningSlash(s.BaseURL.Path, alertManagerProxyEndpoint)
		jsg.AlertmanagerUserWorkloadBaseURL = proxy.SingleJoiningSlash(s.BaseURL.Path, alertmanagerUserWorkloadProxyEndpoint)
	}

	s.CSRFVerifier.SetCSRFCookie(s.BaseURL.Path, w)

	// set the customLogoURL server flag only when there is a customLogo or customFavicon configuration
	if !s.CustomLogoFiles.IsEmpty() || !s.CustomFaviconFiles.IsEmpty() {
		jsg.CustomLogoURL = proxy.SingleJoiningSlash(s.BaseURL.Path, customLogoEndpoint)
	}

	templateData := struct {
		ServerFlags *jsGlobals
		ScriptNonce string
	}{
		ServerFlags: jsg,
		ScriptNonce: indexPageScriptNonce,
	}

	tpl := template.New(indexPageTemplateName)
	tpl.Delims("[[", "]]")
	tpls, err := tpl.ParseFiles(path.Join(s.PublicDir, indexPageTemplateName))
	if err != nil {
		klog.Fatalf("index.html not found in configured public-dir path: %v", err)
	}

	if err := tpls.ExecuteTemplate(w, indexPageTemplateName, templateData); err != nil {
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

func (s *Server) handleCopyLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Invalid method: only GET is allowed"})
		return
	}

	specialAuthURLs := s.Authenticator.GetSpecialURLs()

	serverutils.SendResponse(w, http.StatusOK, struct {
		RequestTokenURL      string `json:"requestTokenURL"`
		ExternalLoginCommand string `json:"externalLoginCommand"`
	}{
		RequestTokenURL:      specialAuthURLs.RequestToken,
		ExternalLoginCommand: s.Authenticator.GetOCLoginCommand(),
	})
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	s.CSRFVerifier.WithCSRFVerification(http.HandlerFunc(s.Authenticator.LogoutFunc)).ServeHTTP(w, r)
}

func (s *Server) NoAuthConfiguredHandler() http.Handler {
	mux := http.NewServeMux()
	mux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		fmt.Fprint(w, "Please configure authentication to use the web console.")
	}))
	return securityHeadersMiddleware(mux)
}

func (s *Server) CatalogdHandler() http.Handler {
	if s.CatalogdProxyConfig == nil {
		return http.NotFoundHandler()
	}
	catalogdProxy := proxy.NewProxy(s.CatalogdProxyConfig)
	return http.StripPrefix(
		proxy.SingleJoiningSlash(s.BaseURL.Path, catalogdEndpoint),
		catalogdProxy,
	)
}
