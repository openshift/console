/*
Copyright 2022.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package v1

import (
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

var ClusterExtensionKind = "ClusterExtension"

type (
	UpgradeConstraintPolicy     string
	CRDUpgradeSafetyEnforcement string

	ClusterExtensionConfigType string
)

const (
	// The extension will only upgrade if the new version satisfies
	// the upgrade constraints set by the package author.
	UpgradeConstraintPolicyCatalogProvided UpgradeConstraintPolicy = "CatalogProvided"

	// Unsafe option which allows an extension to be
	// upgraded or downgraded to any available version of the package and
	// ignore the upgrade path designed by package authors.
	// This assumes that users independently verify the outcome of the changes.
	// Use with caution as this can lead to unknown and potentially
	// disastrous results such as data loss.
	UpgradeConstraintPolicySelfCertified UpgradeConstraintPolicy = "SelfCertified"

	ClusterExtensionConfigTypeInline ClusterExtensionConfigType = "Inline"
)

// ClusterExtensionSpec defines the desired state of ClusterExtension
type ClusterExtensionSpec struct {
	// namespace specifies a Kubernetes namespace.
	// <opcon:standard:description>It designates the default namespace where namespace-scoped resources for the extension are applied to the cluster.
	// Some extensions may contain namespace-scoped resources to be applied in other namespaces.
	// This namespace must exist.
	//
	// The namespace field is required, immutable, and follows the DNS label standard as defined in [RFC 1123].
	// It must contain only lowercase alphanumeric characters or hyphens (-), start and end with an alphanumeric character,
	// and be no longer than 63 characters.
	//
	// [RFC 1123]: https://tools.ietf.org/html/rfc1123
	// </opcon:standard:description>
	// <opcon:experimental:description>
	// It designates the default namespace where namespace-scoped resources for the extension
	// are applied to.
	//
	// namespace is optional. When set, it must reference an existing namespace on the cluster.
	// When omitted, operator-controller resolves and creates a managed namespace from the
	// bundle's metadata. Whether namespace is set or omitted is fixed at creation time and
	// cannot be changed afterwards.
	//
	// The namespace field follows the DNS label standard as defined in [RFC 1123].
	// It must contain only lowercase alphanumeric characters or hyphens (-), start and end with an alphanumeric character,
	// and be no longer than 63 characters.
	//
	// [RFC 1123]: https://tools.ietf.org/html/rfc1123
	// </opcon:experimental:description>
	//
	// <opcon:standard:validation:XValidation:rule="self == oldSelf",message="namespace is immutable">
	// <opcon:standard:validation:XValidation:rule="self.matches("^[a-z0-9]([-a-z0-9]*[a-z0-9])?$")",message="namespace must be a valid DNS1123 label">
	// <opcon:experimental:validation:XValidation:rule="self == oldSelf",message="namespace is immutable">
	// <opcon:experimental:validation:XValidation:rule="self.matches("^[a-z0-9]([-a-z0-9]*[a-z0-9])?$")",message="namespace must be a valid DNS1123 label">
	// <opcon:experimental:validation:Optional>
	//
	// +kubebuilder:validation:MaxLength:=63
	// +required
	Namespace string `json:"namespace,omitzero"`

	// serviceAccount is a deprecated field and is completely ignored.
	// OLMv1 is a single-tenant system where users with ClusterExtension write access are
	// effectively delegated cluster-admin trust. The operator-controller runs with
	// cluster-admin privileges and uses its own service account for all cluster interactions.
	//
	// Deprecated: serviceAccount is no longer used and will be removed in a future release.
	//
	// +optional
	ServiceAccount ServiceAccountReference `json:"serviceAccount,omitzero"`

	// source is required and selects the installation source of content for this ClusterExtension.
	// Set the sourceType field to perform the selection.
	//
	// Catalog is currently the only implemented sourceType.
	// Setting sourceType to "Catalog" requires the catalog field to also be defined.
	//
	// Below is a minimal example of a source definition (in yaml):
	//
	// source:
	//   sourceType: Catalog
	//   catalog:
	//     packageName: example-package
	//
	// +required
	Source SourceConfig `json:"source"`

	// install is optional and configures installation options for the ClusterExtension,
	// such as the pre-flight check configuration.
	//
	// +optional
	Install *ClusterExtensionInstallConfig `json:"install,omitempty"`

	// config is optional and specifies bundle-specific configuration.
	// Configuration is bundle-specific and a bundle may provide a configuration schema.
	// When not specified, the default configuration of the resolved bundle is used.
	//
	// config is validated against a configuration schema provided by the resolved bundle. If the bundle does not provide
	// a configuration schema the bundle is deemed to not be configurable. More information on how
	// to configure bundles can be found in the OLM documentation associated with your current OLM version.
	//
	// <opcon:experimental>
	// +optional
	Config *ClusterExtensionConfig `json:"config,omitempty"`

	// progressDeadlineMinutes is an optional field that defines the maximum period
	// of time in minutes after which an installation should be considered failed and
	// require manual intervention. This functionality is disabled when no value
	// is provided. The minimum period is 10 minutes, and the maximum is 720 minutes (12 hours).
	//
	// +kubebuilder:validation:Minimum:=10
	// +kubebuilder:validation:Maximum:=720
	// +optional
	// <opcon:experimental>
	ProgressDeadlineMinutes int32 `json:"progressDeadlineMinutes,omitempty"`
}

const SourceTypeCatalog = "Catalog"

// SourceConfig is a discriminated union which selects the installation source.
//
// +union
// +kubebuilder:validation:XValidation:rule="has(self.sourceType) && self.sourceType == 'Catalog' ? has(self.catalog) : !has(self.catalog)",message="catalog is required when sourceType is Catalog, and forbidden otherwise"
type SourceConfig struct {
	// sourceType is required and specifies the type of install source.
	//
	// The only allowed value is "Catalog".
	//
	// When set to "Catalog", information for determining the appropriate bundle of content to install
	// is fetched from ClusterCatalog resources on the cluster.
	// When using the Catalog sourceType, the catalog field must also be set.
	//
	// +unionDiscriminator
	// +kubebuilder:validation:Enum:="Catalog"
	// +required
	SourceType string `json:"sourceType"`

	// catalog configures how information is sourced from a catalog.
	// It is required when sourceType is "Catalog", and forbidden otherwise.
	//
	// +optional
	Catalog *CatalogFilter `json:"catalog,omitempty"`
}

// ClusterExtensionInstallConfig is a union which selects the clusterExtension installation config.
//
// +kubebuilder:validation:XValidation:rule="has(self.preflight)",message="at least one of [preflight] are required when install is specified"
// +union
type ClusterExtensionInstallConfig struct {
	// preflight is optional and configures the checks that run before installation or upgrade
	// of the content for the package specified in the packageName field.
	//
	// When specified, it replaces the default preflight configuration for install/upgrade actions.
	// When not specified, the default configuration is used.
	//
	// +optional
	Preflight *PreflightConfig `json:"preflight,omitempty"`
}

// ClusterExtensionConfig is a discriminated union which selects the source configuration values to be merged into
// the ClusterExtension's rendered manifests.
//
// +kubebuilder:validation:XValidation:rule="has(self.configType) && self.configType == 'Inline' ?has(self.inline) : !has(self.inline)",message="inline is required when configType is Inline, and forbidden otherwise"
// +union
type ClusterExtensionConfig struct {
	// configType is required and specifies the type of configuration source.
	//
	// The only allowed value is "Inline".
	//
	// When set to "Inline", the cluster extension configuration is defined inline within the ClusterExtension resource.
	//
	// +unionDiscriminator
	// +kubebuilder:validation:Enum:="Inline"
	// +required
	ConfigType ClusterExtensionConfigType `json:"configType"`

	// inline contains JSON or YAML values specified directly in the ClusterExtension.
	//
	// It is used to specify arbitrary configuration values for the ClusterExtension.
	// It must be set if configType is 'Inline' and must be a valid JSON/YAML object containing at least one property.
	// The configuration values are validated at runtime against a JSON schema provided by the bundle.
	//
	// +kubebuilder:validation:Type=object
	// +kubebuilder:validation:MinProperties=1
	// +optional
	// +unionMember
	Inline *apiextensionsv1.JSON `json:"inline,omitempty"`
}

// CatalogFilter defines the attributes used to identify and filter content from a catalog.
type CatalogFilter struct {
	// packageName specifies the name of the package to be installed and is used to filter
	// the content from catalogs.
	//
	// It is required, immutable, and follows the DNS subdomain standard as defined in [RFC 1123].
	// It must contain only lowercase alphanumeric characters, hyphens (-) or periods (.),
	// start and end with an alphanumeric character, and be no longer than 253 characters.
	//
	// Some examples of valid values are:
	//   - some-package
	//   - 123-package
	//   - 1-package-2
	//   - somepackage
	//
	// Some examples of invalid values are:
	//   - -some-package
	//   - some-package-
	//   - thisisareallylongpackagenamethatisgreaterthanthemaximumlength
	//   - some.package
	//
	// [RFC 1123]: https://tools.ietf.org/html/rfc1123
	//
	// +kubebuilder:validation.Required
	// +kubebuilder:validation:MaxLength:=253
	// +kubebuilder:validation:XValidation:rule="self == oldSelf",message="packageName is immutable"
	// +kubebuilder:validation:XValidation:rule="self.matches(\"^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$\")",message="packageName must be a valid DNS1123 subdomain. It must contain only lowercase alphanumeric characters, hyphens (-) or periods (.), start and end with an alphanumeric character, and be no longer than 253 characters"
	// +required
	PackageName string `json:"packageName"`

	// version is an optional semver constraint (a specific version or range of versions).
	// When unspecified, the latest version available is installed.
	//
	// Acceptable version ranges are no longer than 64 characters.
	// Version ranges are composed of comma- or space-delimited values and one or more comparison operators,
	// known as comparison strings.
	// You can add additional comparison strings using the OR operator (||).
	//
	// # Range Comparisons
	//
	// To specify a version range, you can use a comparison string like ">=3.0,
	// <3.6". When specifying a range, automatic updates will occur within that
	// range. The example comparison string means "install any version greater than
	// or equal to 3.0.0 but less than 3.6.0.". It also states intent that if any
	// upgrades are available within the version range after initial installation,
	// those upgrades should be automatically performed.
	//
	// # Pinned Versions
	//
	// To specify an exact version to install you can use a version range that
	// "pins" to a specific version. When pinning to a specific version, no
	// automatic updates will occur. An example of a pinned version range is
	// "0.6.0", which means "only install version 0.6.0 and never
	// upgrade from this version".
	//
	// # Basic Comparison Operators
	//
	// The basic comparison operators and their meanings are:
	//   - "=", equal (not aliased to an operator)
	//   - "!=", not equal
	//   - "<", less than
	//   - ">", greater than
	//   - ">=", greater than OR equal to
	//   - "<=", less than OR equal to
	//
	// # Wildcard Comparisons
	//
	// You can use the "x", "X", and "*" characters as wildcard characters in all
	// comparison operations. Some examples of using the wildcard characters:
	//   - "1.2.x", "1.2.X", and "1.2.*" is equivalent to ">=1.2.0, < 1.3.0"
	//   - ">= 1.2.x", ">= 1.2.X", and ">= 1.2.*" is equivalent to ">= 1.2.0"
	//   - "<= 2.x", "<= 2.X", and "<= 2.*" is equivalent to "< 3"
	//   - "x", "X", and "*" is equivalent to ">= 0.0.0"
	//
	// # Patch Release Comparisons
	//
	// When you want to specify a minor version up to the next major version you
	// can use the "~" character to perform patch comparisons. Some examples:
	//   - "~1.2.3" is equivalent to ">=1.2.3, <1.3.0"
	//   - "~1" and "~1.x" is equivalent to ">=1, <2"
	//   - "~2.3" is equivalent to ">=2.3, <2.4"
	//   - "~1.2.x" is equivalent to ">=1.2.0, <1.3.0"
	//
	// # Major Release Comparisons
	//
	// You can use the "^" character to make major release comparisons after a
	// stable 1.0.0 version is published. If there is no stable version published, // minor versions define the stability level. Some examples:
	//   - "^1.2.3" is equivalent to ">=1.2.3, <2.0.0"
	//   - "^1.2.x" is equivalent to ">=1.2.0, <2.0.0"
	//   - "^2.3" is equivalent to ">=2.3, <3"
	//   - "^2.x" is equivalent to ">=2.0.0, <3"
	//   - "^0.2.3" is equivalent to ">=0.2.3, <0.3.0"
	//   - "^0.2" is equivalent to ">=0.2.0, <0.3.0"
	//   - "^0.0.3" is equvalent to ">=0.0.3, <0.0.4"
	//   - "^0.0" is equivalent to ">=0.0.0, <0.1.0"
	//   - "^0" is equivalent to ">=0.0.0, <1.0.0"
	//
	// # OR Comparisons
	// You can use the "||" character to represent an OR operation in the version
	// range. Some examples:
	//   - ">=1.2.3, <2.0.0 || >3.0.0"
	//   - "^0 || ^3 || ^5"
	//
	// For more information on semver, please see https://semver.org/
	//
	// +kubebuilder:validation:MaxLength:=64
	// +kubebuilder:validation:XValidation:rule="self.matches(\"^(\\\\s*(=||!=|>|<|>=|=>|<=|=<|~|~>|\\\\^)\\\\s*(v?(0|[1-9]\\\\d*|[x|X|\\\\*])(\\\\.(0|[1-9]\\\\d*|x|X|\\\\*]))?(\\\\.(0|[1-9]\\\\d*|x|X|\\\\*))?(-([0-9A-Za-z\\\\-]+(\\\\.[0-9A-Za-z\\\\-]+)*))?(\\\\+([0-9A-Za-z\\\\-]+(\\\\.[0-9A-Za-z\\\\-]+)*))?)\\\\s*)((?:\\\\s+|,\\\\s*|\\\\s*\\\\|\\\\|\\\\s*)(=||!=|>|<|>=|=>|<=|=<|~|~>|\\\\^)\\\\s*(v?(0|[1-9]\\\\d*|x|X|\\\\*])(\\\\.(0|[1-9]\\\\d*|x|X|\\\\*))?(\\\\.(0|[1-9]\\\\d*|x|X|\\\\*]))?(-([0-9A-Za-z\\\\-]+(\\\\.[0-9A-Za-z\\\\-]+)*))?(\\\\+([0-9A-Za-z\\\\-]+(\\\\.[0-9A-Za-z\\\\-]+)*))?)\\\\s*)*$\")",message="invalid version expression"
	// +optional
	Version string `json:"version,omitempty"`

	// channels is optional and specifies a set of channels belonging to the package
	// specified in the packageName field.
	//
	// A channel is a package-author-defined stream of updates for an extension.
	//
	// Each channel in the list must follow the DNS subdomain standard as defined in [RFC 1123].
	// It must contain only lowercase alphanumeric characters, hyphens (-) or periods (.),
	// start and end with an alphanumeric character, and be no longer than 253 characters.
	// You can specify no more than 256 channels.
	//
	// When specified, it constrains the set of installable bundles and the automated upgrade path.
	// This constraint is an AND operation with the version field. For example:
	//   - Given channel is set to "foo"
	//   - Given version is set to ">=1.0.0, <1.5.0"
	//   - Only bundles that exist in channel "foo" AND satisfy the version range comparison are considered installable
	//   - Automatic upgrades are constrained to upgrade edges defined by the selected channel
	//
	// When unspecified, upgrade edges across all channels are used to identify valid automatic upgrade paths.
	//
	// Some examples of valid values are:
	//   - 1.1.x
	//   - alpha
	//   - stable
	//   - stable-v1
	//   - v1-stable
	//   - dev-preview
	//   - preview
	//   - community
	//
	// Some examples of invalid values are:
	//   - -some-channel
	//   - some-channel-
	//   - thisisareallylongchannelnamethatisgreaterthanthemaximumlength
	//   - original_40
	//   - --default-channel
	//
	// [RFC 1123]: https://tools.ietf.org/html/rfc1123
	//
	// +kubebuilder:validation:items:MaxLength:=253
	// +kubebuilder:validation:MaxItems:=256
	// +kubebuilder:validation:items:XValidation:rule="self.matches(\"^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$\")",message="channels entries must be valid DNS1123 subdomains"
	// +optional
	Channels []string `json:"channels,omitempty"`

	// selector is optional and filters the set of ClusterCatalogs used in the bundle selection process.
	//
	// When unspecified, all ClusterCatalogs are used in the bundle selection process.
	//
	// +optional
	Selector *metav1.LabelSelector `json:"selector,omitempty"`

	// upgradeConstraintPolicy is optional and controls whether the upgrade paths defined in the catalog
	// are enforced for the package referenced in the packageName field.
	//
	// Allowed values are "CatalogProvided", "SelfCertified", or omitted.
	//
	// When set to "CatalogProvided", automatic upgrades only occur when upgrade constraints specified by the package
	// author are met.
	//
	// When set to "SelfCertified", the upgrade constraints specified by the package author are ignored.
	// This allows upgrades and downgrades to any version of the package.
	// This is considered a dangerous operation as it can lead to unknown and potentially disastrous outcomes,
	// such as data loss.
	// Use this option only if you have independently verified the changes.
	//
	// When omitted, the default value is "CatalogProvided".
	//
	// +kubebuilder:validation:Enum:=CatalogProvided;SelfCertified
	// +kubebuilder:default:=CatalogProvided
	// +optional
	UpgradeConstraintPolicy UpgradeConstraintPolicy `json:"upgradeConstraintPolicy,omitempty"`
}

// ServiceAccountReference is a deprecated type and is completely ignored.
//
// Deprecated: ServiceAccountReference is no longer used and will be removed in a future release.
//
// +kubebuilder:validation:MinProperties=1
type ServiceAccountReference struct {
	// name is a deprecated field and is completely ignored.
	//
	// Deprecated: name is no longer used and will be removed in a future release.
	//
	// The name field follows the DNS subdomain standard as defined in [RFC 1123].
	// It must contain only lowercase alphanumeric characters, hyphens (-) or periods (.),
	// start and end with an alphanumeric character, and be no longer than 253 characters.
	//
	// Some examples of valid values are:
	//   - some-serviceaccount
	//   - 123-serviceaccount
	//   - 1-serviceaccount-2
	//   - someserviceaccount
	//   - some.serviceaccount
	//
	// Some examples of invalid values are:
	//   - -some-serviceaccount
	//   - some-serviceaccount-
	//
	// [RFC 1123]: https://tools.ietf.org/html/rfc1123
	//
	// +kubebuilder:validation:MinLength:=1
	// +kubebuilder:validation:MaxLength:=253
	// +kubebuilder:validation:XValidation:rule="self == oldSelf",message="name is immutable once set but may be cleared"
	// +kubebuilder:validation:XValidation:rule="self.matches(\"^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$\")",message="name must be a valid DNS1123 subdomain. It must contain only lowercase alphanumeric characters, hyphens (-) or periods (.), start and end with an alphanumeric character, and be no longer than 253 characters"
	// +optional
	Name string `json:"name,omitempty"`
}

// PreflightConfig holds the configuration for the preflight checks.  If used, at least one preflight check must be non-nil.
//
// +kubebuilder:validation:XValidation:rule="has(self.crdUpgradeSafety)",message="at least one of [crdUpgradeSafety] are required when preflight is specified"
type PreflightConfig struct {
	// crdUpgradeSafety configures the CRD Upgrade Safety pre-flight checks that run
	// before upgrades of installed content.
	//
	// The CRD Upgrade Safety pre-flight check safeguards from unintended consequences of upgrading a CRD,
	// such as data loss.
	CRDUpgradeSafety *CRDUpgradeSafetyPreflightConfig `json:"crdUpgradeSafety"`
}

// CRDUpgradeSafetyPreflightConfig is the configuration for CRD upgrade safety preflight check.
type CRDUpgradeSafetyPreflightConfig struct {
	// enforcement is required and configures the state of the CRD Upgrade Safety pre-flight check.
	//
	// Allowed values are "None" or "Strict". The default value is "Strict".
	//
	// When set to "None", the CRD Upgrade Safety pre-flight check is skipped during an upgrade operation.
	// Use this option with caution as unintended consequences such as data loss can occur.
	//
	// When set to "Strict", the CRD Upgrade Safety pre-flight check runs during an upgrade operation.
	//
	// +kubebuilder:validation:Enum:="None";"Strict"
	// +required
	Enforcement CRDUpgradeSafetyEnforcement `json:"enforcement"`
}

const (
	// TypeDeprecated is a rollup condition that is present when
	// any of the deprecated conditions are present.
	TypeDeprecated        = "Deprecated"
	TypePackageDeprecated = "PackageDeprecated"
	TypeChannelDeprecated = "ChannelDeprecated"
	TypeBundleDeprecated  = "BundleDeprecated"

	// None will not perform CRD upgrade safety checks.
	CRDUpgradeSafetyEnforcementNone CRDUpgradeSafetyEnforcement = "None"
	// Strict will enforce the CRD upgrade safety check and block the upgrade if the CRD would not pass the check.
	CRDUpgradeSafetyEnforcementStrict CRDUpgradeSafetyEnforcement = "Strict"
)

// BundleMetadata is a representation of the identifying attributes of a bundle.
type BundleMetadata struct {
	// name is required and follows the DNS subdomain standard as defined in [RFC 1123].
	// It must contain only lowercase alphanumeric characters, hyphens (-) or periods (.),
	// start and end with an alphanumeric character, and be no longer than 253 characters.
	//
	// +required
	// +kubebuilder:validation:XValidation:rule="self.matches(\"^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$\")",message="packageName must be a valid DNS1123 subdomain. It must contain only lowercase alphanumeric characters, hyphens (-) or periods (.), start and end with an alphanumeric character, and be no longer than 253 characters"
	Name string `json:"name"`

	// version is required and references the version that this bundle represents.
	// It follows the semantic versioning standard as defined in https://semver.org/.
	//
	// +required
	// +kubebuilder:validation:XValidation:rule="self.matches(\"^([0-9]+)(\\\\.[0-9]+)?(\\\\.[0-9]+)?(-([-0-9A-Za-z]+(\\\\.[-0-9A-Za-z]+)*))?(\\\\+([-0-9A-Za-z]+(-\\\\.[-0-9A-Za-z]+)*))?\")",message="version must be well-formed semver"
	Version string `json:"version"`

	// release is an optional field that identifies a specific release of this bundle's version.
	// A release represents a re-publication of the same version, typically used to deliver
	// packaging or metadata changes without changing the version number. When multiple
	// releases exist for the same version, higher releases are preferred. An unset release
	// is less preferred than all other release values.
	//
	// The value consists of dot-separated identifiers, where each identifier is either a
	// numeric value (without leading zeros) or an alphanumeric string (e.g., "2", "1.el9",
	// "3.alpha.1"). Releases are compared identifier by identifier: numeric identifiers are
	// compared as integers, alphanumeric identifiers are compared lexically, and numeric
	// identifiers always sort before alphanumeric identifiers.
	//
	// For bundles with explicit pkg.Release metadata, this field contains that release value.
	// For registry+v1 bundles lacking an explicit release value, this field contains the release
	// extracted from version's build metadata (e.g., '2' from '1.0.0+2').
	// This field is omitted when the bundle's release value is unset.
	//
	// +optional
	// <opcon:experimental>
	// +kubebuilder:validation:MaxLength=20
	// +kubebuilder:validation:XValidation:rule="self.matches(\"^$|^(0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(\\\\.(0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*$\")",message="release must be empty or consist of dot-separated identifiers (numeric without leading zeros, or alphanumeric)"
	Release *string `json:"release,omitempty"`
}

// RevisionStatus defines the observed state of a ClusterObjectSet.
type RevisionStatus struct {
	// name of the ClusterObjectSet resource
	Name string `json:"name"`
	// conditions optionally expose Progressing and Available condition of the revision,
	// in case when it is not yet marked as successfully installed (condition Succeeded is not set to True).
	// Given that a ClusterExtension should remain available during upgrades, an observer may use these conditions
	// to get more insights about reasons for its current state.
	//
	// +listType=map
	// +listMapKey=type
	// +optional
	Conditions []metav1.Condition `json:"conditions,omitempty"`
}

// ClusterExtensionStatus defines the observed state of a ClusterExtension.
type ClusterExtensionStatus struct {
	// conditions represents the current state of the ClusterExtension.
	//
	// The set of condition types which apply to all spec.source variations are Installed and Progressing.
	//
	// The Installed condition represents whether the bundle has been installed for this ClusterExtension:
	//   - When Installed is True and the Reason is Succeeded, the bundle has been successfully installed.
	//   - When Installed is False and the Reason is Failed, the bundle has failed to install.
	//
	// The Progressing condition represents whether or not the ClusterExtension is advancing towards a new state.
	// When Progressing is True and the Reason is Succeeded, the ClusterExtension is making progress towards a new state.
	// When Progressing is True and the Reason is Retrying, the ClusterExtension has encountered an error that could be resolved on subsequent reconciliation attempts.
	// When Progressing is False and the Reason is Blocked, the ClusterExtension has encountered an error that requires manual intervention for recovery.
	// <opcon:experimental:description>
	// When Progressing is True and Reason is RollingOut, the ClusterExtension has one or more ClusterObjectSets in active roll out.
	// </opcon:experimental:description>
	//
	// When the ClusterExtension is sourced from a catalog, it surfaces deprecation conditions based on catalog metadata.
	// These are indications from a package owner to guide users away from a particular package, channel, or bundle:
	//   - BundleDeprecated is True if the installed bundle is marked deprecated, False if not deprecated, or Unknown if no bundle is installed yet or if catalog data is unavailable.
	//   - ChannelDeprecated is True if any requested channel is marked deprecated, False if not deprecated, or Unknown if catalog data is unavailable.
	//   - PackageDeprecated is True if the requested package is marked deprecated, False if not deprecated, or Unknown if catalog data is unavailable.
	//   - Deprecated is a rollup condition that is True when any deprecation exists, False when none exist, or Unknown when catalog data is unavailable.
	//
	// +listType=map
	// +listMapKey=type
	// +optional
	Conditions []metav1.Condition `json:"conditions,omitempty"`

	// install is a representation of the current installation status for this ClusterExtension.
	//
	// +optional
	Install *ClusterExtensionInstallStatus `json:"install,omitempty"`

	// activeRevisions holds a list of currently active (non-archived) ClusterObjectSets,
	// including both installed and rolling out revisions.
	// +listType=map
	// +listMapKey=name
	// +optional
	// <opcon:experimental>
	ActiveRevisions []RevisionStatus `json:"activeRevisions,omitempty"`
}

// ClusterExtensionInstallStatus is a representation of the status of the identified bundle.
type ClusterExtensionInstallStatus struct {
	// bundle is required and represents the identifying attributes of a bundle.
	//
	// A "bundle" is a versioned set of content that represents the resources that need to be applied
	// to a cluster to install a package.
	//
	// +required
	Bundle BundleMetadata `json:"bundle"`
}

// +genclient
// +genclient:nonNamespaced
// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Installed Bundle",type=string,JSONPath=`.status.install.bundle.name`
// +kubebuilder:printcolumn:name=Version,type=string,JSONPath=`.status.install.bundle.version`
// +kubebuilder:printcolumn:name="Installed",type=string,JSONPath=`.status.conditions[?(@.type=='Installed')].status`
// +kubebuilder:printcolumn:name="Progressing",type=string,JSONPath=`.status.conditions[?(@.type=='Progressing')].status`
// +kubebuilder:printcolumn:name=Age,type=date,JSONPath=`.metadata.creationTimestamp`

// ClusterExtension is the Schema for the clusterextensions API
type ClusterExtension struct {
	metav1.TypeMeta `json:",inline"`

	// metadata is the standard object's metadata.
	// More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
	// +optional
	metav1.ObjectMeta `json:"metadata,omitempty"`

	// spec is an optional field that defines the desired state of the ClusterExtension.
	//
	// <opcon:experimental:validation:XValidation:rule="has(oldSelf.namespace) == has(self.namespace)",message="namespace presence is immutable; it cannot be added or removed after creation">
	// +optional
	Spec ClusterExtensionSpec `json:"spec,omitempty"`

	// status is an optional field that defines the observed state of the ClusterExtension.
	// +optional
	Status ClusterExtensionStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// ClusterExtensionList contains a list of ClusterExtension
type ClusterExtensionList struct {
	metav1.TypeMeta `json:",inline"`

	// +optional
	metav1.ListMeta `json:"metadata,omitempty"`

	// items is a required list of ClusterExtension objects.
	//
	// +required
	Items []ClusterExtension `json:"items"`
}

func init() {
	SchemeBuilder.Register(func(s *runtime.Scheme) error {
		s.AddKnownTypes(GroupVersion, &ClusterExtension{}, &ClusterExtensionList{})
		return nil
	})
}
