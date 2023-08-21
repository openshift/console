package server

import (
	"context"
	"crypto/sha256"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
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
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"k8s.io/client-go/transport"
	"k8s.io/klog"

	"github.com/openshift/console/pkg/auth"
	devconsoleProxy "github.com/openshift/console/pkg/devconsole/proxy"
	"github.com/openshift/console/pkg/devfile"
	"github.com/openshift/console/pkg/graphql/resolver"
	helmhandlerspkg "github.com/openshift/console/pkg/helm/handlers"
	"github.com/openshift/console/pkg/knative"
	"github.com/openshift/console/pkg/metrics"
	"github.com/openshift/console/pkg/plugins"
	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/pkg/serverconfig"
	"github.com/openshift/console/pkg/serverutils"
	"github.com/openshift/console/pkg/terminal"
	"github.com/openshift/console/pkg/usage"
	"github.com/openshift/console/pkg/usersettings"
	"github.com/openshift/console/pkg/version"

	graphql "github.com/graph-gophers/graphql-go"
	"github.com/graph-gophers/graphql-go/relay"
	"github.com/rawagner/graphql-transport-ws/graphqlws"
)

// Public constants
const (
	AuthLoginCallbackEndpoint = "/auth/callback"
	AuthLoginErrorEndpoint    = "/error"
	AuthLoginSuccessEndpoint  = "/"
)

// Private constants
const (
	accountManagementEndpoint             = "/api/accounts_mgmt/"
	alertManagerProxyEndpoint             = "/api/alertmanager"
	alertManagerTenancyProxyEndpoint      = "/api/alertmanager-tenancy"
	alertmanagerUserWorkloadProxyEndpoint = "/api/alertmanager-user-workload"
	authLoginEndpoint                     = "/auth/login"
	authLogoutEndpoint                    = "/auth/logout"
	authLogoutMulticlusterEndpoint        = "/api/logout/multicluster" // TODO remove multicluster.
	customLogoEndpoint                    = "/custom-logo"
	deleteOpenshiftTokenEndpoint          = "/api/openshift/delete-token"
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
	multiclusterLogoutPageTemplateName    = "multicluster-logout.html" // TODO remove multicluster
	operandsListEndpoint                  = "/api/list-operands/"
	pluginAssetsEndpoint                  = "/api/plugins/"
	pluginProxyEndpoint                   = "/api/proxy/"
	prometheusProxyEndpoint               = "/api/prometheus"
	prometheusTenancyProxyEndpoint        = "/api/prometheus-tenancy"
	requestTokenEndpoint                  = "/api/request-token"
	sha256Prefix                          = "sha256~"
	thanosServiceProxyPath                = "/api/v1/namespaces/openshift-monitoring/services/https:thanos-querier:9091/proxy-service/api" // TODO remove multicluster
	thanosTenancyForRulesServiceProxyPath = "/api/v1/namespaces/openshift-monitoring/services/https:thanos-querier:9093/proxy-service/api" // TODO remove multicluster
	thanosTenancyServiceProxyPath         = "/api/v1/namespaces/openshift-monitoring/services/https:thanos-querier:9092/proxy-service/api" // TODO remove multicluster
	tokenizerPageTemplateName             = "tokener.html"
	updatesEndpoint                       = "/api/check-updates"
)

type jsGlobals struct {
	AddPage                         string                     `json:"addPage"`
	AlertManagerBaseURL             string                     `json:"alertManagerBaseURL"`
	AlertManagerPublicURL           string                     `json:"alertManagerPublicURL"`
	AlertmanagerUserWorkloadBaseURL string                     `json:"alertmanagerUserWorkloadBaseURL"`
	AuthDisabled                    bool                       `json:"authDisabled"`
	BasePath                        string                     `json:"basePath"`
	Branding                        string                     `json:"branding"`
	ConsolePlugins                  []string                   `json:"consolePlugins"`
	ConsoleVersion                  string                     `json:"consoleVersion"`
	ControlPlaneTopology            string                     `json:"controlPlaneTopology"`
	CopiedCSVsDisabled              bool                       `json:"copiedCSVsDisabled"`
	CustomLogoURL                   string                     `json:"customLogoURL"`
	CustomProductName               string                     `json:"customProductName"`
	DevCatalogCategories            string                     `json:"developerCatalogCategories"`
	DevCatalogTypes                 string                     `json:"developerCatalogTypes"`
	DocumentationBaseURL            string                     `json:"documentationBaseURL"`
	GOARCH                          string                     `json:"GOARCH"`
	GOOS                            string                     `json:"GOOS"`
	GrafanaPublicURL                string                     `json:"grafanaPublicURL"`
	GraphQLBaseURL                  string                     `json:"graphqlBaseURL"`
	HubConsoleURL                   string                     `json:"hubConsoleURL"` // TODO remove multicluster
	I18nNamespaces                  []string                   `json:"i18nNamespaces"`
	InactivityTimeout               int                        `json:"inactivityTimeout"`
	KubeAdminLogoutURL              string                     `json:"kubeAdminLogoutURL"`
	KubeAPIServerURL                string                     `json:"kubeAPIServerURL"`
	KubectlClientID                 string                     `json:"kubectlClientID"`
	LoadTestFactor                  int                        `json:"loadTestFactor"`
	LoginErrorURL                   string                     `json:"loginErrorURL"`
	LoginSuccessURL                 string                     `json:"loginSuccessURL"`
	LoginURL                        string                     `json:"loginURL"`
	LogoutRedirect                  string                     `json:"logoutRedirect"`
	LogoutURL                       string                     `json:"logoutURL"`
	MulticlusterLogoutRedirect      string                     `json:"multiclusterLogoutRedirect"` // TODO remove multicluster
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
	K8sMode                         string                     `json:"k8sMode"`
}

type Server struct {
	AddPage                             string
	AlertManagerProxyConfig             *proxy.Config
	AlertManagerPublicURL               *url.URL
	AlertManagerTenancyHost             string
	AlertManagerTenancyProxyConfig      *proxy.Config
	AlertManagerUserWorkloadHost        string
	AlertManagerUserWorkloadProxyConfig *proxy.Config
	Authers                             map[string]*auth.Authenticator // TODO remove multicluster
	AuthMetrics                         *auth.Metrics                  // TODO remove multicluster
	BaseURL                             *url.URL
	Branding                            string
	ClusterManagementProxyConfig        *proxy.Config
	ControlPlaneTopology                string
	CopiedCSVsDisabled                  bool
	CustomLogoFile                      string
	CustomProductName                   string
	DevCatalogCategories                string
	DevCatalogTypes                     string
	DocumentationBaseURL                *url.URL
	EnabledConsolePlugins               serverconfig.MultiKeyValue
	GitOpsProxyConfig                   *proxy.Config
	GOARCH                              string
	GOOS                                string
	GrafanaPublicURL                    *url.URL
	HubConsoleURL                       *url.URL // TODO remove multicluster
	I18nNamespaces                      []string
	InactivityTimeout                   int
	K8sClient                           *http.Client
	K8sMode                             string
	K8sProxyConfig                      *proxy.Config
	KnativeChannelCRDLister             ResourceLister
	KnativeEventSourceCRDLister         ResourceLister
	KubeAPIServerURL                    string
	KubectlClientID                     string
	KubeVersion                         string
	LoadTestFactor                      int
	LogoutRedirect                      *url.URL
	ManagedClusterProxyConfig           *proxy.Config // TODO remove multicluster
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
	ServiceAccountToken                 string
	ServiceClient                       *http.Client
	StaticUser                          *auth.User
	StatuspageID                        string
	TectonicVersion                     string
	Telemetry                           serverconfig.MultiKeyValue
	TerminalProxyTLSConfig              *tls.Config
	ThanosProxyConfig                   *proxy.Config
	ThanosPublicURL                     *url.URL
	ThanosTenancyProxyConfig            *proxy.Config
	ThanosTenancyProxyForRulesConfig    *proxy.Config
	UserSettingsLocation                string
}

// TODO remove multicluster
func (s *Server) getLocalAuther() *auth.Authenticator {
	return s.Authers[serverutils.LocalClusterName]
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

func (s *Server) authDisabled() bool {
	return s.getLocalAuther() == nil
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

// TODO remove multicluster
func (s *Server) getManagedClusterList() []string {
	clusters := make([]string, 0, len(s.Authers))
	for cluster := range s.Authers {
		clusters = append(clusters, cluster)
	}
	return clusters
}

func (s *Server) HTTPHandler() http.Handler {
	mux := http.NewServeMux()

	// TODO remove multicluster
	localAuther := s.getLocalAuther()
	localK8sProxy := proxy.NewProxy(s.K8sProxyConfig)
	var managedClusterProxy *proxy.Proxy
	if s.ManagedClusterProxyConfig != nil {
		managedClusterProxy = proxy.NewProxy(s.ManagedClusterProxyConfig)
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
		handleFunc(AuthLoginCallbackEndpoint, localAuther.CallbackFunc(fn))
		handleFunc(authLogoutMulticlusterEndpoint, s.handleLogoutMulticluster) // TODO remove multicluster
		handle(requestTokenEndpoint, authHandler(s.handleClusterTokenURL))
		handle(deleteOpenshiftTokenEndpoint, authHandlerWithUser(s.handleOpenShiftTokenDeletion))

		// TODO remove multicluster
		for clusterName, clusterAuther := range s.Authers {
			if clusterAuther != nil {
				handleFunc(proxy.SingleJoiningSlash(authLoginEndpoint, clusterName), clusterAuther.LoginFunc)
				handleFunc(proxy.SingleJoiningSlash(AuthLoginCallbackEndpoint, clusterName), clusterAuther.CallbackFunc(fn))
			}
		}

	}

	handleFunc("/api/", notFoundHandler)

	staticHandler := http.StripPrefix(proxy.SingleJoiningSlash(s.BaseURL.Path, "/static/"), disableDirectoryListing(http.FileServer(http.Dir(s.PublicDir))))
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

		// TODO remove multicluster.
		authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
			cluster := serverutils.GetCluster(r)
			k8sProxy := localK8sProxy
			if cluster != serverutils.LocalClusterName {
				r.URL.Path = proxy.SingleJoiningSlash("/"+cluster, r.URL.Path)
				r.URL.RawPath = proxy.SingleJoiningSlash("/"+cluster, r.URL.RawPath)
				k8sProxy = managedClusterProxy
			}
			r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
			k8sProxy.ServeHTTP(w, r)
		})),
	)

	handleFunc(devfileEndpoint, devfile.DevfileHandler)
	handleFunc(devfileSamplesEndpoint, devfile.DevfileSamplesHandler)

	terminalProxy := terminal.NewProxy(
		s.TerminalProxyTLSConfig,
		s.K8sProxyConfig.TLSClientConfig,
		s.K8sProxyConfig.Endpoint)

	handle(terminal.ProxyEndpoint, authHandlerWithUser(terminalProxy.HandleProxy))
	handleFunc(terminal.AvailableEndpoint, terminalProxy.HandleProxyEnabled)
	handleFunc(terminal.InstalledNamespaceEndpoint, terminalProxy.HandleTerminalInstalledNamespace)

	graphQLSchema, err := ioutil.ReadFile("pkg/graphql/schema.graphql")
	if err != nil {
		panic(err)
	}
	opts := []graphql.SchemaOpt{graphql.UseFieldResolvers()}
	k8sResolver := resolver.K8sResolver{K8sProxy: localK8sProxy}
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
		)

		localThanosProxy := proxy.NewProxy(s.ThanosProxyConfig)
		handleThanosRequest := http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, targetAPIPath),

			// TODO remove multicluster
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				cluster := serverutils.GetCluster(r)
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				thanosProxy := localThanosProxy
				if cluster != serverutils.LocalClusterName {
					path := proxy.SingleJoiningSlash("/"+cluster, thanosServiceProxyPath)
					r.URL.Path = proxy.SingleJoiningSlash(path, r.URL.Path)
					r.URL.RawPath = proxy.SingleJoiningSlash(path, r.URL.RawPath)
					thanosProxy = managedClusterProxy
				}
				thanosProxy.ServeHTTP(w, r)
			}))

		localThanosTenancyProxy := proxy.NewProxy(s.ThanosTenancyProxyConfig)
		handleThanosTenancyRequest := http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, tenancyTargetAPIPath),

			// TODO remove multicluster
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				cluster := serverutils.GetCluster(r)
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				thanosTenancyProxy := localThanosTenancyProxy
				if cluster != serverutils.LocalClusterName {
					serviceProxyPath := proxy.SingleJoiningSlash("/"+cluster, thanosTenancyServiceProxyPath)
					r.URL.Path = proxy.SingleJoiningSlash(serviceProxyPath, r.URL.Path)
					r.URL.RawPath = proxy.SingleJoiningSlash(serviceProxyPath, r.URL.RawPath)
					thanosTenancyProxy = managedClusterProxy
				}
				thanosTenancyProxy.ServeHTTP(w, r)
			}))

		localThanosTenancyForRulesProxy := proxy.NewProxy(s.ThanosTenancyProxyForRulesConfig)
		handleThanosTenancyForRulesRequest := http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, tenancyTargetAPIPath),

			// TODO remove multicluster
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				cluster := serverutils.GetCluster(r)
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				thanosTenancyForRulesProxy := localThanosTenancyForRulesProxy
				if cluster != serverutils.LocalClusterName {
					serviceProxyPath := proxy.SingleJoiningSlash("/"+cluster, thanosTenancyForRulesServiceProxyPath)
					r.URL.Path = proxy.SingleJoiningSlash(serviceProxyPath, r.URL.Path)
					r.URL.RawPath = proxy.SingleJoiningSlash(serviceProxyPath, r.URL.RawPath)
					thanosTenancyForRulesProxy = managedClusterProxy
				}
				thanosTenancyForRulesProxy.ServeHTTP(w, r)
			}))

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
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				alertManagerProxy.ServeHTTP(w, r)
			})),
		)

		handle(alertManagerUserWorkloadProxyAPIPath, http.StripPrefix(
			proxy.SingleJoiningSlash(s.BaseURL.Path, alertManagerUserWorkloadProxyAPIPath),
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				alertManagerUserWorkloadProxy.ServeHTTP(w, r)
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
		Client:       s.K8sClient,
	}

	handle(operandsListEndpoint, http.StripPrefix(
		proxy.SingleJoiningSlash(s.BaseURL.Path, operandsListEndpoint),
		authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
			operandsListHandler.OperandsListHandler(user, w, r)
		}),
	))

	handle("/api/console/monitoring-dashboard-config", authHandler(s.handleMonitoringDashboardConfigmaps))
	// Knative
	trimURLPrefix := proxy.SingleJoiningSlash(s.BaseURL.Path, knativeProxyEndpoint)
	knativeHandler := knative.NewKnativeHandler(trimURLPrefix,
		s.K8sClient,
		s.K8sProxyConfig.Endpoint.String())
	handle(knativeProxyEndpoint, authHandlerWithUser(knativeHandler.Handle))
	// TODO: move the knative-event-sources and knative-channels handler into the knative module.
	handle("/api/console/knative-event-sources", authHandler(s.handleKnativeEventSourceCRDs))
	handle("/api/console/knative-channels", authHandler(s.handleKnativeChannelCRDs))

	// Dev-Console Proxy
	handle(devConsoleEndpoint, http.StripPrefix(
		proxy.SingleJoiningSlash(s.BaseURL.Path, devConsoleEndpoint),
		authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
			devconsoleProxy.Handler(w, r)
		})),
	)

	// User settings
	userSettingHandler := usersettings.UserSettingsHandler{
		Client:   s.K8sClient,
		Endpoint: s.K8sProxyConfig.Endpoint.String(),
	}
	handle("/api/console/user-settings", authHandlerWithUser(userSettingHandler.HandleUserSettings))

	// Helm
	helmHandlers := helmhandlerspkg.New(s.K8sProxyConfig.Endpoint.String(), s.K8sClient.Transport, s)
	verifierHandler := helmhandlerspkg.NewVerifierHandler(s.K8sProxyConfig.Endpoint.String(), s.K8sClient.Transport, s)
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

	handle(updatesEndpoint, authHandler(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "GET" {
			w.Header().Set("Allow", "GET")
			serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Method unsupported, the only supported methods is GET"})
			return
		}
		serverutils.SendResponse(w, http.StatusOK, struct {
			ConsoleCommit   string   `json:"consoleCommit"`
			ManagedClusters []string `json:"managedClusters"` // TODO remove multicluster
			Plugins         []string `json:"plugins"`
		}{
			ConsoleCommit:   os.Getenv("SOURCE_GIT_COMMIT"),
			ManagedClusters: s.getManagedClusterList(), // TODO remove multicluster
			Plugins:         pluginsHandler.GetPluginsList(),
		})
	}))

	// Metrics
	config := &serverconfig.Config{
		Plugins: s.EnabledConsolePlugins,
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
	serverconfigMetrics.MonitorPlugins(
		s.K8sClient,
		s.K8sProxyConfig.Endpoint.String(),
	)
	usageMetrics := usage.NewMetrics()
	usageMetrics.MonitorUsers(
		s.K8sClient,
		s.K8sProxyConfig.Endpoint.String(),
	)
	prometheus.MustRegister(s.AuthMetrics.GetCollectors()...) // TODO remove multicluster
	prometheus.MustRegister(serverconfigMetrics.GetCollectors()...)
	prometheus.MustRegister(usageMetrics.GetCollectors()...)
	handle("/metrics", metrics.AddHeaderAsCookieMiddleware(
		authHandler(func(w http.ResponseWriter, r *http.Request) {
			promhttp.Handler().ServeHTTP(w, r)
		}),
	))
	handleFunc("/metrics/usage", func(w http.ResponseWriter, r *http.Request) {
		usage.Handle(usageMetrics, w, r)
	})

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
			authHandlerWithUser(func(user *auth.User, w http.ResponseWriter, r *http.Request) {
				r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
				gitopsProxy.ServeHTTP(w, r)
			})),
		)
	}

	handle("/api/console/version", authHandler(s.versionHandler))

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
		MulticlusterLogoutRedirect: proxy.SingleJoiningSlash(s.BaseURL.String(), authLogoutMulticlusterEndpoint), // TODO remove multicluster
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
		DevCatalogTypes:            s.DevCatalogTypes,
		UserSettingsLocation:       s.UserSettingsLocation,
		ConsolePlugins:             plugins,
		I18nNamespaces:             s.I18nNamespaces,
		QuickStarts:                s.QuickStarts,
		AddPage:                    s.AddPage,
		ProjectAccessClusterRoles:  s.ProjectAccessClusterRoles,
		Perspectives:               s.Perspectives,
		Telemetry:                  s.Telemetry,
		ReleaseVersion:             s.ReleaseVersion,
		NodeArchitectures:          s.NodeArchitectures,
		NodeOperatingSystems:       s.NodeOperatingSystems,
		CopiedCSVsDisabled:         s.CopiedCSVsDisabled,
		HubConsoleURL:              s.HubConsoleURL.String(), // TODO remove multicluster
		K8sMode:                    s.K8sMode,
	}

	localAuther := s.getLocalAuther() // TODO remove multicluster

	if !s.authDisabled() {
		specialAuthURLs := localAuther.GetSpecialURLs()
		jsg.KubeAdminLogoutURL = specialAuthURLs.KubeAdminLogout
	}

	if s.prometheusProxyEnabled() {
		jsg.PrometheusBaseURL = proxy.SingleJoiningSlash(s.BaseURL.Path, prometheusProxyEndpoint)
		jsg.PrometheusTenancyBaseURL = proxy.SingleJoiningSlash(s.BaseURL.Path, prometheusTenancyProxyEndpoint)
	}

	if s.alertManagerProxyEnabled() {
		jsg.AlertManagerBaseURL = proxy.SingleJoiningSlash(s.BaseURL.Path, alertManagerProxyEndpoint)
		jsg.AlertmanagerUserWorkloadBaseURL = proxy.SingleJoiningSlash(s.BaseURL.Path, alertmanagerUserWorkloadProxyEndpoint)
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

func (s *Server) handleClusterTokenURL(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Invalid method: only GET is allowed"})
		return
	}

	// TODO remove multicluster
	cluster := serverutils.GetCluster(r)
	auther, ok := s.Authers[cluster]
	if !ok {
		errMsg := fmt.Sprintf("Auther for %q not found", cluster)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{Err: errMsg})
		return
	}

	requestTokenURL := auther.GetSpecialURLs().RequestToken
	serverutils.SendResponse(w, http.StatusOK, struct {
		RequestTokenURL string `json:"requestTokenURL"`
	}{
		RequestTokenURL: requestTokenURL,
	})
}

func (s *Server) handleOpenShiftTokenDeletion(user *auth.User, w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Invalid method: only POST is allowed"})
		return
	}

	tokenName := user.Token
	if strings.HasPrefix(tokenName, sha256Prefix) {
		tokenName = tokenToObjectName(tokenName)
	}

	// Proxy request to correct cluster
	// TODO remove multicluster
	cluster := serverutils.GetCluster(r)
	client := s.K8sClient
	proxyConfig := s.K8sProxyConfig
	path := "/apis/oauth.openshift.io/v1/oauthaccesstokens/" + tokenName
	if cluster != serverutils.LocalClusterName {
		client = s.ServiceClient
		proxyConfig = s.ManagedClusterProxyConfig
		path = proxy.SingleJoiningSlash("/"+cluster, path)
	}

	// Delete the OpenShift OAuthAccessToken.
	url := proxy.SingleJoiningSlash(proxyConfig.Endpoint.String(), path)
	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: fmt.Sprintf("Failed to create token DELETE request: %v", err)})
		return
	}

	r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
	resp, err := client.Do(req)
	if err != nil {
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: fmt.Sprintf("Failed to delete token: %v", err)})
		return
	}

	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
	resp.Body.Close()
}

// TODO: Move this function into the auth module
// TODO remove multicluster
func (s *Server) handleLogoutMulticluster(w http.ResponseWriter, r *http.Request) {
	if s.AuthMetrics != nil {
		s.AuthMetrics.LogoutRequested(auth.UnknownLogoutReason)
	}

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

func GetK8sClient(tlsConfig *tls.Config, bearerTokenFilePath string) (*http.Client, error) {
	tr := &http.Transport{
		TLSClientConfig: tlsConfig,
	}
	tripper, err := transport.NewBearerAuthWithRefreshRoundTripper("", bearerTokenFilePath, tr)
	if err != nil {
		return nil, fmt.Errorf("failed set round tripper with bearer token refresh: %v", err)
	}
	return &http.Client{
		Transport: tripper,
	}, nil
}

func GetInClusterToken(tokenPath string) (string, error) {
	token, err := os.ReadFile(tokenPath)
	if err != nil {
		return "", fmt.Errorf("error reading bearer token file: %v", err)
	}
	return string(token), nil
}

// tokenToObjectName returns the oauthaccesstokens object name for the given raw token,
// i.e. the sha256 hash prefixed with "sha256~".
// TODO this should be a member function of the User type
func tokenToObjectName(token string) string {
	name := strings.TrimPrefix(token, sha256Prefix)
	h := sha256.Sum256([]byte(name))
	return sha256Prefix + base64.RawURLEncoding.EncodeToString(h[0:])
}
