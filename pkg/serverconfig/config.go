package serverconfig

import (
	"errors"
	"flag"
	"fmt"
	"io/ioutil"
	"strconv"

	"gopkg.in/yaml.v2"
)

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
	// Assume "openshift" if config file is used.
	fs.Set("k8s-auth", "openshift")
	fs.Set("user-auth", "openshift")

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
}
