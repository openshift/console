package main

import (
	"errors"
	"flag"
	"fmt"
	"io/ioutil"

	"gopkg.in/yaml.v2"
)

// Config is the top-level console configuration.
type Config struct {
	APIVersion    string `yaml:"apiVersion"`
	Kind          string `yaml:"kind"`
	ServingInfo   `yaml:"servingInfo"`
	ClusterInfo   `yaml:"clusterInfo"`
	Auth          `yaml:"auth"`
	Customization `yaml:"customization"`
}

// ServingInfo holds configuration for serving HTTP.
type ServingInfo struct {
	BindAddress string `yaml:"bindAddress"`
	CertFile    string `yaml:"certFile"`
	KeyFile     string `yaml:"keyFile"`

	// These fields are defined in `HTTPServingInfo`, but are not supported for console. Fail if any are specified.
	// https://github.com/openshift/api/blob/0cb4131a7636e1ada6b2769edc9118f0fe6844c8/config/v1/types.go#L7-L38
	BindNetwork           string        `yaml:"bindNetwork"`
	ClientCA              string        `yaml:"clientCA"`
	NamedCertificates     []interface{} `yaml:"namedCertificates"`
	MinTLSVersion         string        `yaml:"minTLSVersion"`
	CipherSuites          []string      `yaml:"cipherSuites"`
	MaxRequestsInFlight   int64         `yaml:"maxRequestsInFlight"`
	RequestTimeoutSeconds int64         `yaml:"requestTimeoutSeconds"`
}

// ClusterInfo holds information the about the cluster such as master public URL and console public URL.
type ClusterInfo struct {
	ConsoleBaseAddress string `yaml:"consoleBaseAddress"`
	ConsoleBasePath    string `yaml:"consoleBasePath"`
	MasterPublicURL    string `yaml:"masterPublicURL"`
	// DeveloperPublicConsoleURL is an optional URL of the developer console. If specified, a context switcher is
	// added to the masthead with a link to the developer console. This option will be removed in a future release.
	DeveloperPublicConsoleURL string `yaml:"developerConsolePublicURL"`
}

// Auth holds configuration for authenticating with OpenShift. The auth method is assumed to be "openshift".
type Auth struct {
	ClientID            string `yaml:"clientID"`
	ClientSecretFile    string `yaml:"clientSecretFile"`
	OAuthEndpointCAFile string `yaml:"oauthEndpointCAFile"`
	LogoutRedirect      string `yaml:"logoutRedirect"`
}

// Customization holds configuration such as what logo to use.
type Customization struct {
	Branding             string `yaml:"branding"`
	DocumentationBaseURL string `yaml:"documentationBaseURL"`
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

	if config.APIVersion != "console.openshift.io/v1beta1" || config.Kind != "ConsoleConfig" {
		return fmt.Errorf("unsupported version (apiVersion: %s, kind: %s), only console.openshift.io/v1beta1 ConsoleConfig is supported", config.APIVersion, config.Kind)
	}

	err = addServingInfo(fs, &config.ServingInfo)
	if err != nil {
		return err
	}

	addClusterInfo(fs, &config.ClusterInfo)
	addAuth(fs, &config.Auth)
	addCustomization(fs, &config.Customization)

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

	if clusterInfo.DeveloperPublicConsoleURL != "" {
		fs.Set("developer-console-url", clusterInfo.DeveloperPublicConsoleURL)
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
}

func addCustomization(fs *flag.FlagSet, customization *Customization) {
	if customization.Branding != "" {
		fs.Set("branding", customization.Branding)
	}

	if customization.DocumentationBaseURL != "" {
		fs.Set("documentation-base-url", customization.DocumentationBaseURL)
	}
}
