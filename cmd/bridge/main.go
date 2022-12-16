package main

import (
	"context"
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

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/bridge"
	"github.com/openshift/console/pkg/knative"
	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/pkg/server"
	"github.com/openshift/console/pkg/serverconfig"
	"github.com/openshift/console/pkg/serverutils"
	oscrypto "github.com/openshift/library-go/pkg/crypto"

	"k8s.io/klog"
)

const (
	k8sInClusterCA          = "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt"
	k8sInClusterBearerToken = "/var/run/secrets/kubernetes.io/serviceaccount/token"

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

	// Well-known location of metering service for OpenShift. This is only accessible in-cluster.
	openshiftMeteringHost = "reporting-operator.openshift-metering.svc:8080"

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

	// Define commandline / env / config options
	fs.String("config", "", "The YAML config file.")

	fListen := fs.String("listen", "http://0.0.0.0:9000", "")

	fBaseAddress := fs.String("base-address", "", "Format: <http | https>://domainOrIPAddress[:port]. Example: https://openshift.example.com.")
	fBasePath := fs.String("base-path", "/", "")

	// See https://github.com/openshift/service-serving-cert-signer
	fServiceCAFile := fs.String("service-ca-file", "", "CA bundle for OpenShift services signed with the service signing certificates.")

	fUserAuth := fs.String("user-auth", "disabled", "disabled | oidc | openshift")
	fUserAuthOIDCIssuerURL := fs.String("user-auth-oidc-issuer-url", "", "The OIDC/OAuth2 issuer URL.")
	fUserAuthOIDCCAFile := fs.String("user-auth-oidc-ca-file", "", "PEM file for the OIDC/OAuth2 issuer.")
	fUserAuthOIDCClientID := fs.String("user-auth-oidc-client-id", "", "The OIDC OAuth2 Client ID.")
	fUserAuthOIDCClientSecret := fs.String("user-auth-oidc-client-secret", "", "The OIDC OAuth2 Client Secret.")
	fUserAuthOIDCClientSecretFile := fs.String("user-auth-oidc-client-secret-file", "", "File containing the OIDC OAuth2 Client Secret.")
	fUserAuthLogoutRedirect := fs.String("user-auth-logout-redirect", "", "Optional redirect URL on logout needed for some single sign-on identity providers.")

	fInactivityTimeout := fs.Int("inactivity-timeout", 0, "Number of seconds, after which user will be logged out if inactive. Ignored if less than 300 seconds (5 minutes).")

	fK8sMode := fs.String("k8s-mode", "in-cluster", "in-cluster | off-cluster")
	fK8sModeOffClusterEndpoint := fs.String("k8s-mode-off-cluster-endpoint", "", "URL of the Kubernetes API server.")
	fK8sModeOffClusterSkipVerifyTLS := fs.Bool("k8s-mode-off-cluster-skip-verify-tls", false, "DEV ONLY. When true, skip verification of certs presented by k8s API server.")
	fK8sModeOffClusterThanos := fs.String("k8s-mode-off-cluster-thanos", "", "DEV ONLY. URL of the cluster's Thanos server.")
	fK8sModeOffClusterAlertmanager := fs.String("k8s-mode-off-cluster-alertmanager", "", "DEV ONLY. URL of the cluster's AlertManager server.")
	fK8sModeOffClusterMetering := fs.String("k8s-mode-off-cluster-metering", "", "DEV ONLY. URL of the cluster's metering server.")
	fK8sModeOffClusterManagedClusterProxy := fs.String("k8s-mode-off-cluster-managed-cluster-proxy", "", "DEV ONLY. Public URL of the ACM/MCE cluster proxy.")

	fK8sAuth := fs.String("k8s-auth", "service-account", "service-account | bearer-token | oidc | openshift")
	fK8sAuthBearerToken := fs.String("k8s-auth-bearer-token", "", "Authorization token to send with proxied Kubernetes API requests.")

	fK8sModeOffClusterGitOps := fs.String("k8s-mode-off-cluster-gitops", "", "DEV ONLY. URL of the GitOps backend service")

	fRedirectPort := fs.Int("redirect-port", 0, "Port number under which the console should listen for custom hostname redirect.")
	fLogLevel := fs.String("log-level", "", "level of logging information by package (pkg=level).")
	fPublicDir := fs.String("public-dir", "./frontend/public/dist", "directory containing static web assets.")
	fTlSCertFile := fs.String("tls-cert-file", "", "TLS certificate. If the certificate is signed by a certificate authority, the certFile should be the concatenation of the server's certificate followed by the CA's certificate.")
	fTlSKeyFile := fs.String("tls-key-file", "", "The TLS certificate key.")
	fCAFile := fs.String("ca-file", "", "PEM File containing trusted certificates of trusted CAs. If not present, the system's Root CAs will be used.")

	fKubectlClientID := fs.String("kubectl-client-id", "", "The OAuth2 client_id of kubectl.")
	fKubectlClientSecret := fs.String("kubectl-client-secret", "", "The OAuth2 client_secret of kubectl.")
	fKubectlClientSecretFile := fs.String("kubectl-client-secret-file", "", "File containing the OAuth2 client_secret of kubectl.")
	fK8sPublicEndpoint := fs.String("k8s-public-endpoint", "", "Endpoint to use when rendering kubeconfigs for clients. Useful for when bridge uses an internal endpoint clients can't access for communicating with the API server.")

	fBranding := fs.String("branding", "okd", "Console branding for the masthead logo and title. One of okd, openshift, ocp, online, dedicated, or azure. Defaults to okd.")
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
	fManagedClusterConfigs := fs.String("managed-clusters", "", "List of managed cluster configurations. (JSON as string)")
	fControlPlaneTopology := fs.String("control-plane-topology-mode", "", "Defines the topology mode of the control/infra nodes (External | HighlyAvailable | SingleReplica)")
	fReleaseVersion := fs.String("release-version", "", "Defines the release version of the cluster")
	fNodeArchitectures := fs.String("node-architectures", "", "List of node architectures. Example --node-architecture=amd64,arm64")
	fCopiedCSVsDisabled := fs.Bool("copied-csvs-disabled", false, "Flag to indicate if OLM copied CSVs are disabled.")
	fHubConsoleURL := fs.String("hub-console-url", "", "URL of the hub cluster's console in a multi cluster environment.")
	if err := serverconfig.Parse(fs, os.Args[1:], "BRIDGE"); err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		os.Exit(1)
	}
	if err := serverconfig.Validate(fs); err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		os.Exit(1)
	}

	baseURL := &url.URL{}
	if *fBaseAddress != "" {
		baseURL = bridge.ValidateFlagIsURL("base-address", *fBaseAddress)
	}

	if !strings.HasPrefix(*fBasePath, "/") || !strings.HasSuffix(*fBasePath, "/") {
		bridge.FlagFatalf("base-path", "value must start and end with slash")
	}
	baseURL.Path = *fBasePath

	caCertFilePath := *fCAFile
	if *fK8sMode == "in-cluster" {
		caCertFilePath = k8sInClusterCA
	}

	logoutRedirect := &url.URL{}
	if *fUserAuthLogoutRedirect != "" {
		logoutRedirect = bridge.ValidateFlagIsURL("user-auth-logout-redirect", *fUserAuthLogoutRedirect)
	}

	documentationBaseURL := &url.URL{}
	if *fDocumentationBaseURL != "" {
		if !strings.HasSuffix(*fDocumentationBaseURL, "/") {
			bridge.FlagFatalf("documentation-base-url", "value must end with slash")
		}
		documentationBaseURL = bridge.ValidateFlagIsURL("documentation-base-url", *fDocumentationBaseURL)
	}

	alertManagerPublicURL := &url.URL{}
	if *fAlermanagerPublicURL != "" {
		alertManagerPublicURL = bridge.ValidateFlagIsURL("alermanager-public-url", *fAlermanagerPublicURL)
	}
	grafanaPublicURL := &url.URL{}
	if *fGrafanaPublicURL != "" {
		grafanaPublicURL = bridge.ValidateFlagIsURL("grafana-public-url", *fGrafanaPublicURL)
	}
	prometheusPublicURL := &url.URL{}
	if *fPrometheusPublicURL != "" {
		prometheusPublicURL = bridge.ValidateFlagIsURL("prometheus-public-url", *fPrometheusPublicURL)
	}
	thanosPublicURL := &url.URL{}
	if *fThanosPublicURL != "" {
		thanosPublicURL = bridge.ValidateFlagIsURL("thanos-public-url", *fThanosPublicURL)
	}

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
	default:
		bridge.FlagFatalf("branding", "value must be one of okd, openshift, ocp, online, dedicated, or azure")
	}

	if *fCustomLogoFile != "" {
		if _, err := os.Stat(*fCustomLogoFile); err != nil {
			klog.Fatalf("could not read logo file: %v", err)
		}
	}

	if *fInactivityTimeout < 300 {
		klog.Warning("Flag inactivity-timeout is set to less then 300 seconds and will be ignored!")
	} else {
		if *fK8sAuth != "oidc" && *fK8sAuth != "openshift" {
			fmt.Fprintln(os.Stderr, "In order activate the user inactivity timout, flag --user-auth must be one of: oidc, openshift")
			os.Exit(1)
		}
		klog.Infof("Setting user inactivity timout to %d seconds", *fInactivityTimeout)
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
				bridge.FlagFatalf("i18n-namespaces", "list must contain name of i18n namespaces separated by comma")
			}
			i18nNamespaces = append(i18nNamespaces, str)
		}
	}

	nodeArchitectures := []string{}
	if *fNodeArchitectures != "" {
		for _, str := range strings.Split(*fNodeArchitectures, ",") {
			str = strings.TrimSpace(str)
			if str == "" {
				bridge.FlagFatalf("node-architectures", "list must contain name of node architectures separated by comma")
			}
			nodeArchitectures = append(nodeArchitectures, str)
		}
	}

	hubConsoleURL := &url.URL{}
	if *fHubConsoleURL != "" {
		hubConsoleURL = bridge.ValidateFlagIsURL("hub-console-url", *fHubConsoleURL)
	}

	clusterCopiedCSVsDisabled := map[string]bool{
		serverutils.LocalClusterName: *fCopiedCSVsDisabled,
	}

	srv := &server.Server{
		PublicDir:                    *fPublicDir,
		BaseURL:                      baseURL,
		LogoutRedirect:               logoutRedirect,
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
		InactivityTimeout:            *fInactivityTimeout,
		DevCatalogCategories:         *fDevCatalogCategories,
		DevCatalogTypes:              *fDevCatalogTypes,
		UserSettingsLocation:         *fUserSettingsLocation,
		EnabledConsolePlugins:        consolePluginsFlags,
		I18nNamespaces:               i18nNamespaces,
		PluginProxy:                  *fPluginProxy,
		QuickStarts:                  *fQuickStarts,
		AddPage:                      *fAddPage,
		ProjectAccessClusterRoles:    *fProjectAccessClusterRoles,
		Perspectives:                 *fPerspectives,
		Telemetry:                    telemetryFlags,
		ReleaseVersion:               *fReleaseVersion,
		NodeArchitectures:            nodeArchitectures,
		HubConsoleURL:                hubConsoleURL,
	}

	managedClusterConfigs := []serverconfig.ManagedClusterConfig{}
	if *fManagedClusterConfigs != "" {
		unvalidatedManagedClusters := []serverconfig.ManagedClusterConfig{}
		if err := json.Unmarshal([]byte(*fManagedClusterConfigs), &unvalidatedManagedClusters); err != nil {
			klog.Fatalf("Unable to parse managed cluster JSON: %v", *fManagedClusterConfigs)
		}
		for _, managedClusterConfig := range unvalidatedManagedClusters {
			err := serverconfig.ValidateManagedClusterConfig(managedClusterConfig)
			if err != nil {
				klog.Errorf("Error configuring managed cluster. Invalid configuration: %v", err)
				continue
			}
			managedClusterConfigs = append(managedClusterConfigs, managedClusterConfig)
		}
	}

	// if !in-cluster (dev) we should not pass these values to the frontend
	if *fK8sMode == "in-cluster" {
		srv.GOARCH = runtime.GOARCH
		srv.GOOS = runtime.GOOS
	}

	if (*fKubectlClientID == "") != (*fKubectlClientSecret == "" && *fKubectlClientSecretFile == "") {
		fmt.Fprintln(os.Stderr, "Must provide both --kubectl-client-id and --kubectl-client-secret or --kubectrl-client-secret-file")
		os.Exit(1)
	}

	if *fKubectlClientSecret != "" && *fKubectlClientSecretFile != "" {
		fmt.Fprintln(os.Stderr, "Cannot provide both --kubectl-client-secret and --kubectrl-client-secret-file")
		os.Exit(1)
	}

	if *fLogLevel != "" {
		klog.Warningf("DEPRECATED: --log-level is now deprecated, use verbosity flag --v=Level instead")
	}

	var (
		// Hold on to raw certificates so we can render them in kubeconfig files.
		k8sCertPEM []byte
	)

	var (
		k8sAuthServiceAccountBearerToken string
	)

	var secureCookies bool
	if baseURL.Scheme == "https" {
		secureCookies = true
		klog.Info("cookies are secure!")
	} else {
		secureCookies = false
		klog.Warning("cookies are not secure because base-address is not https!")
	}

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

		bearerToken, err := ioutil.ReadFile(k8sInClusterBearerToken)
		if err != nil {
			klog.Fatalf("failed to read bearer token: %v", err)
		}

		srv.LocalK8sProxyConfig = &proxy.Config{
			TLSClientConfig: tlsConfig,
			HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
			Endpoint:        k8sEndpoint,
		}

		k8sAuthServiceAccountBearerToken = string(bearerToken)

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

			// Disable metrics in multicluster env.
			if len(managedClusterConfigs) == 0 {
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
			srv.MeteringProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
				Endpoint:        &url.URL{Scheme: "https", Host: openshiftMeteringHost, Path: "/api"},
			}
			srv.TerminalProxyTLSConfig = serviceProxyTLSConfig
			srv.PluginsProxyTLSConfig = serviceProxyTLSConfig

			srv.GitOpsProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
				Endpoint:        &url.URL{Scheme: "https", Host: openshiftGitOpsHost},
			}
			srv.ManagedClusterProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
				Endpoint:        &url.URL{Scheme: "https", Host: openshiftClusterProxyHost},
			}
		}

	case "off-cluster":
		k8sEndpoint = bridge.ValidateFlagIsURL("k8s-mode-off-cluster-endpoint", *fK8sModeOffClusterEndpoint)
		serviceProxyTLSConfig := oscrypto.SecureTLSConfig(&tls.Config{
			InsecureSkipVerify: *fK8sModeOffClusterSkipVerifyTLS,
		})

		srv.LocalK8sProxyConfig = &proxy.Config{
			TLSClientConfig: serviceProxyTLSConfig,
			HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
			Endpoint:        k8sEndpoint,
		}

		// Disable metrics in off-cluster multicluster env
		if len(managedClusterConfigs) == 0 && *fK8sModeOffClusterThanos != "" {
			offClusterThanosURL := bridge.ValidateFlagIsURL("k8s-mode-off-cluster-thanos", *fK8sModeOffClusterThanos)
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
			offClusterAlertManagerURL := bridge.ValidateFlagIsURL("k8s-mode-off-cluster-alertmanager", *fK8sModeOffClusterAlertmanager)
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

		if *fK8sModeOffClusterMetering != "" {
			offClusterMeteringURL := bridge.ValidateFlagIsURL("k8s-mode-off-cluster-metering", *fK8sModeOffClusterMetering)
			offClusterMeteringURL.Path += "/api"
			srv.MeteringProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
				Endpoint:        offClusterMeteringURL,
			}
		}

		srv.TerminalProxyTLSConfig = serviceProxyTLSConfig
		srv.PluginsProxyTLSConfig = serviceProxyTLSConfig

		if *fK8sModeOffClusterGitOps != "" {
			offClusterGitOpsURL := bridge.ValidateFlagIsURL("k8s-mode-off-cluster-gitops", *fK8sModeOffClusterGitOps)
			srv.GitOpsProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
				Endpoint:        offClusterGitOpsURL,
			}
		}

		// Must have off-cluster cluster proxy endpoint if we have managed clusters
		if len(managedClusterConfigs) > 0 {
			offClusterManagedClusterProxyURL := bridge.ValidateFlagIsURL("k8s-mode-off-cluster-managed-cluster-proxy", *fK8sModeOffClusterManagedClusterProxy)
			srv.ManagedClusterProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
				Endpoint:        offClusterManagedClusterProxyURL,
			}
		}

	default:
		bridge.FlagFatalf("k8s-mode", "must be one of: in-cluster, off-cluster")
	}

	apiServerEndpoint := *fK8sPublicEndpoint
	if apiServerEndpoint == "" {
		apiServerEndpoint = srv.LocalK8sProxyConfig.Endpoint.String()
	}
	srv.KubeAPIServerURL = apiServerEndpoint
	srv.LocalK8sClient = &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: srv.LocalK8sProxyConfig.TLSClientConfig,
		},
	}

	clusterManagementURL, err := url.Parse(clusterManagementURL)
	if err != nil {
		klog.Fatalf("failed to parse %q", clusterManagementURL)
	}
	srv.ClusterManagementProxyConfig = &proxy.Config{
		TLSClientConfig: oscrypto.SecureTLSConfig(&tls.Config{}),
		HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
		Endpoint:        clusterManagementURL,
	}

	switch *fUserAuth {
	case "oidc", "openshift":
		bridge.ValidateFlagNotEmpty("base-address", *fBaseAddress)
		bridge.ValidateFlagNotEmpty("user-auth-oidc-client-id", *fUserAuthOIDCClientID)

		if *fUserAuthOIDCClientSecret == "" && *fUserAuthOIDCClientSecretFile == "" {
			fmt.Fprintln(os.Stderr, "Must provide either --user-auth-oidc-client-secret or --user-auth-oidc-client-secret-file")
			os.Exit(1)
		}

		if *fUserAuthOIDCClientSecret != "" && *fUserAuthOIDCClientSecretFile != "" {
			fmt.Fprintln(os.Stderr, "Cannot provide both --user-auth-oidc-client-secret and --user-auth-oidc-client-secret-file")
			os.Exit(1)
		}

		var (
			err                      error
			userAuthOIDCIssuerURL    *url.URL
			authLoginErrorEndpoint   = proxy.SingleJoiningSlash(srv.BaseURL.String(), server.AuthLoginErrorEndpoint)
			authLoginSuccessEndpoint = proxy.SingleJoiningSlash(srv.BaseURL.String(), server.AuthLoginSuccessEndpoint)
			oidcClientSecret         = *fUserAuthOIDCClientSecret
			// Abstraction leak required by NewAuthenticator. We only want the browser to send the auth token for paths starting with basePath/api.
			cookiePath  = proxy.SingleJoiningSlash(srv.BaseURL.Path, "/api/")
			refererPath = srv.BaseURL.String()
		)

		scopes := []string{"openid", "email", "profile", "groups"}
		authSource := auth.AuthSourceTectonic

		if *fUserAuth == "openshift" {
			// Scopes come from OpenShift documentation
			// https://access.redhat.com/documentation/en-us/openshift_container_platform/4.9/html/authentication_and_authorization/using-service-accounts-as-oauth-client
			//
			// TODO(ericchiang): Support other scopes like view only permissions.
			scopes = []string{"user:full"}
			authSource = auth.AuthSourceOpenShift
			if *fUserAuthOIDCIssuerURL != "" {
				bridge.FlagFatalf("user-auth-oidc-issuer-url", "cannot be used with --user-auth=\"openshift\"")
			}
			userAuthOIDCIssuerURL = k8sEndpoint
		} else {
			userAuthOIDCIssuerURL = bridge.ValidateFlagIsURL("user-auth-oidc-issuer-url", *fUserAuthOIDCIssuerURL)
		}

		if *fUserAuthOIDCClientSecretFile != "" {
			buf, err := ioutil.ReadFile(*fUserAuthOIDCClientSecretFile)
			if err != nil {
				klog.Fatalf("Failed to read client secret file: %v", err)
			}
			oidcClientSecret = string(buf)
		}

		// Config for logging into console.
		oidcClientConfig := &auth.Config{
			AuthSource:   authSource,
			IssuerURL:    userAuthOIDCIssuerURL.String(),
			IssuerCA:     *fUserAuthOIDCCAFile,
			ClientID:     *fUserAuthOIDCClientID,
			ClientSecret: oidcClientSecret,
			RedirectURL:  proxy.SingleJoiningSlash(srv.BaseURL.String(), server.AuthLoginCallbackEndpoint),
			Scope:        scopes,

			// Use the k8s CA file for OpenShift OAuth metadata discovery.
			// This might be different than IssuerCA.
			K8sCA: caCertFilePath,

			ErrorURL:   authLoginErrorEndpoint,
			SuccessURL: authLoginSuccessEndpoint,

			CookiePath:    cookiePath,
			RefererPath:   refererPath,
			SecureCookies: secureCookies,
			ClusterName:   serverutils.LocalClusterName,
		}

		// NOTE: This won't work when using the OpenShift auth mode.
		if *fKubectlClientID != "" {
			srv.KubectlClientID = *fKubectlClientID

			// Assume kubectl is the client ID trusted by kubernetes, not bridge.
			// These additional flags causes Dex to issue an ID token valid for
			// both bridge and kubernetes.
			oidcClientConfig.Scope = append(
				oidcClientConfig.Scope,
				"audience:server:client_id:"+*fUserAuthOIDCClientID,
				"audience:server:client_id:"+*fKubectlClientID,
			)

		}

		srv.Authers = make(map[string]*auth.Authenticator)
		if srv.Authers[serverutils.LocalClusterName], err = auth.NewAuthenticator(context.Background(), oidcClientConfig); err != nil {
			klog.Fatalf("Error initializing authenticator: %v", err)
		}

		if len(managedClusterConfigs) > 0 {
			for _, managedCluster := range managedClusterConfigs {
				managedClusterOIDCClientConfig := &auth.Config{
					AuthSource:   authSource,
					IssuerURL:    managedCluster.APIServer.URL,
					IssuerCA:     managedCluster.OAuth.CAFile,
					ClientID:     managedCluster.OAuth.ClientID,
					ClientSecret: managedCluster.OAuth.ClientSecret,
					RedirectURL:  proxy.SingleJoiningSlash(srv.BaseURL.String(), fmt.Sprintf("%s/%s", server.AuthLoginCallbackEndpoint, managedCluster.Name)),
					Scope:        scopes,

					// Use the k8s CA file for OpenShift OAuth metadata discovery.
					// This might be different than IssuerCA.
					K8sCA: managedCluster.APIServer.CAFile,

					ErrorURL:   authLoginErrorEndpoint,
					SuccessURL: authLoginSuccessEndpoint,

					CookiePath:    cookiePath,
					RefererPath:   refererPath,
					SecureCookies: secureCookies,
					ClusterName:   managedCluster.Name,
				}

				if srv.Authers[managedCluster.Name], err = auth.NewAuthenticator(context.Background(), managedClusterOIDCClientConfig); err != nil {
					klog.Fatalf("Error initializing managed cluster authenticator: %v", err)
				}

				clusterCopiedCSVsDisabled[managedCluster.Name] = managedCluster.CopiedCSVsDisabled
			}
		}
	case "disabled":
		klog.Warning("running with AUTHENTICATION DISABLED!")
	default:
		bridge.FlagFatalf("user-auth", "must be one of: oidc, openshift, disabled")
	}

	switch *fK8sAuth {
	case "service-account":
		bridge.ValidateFlagIs("k8s-mode", *fK8sMode, "in-cluster")
		srv.StaticUser = &auth.User{
			Token: k8sAuthServiceAccountBearerToken,
		}
		srv.ServiceAccountToken = k8sAuthServiceAccountBearerToken
	case "bearer-token":
		bridge.ValidateFlagNotEmpty("k8s-auth-bearer-token", *fK8sAuthBearerToken)
		srv.StaticUser = &auth.User{
			Token: *fK8sAuthBearerToken,
		}
		srv.ServiceAccountToken = *fK8sAuthBearerToken
	case "oidc", "openshift":
		bridge.ValidateFlagIs("user-auth", *fUserAuth, "oidc", "openshift")
		srv.ServiceAccountToken = k8sAuthServiceAccountBearerToken
	default:
		bridge.FlagFatalf("k8s-mode", "must be one of: service-account, bearer-token, oidc, openshift")
	}

	srv.CopiedCSVsDisabled = clusterCopiedCSVsDisabled

	srv.MonitoringDashboardConfigMapLister = server.NewResourceLister(
		srv.ServiceAccountToken,
		&url.URL{
			Scheme: k8sEndpoint.Scheme,
			Host:   k8sEndpoint.Host,
			Path:   k8sEndpoint.Path + "/api/v1/namespaces/openshift-config-managed/configmaps",
			RawQuery: url.Values{
				"labelSelector": {"console.openshift.io/dashboard=true"},
			}.Encode(),
		},
		&http.Client{
			Transport: &http.Transport{
				TLSClientConfig: srv.LocalK8sProxyConfig.TLSClientConfig,
			},
		},
		nil,
	)

	srv.KnativeEventSourceCRDLister = server.NewResourceLister(
		srv.ServiceAccountToken,
		&url.URL{
			Scheme: k8sEndpoint.Scheme,
			Host:   k8sEndpoint.Host,
			Path:   k8sEndpoint.Path + "/apis/apiextensions.k8s.io/v1/customresourcedefinitions",
			RawQuery: url.Values{
				"labelSelector": {"duck.knative.dev/source=true"},
			}.Encode(),
		},
		&http.Client{
			Transport: &http.Transport{
				TLSClientConfig: srv.LocalK8sProxyConfig.TLSClientConfig,
			},
		},
		knative.EventSourceFilter,
	)

	srv.KnativeChannelCRDLister = server.NewResourceLister(
		srv.ServiceAccountToken,
		&url.URL{
			Scheme: k8sEndpoint.Scheme,
			Host:   k8sEndpoint.Host,
			Path:   k8sEndpoint.Path + "/apis/apiextensions.k8s.io/v1/customresourcedefinitions",
			RawQuery: url.Values{
				"labelSelector": {"duck.knative.dev/addressable=true,messaging.knative.dev/subscribable=true"},
			}.Encode(),
		},
		&http.Client{
			Transport: &http.Transport{
				TLSClientConfig: srv.LocalK8sProxyConfig.TLSClientConfig,
			},
		},
		knative.ChannelFilter,
	)

	listenURL := bridge.ValidateFlagIsURL("listen", *fListen)
	switch listenURL.Scheme {
	case "http":
	case "https":
		bridge.ValidateFlagNotEmpty("tls-cert-file", *fTlSCertFile)
		bridge.ValidateFlagNotEmpty("tls-key-file", *fTlSKeyFile)
	default:
		bridge.FlagFatalf("listen", "scheme must be one of: http, https")
	}

	httpsrv := &http.Server{
		Addr:    listenURL.Host,
		Handler: srv.HTTPHandler(),
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
