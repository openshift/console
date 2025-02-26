package v1

import (
	configv1 "github.com/openshift/api/config/v1"
	authorizationv1 "k8s.io/api/authorization/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// +genclient
// +genclient:nonNamespaced
// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
// +kubebuilder:object:root=true
// +kubebuilder:resource:path=consoles,scope=Cluster
// +kubebuilder:subresource:status
// +openshift:api-approved.openshift.io=https://github.com/openshift/api/pull/486
// +openshift:file-pattern=cvoRunLevel=0000_50,operatorName=console,operatorOrdering=01

// Console provides a means to configure an operator to manage the console.
//
// Compatibility level 1: Stable within a major release for a minimum of 12 months or 3 minor releases (whichever is longer).
// +openshift:compatibility-gen:level=1
type Console struct {
	metav1.TypeMeta `json:",inline"`

	// metadata is the standard object's metadata.
	// More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
	metav1.ObjectMeta `json:"metadata,omitempty"`

	// +required
	Spec ConsoleSpec `json:"spec,omitempty"`
	// +optional
	Status ConsoleStatus `json:"status,omitempty"`
}

// ConsoleSpec is the specification of the desired behavior of the Console.
type ConsoleSpec struct {
	OperatorSpec `json:",inline"`
	// customization is used to optionally provide a small set of
	// customization options to the web console.
	// +optional
	Customization ConsoleCustomization `json:"customization"`
	// providers contains configuration for using specific service providers.
	Providers ConsoleProviders `json:"providers"`
	// route contains hostname and secret reference that contains the serving certificate.
	// If a custom route is specified, a new route will be created with the
	// provided hostname, under which console will be available.
	// In case of custom hostname uses the default routing suffix of the cluster,
	// the Secret specification for a serving certificate will not be needed.
	// In case of custom hostname points to an arbitrary domain, manual DNS configurations steps are necessary.
	// The default console route will be maintained to reserve the default hostname
	// for console if the custom route is removed.
	// If not specified, default route will be used.
	// DEPRECATED
	// +optional
	Route ConsoleConfigRoute `json:"route"`
	// plugins defines a list of enabled console plugin names.
	// +optional
	Plugins []string `json:"plugins,omitempty"`
	// ingress allows to configure the alternative ingress for the console.
	// This field is intended for clusters without ingress capability,
	// where access to routes is not possible.
	// +optional
	Ingress Ingress `json:"ingress"`
}

// ConsoleConfigRoute holds information on external route access to console.
// DEPRECATED
type ConsoleConfigRoute struct {
	// hostname is the desired custom domain under which console will be available.
	Hostname string `json:"hostname"`
	// secret points to secret in the openshift-config namespace that contains custom
	// certificate and key and needs to be created manually by the cluster admin.
	// Referenced Secret is required to contain following key value pairs:
	// - "tls.crt" - to specifies custom certificate
	// - "tls.key" - to specifies private key of the custom certificate
	// If the custom hostname uses the default routing suffix of the cluster,
	// the Secret specification for a serving certificate will not be needed.
	// +optional
	Secret configv1.SecretNameReference `json:"secret"`
}

// ConsoleStatus defines the observed status of the Console.
type ConsoleStatus struct {
	OperatorStatus `json:",inline"`
}

// ConsoleProviders defines a list of optional additional providers of
// functionality to the console.
type ConsoleProviders struct {
	// statuspage contains ID for statuspage.io page that provides status info about.
	// +optional
	Statuspage *StatuspageProvider `json:"statuspage,omitempty"`
}

// StatuspageProvider provides identity for statuspage account.
type StatuspageProvider struct {
	// pageID is the unique ID assigned by Statuspage for your page. This must be a public page.
	PageID string `json:"pageID"`
}

// ConsoleCapabilityName defines name of UI capability in the console UI.
type ConsoleCapabilityName string

const (
	// lightspeedButton is the name for the Lightspeed button HTML element.
	LightspeedButton ConsoleCapabilityName = "LightspeedButton"

	// gettingStartedBanner is the name of the 'Getting started resources' banner in the console UI Overview page.
	GettingStartedBanner ConsoleCapabilityName = "GettingStartedBanner"
)

// CapabilityState defines the state of the capability in the console UI.
type CapabilityState string

const (
	// "Enabled" means that the capability will be rendered in the console UI.
	CapabilityEnabled CapabilityState = "Enabled"
	// "Disabled" means that the capability will not be rendered in the console UI.
	CapabilityDisabled CapabilityState = "Disabled"
)

// CapabilityVisibility defines the criteria to enable/disable a capability.
// +union
type CapabilityVisibility struct {
	// state defines if the capability is enabled or disabled in the console UI.
	// Enabling the capability in the console UI is represented by the "Enabled" value.
	// Disabling the capability in the console UI is represented by the "Disabled" value.
	// +unionDiscriminator
	// +kubebuilder:validation:Enum:="Enabled";"Disabled"
	// +required
	State CapabilityState `json:"state"`
}

// Capabilities contains set of UI capabilities and their state in the console UI.
type Capability struct {
	// name is the unique name of a capability.
	// Available capabilities are LightspeedButton and GettingStartedBanner.
	// +kubebuilder:validation:Enum:="LightspeedButton";"GettingStartedBanner"
	// +required
	Name ConsoleCapabilityName `json:"name"`
	// visibility defines the visibility state of the capability.
	// +required
	Visibility CapabilityVisibility `json:"visibility"`
}

// ThemeType is the value of the CustomLogo Theme Type field that determines the theme mode in the console UI.
type ThemeType string

// ThemeType values
const (
	// ThemeTypeDark represents the dark theme for the console UI.
	ThemeTypeDark ThemeType = "Dark"

	// ThemeTypeLight represents the light theme for the console UI.
	ThemeTypeLight ThemeType = "Light"

	// ThemeTypeDefault represents the default theme for all unspecified themes.
	ThemeTypeDefault ThemeType = "Default"
)

// LogoType is the value of the CustomLogo Type field that determines if the logo is for the masthead or the favicon in the console UI.
type LogoType string

const (
	// Masthead represents the logo in the masthead.
	LogoTypeMasthead LogoType = "Masthead"

	// Favicon represents the favicon logo.
	LogoTypeFavicon LogoType = "Favicon"
)

// Theme defines a theme type for the console UI.
type Theme struct {
	// type is a required field that specifies the type of the logo for the console UI.
	// This field is an enum with valid values "Dark", "Light" and "Default".
	// The type determines whether the logo is for the dark, light or default theme.
	// When set to "Dark", the corresponding logo for the dark theme will be used in the console UI.
	// When set to "Light", the corresponding logo for the light theme will be used in the console UI.
	// When set to "Default", the corresponding logo will be used for any unspecified theme(s) in the console UI.
	// If only the dark or light theme is specified, the default OCP logo will be used for the unspecified theme.
	// +kubebuilder:validation:Enum="Dark";"Light";"Default"
	// +required
	Type ThemeType `json:"type"`

	// file is a required field that references a specific file within a ConfigMap in the openshift-config namespace.
	// This field allows the console to locate and use the specified file containing a custom logo.
	// You can create it with a command like:
	// - 'oc create configmap custom-logos-config --namespace=openshift-config --from-file=/path/to/file'
	// The ConfigMap key must include the file extension for the dark or light or default theme so that the console serves the file with the correct MIME type.
	// Recommended Masthead and About Modal logo specifications:
	// Image size must be less than 1 MB due to constraints on the ConfigMap size.
	// Dimensions: Max height of 60px and max width of 200px.
	// SVG format preferred.
	// Recommended Favicon specifications:
	// Dimensions: Max height of 16px and max width of 16px
	// PNG format preferred.
	// +required
	File configv1.ConfigMapFileReference `json:"file"`
}

// CustomLogo defines a configuration based on theme types for the console UI logo.
type CustomLogo struct {
	// type is a required field that specifies the type of the logo for the console UI. It determines whether the logo is for the masthead or favicon.
	// Valid values are "Masthead" and "Favicon".
	// When set to "Masthead", the logo will be used in the masthead or about modal of the console UI.
	// When set to "Favicon", the logo will be used as the favicon of the console UI.
	// +kubebuilder:validation:Enum="Masthead";"Favicon"
	// +required
	Type LogoType `json:"type"`

	// themes is a required field that specifies the themes for the console UI logo.
	// This field is a list of themes, each with a Type.
	// Each theme determines whether the logo is for the dark or light or default theme of the console UI.
	// Each item in the list must have a unique Type.
	// When specified, there must be at least one entry and no more than 3 entries.
	// +kubebuilder:validation:MinItems=1
	// +kubebuilder:validation:MaxItems=3
	// +listType=map
	// +listMapKey=type
	// +required
	Themes []Theme `json:"themes"`
}

// ConsoleCustomization defines a list of optional configuration for the console UI.
type ConsoleCustomization struct {
	// customLogos is an optional field that can be used to replace the OpenShift Masthead and Favicon logos in the console UI with custom logos.
	// Each entry must have a unique logo type.
	// When specified, there must be at least one entry and no more than 2 entries.
	// Each item in the list must have a unique Type.
	// +kubebuilder:validation:MinItems=1
	// +kubebuilder:validation:MaxItems=2
	// +listType=map
	// +listMapKey=type
	// +optional
	CustomLogos []CustomLogo `json:"customLogos,omitempty"`

	// capabilities defines an array of capabilities that can be interacted with in the console UI.
	// Each capability defines a visual state that can be interacted with the console to render in the UI.
	// Available capabilities are LightspeedButton and GettingStartedBanner.
	// Each of the available capabilities may appear only once in the list.
	// +kubebuilder:validation:MinItems=1
	// +kubebuilder:validation:MaxItems=2
	// +listType=map
	// +listMapKey=name
	// +optional
	Capabilities []Capability `json:"capabilities,omitempty"`
	// brand is the default branding of the web console which can be overridden by
	// providing the brand field.  There is a limited set of specific brand options.
	// This field controls elements of the console such as the logo.
	// Invalid value will prevent a console rollout.
	// +kubebuilder:validation:Enum:=openshift;okd;online;ocp;dedicated;azure;OpenShift;OKD;Online;OCP;Dedicated;Azure;ROSA
	Brand Brand `json:"brand,omitempty"`
	// documentationBaseURL links to external documentation are shown in various sections
	// of the web console.  Providing documentationBaseURL will override the default
	// documentation URL.
	// Invalid value will prevent a console rollout.
	// +kubebuilder:validation:Pattern=`^$|^((https):\/\/?)[^\s()<>]+(?:\([\w\d]+\)|([^[:punct:]\s]|\/?))\/$`
	DocumentationBaseURL string `json:"documentationBaseURL,omitempty"`
	// customProductName is the name that will be displayed in page titles, logo alt text, and the about dialog
	// instead of the normal OpenShift product name.
	// +optional
	CustomProductName string `json:"customProductName,omitempty"`
	// customLogoFile replaces the default OpenShift logo in the masthead and about dialog. It is a reference to a
	// ConfigMap in the openshift-config namespace. This can be created with a command like
	// 'oc create configmap custom-logo --from-file=/path/to/file -n openshift-config'.
	// Image size must be less than 1 MB due to constraints on the ConfigMap size.
	// The ConfigMap key should include a file extension so that the console serves the file
	// with the correct MIME type.
	// Recommended logo specifications:
	// Dimensions: Max height of 60px and max width of 200px
	// SVG format preferred
	// Deprecated: Use CustomLogos instead.
	// +optional
	CustomLogoFile configv1.ConfigMapFileReference `json:"customLogoFile,omitempty"`
	// developerCatalog allows to configure the shown developer catalog categories (filters) and types (sub-catalogs).
	// +optional
	DeveloperCatalog DeveloperConsoleCatalogCustomization `json:"developerCatalog,omitempty"`
	// projectAccess allows customizing the available list of ClusterRoles in the Developer perspective
	// Project access page which can be used by a project admin to specify roles to other users and
	// restrict access within the project. If set, the list will replace the default ClusterRole options.
	// +optional
	ProjectAccess ProjectAccess `json:"projectAccess,omitempty"`
	// quickStarts allows customization of available ConsoleQuickStart resources in console.
	// +optional
	QuickStarts QuickStarts `json:"quickStarts,omitempty"`
	// addPage allows customizing actions on the Add page in developer perspective.
	// +optional
	AddPage AddPage `json:"addPage,omitempty"`
	// perspectives allows enabling/disabling of perspective(s) that user can see in the Perspective switcher dropdown.
	// +listType=map
	// +listMapKey=id
	// +optional
	Perspectives []Perspective `json:"perspectives"`
}

// ProjectAccess contains options for project access roles
type ProjectAccess struct {
	// availableClusterRoles is the list of ClusterRole names that are assignable to users
	// through the project access tab.
	// +optional
	AvailableClusterRoles []string `json:"availableClusterRoles,omitempty"`
}

// CatalogTypesState defines the state of the catalog types based on which the types will be enabled or disabled.
type CatalogTypesState string

const (
	CatalogTypeEnabled  CatalogTypesState = "Enabled"
	CatalogTypeDisabled CatalogTypesState = "Disabled"
)

// DeveloperConsoleCatalogTypes defines the state of the sub-catalog types.
// +kubebuilder:validation:XValidation:rule="self.state == 'Enabled' ? true : !has(self.enabled)",message="enabled is forbidden when state is not Enabled"
// +kubebuilder:validation:XValidation:rule="self.state == 'Disabled' ? true : !has(self.disabled)",message="disabled is forbidden when state is not Disabled"
// +union
type DeveloperConsoleCatalogTypes struct {
	// state defines if a list of catalog types should be enabled or disabled.
	// +unionDiscriminator
	// +kubebuilder:validation:Enum:="Enabled";"Disabled";
	// +kubebuilder:default:="Enabled"
	// +default="Enabled"
	// +required
	State CatalogTypesState `json:"state,omitempty"`
	// enabled is a list of developer catalog types (sub-catalogs IDs) that will be shown to users.
	// Types (sub-catalogs) are added via console plugins, the available types (sub-catalog IDs) are available
	// in the console on the cluster configuration page, or when editing the YAML in the console.
	// Example: "Devfile", "HelmChart", "BuilderImage"
	// If the list is non-empty, a new type will not be shown to the user until it is added to list.
	// If the list is empty the complete developer catalog will be shown.
	// +listType=set
	// +unionMember,optional
	Enabled *[]string `json:"enabled,omitempty"`
	// disabled is a list of developer catalog types (sub-catalogs IDs) that are not shown to users.
	// Types (sub-catalogs) are added via console plugins, the available types (sub-catalog IDs) are available
	// in the console on the cluster configuration page, or when editing the YAML in the console.
	// Example: "Devfile", "HelmChart", "BuilderImage"
	// If the list is empty or all the available sub-catalog types are added, then the complete developer catalog should be hidden.
	// +listType=set
	// +unionMember,optional
	Disabled *[]string `json:"disabled,omitempty"`
}

// DeveloperConsoleCatalogCustomization allow cluster admin to configure developer catalog.
type DeveloperConsoleCatalogCustomization struct {
	// categories which are shown in the developer catalog.
	// +optional
	Categories []DeveloperConsoleCatalogCategory `json:"categories,omitempty"`
	// types allows enabling or disabling of sub-catalog types that user can see in the Developer catalog.
	// When omitted, all the sub-catalog types will be shown.
	// +optional
	Types DeveloperConsoleCatalogTypes `json:"types,omitempty"`
}

// DeveloperConsoleCatalogCategoryMeta are the key identifiers of a developer catalog category.
type DeveloperConsoleCatalogCategoryMeta struct {
	// id is an identifier used in the URL to enable deep linking in console.
	// ID is required and must have 1-32 URL safe (A-Z, a-z, 0-9, - and _) characters.
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=32
	// +kubebuilder:validation:Pattern=`^[A-Za-z0-9-_]+$`
	// +required
	ID string `json:"id"`
	// label defines a category display label. It is required and must have 1-64 characters.
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=64
	// +required
	Label string `json:"label"`
	// tags is a list of strings that will match the category. A selected category
	// show all items which has at least one overlapping tag between category and item.
	// +optional
	Tags []string `json:"tags,omitempty"`
}

// DeveloperConsoleCatalogCategory for the developer console catalog.
type DeveloperConsoleCatalogCategory struct {
	// defines top level category ID, label and filter tags.
	DeveloperConsoleCatalogCategoryMeta `json:",inline"`
	// subcategories defines a list of child categories.
	// +optional
	Subcategories []DeveloperConsoleCatalogCategoryMeta `json:"subcategories,omitempty"`
}

// QuickStarts allow cluster admins to customize available ConsoleQuickStart resources.
type QuickStarts struct {
	// disabled is a list of ConsoleQuickStart resource names that are not shown to users.
	// +optional
	Disabled []string `json:"disabled,omitempty"`
}

// AddPage allows customizing actions on the Add page in developer perspective.
type AddPage struct {
	// disabledActions is a list of actions that are not shown to users.
	// Each action in the list is represented by its ID.
	// +kubebuilder:validation:MinItems=1
	// +optional
	DisabledActions []string `json:"disabledActions,omitempty"`
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
// +kubebuilder:validation:MinProperties:=1
type ResourceAttributesAccessReview struct {
	// required defines a list of permission checks. The perspective will only be shown when all checks are successful. When omitted, the access review is skipped and the perspective will not be shown unless it is required to do so based on the configuration of the missing access review list.
	// +optional
	Required []authorizationv1.ResourceAttributes `json:"required"`
	// missing defines a list of permission checks. The perspective will only be shown when at least one check fails. When omitted, the access review is skipped and the perspective will not be shown unless it is required to do so based on the configuration of the required access review list.
	// +optional
	Missing []authorizationv1.ResourceAttributes `json:"missing"`
}

// PerspectiveVisibility defines the criteria to show/hide a perspective
// +kubebuilder:validation:XValidation:rule="self.state == 'AccessReview' ?  has(self.accessReview) : !has(self.accessReview)",message="accessReview configuration is required when state is AccessReview, and forbidden otherwise"
// +union
type PerspectiveVisibility struct {
	// state defines the perspective is enabled or disabled or access review check is required.
	// +unionDiscriminator
	// +kubebuilder:validation:Enum:="Enabled";"Disabled";"AccessReview"
	// +required
	State PerspectiveState `json:"state"`
	// accessReview defines required and missing access review checks.
	// +optional
	AccessReview *ResourceAttributesAccessReview `json:"accessReview,omitempty"`
}

// Perspective defines a perspective that cluster admins want to show/hide in the perspective switcher dropdown
// +kubebuilder:validation:XValidation:rule="has(self.id) && self.id != 'dev'? !has(self.pinnedResources) : true",message="pinnedResources is allowed only for dev and forbidden for other perspectives"
// +optional
type Perspective struct {
	// id defines the id of the perspective.
	// Example: "dev", "admin".
	// The available perspective ids can be found in the code snippet section next to the yaml editor.
	// Incorrect or unknown ids will be ignored.
	// +required
	ID string `json:"id"`
	// visibility defines the state of perspective along with access review checks if needed for that perspective.
	// +required
	Visibility PerspectiveVisibility `json:"visibility"`
	// pinnedResources defines the list of default pinned resources that users will see on the perspective navigation if they have not customized these pinned resources themselves.
	// The list of available Kubernetes resources could be read via `kubectl api-resources`.
	// The console will also provide a configuration UI and a YAML snippet that will list the available resources that can be pinned to the navigation.
	// Incorrect or unknown resources will be ignored.
	// +kubebuilder:validation:MaxItems=100
	// +optional
	PinnedResources *[]PinnedResourceReference `json:"pinnedResources,omitempty"`
}

// PinnedResourceReference includes the group, version and type of resource
type PinnedResourceReference struct {
	// group is the API Group of the Resource.
	// Enter empty string for the core group.
	// This value should consist of only lowercase alphanumeric characters, hyphens and periods.
	// Example: "", "apps", "build.openshift.io", etc.
	// +kubebuilder:validation:Pattern:="^$|^[a-z0-9]([-a-z0-9]*[a-z0-9])?(.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$"
	// +required
	Group string `json:"group"`
	// version is the API Version of the Resource.
	// This value should consist of only lowercase alphanumeric characters.
	// Example: "v1", "v1beta1", etc.
	// +kubebuilder:validation:Pattern:="^[a-z0-9]+$"
	// +required
	Version string `json:"version"`
	// resource is the type that is being referenced.
	// It is normally the plural form of the resource kind in lowercase.
	// This value should consist of only lowercase alphanumeric characters and hyphens.
	// Example: "deployments", "deploymentconfigs", "pods", etc.
	// +kubebuilder:validation:Pattern:="^[a-z0-9]([-a-z0-9]*[a-z0-9])?$"
	// +required
	Resource string `json:"resource"`
}

// Brand is a specific supported brand within the console.
type Brand string

const (
	// Legacy branding for OpenShift
	BrandOpenShiftLegacy Brand = "openshift"
	// Legacy branding for The Origin Community Distribution of Kubernetes
	BrandOKDLegacy Brand = "okd"
	// Legacy branding for OpenShift Online
	BrandOnlineLegacy Brand = "online"
	// Legacy branding for OpenShift Container Platform
	BrandOCPLegacy Brand = "ocp"
	// Legacy branding for OpenShift Dedicated
	BrandDedicatedLegacy Brand = "dedicated"
	// Legacy branding for Azure Red Hat OpenShift
	BrandAzureLegacy Brand = "azure"
	// Branding for OpenShift
	BrandOpenShift Brand = "OpenShift"
	// Branding for The Origin Community Distribution of Kubernetes
	BrandOKD Brand = "OKD"
	// Branding for OpenShift Online
	BrandOnline Brand = "Online"
	// Branding for OpenShift Container Platform
	BrandOCP Brand = "OCP"
	// Branding for OpenShift Dedicated
	BrandDedicated Brand = "Dedicated"
	// Branding for Azure Red Hat OpenShift
	BrandAzure Brand = "Azure"
	// Branding for Red Hat OpenShift Service on AWS
	BrandROSA Brand = "ROSA"
)

// Ingress allows cluster admin to configure alternative ingress for the console.
type Ingress struct {
	// consoleURL is a URL to be used as the base console address.
	// If not specified, the console route hostname will be used.
	// This field is required for clusters without ingress capability,
	// where access to routes is not possible.
	// Make sure that appropriate ingress is set up at this URL.
	// The console operator will monitor the URL and may go degraded
	// if it's unreachable for an extended period.
	// Must use the HTTPS scheme.
	// +optional
	// +kubebuilder:validation:XValidation:rule="size(self) == 0 || isURL(self)",message="console url must be a valid absolute URL"
	// +kubebuilder:validation:XValidation:rule="size(self) == 0 || url(self).getScheme() == 'https'",message="console url scheme must be https"
	// +kubebuilder:validation:MaxLength=1024
	ConsoleURL string `json:"consoleURL"`
	// clientDownloadsURL is a URL to be used as the address to download client binaries.
	// If not specified, the downloads route hostname will be used.
	// This field is required for clusters without ingress capability,
	// where access to routes is not possible.
	// The console operator will monitor the URL and may go degraded
	// if it's unreachable for an extended period.
	// Must use the HTTPS scheme.
	// +optional
	// +kubebuilder:validation:XValidation:rule="size(self) == 0 || isURL(self)",message="client downloads url must be a valid absolute URL"
	// +kubebuilder:validation:XValidation:rule="size(self) == 0 || url(self).getScheme() == 'https'",message="client downloads url scheme must be https"
	// +kubebuilder:validation:MaxLength=1024
	ClientDownloadsURL string `json:"clientDownloadsURL"`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object

// Compatibility level 1: Stable within a major release for a minimum of 12 months or 3 minor releases (whichever is longer).
// +openshift:compatibility-gen:level=1
type ConsoleList struct {
	metav1.TypeMeta `json:",inline"`

	// metadata is the standard list's metadata.
	// More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
	metav1.ListMeta `json:"metadata"`

	Items []Console `json:"items"`
}
