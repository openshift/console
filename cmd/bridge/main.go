package main

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"flag"
	"fmt"
	"runtime"

	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"strings"

	operatorv1 "github.com/openshift/api/operator/v1"
	authopts "github.com/openshift/console/cmd/bridge/config/auth"
	"github.com/openshift/console/cmd/bridge/config/session"
	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/flags"
	"github.com/openshift/console/pkg/knative"
	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/pkg/server"
	"github.com/openshift/console/pkg/serverconfig"
	oscrypto "github.com/openshift/library-go/pkg/crypto"
	"k8s.io/client-go/rest"
	klog "k8s.io/klog/v2"
)

const (
	k8sInClusterCA          = "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt"
	k8sInClusterBearerToken = "/var/run/secrets/kubernetes.io/serviceaccount/token"

	catalogdHost = "catalogd-catalogserver.openshift-catalogd.svc:443"

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

func main() {
	fs := flag.NewFlagSet("bridge", flag.ExitOnError)
	klog.InitFlags(fs)
	defer klog.Flush()

	authOptions := authopts.NewAuthOptions()
	authOptions.AddFlags(fs)

	sessionOptions := session.NewSessionOptions()
	sessionOptions.AddFlags(fs)

	// Define commandline / env / config options
	fs.String("config", "", "The YAML config file.")

	fListen := fs.String("listen", "http://0.0.0.0:9000", "")

	fBaseAddress := fs.String("base-address", "", "Format: <http | https>://domainOrIPAddress[:port]. Example: https://openshift.example.com.")
	fBasePath := fs.String("base-path", "/", "")

	// See https://github.com/openshift/service-serving-cert-signer
	fServiceCAFile := fs.String("service-ca-file", "", "CA bundle for OpenShift services signed with the service signing certificates.")

	fK8sMode := fs.String("k8s-mode", "in-cluster", "in-cluster | off-cluster")
	fK8sModeOffClusterEndpoint := fs.String("k8s-mode-off-cluster-endpoint", "", "URL of the Kubernetes API server.")
	fK8sModeOffClusterSkipVerifyTLS := fs.Bool("k8s-mode-off-cluster-skip-verify-tls", false, "DEV ONLY. When true, skip verification of certs presented by k8s API server.")
	fK8sModeOffClusterThanos := fs.String("k8s-mode-off-cluster-thanos", "", "DEV ONLY. URL of the cluster's Thanos server.")
	fK8sModeOffClusterAlertmanager := fs.String("k8s-mode-off-cluster-alertmanager", "", "DEV ONLY. URL of the cluster's AlertManager server.")
	fK8sModeOffClusterCatalogd := fs.String("k8s-mode-off-cluster-catalogd", "", "DEV ONLY. URL of the cluster's catalogd server.")

	fK8sAuth := fs.String("k8s-auth", "", "this option is deprecated, setting it has no effect")

	fK8sModeOffClusterGitOps := fs.String("k8s-mode-off-cluster-gitops", "", "DEV ONLY. URL of the GitOps backend service")

	fRedirectPort := fs.Int("redirect-port", 0, "Port number under which the console should listen for custom hostname redirect.")
	fLogLevel := fs.String("log-level", "", "level of logging information by package (pkg=level).")
	fPublicDir := fs.String("public-dir", "./frontend/public/dist", "directory containing static web assets.")
	fTlSCertFile := fs.String("tls-cert-file", "", "TLS certificate. If the certificate is signed by a certificate authority, the certFile should be the concatenation of the server's certificate followed by the CA's certificate.")
	fTlSKeyFile := fs.String("tls-key-file", "", "The TLS certificate key.")
	fCAFile := fs.String("ca-file", "", "PEM File containing trusted certificates of trusted CAs. If not present, the system's Root CAs will be used.")

	_ = fs.String("kubectl-client-id", "", "DEPRECATED: setting this does not do anything.")
	_ = fs.String("kubectl-client-secret", "", "DEPRECATED: setting this does not do anything.")
	_ = fs.String("kubectl-client-secret-file", "", "DEPRECATED: setting this does not do anything.")

	fK8sPublicEndpoint := fs.String("k8s-public-endpoint", "", "Endpoint to use to communicate to the API server.")

	fBranding := fs.String("branding", "okd", "Console branding for the masthead logo and title. One of okd, openshift, ocp, online, dedicated, azure, or rosa. Defaults to okd.")
	fCustomProductName := fs.String("custom-product-name", "", "Custom product name for console branding.")
	fCustomLogoFile := fs.String("custom-logo-file", "", "Custom product image for console branding.")
	fStatuspageID := fs.String("statuspage-id", "", "Unique ID assigned by statuspage.io page that provides status info.")
	fDocumentationBaseURL := fs.String("documentation-base-url", "", "The base URL for documentation links.")

	fAlertmanagerUserWorkloadHost := fs.String("alermanager-user-workload-host", openshiftAlertManagerHost, "Location of the Alertmanager service for user-defined alerts.")
	fAlertmanagerTenancyHost := fs.String("alermanager-tenancy-host", openshiftAlertManagerTenancyHost, "Location of the tenant-aware Alertmanager service.")
	fAlermanagerPublicURL := fs.String("alermanager-public-url", "", "Public URL of the cluster's AlertManager server.")
	fGrafanaPublicURL := fs.String("grafana-public-url", "", "Public URL of the cluster's Grafana server.")
	fPrometheusPublicURL := fs.String("prometheus-public-url", "", "Public URL of the cluster's Prometheus server.")
	fThanosPublicURL := fs.String("thanos-public-url", "", "Public URL of the cluster's Thanos server.")

	consolePluginsFlags := serverconfig.MultiKeyValue{}
	fs.Var(&consolePluginsFlags, "plugins", "List of plugin entries that are enabled for the console. Each entry consist of plugin-name as a key and plugin-endpoint as a value.")
	fPluginProxy := fs.String("plugin-proxy", "", "Defines various service types to which will console proxy plugins requests. (JSON as string)")
	fI18NamespacesFlags := fs.String("i18n-namespaces", "", "List of namespaces separated by comma. Example --i18n-namespaces=plugin__acm,plugin__kubevirt")
	fContentSecurityPolicy := fs.String("content-security-policy", "", "Content security policy for the console. (JSON as string)")

	telemetryFlags := serverconfig.MultiKeyValue{}
	fs.Var(&telemetryFlags, "telemetry", "Telemetry configuration that can be used by console plugins. Each entry should be a key=value pair.")

	fLoadTestFactor := fs.Int("load-test-factor", 0, "DEV ONLY. The factor used to multiply k8s API list responses for load testing purposes.")

	fDevCatalogCategories := fs.String("developer-catalog-categories", "", "Allow catalog categories customization. (JSON as string)")
	fDevCatalogTypes := fs.String("developer-catalog-types", "", "Allow enabling/disabling of sub-catalog types from the developer catalog. (JSON as string)")
	fUserSettingsLocation := fs.String("user-settings-location", "configmap", "DEV ONLY. Define where the user settings should be stored. (configmap | localstorage).")
	fQuickStarts := fs.String("quick-starts", "", "Allow customization of available ConsoleQuickStart resources in console. (JSON as string)")
	fAddPage := fs.String("add-page", "", "DEV ONLY. Allow add page customization. (JSON as string)")
	fProjectAccessClusterRoles := fs.String("project-access-cluster-roles", "", "The list of Cluster Roles assignable for the project access page. (JSON as string)")
	fPerspectives := fs.String("perspectives", "", "Allow enabling/disabling of perspectives in the console. (JSON as string)")
	fCapabilities := fs.String("capabilities", "", "Allow enabling/disabling of capabilities in the console. (JSON as string)")
	fControlPlaneTopology := fs.String("control-plane-topology-mode", "", "Defines the topology mode of the control/infra nodes (External | HighlyAvailable | SingleReplica)")
	fReleaseVersion := fs.String("release-version", "", "Defines the release version of the cluster")
	fNodeArchitectures := fs.String("node-architectures", "", "List of node architectures. Example --node-architecture=amd64,arm64")
	fNodeOperatingSystems := fs.String("node-operating-systems", "", "List of node operating systems. Example --node-operating-system=linux,windows")
	fCopiedCSVsDisabled := fs.Bool("copied-csvs-disabled", false, "Flag to indicate if OLM copied CSVs are disabled.")

	cfg, err := serverconfig.Parse(fs, os.Args[1:], "BRIDGE")
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		os.Exit(1)
	}

	if err := serverconfig.Validate(fs); err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		os.Exit(1)
	}

	authOptions.ApplyConfig(&cfg.Auth)
	sessionOptions.ApplyConfig(&cfg.Session)

	baseURL, err := flags.ValidateFlagIsURL("base-address", *fBaseAddress, true)
	flags.FatalIfFailed(err)

	if !strings.HasPrefix(*fBasePath, "/") || !strings.HasSuffix(*fBasePath, "/") {
		flags.FatalIfFailed(flags.NewInvalidFlagError("base-path", "value must start and end with slash"))
	}
	baseURL.Path = *fBasePath

	documentationBaseURL := &url.URL{}
	if *fDocumentationBaseURL != "" {
		if !strings.HasSuffix(*fDocumentationBaseURL, "/") {
			flags.FatalIfFailed(flags.NewInvalidFlagError("documentation-base-url", "value must end with slash"))
		}
		documentationBaseURL, err = flags.ValidateFlagIsURL("documentation-base-url", *fDocumentationBaseURL, false)
		flags.FatalIfFailed(err)
	}

	alertManagerPublicURL, err := flags.ValidateFlagIsURL("alermanager-public-url", *fAlermanagerPublicURL, true)
	flags.FatalIfFailed(err)

	grafanaPublicURL, err := flags.ValidateFlagIsURL("grafana-public-url", *fGrafanaPublicURL, true)
	flags.FatalIfFailed(err)

	prometheusPublicURL, err := flags.ValidateFlagIsURL("prometheus-public-url", *fPrometheusPublicURL, true)
	flags.FatalIfFailed(err)

	thanosPublicURL, err := flags.ValidateFlagIsURL("thanos-public-url", *fThanosPublicURL, true)
	flags.FatalIfFailed(err)

	branding := *fBranding
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

	if *fCustomLogoFile != "" {
		if _, err := os.Stat(*fCustomLogoFile); err != nil {
			klog.Fatalf("could not read logo file: %v", err)
		}
	}

	if len(consolePluginsFlags) > 0 {
		klog.Infoln("The following console plugins are enabled:")
		for pluginName := range consolePluginsFlags {
			klog.Infof(" - %s\n", pluginName)
		}
	}

	i18nNamespaces := []string{}
	if *fI18NamespacesFlags != "" {
		for _, str := range strings.Split(*fI18NamespacesFlags, ",") {
			str = strings.TrimSpace(str)
			if str == "" {
				flags.FatalIfFailed(flags.NewInvalidFlagError("i18n-namespaces", "list must contain name of i18n namespaces separated by comma"))
			}
			i18nNamespaces = append(i18nNamespaces, str)
		}
	}

	nodeArchitectures := []string{}
	if *fNodeArchitectures != "" {
		for _, str := range strings.Split(*fNodeArchitectures, ",") {
			str = strings.TrimSpace(str)
			if str == "" {
				flags.FatalIfFailed(flags.NewInvalidFlagError("node-architectures", "list must contain name of node architectures separated by comma"))
			}
			nodeArchitectures = append(nodeArchitectures, str)
		}
	}

	nodeOperatingSystems := []string{}
	if *fNodeOperatingSystems != "" {
		for _, str := range strings.Split(*fNodeOperatingSystems, ",") {
			str = strings.TrimSpace(str)
			if str == "" {
				flags.FatalIfFailed(flags.NewInvalidFlagError("node-operating-systems", "list must contain name of node architectures separated by comma"))
			}
			nodeOperatingSystems = append(nodeOperatingSystems, str)
		}
	}

	capabilities := []operatorv1.Capability{}
	if *fCapabilities != "" {
		err = json.Unmarshal([]byte(*fCapabilities), &capabilities)
		if err != nil {
			klog.Fatalf("Error unmarshaling capabilities JSON: %v", err)
		}
	}

	srv := &server.Server{
		PublicDir:                    *fPublicDir,
		BaseURL:                      baseURL,
		Branding:                     branding,
		CustomProductName:            *fCustomProductName,
		CustomLogoFile:               *fCustomLogoFile,
		ControlPlaneTopology:         *fControlPlaneTopology,
		StatuspageID:                 *fStatuspageID,
		DocumentationBaseURL:         documentationBaseURL,
		AlertManagerUserWorkloadHost: *fAlertmanagerUserWorkloadHost,
		AlertManagerTenancyHost:      *fAlertmanagerTenancyHost,
		AlertManagerPublicURL:        alertManagerPublicURL,
		GrafanaPublicURL:             grafanaPublicURL,
		PrometheusPublicURL:          prometheusPublicURL,
		ThanosPublicURL:              thanosPublicURL,
		LoadTestFactor:               *fLoadTestFactor,
		DevCatalogCategories:         *fDevCatalogCategories,
		DevCatalogTypes:              *fDevCatalogTypes,
		UserSettingsLocation:         *fUserSettingsLocation,
		EnabledConsolePlugins:        consolePluginsFlags,
		I18nNamespaces:               i18nNamespaces,
		PluginProxy:                  *fPluginProxy,
		ContentSecurityPolicy:        *fContentSecurityPolicy,
		QuickStarts:                  *fQuickStarts,
		AddPage:                      *fAddPage,
		ProjectAccessClusterRoles:    *fProjectAccessClusterRoles,
		Perspectives:                 *fPerspectives,
		Telemetry:                    telemetryFlags,
		ReleaseVersion:               *fReleaseVersion,
		NodeArchitectures:            nodeArchitectures,
		NodeOperatingSystems:         nodeOperatingSystems,
		K8sMode:                      *fK8sMode,
		CopiedCSVsDisabled:           *fCopiedCSVsDisabled,
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
	if *fK8sMode == "in-cluster" {
		srv.GOARCH = runtime.GOARCH
		srv.GOOS = runtime.GOOS
	}

	if *fLogLevel != "" {
		klog.Warningf("DEPRECATED: --log-level is now deprecated, use verbosity flag --v=Level instead")
	}

	var (
		// Hold on to raw certificates so we can render them in kubeconfig files.
		k8sCertPEM []byte
	)

	var k8sEndpoint *url.URL
	switch *fK8sMode {
	case "in-cluster":
		k8sEndpoint = &url.URL{Scheme: "https", Host: "kubernetes.default.svc"}
		var err error
		k8sCertPEM, err = ioutil.ReadFile(k8sInClusterCA)
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
			HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
			Endpoint:        k8sEndpoint,
		}

		// If running in an OpenShift cluster, set up a proxy to the prometheus-k8s service running in the openshift-monitoring namespace.
		if *fServiceCAFile != "" {
			serviceCertPEM, err := ioutil.ReadFile(*fServiceCAFile)
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
				HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
				Endpoint:        &url.URL{Scheme: "https", Host: openshiftThanosHost, Path: "/api"},
			}
			srv.ThanosTenancyProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
				Endpoint:        &url.URL{Scheme: "https", Host: openshiftThanosTenancyHost, Path: "/api"},
			}
			srv.ThanosTenancyProxyForRulesConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
				Endpoint:        &url.URL{Scheme: "https", Host: openshiftThanosTenancyForRulesHost, Path: "/api"},
			}

			srv.AlertManagerProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
				Endpoint:        &url.URL{Scheme: "https", Host: openshiftAlertManagerHost, Path: "/api"},
			}
			srv.AlertManagerUserWorkloadProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
				Endpoint:        &url.URL{Scheme: "https", Host: *fAlertmanagerUserWorkloadHost, Path: "/api"},
			}
			srv.AlertManagerTenancyProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
				Endpoint:        &url.URL{Scheme: "https", Host: *fAlertmanagerTenancyHost, Path: "/api"},
			}
			srv.TerminalProxyTLSConfig = serviceProxyTLSConfig
			srv.PluginsProxyTLSConfig = serviceProxyTLSConfig

			srv.GitOpsProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
				Endpoint:        &url.URL{Scheme: "https", Host: openshiftGitOpsHost},
			}
		}

	case "off-cluster":
		k8sEndpoint, err = flags.ValidateFlagIsURL("k8s-mode-off-cluster-endpoint", *fK8sModeOffClusterEndpoint, false)
		flags.FatalIfFailed(err)

		serviceProxyTLSConfig := oscrypto.SecureTLSConfig(&tls.Config{
			InsecureSkipVerify: *fK8sModeOffClusterSkipVerifyTLS,
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

		srv.K8sProxyConfig = &proxy.Config{
			TLSClientConfig:         serviceProxyTLSConfig,
			HeaderBlacklist:         []string{"Cookie", "X-CSRFToken"},
			Endpoint:                k8sEndpoint,
			UseProxyFromEnvironment: true,
		}

		if *fK8sModeOffClusterCatalogd != "" {
			offClusterCatalogdURL, err := flags.ValidateFlagIsURL("k8s-mode-off-cluster-catalogd", *fK8sModeOffClusterCatalogd, false)
			flags.FatalIfFailed(err)
			srv.CatalogdProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				Endpoint:        offClusterCatalogdURL,
			}
		}

		if *fK8sModeOffClusterThanos != "" {
			offClusterThanosURL, err := flags.ValidateFlagIsURL("k8s-mode-off-cluster-thanos", *fK8sModeOffClusterThanos, false)
			flags.FatalIfFailed(err)

			offClusterThanosURL.Path += "/api"
			srv.ThanosTenancyProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
				Endpoint:        offClusterThanosURL,
			}
			srv.ThanosTenancyProxyForRulesConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
				Endpoint:        offClusterThanosURL,
			}
			srv.ThanosProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
				Endpoint:        offClusterThanosURL,
			}
		}

		if *fK8sModeOffClusterAlertmanager != "" {
			offClusterAlertManagerURL, err := flags.ValidateFlagIsURL("k8s-mode-off-cluster-alertmanager", *fK8sModeOffClusterAlertmanager, false)
			flags.FatalIfFailed(err)

			offClusterAlertManagerURL.Path += "/api"
			srv.AlertManagerProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
				Endpoint:        offClusterAlertManagerURL,
			}
			srv.AlertManagerTenancyProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
				Endpoint:        offClusterAlertManagerURL,
			}
			srv.AlertManagerUserWorkloadProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
				Endpoint:        offClusterAlertManagerURL,
			}
		}

		srv.TerminalProxyTLSConfig = serviceProxyTLSConfig
		srv.PluginsProxyTLSConfig = serviceProxyTLSConfig

		if *fK8sModeOffClusterGitOps != "" {
			offClusterGitOpsURL, err := flags.ValidateFlagIsURL("k8s-mode-off-cluster-gitops", *fK8sModeOffClusterGitOps, false)
			flags.FatalIfFailed(err)

			srv.GitOpsProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
				Endpoint:        offClusterGitOpsURL,
			}
		}
	default:
		flags.FatalIfFailed(flags.NewInvalidFlagError("k8s-mode", "must be one of: in-cluster, off-cluster"))
	}

	apiServerEndpoint := *fK8sPublicEndpoint
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
		HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
		Endpoint:        clusterManagementURL,
	}

	if len(*fK8sAuth) > 0 {
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

	caCertFilePath := *fCAFile
	if *fK8sMode == "in-cluster" {
		caCertFilePath = k8sInClusterCA
	}

	if err := completedAuthnOptions.ApplyTo(srv, k8sEndpoint, caCertFilePath, completedSessionOptions); err != nil {
		klog.Fatalf("failed to apply configuration to server: %v", err)
		os.Exit(1)
	}

	listenURL, err := flags.ValidateFlagIsURL("listen", *fListen, false)
	flags.FatalIfFailed(err)

	switch listenURL.Scheme {
	case "http":
	case "https":
		flags.FatalIfFailed(flags.ValidateFlagNotEmpty("tls-cert-file", *fTlSCertFile))
		flags.FatalIfFailed(flags.ValidateFlagNotEmpty("tls-key-file", *fTlSKeyFile))
	default:
		flags.FatalIfFailed(flags.NewInvalidFlagError("listen", "scheme must be one of: http, https"))
	}

	consoleHandler, err := srv.HTTPHandler()
	if err != nil {
		klog.Errorf("failed to set up the console's HTTP handler: %v", err)
		os.Exit(1)
	}
	httpsrv := &http.Server{
		Addr:    listenURL.Host,
		Handler: consoleHandler,
		// Disable HTTP/2, which breaks WebSockets.
		TLSNextProto: make(map[string]func(*http.Server, *tls.Conn, http.Handler)),
		TLSConfig:    oscrypto.SecureTLSConfig(&tls.Config{}),
	}

	if *fRedirectPort != 0 {
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
			redirectPort := fmt.Sprintf(":%d", *fRedirectPort)
			klog.Infof("Listening on %q for custom hostname redirect...", redirectPort)
			klog.Fatal(http.ListenAndServe(redirectPort, redirectServer))
		}()
	}

	klog.Infof("Binding to %s...", httpsrv.Addr)
	if listenURL.Scheme == "https" {
		klog.Info("using TLS")
		klog.Fatal(httpsrv.ListenAndServeTLS(*fTlSCertFile, *fTlSKeyFile))
	} else {
		klog.Info("not using TLS")
		klog.Fatal(httpsrv.ListenAndServe())
	}
}
