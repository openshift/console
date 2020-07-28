package serverconfig

// This file is a copy of the struct within the console operator:
//   https://github.com/openshift/console-operator/blob/master/pkg/console/subresource/consoleserver/types.go
// These structs need to remain in sync.

// Config is the top-level console server cli configuration.
type Config struct {
	APIVersion     string `yaml:"apiVersion"`
	Kind           string `yaml:"kind"`
	ServingInfo    `yaml:"servingInfo"`
	ClusterInfo    `yaml:"clusterInfo"`
	Auth           `yaml:"auth"`
	Customization  `yaml:"customization"`
	Providers      `yaml:"providers"`
	Helm           `yaml:"helm"`
	MonitoringInfo `yaml:"monitoringInfo,omitempty"`
}

// ServingInfo holds configuration for serving HTTP.
type ServingInfo struct {
	BindAddress  string `yaml:"bindAddress,omitempty"`
	CertFile     string `yaml:"certFile,omitempty"`
	KeyFile      string `yaml:"keyFile,omitempty"`
	RedirectPort int    `yaml:"redirectPort,omitempty"`

	// These fields are defined in `HTTPServingInfo`, but are not supported for console. Fail if any are specified.
	// https://github.com/openshift/api/blob/0cb4131a7636e1ada6b2769edc9118f0fe6844c8/config/v1/types.go#L7-L38
	BindNetwork           string        `yaml:"bindNetwork,omitempty"`
	ClientCA              string        `yaml:"clientCA,omitempty"`
	NamedCertificates     []interface{} `yaml:"namedCertificates,omitempty"`
	MinTLSVersion         string        `yaml:"minTLSVersion,omitempty"`
	CipherSuites          []string      `yaml:"cipherSuites,omitempty"`
	MaxRequestsInFlight   int64         `yaml:"maxRequestsInFlight,omitempty"`
	RequestTimeoutSeconds int64         `yaml:"requestTimeoutSeconds,omitempty"`
}

// Monitoring holds URLs for monitoring related services
type MonitoringInfo struct {
	AlertmanagerPublicURL string `yaml:"alertmanagerPublicURL,omitempty"`
	GrafanaPublicURL      string `yaml:"grafanaPublicURL,omitempty"`
	PrometheusPublicURL   string `yaml:"prometheusPublicURL,omitempty"`
	ThanosPublicURL       string `yaml:"thanosPublicURL,omitempty"`
}

// ClusterInfo holds information the about the cluster such as master public URL and console public URL.
type ClusterInfo struct {
	ConsoleBaseAddress string `yaml:"consoleBaseAddress,omitempty"`
	ConsoleBasePath    string `yaml:"consoleBasePath,omitempty"`
	MasterPublicURL    string `yaml:"masterPublicURL,omitempty"`
}

// Auth holds configuration for authenticating with OpenShift. The auth method is assumed to be "openshift".
type Auth struct {
	ClientID                 string `yaml:"clientID,omitempty"`
	ClientSecretFile         string `yaml:"clientSecretFile,omitempty"`
	OAuthEndpointCAFile      string `yaml:"oauthEndpointCAFile,omitempty"`
	LogoutRedirect           string `yaml:"logoutRedirect,omitempty"`
	InactivityTimeoutSeconds int    `yaml:"inactivityTimeoutSeconds,omitempty"`
}

// Customization holds configuration such as what logo to use.
type Customization struct {
	Branding             string `yaml:"branding,omitempty"`
	DocumentationBaseURL string `yaml:"documentationBaseURL,omitempty"`
	CustomProductName    string `yaml:"customProductName,omitempty"`
	CustomLogoFile       string `yaml:"customLogoFile,omitempty"`
}

type Providers struct {
	StatuspageID string `yaml:"statuspageID,omitempty"`
}

type HelmChartRepo struct {
	URL    string `yaml:"url,omitempty"`
	CAFile string `yaml:"caFile,omitempty"`
}

type Helm struct {
	ChartRepo HelmChartRepo `yaml:"chartRepository"`
}
