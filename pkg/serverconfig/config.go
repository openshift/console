package serverconfig

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io/ioutil"
	"strconv"
	"strings"

	"github.com/coreos/pkg/flagutil"
	"gopkg.in/yaml.v2"
	"k8s.io/klog"
)

// MultiKeyValue is used for setting multiple key-value entries of a specific flag, eg.:
// ... --plugins plugin-name=plugin-endpoint plugin-name2=plugin-endpoint2
type MultiKeyValue map[string]string

func (mkv *MultiKeyValue) String() string {
	return fmt.Sprint(*mkv)
}

func (mkv *MultiKeyValue) Set(value string) error {
	kv := strings.SplitN(value, "=", 2)
	if len(kv) != 2 {
		return fmt.Errorf("invalid value string %s", value)
	}
	emap := *mkv
	emap[kv[0]] = kv[1]
	return nil
}

func (mkv *MultiKeyValue) ToMap() map[string]string {
	return map[string]string(*mkv)
}

// Parse configuration from
// 1. Config file
// 2. Environment variables (overrides config file)
// 3. Commandline arguments (overrides config file and environment varibles)
//
// Because the config filename could be defined as commandline argument or
// environment variable, we need to parse these inputs before reading the
// config file and need to override the config values after this again.
func Parse(fs *flag.FlagSet, args []string, envPrefix string) error {
	if err := flagutil.SetFlagsFromEnv(fs, envPrefix); err != nil {
		return err
	}
	if err := fs.Parse(args); err != nil {
		return err
	}

	configFile := fs.Lookup("config").Value.String()

	if configFile != "" {
		if err := SetFlagsFromConfig(fs, configFile); err != nil {
			klog.Fatalf("Failed to load config: %v", err)
			return err
		}
		if err := flagutil.SetFlagsFromEnv(fs, envPrefix); err != nil {
			return err
		}
		if err := fs.Parse(args); err != nil {
			return err
		}
	}

	return nil
}

// SetFlagsFromConfig sets flag values based on a YAML config file.
func SetFlagsFromConfig(fs *flag.FlagSet, filename string) (err error) {
	content, err := ioutil.ReadFile(filename)
	if err != nil {
		return err
	}

	config := Config{}
	err = yaml.Unmarshal(content, &config)
	if err != nil {
		return err
	}

	if !(config.APIVersion == "console.openshift.io/v1beta1" || config.APIVersion == "console.openshift.io/v1") || config.Kind != "ConsoleConfig" {
		return fmt.Errorf("unsupported version (apiVersion: %s, kind: %s), only console.openshift.io/v1 ConsoleConfig is supported", config.APIVersion, config.Kind)
	}

	err = addServingInfo(fs, &config.ServingInfo)
	if err != nil {
		return err
	}

	addClusterInfo(fs, &config.ClusterInfo)
	addAuth(fs, &config.Auth)
	addCustomization(fs, &config.Customization)
	addProviders(fs, &config.Providers)
	addMonitoringInfo(fs, &config.MonitoringInfo)
	addHelmConfig(fs, &config.Helm)
	addPlugins(fs, config.Plugins)

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
}

func addAuth(fs *flag.FlagSet, auth *Auth) {
	// Assume "openshift" if config file is used and it is not set already
	// by a command-line argument or environment variable.
	if !isAlreadySet(fs, "k8s-auth") {
		fs.Set("k8s-auth", "openshift")
	}
	if !isAlreadySet(fs, "user-auth") {
		fs.Set("user-auth", "openshift")
	}

	if auth.ClientID != "" {
		fs.Set("user-auth-oidc-client-id", auth.ClientID)
	}

	if auth.ClientSecretFile != "" {
		fs.Set("user-auth-oidc-client-secret-file", auth.ClientSecretFile)
	}

	if auth.OAuthEndpointCAFile != "" {
		fs.Set("user-auth-oidc-ca-file", auth.OAuthEndpointCAFile)
	}

	if auth.LogoutRedirect != "" {
		fs.Set("user-auth-logout-redirect", auth.LogoutRedirect)
	}

	if auth.InactivityTimeoutSeconds != 0 {
		fs.Set("inactivity-timeout", strconv.Itoa(auth.InactivityTimeoutSeconds))
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

func addPlugins(fs *flag.FlagSet, plugins map[string]string) {
	for pluginName, pluginEndpoint := range plugins {
		fs.Set("plugins", fmt.Sprintf("%s=%s", pluginName, pluginEndpoint))
	}
}
