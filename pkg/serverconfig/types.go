package serverconfig

import (
	configv1 "github.com/openshift/api/config/v1"
	authorizationv1 "k8s.io/api/authorization/v1"
)

// This file is a copy of the struct within the console operator:
//   https://github.com/openshift/console-operator/blob/master/pkg/console/subresource/consoleserver/types.go
// These structs need to remain in sync.

// Config is the top-level console server cli configuration.
type Config struct {
	APIVersion               string `yaml:"apiVersion"`
	Kind                     string `yaml:"kind"`
	ServingInfo              `yaml:"servingInfo"`
	ClusterInfo              `yaml:"clusterInfo"`
	Auth                     `yaml:"auth"`
	Customization            `yaml:"customization"`
	Providers                `yaml:"providers"`
	Helm                     `yaml:"helm"`
	MonitoringInfo           `yaml:"monitoringInfo,omitempty"`
	Plugins                  MultiKeyValue `yaml:"plugins,omitempty"`
	I18nNamespaces           []string      `yaml:"i18nNamespaces,omitempty"`
	ManagedClusterConfigFile string        `yaml:"managedClusterConfigFile,omitempty"` // TODO remove multicluster
	Proxy                    Proxy         `yaml:"proxy,omitempty"`
	Telemetry                MultiKeyValue `yaml:"telemetry,omitempty"`
}

type Proxy struct {
	Services []ProxyService `yaml:"services,omitempty"`
}

type ProxyService struct {
	Endpoint       string `yaml:"endpoint"`
	ConsoleAPIPath string `yaml:"consoleAPIPath"`
	CACertificate  string `yaml:"caCertificate"`
	Authorize      bool   `yaml:"authorize"`
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

// MonitoringInfo holds URLs and hosts for monitoring related services
type MonitoringInfo struct {
	AlertmanagerTenancyHost      string `yaml:"alertmanagerTenancyHost,omitempty"`
	AlertmanagerUserWorkloadHost string `yaml:"alertmanagerUserWorkloadHost,omitempty"`
	AlertmanagerPublicURL        string `yaml:"alertmanagerPublicURL,omitempty"`
	GrafanaPublicURL             string `yaml:"grafanaPublicURL,omitempty"`
	PrometheusPublicURL          string `yaml:"prometheusPublicURL,omitempty"`
	ThanosPublicURL              string `yaml:"thanosPublicURL,omitempty"`
}

// ClusterInfo holds information the about the cluster such as master public URL and console public URL.
type ClusterInfo struct {
	ConsoleBaseAddress   string                `yaml:"consoleBaseAddress,omitempty"`
	ConsoleBasePath      string                `yaml:"consoleBasePath,omitempty"`
	MasterPublicURL      string                `yaml:"masterPublicURL,omitempty"`
	ControlPlaneTopology configv1.TopologyMode `yaml:"controlPlaneTopology,omitempty"`
	ReleaseVersion       string                `yaml:"releaseVersion,omitempty"`
	NodeArchitectures    []string              `yaml:"nodeArchitectures,omitempty"`
	NodeOperatingSystems []string              `yaml:"nodeOperatingSystems,omitempty"`
	CopiedCSVsDisabled   bool                  `yaml:"copiedCSVsDisabled,omitempty"`
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
	// developerCatalog allows to configure the shown developer catalog categories and it's types.
	DeveloperCatalog DeveloperConsoleCatalogCustomization `yaml:"developerCatalog,omitempty"`
	QuickStarts      QuickStarts                          `yaml:"quickStarts,omitempty"`
	// addPage allows customizing actions on the Add page in developer perspective.
	AddPage       AddPage       `yaml:"addPage,omitempty"`
	ProjectAccess ProjectAccess `yaml:"projectAccess,omitempty"`
	Perspectives  []Perspective `yaml:"perspectives,omitempty"`
}

// QuickStarts contains options for ConsoleQuickStarts resource
type QuickStarts struct {
	Disabled []string `json:"disabled,omitempty" yaml:"disabled,omitempty"`
}

// ProjectAccess contains options for project access roles
type ProjectAccess struct {
	AvailableClusterRoles []string `json:"availableClusterRoles,omitempty" yaml:"availableClusterRoles,omitempty"`
}

// CatalogTypesState defines the state of the catalog types based on which the types will be enabled or disabled.
type CatalogTypesState string

const (
	CatalogTypeEnabled  CatalogTypesState = "Enabled"
	CatalogTypeDisabled CatalogTypesState = "Disabled"
)

// DeveloperConsoleCatalogTypesState defines the state of the sub-catalog types.
type DeveloperConsoleCatalogTypesState struct {
	// state defines if a list of catalog types should be enabled or disabled.
	State CatalogTypesState `json:"state,omitempty" yaml:"state,omitempty"`
	// enabled is a list of developer catalog types (sub-catalogs IDs) that will be shown to users.
	// Types (sub-catalogs) are added via console plugins, the available types (sub-catalog IDs) are available
	// in the console on the cluster configuration page, or when editing the YAML in the console.
	// Example: "Devfile", "HelmChart", "BuilderImage"
	// If the list is non-empty, a new type will not be shown to the user until it is added to list.
	// If the list is empty the complete developer catalog will be shown.
	Enabled *[]string `json:"enabled,omitempty" yaml:"enabled,omitempty"`
	// disabled is a list of developer catalog types (sub-catalogs IDs) that are not shown to users.
	// Types (sub-catalogs) are added via console plugins, the available types (sub-catalog IDs) are available
	// in the console on the cluster configuration page, or when editing the YAML in the console.
	// Example: "Devfile", "HelmChart", "BuilderImage"
	// If the list is empty or all the available sub-catalog types are added, then the complete developer catalog should be hidden.
	Disabled *[]string `json:"disabled,omitempty" yaml:"disabled,omitempty"`
}

// DeveloperConsoleCatalogCustomization allow cluster admin to configure developer catalog.
type DeveloperConsoleCatalogCustomization struct {
	// categories which are shown the in developer catalog.
	Categories []DeveloperConsoleCatalogCategory `json:"categories,omitempty" yaml:"categories,omitempty"`
	// types allows enabling or disabling of sub-catalog types that user can see in the Developer catalog.
	// When omitted, all the sub-catalog types will be shown.
	Types DeveloperConsoleCatalogTypesState `json:"types,omitempty" yaml:"types,omitempty"`
}

// DeveloperConsoleCatalogCategoryMeta are the key identifiers of a developer catalog category.
type DeveloperConsoleCatalogCategoryMeta struct {
	// ID is an identifier used in the URL to enable deep linking in console.
	// ID is required and must have 1-32 URL safe (A-Z, a-z, 0-9, - and _) characters.
	ID string `json:"id" yaml:"id"`
	// label defines a category display label. It is required and must have 1-64 characters.
	Label string `json:"label" yaml:"label"`
	// tags is a list of strings that will match the category. A selected category
	// show all items which has at least one overlapping tag between category and item.
	Tags []string `json:"tags,omitempty" yaml:"tags,omitempty"`
}

// DeveloperConsoleCatalogCategory for the developer console catalog.
type DeveloperConsoleCatalogCategory struct {
	// defines top level category ID, label and filter tags.
	DeveloperConsoleCatalogCategoryMeta `json:",inline" yaml:",inline"`
	// subcategories defines a list of child categories.
	Subcategories []DeveloperConsoleCatalogCategoryMeta `json:"subcategories,omitempty" yaml:"subcategories,omitempty"`
}

// AddPage allows customizing actions on the Add page in developer perspective.
type AddPage struct {
	// disabledActions is a list of actions that are not shown to users.
	// Each action in the list is represented by its ID.
	DisabledActions []string `json:"disabledActions,omitempty" yaml:"disabledActions,omitempty"`
}

// PerspectiveState defines the visibility state of the perspective. "Enabled" means the perspective is shown.
// "Disabled" means the Perspective is hidden.
// "AccessReview" means access review check is required to show or hide a Perspective.
type PerspectiveState string

const (
	PerspectiveEnabled      PerspectiveState = "Enabled"
	PerspectiveDisabled     PerspectiveState = "Disabled"
	PerspectiveAccessReview PerspectiveState = "AccessReview"
)

// ResourceAttributesAccessReview defines the visibility of the perspective depending on the access review checks.
// `required` and  `missing` can work together esp. in the case where the cluster admin
// wants to show another perspective to users without specific permissions. Out of `required` and `missing` atleast one property should be non-empty.
type ResourceAttributesAccessReview struct {
	// required defines a list of permission checks. The perspective will only be shown when all checks are successful. When omitted, the access review is skipped and the perspective will not be shown unless it is required to do so based on the configuration of the missing access review list.
	Required []authorizationv1.ResourceAttributes `json:"required" yaml:"required"`
	// missing defines a list of permission checks. The perspective will only be shown when at least one check fails. When omitted, the access review is skipped and the perspective will not be shown unless it is required to do so based on the configuration of the required access review list.
	Missing []authorizationv1.ResourceAttributes `json:"missing" yaml:"missing"`
}

// PerspectiveVisibility defines the criteria to show/hide a perspective.
type PerspectiveVisibility struct {
	// state defines the perspective is enabled or disabled or access review check is required.
	State PerspectiveState `json:"state" yaml:"state"`
	// accessReview defines required and missing access review checks.
	AccessReview *ResourceAttributesAccessReview `json:"accessReview,omitempty" yaml:"accessReview,omitempty"`
}

// Perspective defines a perspective that cluster admins want to show/hide in the perspective switcher dropdown
type Perspective struct {
	// id defines the id of the perspective.
	// Example: "dev", "admin".
	// The available perspective ids can be found in the code snippet section next to the yaml editor.
	// Incorrect or unknown ids will be ignored.
	ID string `json:"id" yaml:"id"`
	// visibility defines the state of perspective along with access review checks if needed for that perspective.
	Visibility PerspectiveVisibility `json:"visibility" yaml:"visibility"`
	// pinnedResources defines the list of default pinned resources that users will see on the perspective navigation if they have not customized these pinned resources themselves.
	// The list of available Kubernetes resources could be read via `kubectl api-resources`.
	// The console will also provide a configuration UI and a YAML snippet that will list the available resources that can be pinned to the navigation.
	// Incorrect or unknown resources will be ignored.
	PinnedResources *[]PinnedResourceReference `json:"pinnedResources,omitempty" yaml:"pinnedResources,omitempty"`
}

// PinnedResourceReference includes the group, version and type of resource
type PinnedResourceReference struct {
	// group is the API Group of the Resource.
	// Enter empty string for the core group.
	// This value should consist of only lowercase alphanumeric characters, hyphens and periods.
	// Example: "", "apps", "build.openshift.io", etc.
	Group string `json:"group" yaml:"group"`
	// version is the API Version of the Resource.
	// This value should consist of only lowercase alphanumeric characters.
	// Example: "v1", "v1beta1", etc.
	Version string `json:"version" yaml:"version"`
	// resource is the type that is being referenced.
	// It is normally the plural form of the resource kind in lowercase.
	// This value should consist of only lowercase alphanumeric characters and hyphens.
	// Example: "deployments", "deploymentconfigs", "pods", etc.
	Resource string `json:"resource" yaml:"resource"`
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

// TODO Remove this type once the console operator has been updated. It is obsolete now that we are using the MCE cluster proxy.
// TODO remove multicluster
type ManagedClusterAPIServerConfig struct {
	URL    string `json:"url" yaml:"url"`
	CAFile string `json:"caFile" yaml:"caFile"`
}

// ManagedClusterOauthConfig enables proxying managed cluster auth
// TODO remove multicluster
type ManagedClusterOAuthConfig struct {
	ClientID     string `json:"clientID" yaml:"clientID"`
	ClientSecret string `json:"clientSecret" yaml:"clientSecret"`
	CAFile       string `json:"caFile" yaml:"caFile"`
}

// ManagedClusterConfig enables proxying to an ACM managed cluster
// TODO remove multicluster
type ManagedClusterConfig struct {
	Name      string                        `json:"name" yaml:"name"`           // ManagedCluster name, provided through ACM
	APIServer ManagedClusterAPIServerConfig `json:"apiServer" yaml:"apiServer"` // TODO Remove this property once conosle operator has been updated
	OAuth     ManagedClusterOAuthConfig     `json:"oauth" yaml:"oauth"`
}
