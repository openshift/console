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
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var ClusterExtensionKind = "ClusterExtension"

type (
	UpgradeConstraintPolicy     string
	CRDUpgradeSafetyEnforcement string
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
)

// ClusterExtensionSpec defines the desired state of ClusterExtension
type ClusterExtensionSpec struct {
	// namespace is a reference to a Kubernetes namespace.
	// This is the namespace in which the provided ServiceAccount must exist.
	// It also designates the default namespace where namespace-scoped resources
	// for the extension are applied to the cluster.
	// Some extensions may contain namespace-scoped resources to be applied in other namespaces.
	// This namespace must exist.
	//
	// namespace is required, immutable, and follows the DNS label standard
	// as defined in [RFC 1123]. It must contain only lowercase alphanumeric characters or hyphens (-),
	// start and end with an alphanumeric character, and be no longer than 63 characters
	//
	// [RFC 1123]: https://tools.ietf.org/html/rfc1123
	//
	// +kubebuilder:validation:MaxLength:=63
	// +kubebuilder:validation:XValidation:rule="self == oldSelf",message="namespace is immutable"
	// +kubebuilder:validation:XValidation:rule="self.matches(\"^[a-z0-9]([-a-z0-9]*[a-z0-9])?$\")",message="namespace must be a valid DNS1123 label"
	// +kubebuilder:validation:Required
	Namespace string `json:"namespace"`

	// serviceAccount is a reference to a ServiceAccount used to perform all interactions
	// with the cluster that are required to manage the extension.
	// The ServiceAccount must be configured with the necessary permissions to perform these interactions.
	// The ServiceAccount must exist in the namespace referenced in the spec.
	// serviceAccount is required.
	//
	// +kubebuilder:validation:Required
	ServiceAccount ServiceAccountReference `json:"serviceAccount"`

	// source is a required field which selects the installation source of content
	// for this ClusterExtension. Selection is performed by setting the sourceType.
	//
	// Catalog is currently the only implemented sourceType, and setting the
	// sourcetype to "Catalog" requires the catalog field to also be defined.
	//
	// Below is a minimal example of a source definition (in yaml):
	//
	// source:
	//   sourceType: Catalog
	//   catalog:
	//     packageName: example-package
	//
	// +kubebuilder:validation:Required
	Source SourceConfig `json:"source"`

	// install is an optional field used to configure the installation options
	// for the ClusterExtension such as the pre-flight check configuration.
	//
	// +optional
	Install *ClusterExtensionInstallConfig `json:"install,omitempty"`
}

const SourceTypeCatalog = "Catalog"

// SourceConfig is a discriminated union which selects the installation source.
//
// +union
// +kubebuilder:validation:XValidation:rule="has(self.sourceType) && self.sourceType == 'Catalog' ? has(self.catalog) : !has(self.catalog)",message="catalog is required when sourceType is Catalog, and forbidden otherwise"
type SourceConfig struct {
	// sourceType is a required reference to the type of install source.
	//
	// Allowed values are "Catalog"
	//
	// When this field is set to "Catalog", information for determining the
	// appropriate bundle of content to install will be fetched from
	// ClusterCatalog resources existing on the cluster.
	// When using the Catalog sourceType, the catalog field must also be set.
	//
	// +unionDiscriminator
	// +kubebuilder:validation:Enum:="Catalog"
	// +kubebuilder:validation:Required
	SourceType string `json:"sourceType"`

	// catalog is used to configure how information is sourced from a catalog.
	// This field is required when sourceType is "Catalog", and forbidden otherwise.
	//
	// +optional
	Catalog *CatalogFilter `json:"catalog,omitempty"`
}

// ClusterExtensionInstallConfig is a union which selects the clusterExtension installation config.
// ClusterExtensionInstallConfig requires the namespace and serviceAccount which should be used for the installation of packages.
//
// +kubebuilder:validation:XValidation:rule="has(self.preflight)",message="at least one of [preflight] are required when install is specified"
// +union
type ClusterExtensionInstallConfig struct {
	// preflight is an optional field that can be used to configure the checks that are
	// run before installation or upgrade of the content for the package specified in the packageName field.
	//
	// When specified, it replaces the default preflight configuration for install/upgrade actions.
	// When not specified, the default configuration will be used.
	//
	// +optional
	Preflight *PreflightConfig `json:"preflight,omitempty"`
}

// CatalogFilter defines the attributes used to identify and filter content from a catalog.
type CatalogFilter struct {
	// packageName is a reference to the name of the package to be installed
	// and is used to filter the content from catalogs.
	//
	// packageName is required, immutable, and follows the DNS subdomain standard
	// as defined in [RFC 1123]. It must contain only lowercase alphanumeric characters,
	// hyphens (-) or periods (.), start and end with an alphanumeric character,
	// and be no longer than 253 characters.
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
	// +kubebuilder:validation:Required
	PackageName string `json:"packageName"`

	// version is an optional semver constraint (a specific version or range of versions). When unspecified, the latest version available will be installed.
	//
	// Acceptable version ranges are no longer than 64 characters.
	// Version ranges are composed of comma- or space-delimited values and one or
	// more comparison operators, known as comparison strings. Additional
	// comparison strings can be added using the OR operator (||).
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

	// channels is an optional reference to a set of channels belonging to
	// the package specified in the packageName field.
	//
	// A "channel" is a package-author-defined stream of updates for an extension.
	//
	// Each channel in the list must follow the DNS subdomain standard
	// as defined in [RFC 1123]. It must contain only lowercase alphanumeric characters,
	// hyphens (-) or periods (.), start and end with an alphanumeric character,
	// and be no longer than 253 characters. No more than 256 channels can be specified.
	//
	// When specified, it is used to constrain the set of installable bundles and
	// the automated upgrade path. This constraint is an AND operation with the
	// version field. For example:
	//   - Given channel is set to "foo"
	//   - Given version is set to ">=1.0.0, <1.5.0"
	//   - Only bundles that exist in channel "foo" AND satisfy the version range comparison will be considered installable
	//   - Automatic upgrades will be constrained to upgrade edges defined by the selected channel
	//
	// When unspecified, upgrade edges across all channels will be used to identify valid automatic upgrade paths.
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

	// selector is an optional field that can be used
	// to filter the set of ClusterCatalogs used in the bundle
	// selection process.
	//
	// When unspecified, all ClusterCatalogs will be used in
	// the bundle selection process.
	//
	// +optional
	Selector *metav1.LabelSelector `json:"selector,omitempty"`

	// upgradeConstraintPolicy is an optional field that controls whether
	// the upgrade path(s) defined in the catalog are enforced for the package
	// referenced in the packageName field.
	//
	// Allowed values are: "CatalogProvided" or "SelfCertified", or omitted.
	//
	// When this field is set to "CatalogProvided", automatic upgrades will only occur
	// when upgrade constraints specified by the package author are met.
	//
	// When this field is set to "SelfCertified", the upgrade constraints specified by
	// the package author are ignored. This allows for upgrades and downgrades to
	// any version of the package. This is considered a dangerous operation as it
	// can lead to unknown and potentially disastrous outcomes, such as data
	// loss. It is assumed that users have independently verified changes when
	// using this option.
	//
	// When this field is omitted, the default value is "CatalogProvided".
	//
	// +kubebuilder:validation:Enum:=CatalogProvided;SelfCertified
	// +kubebuilder:default:=CatalogProvided
	// +optional
	UpgradeConstraintPolicy UpgradeConstraintPolicy `json:"upgradeConstraintPolicy,omitempty"`
}

// ServiceAccountReference identifies the serviceAccount used fo install a ClusterExtension.
type ServiceAccountReference struct {
	// name is a required, immutable reference to the name of the ServiceAccount
	// to be used for installation and management of the content for the package
	// specified in the packageName field.
	//
	// This ServiceAccount must exist in the installNamespace.
	//
	// name follows the DNS subdomain standard as defined in [RFC 1123].
	// It must contain only lowercase alphanumeric characters,
	// hyphens (-) or periods (.), start and end with an alphanumeric character,
	// and be no longer than 253 characters.
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
	// +kubebuilder:validation:MaxLength:=253
	// +kubebuilder:validation:XValidation:rule="self == oldSelf",message="name is immutable"
	// +kubebuilder:validation:XValidation:rule="self.matches(\"^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$\")",message="name must be a valid DNS1123 subdomain. It must contain only lowercase alphanumeric characters, hyphens (-) or periods (.), start and end with an alphanumeric character, and be no longer than 253 characters"
	// +kubebuilder:validation:Required
	Name string `json:"name"`
}

// PreflightConfig holds the configuration for the preflight checks.  If used, at least one preflight check must be non-nil.
//
// +kubebuilder:validation:XValidation:rule="has(self.crdUpgradeSafety)",message="at least one of [crdUpgradeSafety] are required when preflight is specified"
type PreflightConfig struct {
	// crdUpgradeSafety is used to configure the CRD Upgrade Safety pre-flight
	// checks that run prior to upgrades of installed content.
	//
	// The CRD Upgrade Safety pre-flight check safeguards from unintended
	// consequences of upgrading a CRD, such as data loss.
	CRDUpgradeSafety *CRDUpgradeSafetyPreflightConfig `json:"crdUpgradeSafety"`
}

// CRDUpgradeSafetyPreflightConfig is the configuration for CRD upgrade safety preflight check.
type CRDUpgradeSafetyPreflightConfig struct {
	// enforcement is a required field, used to configure the state of the CRD Upgrade Safety pre-flight check.
	//
	// Allowed values are "None" or "Strict". The default value is "Strict".
	//
	// When set to "None", the CRD Upgrade Safety pre-flight check will be skipped
	// when performing an upgrade operation. This should be used with caution as
	// unintended consequences such as data loss can occur.
	//
	// When set to "Strict", the CRD Upgrade Safety pre-flight check will be run when
	// performing an upgrade operation.
	//
	// +kubebuilder:validation:Enum:="None";"Strict"
	// +kubebuilder:validation:Required
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
	// name is required and follows the DNS subdomain standard
	// as defined in [RFC 1123]. It must contain only lowercase alphanumeric characters,
	// hyphens (-) or periods (.), start and end with an alphanumeric character,
	// and be no longer than 253 characters.
	//
	// +kubebuilder:validation:Required
	// +kubebuilder:validation:XValidation:rule="self.matches(\"^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$\")",message="packageName must be a valid DNS1123 subdomain. It must contain only lowercase alphanumeric characters, hyphens (-) or periods (.), start and end with an alphanumeric character, and be no longer than 253 characters"
	Name string `json:"name"`

	// version is a required field and is a reference to the version that this bundle represents
	// version follows the semantic versioning standard as defined in https://semver.org/.
	//
	// +kubebuilder:validation:Required
	// +kubebuilder:validation:XValidation:rule="self.matches(\"^([0-9]+)(\\\\.[0-9]+)?(\\\\.[0-9]+)?(-([-0-9A-Za-z]+(\\\\.[-0-9A-Za-z]+)*))?(\\\\+([-0-9A-Za-z]+(-\\\\.[-0-9A-Za-z]+)*))?\")",message="version must be well-formed semver"
	Version string `json:"version"`
}

// ClusterExtensionStatus defines the observed state of a ClusterExtension.
type ClusterExtensionStatus struct {
	// The set of condition types which apply to all spec.source variations are Installed and Progressing.
	//
	// The Installed condition represents whether or not the bundle has been installed for this ClusterExtension.
	// When Installed is True and the Reason is Succeeded, the bundle has been successfully installed.
	// When Installed is False and the Reason is Failed, the bundle has failed to install.
	//
	// The Progressing condition represents whether or not the ClusterExtension is advancing towards a new state.
	// When Progressing is True and the Reason is Succeeded, the ClusterExtension is making progress towards a new state.
	// When Progressing is True and the Reason is Retrying, the ClusterExtension has encountered an error that could be resolved on subsequent reconciliation attempts.
	// When Progressing is False and the Reason is Blocked, the ClusterExtension has encountered an error that requires manual intervention for recovery.
	//
	// When the ClusterExtension is sourced from a catalog, if may also communicate a deprecation condition.
	// These are indications from a package owner to guide users away from a particular package, channel, or bundle.
	// BundleDeprecated is set if the requested bundle version is marked deprecated in the catalog.
	// ChannelDeprecated is set if the requested channel is marked deprecated in the catalog.
	// PackageDeprecated is set if the requested package is marked deprecated in the catalog.
	// Deprecated is a rollup condition that is present when any of the deprecated conditions are present.
	//
	// +patchMergeKey=type
	// +patchStrategy=merge
	// +listType=map
	// +listMapKey=type
	// +optional
	Conditions []metav1.Condition `json:"conditions,omitempty" patchStrategy:"merge" patchMergeKey:"type" protobuf:"bytes,1,rep,name=conditions"`

	// install is a representation of the current installation status for this ClusterExtension.
	//
	// +optional
	Install *ClusterExtensionInstallStatus `json:"install,omitempty"`
}

// ClusterExtensionInstallStatus is a representation of the status of the identified bundle.
type ClusterExtensionInstallStatus struct {
	// bundle is a required field which represents the identifying attributes of a bundle.
	//
	// A "bundle" is a versioned set of content that represents the resources that
	// need to be applied to a cluster to install a package.
	//
	// +kubebuilder:validation:Required
	Bundle BundleMetadata `json:"bundle"`
}

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
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	// spec is an optional field that defines the desired state of the ClusterExtension.
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
	// +kubebuilder:validation:Required
	Items []ClusterExtension `json:"items"`
}

func init() {
	SchemeBuilder.Register(&ClusterExtension{}, &ClusterExtensionList{})
}
