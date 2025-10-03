package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"flag"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os"
	"runtime"
	"sort"
	"strings"
	"time"

	operatorv1 "github.com/openshift/api/operator/v1"
	authopts "github.com/openshift/console/cmd/bridge/config/auth"
	"github.com/openshift/console/cmd/bridge/config/session"
	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/controllers"
	"github.com/openshift/console/pkg/flags"
	"github.com/openshift/console/pkg/knative"
	"github.com/openshift/console/pkg/olm"
	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/pkg/server"
	"github.com/openshift/console/pkg/serverconfig"
	oscrypto "github.com/openshift/library-go/pkg/crypto"
	ctrlmetrics "sigs.k8s.io/controller-runtime/pkg/metrics/server"

	kruntime "k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/rest"
	klog "k8s.io/klog/v2"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"
)

const (
	k8sInClusterCA          = "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt"
	k8sInClusterBearerToken = "/var/run/secrets/kubernetes.io/serviceaccount/token"

	catalogdHost = "catalogd-service.openshift-catalogd.svc:443"

	// Well-known location of the tenant aware Thanos service for OpenShift exposing the query and query_range endpoints. This is only accessible in-cluster.
	// Thanos proxies requests to both cluster monitoring and user workload monitoring prometheus instances.
	openshiftThanosTenancyHost = "thanos-querier.openshift-monitoring.svc:9092"

	// Well-known location of the tenant aware Thanos service for OpenShift exposing the rules endpoint. This is only accessible in-cluster.
	// Thanos proxies requests to the cluster monitoring and user workload monitoring prometheus instances as well as Thanos ruler instances.
	openshiftThanosTenancyForRulesHost = "thanos-querier.openshift-monitoring.svc:9093"

	// Well-known location of the Thanos service for OpenShift. This is only accessible in-cluster.
	// This is used for non-tenant global query requests
	// proxying to both cluster monitoring and user workload monitoring prometheus instances.
	openshiftThanosHost = "thanos-querier.openshift-monitoring.svc:9091"

	// Well-known location of Alert Manager service for OpenShift. This is only accessible in-cluster.
	openshiftAlertManagerHost = "alertmanager-main.openshift-monitoring.svc:9094"

	// Default location of the tenant aware Alert Manager service for OpenShift. This is only accessible in-cluster.
	openshiftAlertManagerTenancyHost = "alertmanager-main.openshift-monitoring.svc:9092"

	// Well-known location of the GitOps service. This is only accessible in-cluster
	openshiftGitOpsHost = "cluster.openshift-gitops.svc:8080"

	// Well-known location of the cluster proxy service. This is only accessible in-cluster
	openshiftClusterProxyHost = "cluster-proxy-addon-user.multicluster-engine.svc:9092"

	clusterManagementURL = "https://api.openshift.com/"
)

type BridgeOptions struct {
	consoleCSPFlags                                 serverconfig.MultiKeyValue
	customFaviconFlags                              serverconfig.LogosKeyValue
	customLogoFlags                                 serverconfig.LogosKeyValue
	enabledPlugins                                  serverconfig.MultiKeyValue
	fAddPage                                        string
	fAlermanagerPublicURL                           string
	fAlertmanagerTenancyHost                        string
	fAlertmanagerUserWorkloadHost                   string
	fBaseAddress                                    string
	fBasePath                                       string
	fBranding                                       string
	fCAFile                                         string
	fCapabilities                                   string
	fContentSecurityPolicyEnabled                   bool
	fControlPlaneTopology                           string
	fCopiedCSVsDisabled                             bool
	fCustomProductName                              string
	fDevCatalogCategories                           string
	fDevCatalogTypes                                string
	fDocumentationBaseURL                           string
	fGrafanaPublicURL                               string
	fI18NamespacesFlags                             string
	fK8sAuth                                        string
	fK8sMode                                        string
	fK8sModeOffClusterAlertmanager                  string
	fK8sModeOffClusterCatalogd                      string
	fK8sModeOffClusterEndpoint                      string
	fK8sModeOffClusterGitOps                        string
	fK8sModeOffClusterServiceAccountBearerTokenFile string
	fK8sModeOffClusterSkipVerifyTLS                 bool
	fK8sModeOffClusterThanos                        string
	fK8sPublicEndpoint                              string
	fListen                                         string
	fLoadTestFactor                                 int
	fLogLevel                                       string
	fNodeArchitectures                              string
	fNodeOperatingSystems                           string
	fPerspectives                                   string
	fPluginProxy                                    string
	fPluginsOrder                                   string
	fProjectAccessClusterRoles                      string
	fPrometheusPublicURL                            string
	fPublicDir                                      string
	fQuickStarts                                    string
	fRedirectPort                                   int
	fReleaseVersion                                 string
	fServiceCAFile                                  string
	fStatuspageID                                   string
	fTechPreview                                    bool
	fThanosPublicURL                                string
	fTLSCertFile                                    string
	fTLSKeyFile                                     string
	fUserSettingsLocation                           string
	telemetryFlags                                  serverconfig.MultiKeyValue
}

func main() {
	// Initialize controller-runtime logger, needed for the OLM handler
	log.SetLogger(zap.New())

	fs := flag.NewFlagSet("bridge", flag.ExitOnError)
	klog.InitFlags(fs)
	defer klog.Flush()

	bridgeOptions := &BridgeOptions{}
	authOptions := authopts.NewAuthOptions()
	sessionOptions := session.NewSessionOptions()
	addFlags(fs, bridgeOptions, authOptions, sessionOptions)

	if err := fs.Parse(os.Args[1:]); err != nil {
		klog.Fatalf("Failed to parse flags: %v", err)
	}

	configFile := fs.Lookup("config").Value.String()

	// Run server in a loop to support restarts
	for {
		// Parse and apply config
		applyConfig(fs, bridgeOptions, authOptions, sessionOptions)

		// Build the server with current config
		srv := createServer(bridgeOptions, authOptions, sessionOptions)

		// Run the server with config file watching
		shouldRestart := runServer(bridgeOptions, srv, configFile)
		if !shouldRestart {
			return
		}
	}
}

func addFlags(fs *flag.FlagSet, bridgeOptions *BridgeOptions, authOptions *authopts.AuthOptions, sessionOptions *session.SessionOptions) {
	authOptions.AddFlags(fs)
	sessionOptions.AddFlags(fs)

	// Define commandline / env / config options
	fs.String("config", "", "The YAML config file.")
	fs.StringVar(&bridgeOptions.fListen, "listen", "http://0.0.0.0:9000", "")
	fs.StringVar(&bridgeOptions.fBaseAddress, "base-address", "", "Format: <http | https>://domainOrIPAddress[:port]. Example: https://openshift.example.com.")
	fs.StringVar(&bridgeOptions.fBasePath, "base-path", "/", "")
	// See https://github.com/openshift/service-serving-cert-signer
	fs.StringVar(&bridgeOptions.fServiceCAFile, "service-ca-file", "", "CA bundle for OpenShift services signed with the service signing certificates.")
	fs.StringVar(&bridgeOptions.fK8sMode, "k8s-mode", "in-cluster", "in-cluster | off-cluster")
	fs.StringVar(&bridgeOptions.fK8sModeOffClusterEndpoint, "k8s-mode-off-cluster-endpoint", "", "URL of the Kubernetes API server.")
	fs.BoolVar(&bridgeOptions.fK8sModeOffClusterSkipVerifyTLS, "k8s-mode-off-cluster-skip-verify-tls", false, "DEV ONLY. When true, skip verification of certs presented by k8s API server.")
	fs.StringVar(&bridgeOptions.fK8sModeOffClusterThanos, "k8s-mode-off-cluster-thanos", "", "DEV ONLY. URL of the cluster's Thanos server.")
	fs.StringVar(&bridgeOptions.fK8sModeOffClusterAlertmanager, "k8s-mode-off-cluster-alertmanager", "", "DEV ONLY. URL of the cluster's AlertManager server.")
	fs.StringVar(&bridgeOptions.fK8sModeOffClusterCatalogd, "k8s-mode-off-cluster-catalogd", "", "DEV ONLY. URL of the cluster's catalogd server.")
	fs.StringVar(&bridgeOptions.fK8sModeOffClusterServiceAccountBearerTokenFile, "k8s-mode-off-cluster-service-account-bearer-token-file", "", "DEV ONLY. bearer token file for the service account used for internal K8s API server calls.")
	fs.StringVar(&bridgeOptions.fK8sAuth, "k8s-auth", "", "this option is deprecated, setting it has no effect")
	fs.StringVar(&bridgeOptions.fK8sModeOffClusterGitOps, "k8s-mode-off-cluster-gitops", "", "DEV ONLY. URL of the GitOps backend service")
	fs.IntVar(&bridgeOptions.fRedirectPort, "redirect-port", 0, "Port number under which the console should listen for custom hostname redirect.")
	fs.StringVar(&bridgeOptions.fLogLevel, "log-level", "", "level of logging information by package (pkg=level).")
	fs.StringVar(&bridgeOptions.fPublicDir, "public-dir", "./frontend/public/dist", "directory containing static web assets.")
	fs.StringVar(&bridgeOptions.fTLSCertFile, "tls-cert-file", "", "TLS certificate. If the certificate is signed by a certificate authority, the certFile should be the concatenation of the server's certificate followed by the CA's certificate.")
	fs.StringVar(&bridgeOptions.fTLSKeyFile, "tls-key-file", "", "The TLS certificate key.")
	fs.StringVar(&bridgeOptions.fCAFile, "ca-file", "", "PEM File containing trusted certificates of trusted CAs. If not present, the system's Root CAs will be used.")
	fs.String("kubectl-client-id", "", "DEPRECATED: setting this does not do anything.")
	fs.String("kubectl-client-secret", "", "DEPRECATED: setting this does not do anything.")
	fs.String("kubectl-client-secret-file", "", "DEPRECATED: setting this does not do anything.")
	fs.StringVar(&bridgeOptions.fK8sPublicEndpoint, "k8s-public-endpoint", "", "Endpoint to use to communicate to the API server.")
	fs.StringVar(&bridgeOptions.fBranding, "branding", "okd", "Console branding for the masthead logo and title. One of okd, openshift, ocp, online, dedicated, azure, or rosa. Defaults to okd.")
	fs.StringVar(&bridgeOptions.fCustomProductName, "custom-product-name", "", "Custom product name for console branding.")
	fs.Var(&bridgeOptions.customLogoFlags, "custom-logo-files", "List of custom product images used for branding of console's logo in the Masthead and 'About' modal.\n"+
		"Each entry consist of theme type (Dark | Light ) as a key and the path to the image file used for the given theme as its value.\n"+
		"Example --custom-logo-files Dark=./foo/dark-image.png,Light=./foo/light-image.png")
	fs.Var(&bridgeOptions.customFaviconFlags, "custom-favicon-files", "List of custom images used for branding of console's favicon.\n"+
		"Each entry consist of theme type (Dark | Light ) as a key and the path to the image file used for the given theme as its value.\n"+
		"Example --custom-favicon-files Dark=./foo/dark-image.png,Light=./foo/light-image.png")
	fs.StringVar(&bridgeOptions.fStatuspageID, "statuspage-id", "", "Unique ID assigned by statuspage.io page that provides status info.")
	fs.StringVar(&bridgeOptions.fDocumentationBaseURL, "documentation-base-url", "", "The base URL for documentation links.")
	fs.StringVar(&bridgeOptions.fAlertmanagerUserWorkloadHost, "alermanager-user-workload-host", openshiftAlertManagerHost, "Location of the Alertmanager service for user-defined alerts.")
	fs.StringVar(&bridgeOptions.fAlertmanagerTenancyHost, "alermanager-tenancy-host", openshiftAlertManagerTenancyHost, "Location of the tenant-aware Alertmanager service.")
	fs.StringVar(&bridgeOptions.fAlermanagerPublicURL, "alermanager-public-url", "", "Public URL of the cluster's AlertManager server.")
	fs.StringVar(&bridgeOptions.fGrafanaPublicURL, "grafana-public-url", "", "Public URL of the cluster's Grafana server.")
	fs.StringVar(&bridgeOptions.fPrometheusPublicURL, "prometheus-public-url", "", "Public URL of the cluster's Prometheus server.")
	fs.StringVar(&bridgeOptions.fThanosPublicURL, "thanos-public-url", "", "Public URL of the cluster's Thanos server.")
	fs.Var(&bridgeOptions.enabledPlugins, "plugins", "List of plugin entries that are enabled for the console. Each entry consist of plugin-name as a key and plugin-endpoint as a value.")
	fs.StringVar(&bridgeOptions.fPluginsOrder, "plugins-order", "", "List of plugin names which determines the order in which plugin extensions will be resolved.")
	fs.StringVar(&bridgeOptions.fPluginProxy, "plugin-proxy", "", "Defines various service types to which will console proxy plugins requests. (JSON as string)")
	fs.StringVar(&bridgeOptions.fI18NamespacesFlags, "i18n-namespaces", "", "List of namespaces separated by comma. Example --i18n-namespaces=plugin__acm,plugin__kubevirt")
	fs.BoolVar(&bridgeOptions.fContentSecurityPolicyEnabled, "content-security-policy-enabled", false, "Flag to indicate if Content Secrity Policy features should be enabled.")
	fs.Var(&bridgeOptions.consoleCSPFlags, "content-security-policy", "List of CSP directives that are enabled for the console. Each entry consist of csp-directive-name as a key and csp-directive-value as a value. Example --content-security-policy script-src='localhost:9000',font-src='localhost:9001'")
	fs.Var(&bridgeOptions.telemetryFlags, "telemetry", "Telemetry configuration that can be used by console plugins. Each entry should be a key=value pair.")
	fs.IntVar(&bridgeOptions.fLoadTestFactor, "load-test-factor", 0, "DEV ONLY. The factor used to multiply k8s API list responses for load testing purposes.")
	fs.StringVar(&bridgeOptions.fDevCatalogCategories, "developer-catalog-categories", "", "Allow catalog categories customization. (JSON as string)")
	fs.StringVar(&bridgeOptions.fDevCatalogTypes, "developer-catalog-types", "", "Allow enabling/disabling of sub-catalog types from the developer catalog. (JSON as string)")
	fs.StringVar(&bridgeOptions.fUserSettingsLocation, "user-settings-location", "configmap", "DEV ONLY. Define where the user settings should be stored. (configmap | localstorage).")
	fs.StringVar(&bridgeOptions.fQuickStarts, "quick-starts", "", "Allow customization of available ConsoleQuickStart resources in console. (JSON as string)")
	fs.StringVar(&bridgeOptions.fAddPage, "add-page", "", "DEV ONLY. Allow add page customization. (JSON as string)")
	fs.StringVar(&bridgeOptions.fProjectAccessClusterRoles, "project-access-cluster-roles", "", "The list of Cluster Roles assignable for the project access page. (JSON as string)")
	fs.StringVar(&bridgeOptions.fPerspectives, "perspectives", "", "Allow enabling/disabling of perspectives in the console. (JSON as string)")
	fs.StringVar(&bridgeOptions.fCapabilities, "capabilities", "", "Allow enabling/disabling of capabilities in the console. (JSON as string)")
	fs.StringVar(&bridgeOptions.fControlPlaneTopology, "control-plane-topology-mode", "", "Defines the topology mode of the control-plane nodes (External | HighlyAvailable | HighlyAvailableArbiter | DualReplica | SingleReplica)")
	fs.StringVar(&bridgeOptions.fReleaseVersion, "release-version", "", "Defines the release version of the cluster")
	fs.StringVar(&bridgeOptions.fNodeArchitectures, "node-architectures", "", "List of node architectures. Example --node-architecture=amd64,arm64")
	fs.StringVar(&bridgeOptions.fNodeOperatingSystems, "node-operating-systems", "", "List of node operating systems. Example --node-operating-system=linux,windows")
	fs.BoolVar(&bridgeOptions.fCopiedCSVsDisabled, "copied-csvs-disabled", false, "Flag to indicate if OLM copied CSVs are disabled.")
	fs.BoolVar(&bridgeOptions.fTechPreview, "tech-preview", false, "Enable console Technology Preview features.")
}

func applyConfig(fs *flag.FlagSet, bridgeOptions *BridgeOptions, authOptions *authopts.AuthOptions, sessionOptions *session.SessionOptions) {
	cfg, err := serverconfig.Parse(fs, os.Args[1:], "BRIDGE")
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		os.Exit(1)
	}

	if err := serverconfig.Validate(fs); err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		os.Exit(1)
	}

	if bridgeOptions.fTechPreview {
		klog.Warning("Technology Preview features are enabled. These features are experimental and not supported for production use. If you encounter issues, send feedback through the usual support or bug-reporting channels.")
	}

	authOptions.ApplyConfig(&cfg.Auth)
	sessionOptions.ApplyConfig(&cfg.Session)
}

func createServer(bridgeOptions *BridgeOptions, authOptions *authopts.AuthOptions, sessionOptions *session.SessionOptions) *server.Server {
	baseURL, err := flags.ValidateFlagIsURL("base-address", bridgeOptions.fBaseAddress, true)
	flags.FatalIfFailed(err)

	if !strings.HasPrefix(bridgeOptions.fBasePath, "/") || !strings.HasSuffix(bridgeOptions.fBasePath, "/") {
		flags.FatalIfFailed(flags.NewInvalidFlagError("base-path", "value must start and end with slash"))
	}
	baseURL.Path = bridgeOptions.fBasePath

	documentationBaseURL := &url.URL{}
	if bridgeOptions.fDocumentationBaseURL != "" {
		if !strings.HasSuffix(bridgeOptions.fDocumentationBaseURL, "/") {
			flags.FatalIfFailed(flags.NewInvalidFlagError("documentation-base-url", "value must end with slash"))
		}
		documentationBaseURL, err = flags.ValidateFlagIsURL("documentation-base-url", bridgeOptions.fDocumentationBaseURL, false)
		flags.FatalIfFailed(err)
	}

	alertManagerPublicURL, err := flags.ValidateFlagIsURL("alermanager-public-url", bridgeOptions.fAlermanagerPublicURL, true)
	flags.FatalIfFailed(err)

	grafanaPublicURL, err := flags.ValidateFlagIsURL("grafana-public-url", bridgeOptions.fGrafanaPublicURL, true)
	flags.FatalIfFailed(err)

	prometheusPublicURL, err := flags.ValidateFlagIsURL("prometheus-public-url", bridgeOptions.fPrometheusPublicURL, true)
	flags.FatalIfFailed(err)

	thanosPublicURL, err := flags.ValidateFlagIsURL("thanos-public-url", bridgeOptions.fThanosPublicURL, true)
	flags.FatalIfFailed(err)

	branding := bridgeOptions.fBranding
	if branding == "origin" {
		branding = "okd"
	}
	switch branding {
	case "okd":
	case "openshift":
	case "ocp":
	case "online":
	case "dedicated":
	case "azure":
	case "rosa":
	default:
		flags.FatalIfFailed(flags.NewInvalidFlagError("branding", "value must be one of okd, openshift, ocp, online, dedicated, azure, or rosa"))
	}

	i18nNamespaces := []string{}
	if bridgeOptions.fI18NamespacesFlags != "" {
		for _, str := range strings.Split(bridgeOptions.fI18NamespacesFlags, ",") {
			str = strings.TrimSpace(str)
			if str == "" {
				flags.FatalIfFailed(flags.NewInvalidFlagError("i18n-namespaces", "list must contain name of i18n namespaces separated by comma"))
			}
			i18nNamespaces = append(i18nNamespaces, str)
		}
	}

	enabledPluginsOrder := []string{}
	if bridgeOptions.fPluginsOrder != "" {
		for _, str := range strings.Split(bridgeOptions.fPluginsOrder, ",") {
			str = strings.TrimSpace(str)
			if str == "" {
				flags.FatalIfFailed(flags.NewInvalidFlagError("plugins-order", "list must contain names of plugins separated by comma"))
			}
			if bridgeOptions.enabledPlugins[str] == "" {
				flags.FatalIfFailed(flags.NewInvalidFlagError("plugins-order", "list must only contain currently enabled plugins"))
			}
			enabledPluginsOrder = append(enabledPluginsOrder, str)
		}
	} else if len(bridgeOptions.enabledPlugins) > 0 {
		for plugin := range bridgeOptions.enabledPlugins {
			enabledPluginsOrder = append(enabledPluginsOrder, plugin)
		}
	}

	if len(enabledPluginsOrder) > 0 {
		klog.Infoln("Console plugins are enabled in following order:")
		for _, pluginName := range enabledPluginsOrder {
			klog.Infof(" - %s", pluginName)
		}
	}

	nodeArchitectures := []string{}
	if bridgeOptions.fNodeArchitectures != "" {
		for _, str := range strings.Split(bridgeOptions.fNodeArchitectures, ",") {
			str = strings.TrimSpace(str)
			if str == "" {
				flags.FatalIfFailed(flags.NewInvalidFlagError("node-architectures", "list must contain name of node architectures separated by comma"))
			}
			nodeArchitectures = append(nodeArchitectures, str)
		}
	}

	nodeOperatingSystems := []string{}
	if bridgeOptions.fNodeOperatingSystems != "" {
		for _, str := range strings.Split(bridgeOptions.fNodeOperatingSystems, ",") {
			str = strings.TrimSpace(str)
			if str == "" {
				flags.FatalIfFailed(flags.NewInvalidFlagError("node-operating-systems", "list must contain name of node architectures separated by comma"))
			}
			nodeOperatingSystems = append(nodeOperatingSystems, str)
		}
	}

	capabilities := []operatorv1.Capability{}
	if bridgeOptions.fCapabilities != "" {
		err = json.Unmarshal([]byte(bridgeOptions.fCapabilities), &capabilities)
		if err != nil {
			klog.Fatalf("Error unmarshaling capabilities JSON: %v", err)
		}
	}

	if len(bridgeOptions.telemetryFlags) > 0 {
		keys := make([]string, 0, len(bridgeOptions.telemetryFlags))
		for name := range bridgeOptions.telemetryFlags {
			keys = append(keys, name)
		}
		sort.Strings(keys)

		klog.Infoln("Console telemetry options:")
		for _, k := range keys {
			klog.Infof(" - %s %s", k, bridgeOptions.telemetryFlags[k])
		}
	}

	srv := &server.Server{
		PublicDir:                    bridgeOptions.fPublicDir,
		BaseURL:                      baseURL,
		Branding:                     branding,
		CustomProductName:            bridgeOptions.fCustomProductName,
		CustomLogoFiles:              bridgeOptions.customLogoFlags,
		CustomFaviconFiles:           bridgeOptions.customFaviconFlags,
		ControlPlaneTopology:         bridgeOptions.fControlPlaneTopology,
		StatuspageID:                 bridgeOptions.fStatuspageID,
		DocumentationBaseURL:         documentationBaseURL,
		AlertManagerUserWorkloadHost: bridgeOptions.fAlertmanagerUserWorkloadHost,
		AlertManagerTenancyHost:      bridgeOptions.fAlertmanagerTenancyHost,
		AlertManagerPublicURL:        alertManagerPublicURL,
		GrafanaPublicURL:             grafanaPublicURL,
		PrometheusPublicURL:          prometheusPublicURL,
		ThanosPublicURL:              thanosPublicURL,
		LoadTestFactor:               bridgeOptions.fLoadTestFactor,
		DevCatalogCategories:         bridgeOptions.fDevCatalogCategories,
		DevCatalogTypes:              bridgeOptions.fDevCatalogTypes,
		UserSettingsLocation:         bridgeOptions.fUserSettingsLocation,
		EnabledPlugins:               bridgeOptions.enabledPlugins,
		EnabledPluginsOrder:          enabledPluginsOrder,
		I18nNamespaces:               i18nNamespaces,
		PluginProxy:                  bridgeOptions.fPluginProxy,
		ContentSecurityPolicyEnabled: bridgeOptions.fContentSecurityPolicyEnabled,
		ContentSecurityPolicy:        bridgeOptions.consoleCSPFlags,
		QuickStarts:                  bridgeOptions.fQuickStarts,
		AddPage:                      bridgeOptions.fAddPage,
		ProjectAccessClusterRoles:    bridgeOptions.fProjectAccessClusterRoles,
		Perspectives:                 bridgeOptions.fPerspectives,
		Telemetry:                    bridgeOptions.telemetryFlags,
		ReleaseVersion:               bridgeOptions.fReleaseVersion,
		NodeArchitectures:            nodeArchitectures,
		NodeOperatingSystems:         nodeOperatingSystems,
		K8sMode:                      bridgeOptions.fK8sMode,
		CopiedCSVsDisabled:           bridgeOptions.fCopiedCSVsDisabled,
		Capabilities:                 capabilities,
	}

	completedAuthnOptions, err := authOptions.Complete()
	if err != nil {
		klog.Fatalf("failed to complete authentication options: %v", err)
		os.Exit(1)
	}

	completedSessionOptions, err := sessionOptions.Complete(completedAuthnOptions.AuthType)
	if err != nil {
		klog.Fatalf("failed to complete session options: %v", err)
		os.Exit(1)
	}

	// if !in-cluster (dev) we should not pass these values to the frontend
	// is used by catalog-utils.ts
	if bridgeOptions.fK8sMode == "in-cluster" {
		srv.GOARCH = runtime.GOARCH
		srv.GOOS = runtime.GOOS
	}

	// Blacklisted headers
	srv.ProxyHeaderDenyList = []string{"Cookie", "X-CSRFToken"}

	if bridgeOptions.fLogLevel != "" {
		klog.Warningf("DEPRECATED: --log-level is now deprecated, use verbosity flag --v=Level instead")
	}

	var (
		// Hold on to raw certificates so we can render them in kubeconfig files.
		k8sCertPEM []byte
	)

	var k8sEndpoint *url.URL
	switch bridgeOptions.fK8sMode {
	case "in-cluster":
		k8sEndpoint = &url.URL{Scheme: "https", Host: "kubernetes.default.svc"}
		var err error
		k8sCertPEM, err = os.ReadFile(k8sInClusterCA)
		if err != nil {
			klog.Fatalf("Error inferring Kubernetes config from environment: %v", err)
		}
		rootCAs := x509.NewCertPool()
		if !rootCAs.AppendCertsFromPEM(k8sCertPEM) {
			klog.Fatal("No CA found for the API server")
		}
		tlsConfig := oscrypto.SecureTLSConfig(&tls.Config{
			RootCAs: rootCAs,
		})

		srv.InternalProxiedK8SClientConfig = &rest.Config{
			Host:            k8sEndpoint.String(),
			BearerTokenFile: k8sInClusterBearerToken,
			TLSClientConfig: rest.TLSClientConfig{
				CAFile: k8sInClusterCA,
			},
		}

		srv.K8sProxyConfig = &proxy.Config{
			TLSClientConfig: tlsConfig,
			HeaderBlacklist: srv.ProxyHeaderDenyList,
			Endpoint:        k8sEndpoint,
		}

		// If running in an OpenShift cluster, set up a proxy to the prometheus-k8s service running in the openshift-monitoring namespace.
		if bridgeOptions.fServiceCAFile != "" {
			serviceCertPEM, err := os.ReadFile(bridgeOptions.fServiceCAFile)
			if err != nil {
				klog.Fatalf("failed to read service-ca.crt file: %v", err)
			}
			serviceProxyRootCAs := x509.NewCertPool()
			if !serviceProxyRootCAs.AppendCertsFromPEM(serviceCertPEM) {
				klog.Fatal("no CA found for Kubernetes services")
			}
			serviceProxyTLSConfig := oscrypto.SecureTLSConfig(&tls.Config{
				RootCAs: serviceProxyRootCAs,
			})

			srv.ServiceClient = &http.Client{
				Transport: &http.Transport{
					TLSClientConfig: serviceProxyTLSConfig,
				},
			}

			srv.CatalogdProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				Endpoint:        &url.URL{Scheme: "https", Host: catalogdHost},
			}

			srv.ThanosProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        &url.URL{Scheme: "https", Host: openshiftThanosHost, Path: "/api"},
			}
			srv.ThanosTenancyProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        &url.URL{Scheme: "https", Host: openshiftThanosTenancyHost, Path: "/api"},
			}
			srv.ThanosTenancyProxyForRulesConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        &url.URL{Scheme: "https", Host: openshiftThanosTenancyForRulesHost, Path: "/api"},
			}

			srv.AlertManagerProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        &url.URL{Scheme: "https", Host: openshiftAlertManagerHost, Path: "/api"},
			}
			srv.AlertManagerUserWorkloadProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        &url.URL{Scheme: "https", Host: bridgeOptions.fAlertmanagerUserWorkloadHost, Path: "/api"},
			}
			srv.AlertManagerTenancyProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        &url.URL{Scheme: "https", Host: bridgeOptions.fAlertmanagerTenancyHost, Path: "/api"},
			}
			srv.TerminalProxyTLSConfig = serviceProxyTLSConfig
			srv.PluginsProxyTLSConfig = serviceProxyTLSConfig

			srv.GitOpsProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        &url.URL{Scheme: "https", Host: openshiftGitOpsHost},
			}
		}

	case "off-cluster":
		k8sEndpoint, err = flags.ValidateFlagIsURL("k8s-mode-off-cluster-endpoint", bridgeOptions.fK8sModeOffClusterEndpoint, false)
		flags.FatalIfFailed(err)

		serviceProxyTLSConfig := oscrypto.SecureTLSConfig(&tls.Config{
			InsecureSkipVerify: bridgeOptions.fK8sModeOffClusterSkipVerifyTLS,
		})

		srv.ServiceClient = &http.Client{
			Transport: &http.Transport{
				TLSClientConfig: serviceProxyTLSConfig,
			},
		}

		srv.InternalProxiedK8SClientConfig = &rest.Config{
			Host:      k8sEndpoint.String(),
			Transport: &http.Transport{TLSClientConfig: serviceProxyTLSConfig},
		}

		if bridgeOptions.fK8sModeOffClusterServiceAccountBearerTokenFile != "" {
			srv.InternalProxiedK8SClientConfig.BearerTokenFile = bridgeOptions.fK8sModeOffClusterServiceAccountBearerTokenFile
		}

		srv.K8sProxyConfig = &proxy.Config{
			TLSClientConfig:         serviceProxyTLSConfig,
			HeaderBlacklist:         srv.ProxyHeaderDenyList,
			Endpoint:                k8sEndpoint,
			UseProxyFromEnvironment: true,
		}

		if bridgeOptions.fK8sModeOffClusterCatalogd != "" {
			offClusterCatalogdURL, err := flags.ValidateFlagIsURL("k8s-mode-off-cluster-catalogd", bridgeOptions.fK8sModeOffClusterCatalogd, false)
			flags.FatalIfFailed(err)
			srv.CatalogdProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				Endpoint:        offClusterCatalogdURL,
			}
		}

		if bridgeOptions.fK8sModeOffClusterThanos != "" {
			offClusterThanosURL, err := flags.ValidateFlagIsURL("k8s-mode-off-cluster-thanos", bridgeOptions.fK8sModeOffClusterThanos, false)
			flags.FatalIfFailed(err)

			offClusterThanosURL.Path += "/api"
			srv.ThanosTenancyProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        offClusterThanosURL,
			}
			srv.ThanosTenancyProxyForRulesConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        offClusterThanosURL,
			}
			srv.ThanosProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        offClusterThanosURL,
			}
		}

		if bridgeOptions.fK8sModeOffClusterAlertmanager != "" {
			offClusterAlertManagerURL, err := flags.ValidateFlagIsURL("k8s-mode-off-cluster-alertmanager", bridgeOptions.fK8sModeOffClusterAlertmanager, false)
			flags.FatalIfFailed(err)

			offClusterAlertManagerURL.Path += "/api"
			srv.AlertManagerProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        offClusterAlertManagerURL,
			}
			srv.AlertManagerTenancyProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        offClusterAlertManagerURL,
			}
			srv.AlertManagerUserWorkloadProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        offClusterAlertManagerURL,
			}
		}

		srv.TerminalProxyTLSConfig = serviceProxyTLSConfig
		srv.PluginsProxyTLSConfig = serviceProxyTLSConfig

		if bridgeOptions.fK8sModeOffClusterGitOps != "" {
			offClusterGitOpsURL, err := flags.ValidateFlagIsURL("k8s-mode-off-cluster-gitops", bridgeOptions.fK8sModeOffClusterGitOps, false)
			flags.FatalIfFailed(err)

			srv.GitOpsProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        offClusterGitOpsURL,
			}
		}
	default:
		flags.FatalIfFailed(flags.NewInvalidFlagError("k8s-mode", "must be one of: in-cluster, off-cluster"))
	}

	// Controllers are behind Tech Preview flag
	if bridgeOptions.fTechPreview {
		controllerManagerMetricsOptions := ctrlmetrics.Options{
			// Disable the metrics server for now. We can enable it later if we want and make it a configurable flag.
			BindAddress: "0",
		}
		mgr, err := ctrl.NewManager(srv.InternalProxiedK8SClientConfig, ctrl.Options{
			Scheme:  kruntime.NewScheme(),
			Metrics: controllerManagerMetricsOptions,
		})
		if err != nil {
			klog.Errorf("problem creating controller manager: %v", err)
		}

		catalogService := olm.NewDummyCatalogService()
		if err = controllers.NewClusterCatalogReconciler(mgr, catalogService).SetupWithManager(mgr); err != nil {
			klog.Errorf("failed to start ClusterCatalog reconciler: %v", err)
		}

		klog.Info("starting manager")
		mgrContext := ctrl.SetupSignalHandler()
		go func() {
			if err := mgr.Start(mgrContext); err != nil {
				klog.Errorf("problem running manager: %v", err)
			}
		}()
	}

	apiServerEndpoint := bridgeOptions.fK8sPublicEndpoint
	if apiServerEndpoint == "" {
		apiServerEndpoint = srv.K8sProxyConfig.Endpoint.String()
	}
	srv.KubeAPIServerURL = apiServerEndpoint

	clusterManagementURL, err := url.Parse(clusterManagementURL)
	if err != nil {
		klog.Fatalf("failed to parse %q", clusterManagementURL)
	}
	srv.ClusterManagementProxyConfig = &proxy.Config{
		TLSClientConfig: oscrypto.SecureTLSConfig(&tls.Config{}),
		HeaderBlacklist: srv.ProxyHeaderDenyList,
		Endpoint:        clusterManagementURL,
	}

	if len(bridgeOptions.fK8sAuth) > 0 {
		klog.Warning("DEPRECATED: --k8s-auth is deprecated and setting it has no effect")
	}

	internalProxiedK8SRT, err := rest.TransportFor(srv.InternalProxiedK8SClientConfig)
	if err != nil {
		klog.Fatalf("Failed to create k8s HTTP client: %v", err)
	}
	srv.MonitoringDashboardConfigMapLister = server.NewResourceLister(
		&url.URL{
			Scheme: k8sEndpoint.Scheme,
			Host:   k8sEndpoint.Host,
			Path:   k8sEndpoint.Path + "/api/v1/namespaces/openshift-config-managed/configmaps",
			RawQuery: url.Values{
				"labelSelector": {"console.openshift.io/dashboard=true"},
			}.Encode(),
		},
		internalProxiedK8SRT,
		nil,
	)

	srv.KnativeEventSourceCRDLister = server.NewResourceLister(
		&url.URL{
			Scheme: k8sEndpoint.Scheme,
			Host:   k8sEndpoint.Host,
			Path:   k8sEndpoint.Path + "/apis/apiextensions.k8s.io/v1/customresourcedefinitions",
			RawQuery: url.Values{
				"labelSelector": {"duck.knative.dev/source=true"},
			}.Encode(),
		},
		internalProxiedK8SRT,
		knative.EventSourceFilter,
	)

	srv.KnativeChannelCRDLister = server.NewResourceLister(
		&url.URL{
			Scheme: k8sEndpoint.Scheme,
			Host:   k8sEndpoint.Host,
			Path:   k8sEndpoint.Path + "/apis/apiextensions.k8s.io/v1/customresourcedefinitions",
			RawQuery: url.Values{
				"labelSelector": {"duck.knative.dev/addressable=true,messaging.knative.dev/subscribable=true"},
			}.Encode(),
		},
		internalProxiedK8SRT,
		knative.ChannelFilter,
	)

	srv.AnonymousInternalProxiedK8SRT, err = rest.TransportFor(rest.AnonymousClientConfig(srv.InternalProxiedK8SClientConfig))
	if err != nil {
		klog.Fatalf("Failed to create anonymous k8s HTTP client: %v", err)
	}

	srv.AuthMetrics = auth.NewMetrics(srv.AnonymousInternalProxiedK8SRT)

	caCertFilePath := bridgeOptions.fCAFile
	if bridgeOptions.fK8sMode == "in-cluster" {
		caCertFilePath = k8sInClusterCA
	}

	tokenReviewer, err := auth.NewTokenReviewer(srv.InternalProxiedK8SClientConfig)
	if err != nil {
		klog.Fatalf("failed to create token reviewer: %v", err)
	}
	srv.TokenReviewer = tokenReviewer

	if err := completedAuthnOptions.ApplyTo(srv, k8sEndpoint, caCertFilePath, completedSessionOptions); err != nil {
		klog.Fatalf("failed to apply configuration to server: %v", err)
	}

	return srv
}

func runServer(bridgeOptions *BridgeOptions, srv *server.Server, configFile string) bool {
	listenURL, err := flags.ValidateFlagIsURL("listen", bridgeOptions.fListen, false)
	flags.FatalIfFailed(err)

	switch listenURL.Scheme {
	case "http":
	case "https":
		flags.FatalIfFailed(flags.ValidateFlagNotEmpty("tls-cert-file", bridgeOptions.fTLSCertFile))
		flags.FatalIfFailed(flags.ValidateFlagNotEmpty("tls-key-file", bridgeOptions.fTLSKeyFile))
	default:
		flags.FatalIfFailed(flags.NewInvalidFlagError("listen", "scheme must be one of: http, https"))
	}

	handler, err := srv.HTTPHandler()
	if err != nil {
		klog.Fatalf("failed to set up HTTP handler: %v", err)
	}

	httpsrv := &http.Server{Handler: handler}

	listener, err := listen(listenURL.Scheme, listenURL.Host, bridgeOptions.fTLSCertFile, bridgeOptions.fTLSKeyFile)
	if err != nil {
		klog.Fatalf("error getting listener, %v", err)
	}
	defer listener.Close()

	// Create a context that can be cancelled to trigger shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Start config file watcher if a config file is specified
	if configFile != "" {
		watcher, err := serverconfig.NewConfigWatcher(configFile, func() {
			klog.Info("Config file changed, triggering server restart...")
			cancel()
		})
		if err != nil {
			klog.Fatalf("Failed to create config file watcher: %v", err)
		}

		go func() {
			if err := watcher.Start(ctx); err != nil && err != context.Canceled {
				klog.Errorf("Config file watcher stopped with error: %v", err)
			}
		}()
	}

	// Start shutdown handler
	go func() {
		<-ctx.Done()
		klog.Info("Shutting down server...")
		// Create a new context with timeout for shutdown
		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer shutdownCancel()
		if err := httpsrv.Shutdown(shutdownCtx); err != nil {
			klog.Errorf("Error shutting down server: %v", err)
		}
	}()

	if bridgeOptions.fRedirectPort != 0 {
		go func() {
			// Listen on passed port number to be redirected to the console
			redirectServer := http.NewServeMux()
			redirectServer.HandleFunc("/", func(res http.ResponseWriter, req *http.Request) {
				redirectURL := &url.URL{
					Scheme:   srv.BaseURL.Scheme,
					Host:     srv.BaseURL.Host,
					RawQuery: req.URL.RawQuery,
					Path:     req.URL.Path,
				}
				http.Redirect(res, req, redirectURL.String(), http.StatusMovedPermanently)
			})
			redirectPort := fmt.Sprintf(":%d", bridgeOptions.fRedirectPort)
			klog.Infof("Listening on %q for custom hostname redirect...", redirectPort)
			klog.Fatal(http.ListenAndServe(redirectPort, redirectServer))
		}()
	}

	klog.Infof("Server listening on %s", listenURL.String())
	serveErr := httpsrv.Serve(listener)

	// Determine if we should restart
	if ctx.Err() == context.Canceled {
		// Context was cancelled (config change triggered restart)
		klog.Info("Server stopped, restarting with new configuration...")
		return true
	}

	// Server stopped naturally or with an error
	if serveErr != nil && serveErr != http.ErrServerClosed {
		klog.Fatalf("Server stopped with error: %v", serveErr)
	}

	klog.Info("Server stopped gracefully")
	return false
}

func listen(scheme, host, certFile, keyFile string) (net.Listener, error) {
	klog.Infof("Binding to %s...", host)
	if scheme == "http" {
		klog.Info("Not using TLS")
		return net.Listen("tcp", host)
	}
	klog.Info("Using TLS")
	tlsConfig := &tls.Config{
		NextProtos: []string{"http/1.1"},
		GetCertificate: func(_ *tls.ClientHelloInfo) (*tls.Certificate, error) {
			klog.V(4).Infof("Getting TLS certs.")
			cert, err := tls.LoadX509KeyPair(certFile, keyFile)
			if err != nil {
				return nil, err
			}
			return &cert, nil
		},
	}
	return tls.Listen("tcp", host, tlsConfig)
}
