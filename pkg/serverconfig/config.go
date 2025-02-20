package serverconfig

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io/ioutil"
	"sort"
	"strconv"
	"strings"

	"github.com/coreos/pkg/flagutil"
	"gopkg.in/yaml.v2"
	"k8s.io/klog/v2"

	consolev1 "github.com/openshift/api/console/v1"
)

// MultiKeyValue is used for setting multiple key-value entries of a specific flag, eg.:
// ... --plugins plugin-name=plugin-endpoint plugin-name2=plugin-endpoint2
type MultiKeyValue map[string]string

func (mkv *MultiKeyValue) String() string {
	keyValuePairs := []string{}
	for k, v := range *mkv {
		keyValuePairs = append(keyValuePairs, fmt.Sprintf("%s=%s", k, v))
	}
	sort.Strings(keyValuePairs)
	return strings.Join(keyValuePairs, ", ")
}

func (mkv *MultiKeyValue) Set(value string) error {
	keyValuePairs := strings.Split(value, ",")
	for _, keyValuePair := range keyValuePairs {
		keyValuePair = strings.TrimSpace(keyValuePair)
		if len(keyValuePair) == 0 {
			continue
		}
		splitted := strings.SplitN(keyValuePair, "=", 2)
		if len(splitted) != 2 {
			return fmt.Errorf("invalid key value pair %s", keyValuePair)
		}
		(*mkv)[splitted[0]] = splitted[1]
	}
	return nil
}

// Parse configuration from
// 1. Config file
// 2. Environment variables (overrides config file)
// 3. Commandline arguments (overrides config file and environment varibles)
//
// Because the config filename could be defined as commandline argument or
// environment variable, we need to parse these inputs before reading the
// config file and need to override the config values after this again.
func Parse(fs *flag.FlagSet, args []string, envPrefix string) (*Config, error) {
	if err := flagutil.SetFlagsFromEnv(fs, envPrefix); err != nil {
		return nil, err
	}
	if err := fs.Parse(args); err != nil {
		return nil, err
	}

	cfg := &Config{}
	configFile := fs.Lookup("config").Value.String()
	if configFile != "" {
		var err error
		cfg, err = SetFlagsFromConfigFile(fs, configFile)
		if err != nil {
			klog.Fatalf("Failed to load config: %v", err)
			return nil, err
		}
		if err := flagutil.SetFlagsFromEnv(fs, envPrefix); err != nil {
			return nil, err
		}
		if err := fs.Parse(args); err != nil {
			return nil, err
		}
	}

	return cfg, nil
}

// SetFlagsFromConfigFile sets flag values based on a YAML config file.
func SetFlagsFromConfigFile(fs *flag.FlagSet, filename string) (*Config, error) {
	content, err := ioutil.ReadFile(filename)
	if err != nil {
		return nil, err
	}

	config := &Config{}
	err = yaml.Unmarshal(content, config)
	if err != nil {
		return nil, err
	}

	if err := SetFlagsFromConfig(fs, config); err != nil {
		return nil, err
	}

	return config, nil
}

// SetFlagsFromConfig sets flag values based on a YAML config.
func SetFlagsFromConfig(fs *flag.FlagSet, config *Config) (err error) {
	if !(config.APIVersion == "console.openshift.io/v1beta1" || config.APIVersion == "console.openshift.io/v1") || config.Kind != "ConsoleConfig" {
		return fmt.Errorf("unsupported version (apiVersion: %s, kind: %s), only console.openshift.io/v1 ConsoleConfig is supported", config.APIVersion, config.Kind)
	}

	err = addServingInfo(fs, &config.ServingInfo)
	if err != nil {
		return err
	}

	addClusterInfo(fs, &config.ClusterInfo)
	addCustomization(fs, &config.Customization)
	addProviders(fs, &config.Providers)
	addMonitoringInfo(fs, &config.MonitoringInfo)
	addHelmConfig(fs, &config.Helm)
	addPlugins(fs, config.Plugins)
	addI18nNamespaces(fs, config.I18nNamespaces)
	err = addProxy(fs, &config.Proxy)
	if err != nil {
		return err
	}
	addContentSecurityPolicyEnabled(fs, &config.ContentSecurityPolicyEnabled)
	addContentSecurityPolicy(fs, config.ContentSecurityPolicy)
	addTelemetry(fs, config.Telemetry)

	return nil
}

func addProxy(fs *flag.FlagSet, proxyConfig *Proxy) error {
	if proxyConfig != nil {
		marshaledProxyConfig, err := json.Marshal(proxyConfig)
		if err != nil {
			klog.Fatalf("Could not marshal ConsoleConfig 'proxy' field: %v", err)
			return err
		}
		fs.Set("plugin-proxy", string(marshaledProxyConfig))
	}
	return nil
}

func addHelmConfig(fs *flag.FlagSet, helmConfig *Helm) (err error) {
	if helmConfig.ChartRepo.URL != "" {
		fs.Set("helm-chart-repo-url", helmConfig.ChartRepo.URL)
	}
	if helmConfig.ChartRepo.CAFile != "" {
		fs.Set("helm-chart-repo-ca-file", helmConfig.ChartRepo.CAFile)
	}
	return nil
}

func addServingInfo(fs *flag.FlagSet, servingInfo *ServingInfo) (err error) {
	if servingInfo.BindAddress != "" {
		fs.Set("listen", servingInfo.BindAddress)
	}

	if servingInfo.CertFile != "" {
		fs.Set("tls-cert-file", servingInfo.CertFile)
	}

	if servingInfo.KeyFile != "" {
		fs.Set("tls-key-file", servingInfo.KeyFile)
	}

	if servingInfo.RedirectPort != 0 {
		fs.Set("redirect-port", strconv.Itoa(servingInfo.RedirectPort))
	}

	// Test for fields specified in HTTPServingInfo that we don't currently support in the console.
	if servingInfo.BindNetwork != "" {
		return errors.New("servingInfo.bindNetwork is not supported")
	}

	if servingInfo.ClientCA != "" {
		return errors.New("servingInfo.clientCA is not supported")
	}

	if len(servingInfo.NamedCertificates) > 0 {
		return errors.New("servingInfo.namedCertificates are not supported")
	}

	if servingInfo.MinTLSVersion != "" {
		return errors.New("servingInfo.minTLSVersion is not supported")
	}

	if len(servingInfo.CipherSuites) > 0 {
		return errors.New("servingInfo.cipherSuites is not supported")
	}

	if servingInfo.MaxRequestsInFlight != 0 {
		return errors.New("servingInfo.maxRequestsInFlight is not supported")
	}

	if servingInfo.RequestTimeoutSeconds != 0 {
		return errors.New("servingInfo.requestTimeoutSeconds is not supported")
	}

	return nil
}

func addClusterInfo(fs *flag.FlagSet, clusterInfo *ClusterInfo) {
	if clusterInfo.ConsoleBaseAddress != "" {
		fs.Set("base-address", clusterInfo.ConsoleBaseAddress)
	}

	if clusterInfo.ConsoleBasePath != "" {
		fs.Set("base-path", clusterInfo.ConsoleBasePath)
	}

	if clusterInfo.MasterPublicURL != "" {
		fs.Set("k8s-public-endpoint", clusterInfo.MasterPublicURL)
	}

	if clusterInfo.ControlPlaneTopology != "" {
		fs.Set("control-plane-topology-mode", string(clusterInfo.ControlPlaneTopology))
	}

	if clusterInfo.ReleaseVersion != "" {
		fs.Set("release-version", string(clusterInfo.ReleaseVersion))
	}

	if len(clusterInfo.NodeArchitectures) > 0 {
		fs.Set("node-architectures", strings.Join(clusterInfo.NodeArchitectures, ","))
	}

	if len(clusterInfo.NodeOperatingSystems) > 0 {
		fs.Set("node-operating-systems", strings.Join(clusterInfo.NodeOperatingSystems, ","))
	}

	if clusterInfo.CopiedCSVsDisabled {
		fs.Set("copied-csvs-disabled", "true")
	}
}

func addProviders(fs *flag.FlagSet, providers *Providers) {
	if providers.StatuspageID != "" {
		fs.Set("statuspage-id", providers.StatuspageID)
	}
}

func addMonitoringInfo(fs *flag.FlagSet, monitoring *MonitoringInfo) {
	if monitoring.AlertmanagerPublicURL != "" {
		fs.Set("alermanager-public-url", monitoring.AlertmanagerPublicURL)
	}
	if monitoring.GrafanaPublicURL != "" {
		fs.Set("grafana-public-url", monitoring.GrafanaPublicURL)
	}
	if monitoring.PrometheusPublicURL != "" {
		fs.Set("prometheus-public-url", monitoring.PrometheusPublicURL)
	}
	if monitoring.ThanosPublicURL != "" {
		fs.Set("thanos-public-url", monitoring.ThanosPublicURL)
	}
	if monitoring.AlertmanagerUserWorkloadHost != "" {
		fs.Set("alermanager-user-workload-host", monitoring.AlertmanagerUserWorkloadHost)
	}
	if monitoring.AlertmanagerTenancyHost != "" {
		fs.Set("alermanager-tenancy-host", monitoring.AlertmanagerTenancyHost)
	}
}

func addCustomization(fs *flag.FlagSet, customization *Customization) {
	if customization.Branding != "" {
		fs.Set("branding", customization.Branding)
	}

	if customization.DocumentationBaseURL != "" {
		fs.Set("documentation-base-url", customization.DocumentationBaseURL)
	}

	if customization.CustomProductName != "" {
		fs.Set("custom-product-name", customization.CustomProductName)
	}

	if customization.CustomLogoFile != "" {
		fs.Set("custom-logo-file", customization.CustomLogoFile)
	}

	if customization.DeveloperCatalog.Categories != nil {
		categories, err := json.Marshal(customization.DeveloperCatalog.Categories)
		if err == nil {
			fs.Set("developer-catalog-categories", string(categories))
		} else {
			klog.Fatalf("Could not marshal ConsoleConfig customization.developerCatalog.categories field: %v", err)
		}
	}

	if (customization.DeveloperCatalog.Types != DeveloperConsoleCatalogTypesState{}) {
		types, err := json.Marshal(customization.DeveloperCatalog.Types)
		if err == nil {
			fs.Set("developer-catalog-types", string(types))
		} else {
			klog.Fatalf("Could not marshal ConsoleConfig customization.developerCatalog.types field: %v", err)
		}
	}

	if customization.QuickStarts.Disabled != nil {
		quickStarts, err := json.Marshal(customization.QuickStarts)
		if err == nil {
			fs.Set("quick-starts", string(quickStarts))
		} else {
			klog.Fatalf("Could not marshal ConsoleConfig customization.quickStarts field: %v", err)
		}
	}

	addPage, err := json.Marshal(customization.AddPage)
	if err == nil {
		fs.Set("add-page", string(addPage))
	} else {
		klog.Fatalf("Could not marshal ConsoleConfig customization.addPage field: %v", err)
	}

	if customization.ProjectAccess.AvailableClusterRoles != nil {
		projectAccessClusterRoles, err := json.Marshal(customization.ProjectAccess.AvailableClusterRoles)
		if err != nil {
			klog.Fatalf("Could not marshal ConsoleConfig customization.projectAccess field: %v", err)
		} else {
			fs.Set("project-access-cluster-roles", string(projectAccessClusterRoles))
		}
	}

	if customization.CustomLogoFiles != nil {
		customLogos, err := json.Marshal(customization.CustomLogoFiles)
		if err != nil {
			klog.Fatalf("Could not marshal ConsoleConfig customization.customLogoFiles field: %v", err)
		} else {
			fs.Set("custom-logo-files", string(customLogos))
		}
	}

	if customization.Perspectives != nil {
		perspectives, err := json.Marshal(customization.Perspectives)
		if err != nil {
			klog.Fatalf("Could not marshal ConsoleConfig customization.perspectives field: %v", err)
		} else {
			fs.Set("perspectives", string(perspectives))
		}
	}

	if customization.Capabilities != nil {
		capabilities, err := json.Marshal(customization.Capabilities)
		if err != nil {
			klog.Fatalf("Could not marshal ConsoleConfig customization.capabilities field: %v", err)
		} else {
			fs.Set("capabilities", string(capabilities))
		}
	}
}

func isAlreadySet(fs *flag.FlagSet, name string) bool {
	alreadySet := false
	fs.Visit(func(f *flag.Flag) {
		if f.Name == name {
			alreadySet = true
		}
	})
	return alreadySet
}

func addPlugins(fs *flag.FlagSet, plugins MultiKeyValue) {
	for pluginName, pluginEndpoint := range plugins {
		fs.Set("plugins", fmt.Sprintf("%s=%s", pluginName, pluginEndpoint))
	}
}

func addTelemetry(fs *flag.FlagSet, telemetry MultiKeyValue) {
	for key, value := range telemetry {
		fs.Set("telemetry", fmt.Sprintf("%s=%s", key, value))
	}
}

func addI18nNamespaces(fs *flag.FlagSet, i18nNamespaces []string) {
	fs.Set("i18n-namespaces", strings.Join(i18nNamespaces, ","))
}

func addContentSecurityPolicy(fs *flag.FlagSet, csp map[consolev1.DirectiveType][]string) error {
	if csp != nil {
		marshaledCSP, err := json.Marshal(csp)
		if err != nil {
			klog.Fatalf("Could not marshal ConsoleConfig 'content-security-policy' field: %v", err)
			return err
		}
		fs.Set("content-security-policy", string(marshaledCSP))
	}
	return nil
}

func addContentSecurityPolicyEnabled(fs *flag.FlagSet, enabled *bool) {
	if enabled != nil && *enabled {
		fs.Set("content-security-policy-enabled", "true")
	}
}

func SetIfUnset(flagVal *string, val string) {
	if len(*flagVal) == 0 {
		*flagVal = val
	}
}
