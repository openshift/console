package config

import (
	"encoding/json"
	"flag"
	"net/url"
	"sort"
	"strings"

	operatorv1 "github.com/openshift/api/operator/v1"
	"k8s.io/klog/v2"

	"github.com/openshift/console/pkg/flags"
	"github.com/openshift/console/pkg/serverconfig"
)

type Options struct {
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

type CompletedOptions struct {
	ContentSecurityPolicyEnabled   bool
	CopiedCSVsDisabled             bool
	K8sModeOffClusterSkipVerifyTLS bool
	TechPreview                    bool

	LoadTestFactor int
	RedirectPort   int

	AddPage                                        string
	AlertmanagerTenancyHost                        string
	AlertmanagerUserWorkloadHost                   string
	BasePath                                       string
	Branding                                       string
	CAFile                                         string
	ControlPlaneTopology                           string
	CustomProductName                              string
	DevCatalogCategories                           string
	DevCatalogTypes                                string
	K8sMode                                        string
	K8sModeOffClusterServiceAccountBearerTokenFile string
	K8sPublicEndpoint                              string
	Perspectives                                   string
	PluginProxy                                    string
	ProjectAccessClusterRoles                      string
	PublicDir                                      string
	QuickStarts                                    string
	ReleaseVersion                                 string
	ServiceCAFile                                  string
	StatuspageID                                   string
	TLSCertFile                                    string
	TLSKeyFile                                     string
	UserSettingsLocation                           string

	Capabilities         []operatorv1.Capability
	I18nNamespaces       []string
	NodeArchitectures    []string
	NodeOperatingSystems []string
	PluginsOrder         []string

	AlertmanagerPublicURL         *url.URL
	BaseURL                       *url.URL
	DocumentationBaseURL          *url.URL
	GrafanaPublicURL              *url.URL
	K8sModeOffClusterAlertmanager *url.URL
	K8sModeOffClusterCatalogd     *url.URL
	K8sModeOffClusterEndpoint     *url.URL
	K8sModeOffClusterGitOps       *url.URL
	K8sModeOffClusterThanos       *url.URL
	Listen                        *url.URL
	PrometheusPublicURL           *url.URL
	PublicThanosURL               *url.URL

	ConsoleCSPs    serverconfig.MultiKeyValue
	CustomFavicons serverconfig.LogosKeyValue
	CustomLogos    serverconfig.LogosKeyValue
	EnabledPlugins serverconfig.MultiKeyValue
	Telemetry      serverconfig.MultiKeyValue
}

func NewOptions() *Options {
	return &Options{}
}

func (o *Options) AddFlags(fs *flag.FlagSet) {
	// Define commandline / env / config options
	fs.String("config", "", "The YAML config file.")
	fs.StringVar(&o.fListen, "listen", "http://0.0.0.0:9000", "")
	fs.StringVar(&o.fBaseAddress, "base-address", "", "Format: <http | https>://domainOrIPAddress[:port]. Example: https://openshift.example.com.")
	fs.StringVar(&o.fBasePath, "base-path", "/", "")
	// See https://github.com/openshift/service-serving-cert-signer
	fs.StringVar(&o.fServiceCAFile, "service-ca-file", "", "CA bundle for OpenShift services signed with the service signing certificates.")
	fs.StringVar(&o.fK8sMode, "k8s-mode", "in-cluster", "in-cluster | off-cluster")
	fs.StringVar(&o.fK8sModeOffClusterEndpoint, "k8s-mode-off-cluster-endpoint", "", "URL of the Kubernetes API server.")
	fs.BoolVar(&o.fK8sModeOffClusterSkipVerifyTLS, "k8s-mode-off-cluster-skip-verify-tls", false, "DEV ONLY. When true, skip verification of certs presented by k8s API server.")
	fs.StringVar(&o.fK8sModeOffClusterThanos, "k8s-mode-off-cluster-thanos", "", "DEV ONLY. URL of the cluster's Thanos server.")
	fs.StringVar(&o.fK8sModeOffClusterAlertmanager, "k8s-mode-off-cluster-alertmanager", "", "DEV ONLY. URL of the cluster's AlertManager server.")
	fs.StringVar(&o.fK8sModeOffClusterCatalogd, "k8s-mode-off-cluster-catalogd", "", "DEV ONLY. URL of the cluster's catalogd server.")
	fs.StringVar(&o.fK8sModeOffClusterServiceAccountBearerTokenFile, "k8s-mode-off-cluster-service-account-bearer-token-file", "", "DEV ONLY. bearer token file for the service account used for internal K8s API server calls.")
	fs.StringVar(&o.fK8sAuth, "k8s-auth", "", "this option is deprecated, setting it has no effect")
	fs.StringVar(&o.fK8sModeOffClusterGitOps, "k8s-mode-off-cluster-gitops", "", "DEV ONLY. URL of the GitOps backend service")
	fs.IntVar(&o.fRedirectPort, "redirect-port", 0, "Port number under which the console should listen for custom hostname redirect.")
	fs.StringVar(&o.fLogLevel, "log-level", "", "level of logging information by package (pkg=level).")
	fs.StringVar(&o.fPublicDir, "public-dir", "./frontend/public/dist", "directory containing static web assets.")
	fs.StringVar(&o.fTLSCertFile, "tls-cert-file", "", "TLS certificate. If the certificate is signed by a certificate authority, the certFile should be the concatenation of the server's certificate followed by the CA's certificate.")
	fs.StringVar(&o.fTLSKeyFile, "tls-key-file", "", "The TLS certificate key.")
	fs.StringVar(&o.fCAFile, "ca-file", "", "PEM File containing trusted certificates of trusted CAs. If not present, the system's Root CAs will be used.")
	fs.String("kubectl-client-id", "", "DEPRECATED: setting this does not do anything.")
	fs.String("kubectl-client-secret", "", "DEPRECATED: setting this does not do anything.")
	fs.String("kubectl-client-secret-file", "", "DEPRECATED: setting this does not do anything.")
	fs.StringVar(&o.fK8sPublicEndpoint, "k8s-public-endpoint", "", "Endpoint to use to communicate to the API server.")
	fs.StringVar(&o.fBranding, "branding", "okd", "Console branding for the masthead logo and title. One of okd, openshift, ocp, online, dedicated, azure, or rosa. Defaults to okd.")
	fs.StringVar(&o.fCustomProductName, "custom-product-name", "", "Custom product name for console branding.")
	fs.Var(&o.customLogoFlags, "custom-logo-files", "List of custom product images used for branding of console's logo in the Masthead and 'About' modal.\n"+
		"Each entry consist of theme type (Dark | Light ) as a key and the path to the image file used for the given theme as its value.\n"+
		"Example --custom-logo-files Dark=./foo/dark-image.png,Light=./foo/light-image.png")
	fs.Var(&o.customFaviconFlags, "custom-favicon-files", "List of custom images used for branding of console's favicon.\n"+
		"Each entry consist of theme type (Dark | Light ) as a key and the path to the image file used for the given theme as its value.\n"+
		"Example --custom-favicon-files Dark=./foo/dark-image.png,Light=./foo/light-image.png")
	fs.StringVar(&o.fStatuspageID, "statuspage-id", "", "Unique ID assigned by statuspage.io page that provides status info.")
	fs.StringVar(&o.fDocumentationBaseURL, "documentation-base-url", "", "The base URL for documentation links.")
	fs.StringVar(&o.fAlertmanagerUserWorkloadHost, "alermanager-user-workload-host", OpenshiftAlertManagerHost, "Location of the Alertmanager service for user-defined alerts.")
	fs.StringVar(&o.fAlertmanagerTenancyHost, "alermanager-tenancy-host", OpenshiftAlertManagerTenancyHost, "Location of the tenant-aware Alertmanager service.")
	fs.StringVar(&o.fAlermanagerPublicURL, "alermanager-public-url", "", "Public URL of the cluster's AlertManager server.")
	fs.StringVar(&o.fGrafanaPublicURL, "grafana-public-url", "", "Public URL of the cluster's Grafana server.")
	fs.StringVar(&o.fPrometheusPublicURL, "prometheus-public-url", "", "Public URL of the cluster's Prometheus server.")
	fs.StringVar(&o.fThanosPublicURL, "thanos-public-url", "", "Public URL of the cluster's Thanos server.")
	fs.Var(&o.enabledPlugins, "plugins", "List of plugin entries that are enabled for the console. Each entry consist of plugin-name as a key and plugin-endpoint as a value.")
	fs.StringVar(&o.fPluginsOrder, "plugins-order", "", "List of plugin names which determines the order in which plugin extensions will be resolved.")
	fs.StringVar(&o.fPluginProxy, "plugin-proxy", "", "Defines various service types to which will console proxy plugins requests. (JSON as string)")
	fs.StringVar(&o.fI18NamespacesFlags, "i18n-namespaces", "", "List of namespaces separated by comma. Example --i18n-namespaces=plugin__acm,plugin__kubevirt")
	fs.BoolVar(&o.fContentSecurityPolicyEnabled, "content-security-policy-enabled", false, "Flag to indicate if Content Secrity Policy features should be enabled.")
	fs.Var(&o.consoleCSPFlags, "content-security-policy", "List of CSP directives that are enabled for the console. Each entry consist of csp-directive-name as a key and csp-directive-value as a value. Example --content-security-policy script-src='localhost:9000',font-src='localhost:9001'")
	fs.Var(&o.telemetryFlags, "telemetry", "Telemetry configuration that can be used by console plugins. Each entry should be a key=value pair.")
	fs.IntVar(&o.fLoadTestFactor, "load-test-factor", 0, "DEV ONLY. The factor used to multiply k8s API list responses for load testing purposes.")
	fs.StringVar(&o.fDevCatalogCategories, "developer-catalog-categories", "", "Allow catalog categories customization. (JSON as string)")
	fs.StringVar(&o.fDevCatalogTypes, "developer-catalog-types", "", "Allow enabling/disabling of sub-catalog types from the developer catalog. (JSON as string)")
	fs.StringVar(&o.fUserSettingsLocation, "user-settings-location", "configmap", "DEV ONLY. Define where the user settings should be stored. (configmap | localstorage).")
	fs.StringVar(&o.fQuickStarts, "quick-starts", "", "Allow customization of available ConsoleQuickStart resources in console. (JSON as string)")
	fs.StringVar(&o.fAddPage, "add-page", "", "DEV ONLY. Allow add page customization. (JSON as string)")
	fs.StringVar(&o.fProjectAccessClusterRoles, "project-access-cluster-roles", "", "The list of Cluster Roles assignable for the project access page. (JSON as string)")
	fs.StringVar(&o.fPerspectives, "perspectives", "", "Allow enabling/disabling of perspectives in the console. (JSON as string)")
	fs.StringVar(&o.fCapabilities, "capabilities", "", "Allow enabling/disabling of capabilities in the console. (JSON as string)")
	fs.StringVar(&o.fControlPlaneTopology, "control-plane-topology-mode", "", "Defines the topology mode of the control-plane nodes (External | HighlyAvailable | HighlyAvailableArbiter | DualReplica | SingleReplica)")
	fs.StringVar(&o.fReleaseVersion, "release-version", "", "Defines the release version of the cluster")
	fs.StringVar(&o.fNodeArchitectures, "node-architectures", "", "List of node architectures. Example --node-architecture=amd64,arm64")
	fs.StringVar(&o.fNodeOperatingSystems, "node-operating-systems", "", "List of node operating systems. Example --node-operating-system=linux,windows")
	fs.BoolVar(&o.fCopiedCSVsDisabled, "copied-csvs-disabled", false, "Flag to indicate if OLM copied CSVs are disabled.")
	fs.BoolVar(&o.fTechPreview, "tech-preview", false, "Enable console Technology Preview features.")
}

func (o *Options) CompleteOptions() (*CompletedOptions, error) {
	if o.fTechPreview {
		klog.Warning("Technology Preview features are enabled. These features are experimental and not supported for production use. If you encounter issues, send feedback through the usual support or bug-reporting channels.")
	}

	if len(o.fK8sAuth) > 0 {
		klog.Warning("DEPRECATED: --k8s-auth is deprecated and setting it has no effect")
	}

	if o.fLogLevel != "" {
		klog.Warningf("DEPRECATED: --log-level is now deprecated, use verbosity flag --v=Level instead")
	}

	completed := &CompletedOptions{
		AddPage:                      o.fAddPage,
		AlertmanagerTenancyHost:      o.fAlertmanagerTenancyHost,
		AlertmanagerUserWorkloadHost: o.fAlertmanagerUserWorkloadHost,
		BasePath:                     o.fBasePath,
		Branding:                     o.fBranding,
		CAFile:                       o.fCAFile,
		ContentSecurityPolicyEnabled: o.fContentSecurityPolicyEnabled,
		ControlPlaneTopology:         o.fControlPlaneTopology,
		CopiedCSVsDisabled:           o.fCopiedCSVsDisabled,
		CustomProductName:            o.fCustomProductName,
		DevCatalogCategories:         o.fDevCatalogCategories,
		DevCatalogTypes:              o.fDevCatalogTypes,
		K8sMode:                      o.fK8sMode,
		K8sModeOffClusterServiceAccountBearerTokenFile: o.fK8sModeOffClusterServiceAccountBearerTokenFile,
		K8sModeOffClusterSkipVerifyTLS:                 o.fK8sModeOffClusterSkipVerifyTLS,
		K8sPublicEndpoint:                              o.fK8sPublicEndpoint,
		LoadTestFactor:                                 o.fLoadTestFactor,
		Perspectives:                                   o.fPerspectives,
		PluginProxy:                                    o.fPluginProxy,
		ProjectAccessClusterRoles:                      o.fProjectAccessClusterRoles,
		PublicDir:                                      o.fPublicDir,
		QuickStarts:                                    o.fQuickStarts,
		RedirectPort:                                   o.fRedirectPort,
		ReleaseVersion:                                 o.fReleaseVersion,
		ServiceCAFile:                                  o.fServiceCAFile,
		StatuspageID:                                   o.fStatuspageID,
		TechPreview:                                    o.fTechPreview,
		TLSCertFile:                                    o.fTLSCertFile,
		TLSKeyFile:                                     o.fTLSKeyFile,
		UserSettingsLocation:                           o.fUserSettingsLocation,
	}

	var err error
	completed.BaseURL, err = flags.ValidateFlagIsURL("base-address", o.fBaseAddress, true)
	if err != nil {
		return nil, err
	}

	if !strings.HasPrefix(o.fBasePath, "/") || !strings.HasSuffix(o.fBasePath, "/") {
		return nil, flags.NewInvalidFlagError("base-path", "value must start and end with slash")
	}
	completed.BaseURL.Path = o.fBasePath

	completed.DocumentationBaseURL = &url.URL{}
	if o.fDocumentationBaseURL != "" {
		if !strings.HasSuffix(o.fDocumentationBaseURL, "/") {
			return nil, flags.NewInvalidFlagError("documentation-base-url", "value must end with slash")
		}
		completed.DocumentationBaseURL, err = flags.ValidateFlagIsURL("documentation-base-url", o.fDocumentationBaseURL, false)
		if err != nil {
			return nil, err
		}
	}

	completed.AlertmanagerPublicURL, err = flags.ValidateFlagIsURL("alermanager-public-url", o.fAlermanagerPublicURL, true)
	if err != nil {
		return nil, err
	}

	completed.GrafanaPublicURL, err = flags.ValidateFlagIsURL("grafana-public-url", o.fGrafanaPublicURL, true)
	if err != nil {
		return nil, err
	}

	completed.PrometheusPublicURL, err = flags.ValidateFlagIsURL("prometheus-public-url", o.fPrometheusPublicURL, true)
	if err != nil {
		return nil, err
	}

	completed.K8sModeOffClusterThanos, err = flags.ValidateFlagIsURL("thanos-public-url", o.fThanosPublicURL, true)
	if err != nil {
		return nil, err
	}

	completed.K8sModeOffClusterEndpoint, err = flags.ValidateFlagIsURL("k8s-mode-off-cluster-endpoint", o.fK8sModeOffClusterEndpoint, true)
	if err != nil {
		return nil, err
	}

	completed.K8sModeOffClusterCatalogd, err = flags.ValidateFlagIsURL("k8s-mode-off-cluster-catalogd", o.fK8sModeOffClusterCatalogd, true)
	if err != nil {
		return nil, err
	}

	completed.K8sModeOffClusterGitOps, err = flags.ValidateFlagIsURL("k8s-mode-off-cluster-gitops", o.fK8sModeOffClusterGitOps, true)
	if err != nil {
		return nil, err
	}

	completed.Listen, err = flags.ValidateFlagIsURL("listen", o.fListen, false)
	if err != nil {
		return nil, err
	}

	switch completed.Listen.Scheme {
	case "http":
	case "https":
		err = flags.ValidateFlagNotEmpty("tls-cert-file", o.fTLSCertFile)
		if err != nil {
			return nil, err
		}
		err = flags.ValidateFlagNotEmpty("tls-key-file", o.fTLSKeyFile)
		if err != nil {
			return nil, err
		}
	default:
		return nil, flags.NewInvalidFlagError("listen", "scheme must be one of: http, https")
	}

	completed.Branding = o.fBranding
	if completed.Branding == "origin" {
		completed.Branding = "okd"
	}
	switch completed.Branding {
	case "okd":
	case "openshift":
	case "ocp":
	case "online":
	case "dedicated":
	case "azure":
	case "rosa":
	default:
		return nil, flags.NewInvalidFlagError("branding", "value must be one of okd, openshift, ocp, online, dedicated, azure, or rosa")
	}

	completed.I18nNamespaces = []string{}
	if o.fI18NamespacesFlags != "" {
		for _, str := range strings.Split(o.fI18NamespacesFlags, ",") {
			str = strings.TrimSpace(str)
			if str == "" {
				return nil, flags.NewInvalidFlagError("i18n-namespaces", "list must contain name of i18n namespaces separated by comma")
			}
			completed.I18nNamespaces = append(completed.I18nNamespaces, str)
		}
	}

	completed.PluginsOrder = []string{}
	if o.fPluginsOrder != "" {
		for _, str := range strings.Split(o.fPluginsOrder, ",") {
			str = strings.TrimSpace(str)
			if str == "" {
				return nil, flags.NewInvalidFlagError("plugins-order", "list must contain names of plugins separated by comma")
			}
			if o.enabledPlugins[str] == "" {
				return nil, flags.NewInvalidFlagError("plugins-order", "list must only contain currently enabled plugins")
			}
			completed.PluginsOrder = append(completed.PluginsOrder, str)
		}
	} else if len(o.enabledPlugins) > 0 {
		for plugin := range o.enabledPlugins {
			completed.PluginsOrder = append(completed.PluginsOrder, plugin)
		}
	}

	if len(completed.PluginsOrder) > 0 {
		klog.Infoln("Console plugins are enabled in following order:")
		for _, pluginName := range completed.PluginsOrder {
			klog.Infof(" - %s", pluginName)
		}
	}

	completed.NodeArchitectures = []string{}
	if o.fNodeArchitectures != "" {
		for _, str := range strings.Split(o.fNodeArchitectures, ",") {
			str = strings.TrimSpace(str)
			if str == "" {
				return nil, flags.NewInvalidFlagError("node-architectures", "list must contain name of node architectures separated by comma")
			}
			completed.NodeArchitectures = append(completed.NodeArchitectures, str)
		}
	}

	completed.NodeOperatingSystems = []string{}
	if o.fNodeOperatingSystems != "" {
		for _, str := range strings.Split(o.fNodeOperatingSystems, ",") {
			str = strings.TrimSpace(str)
			if str == "" {
				return nil, flags.NewInvalidFlagError("node-operating-systems", "list must contain name of node architectures separated by comma")
			}
			completed.NodeOperatingSystems = append(completed.NodeOperatingSystems, str)
		}
	}

	completed.Capabilities = []operatorv1.Capability{}
	if o.fCapabilities != "" {
		err = json.Unmarshal([]byte(o.fCapabilities), &completed.Capabilities)
		if err != nil {
			return nil, flags.NewInvalidFlagError("capabilities", "must be a valid JSON []Capability array (see https://pkg.go.dev/github.com/openshift/api/operator/v1#Capability): %v", err)
		}
	}

	if len(completed.Telemetry) > 0 {
		keys := make([]string, 0, len(completed.Telemetry))
		for name := range completed.Telemetry {
			keys = append(keys, name)
		}
		sort.Strings(keys)

		klog.Infoln("Console telemetry options:")
		for _, k := range keys {
			klog.Infof(" - %s %s", k, completed.Telemetry[k])
		}
	}

	return completed, nil
}
