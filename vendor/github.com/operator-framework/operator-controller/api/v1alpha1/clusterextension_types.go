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

package v1alpha1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"github.com/operator-framework/operator-controller/internal/conditionsets"
)

var (
	ClusterExtensionGVK  = SchemeBuilder.GroupVersion.WithKind("ClusterExtension")
	ClusterExtensionKind = ClusterExtensionGVK.Kind
)

type UpgradeConstraintPolicy string
type CRDUpgradeSafetyPolicy string

const (
	// The extension will only upgrade if the new version satisfies
	// the upgrade constraints set by the package author.
	UpgradeConstraintPolicyEnforce UpgradeConstraintPolicy = "Enforce"

	// Unsafe option which allows an extension to be
	// upgraded or downgraded to any available version of the package and
	// ignore the upgrade path designed by package authors.
	// This assumes that users independently verify the outcome of the changes.
	// Use with caution as this can lead to unknown and potentially
	// disastrous results such as data loss.
	UpgradeConstraintPolicyIgnore UpgradeConstraintPolicy = "Ignore"
)

// ClusterExtensionSpec defines the desired state of ClusterExtension
type ClusterExtensionSpec struct {
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
	Source SourceConfig `json:"source"`

	// install is a required field used to configure the installation options
	// for the ClusterExtension such as the installation namespace,
	// the service account and the pre-flight check configuration.
	//
	// Below is a minimal example of an installation definition (in yaml):
	// install:
	//    namespace: example-namespace
	//    serviceAccount:
	//      name: example-sa
	Install ClusterExtensionInstallConfig `json:"install"`
}

const SourceTypeCatalog = "Catalog"

// SourceConfig is a discriminated union which selects the installation source.
// +union
// +kubebuilder:validation:XValidation:rule="self.sourceType == 'Catalog' && has(self.catalog)",message="sourceType Catalog requires catalog field"
type SourceConfig struct {
	// sourceType is a required reference to the type of install source.
	//
	// Allowed values are ["Catalog"]
	//
	// When this field is set to "Catalog", information for determining the appropriate
	// bundle of content to install will be fetched from ClusterCatalog resources existing
	// on the cluster. When using the Catalog sourceType, the catalog field must also be set.
	//
	// +unionDiscriminator
	// +kubebuilder:validation:Enum:="Catalog"
	SourceType string `json:"sourceType"`

	// catalog is used to configure how information is sourced from a catalog. This field must be defined when sourceType is set to "Catalog",
	// and must be the only field defined for this sourceType.
	//
	// +optional.
	Catalog *CatalogSource `json:"catalog,omitempty"`
}

// ClusterExtensionInstallConfig is a union which selects the clusterExtension installation config.
// ClusterExtensionInstallConfig requires the namespace and serviceAccount which should be used for the installation of packages.
// +union
type ClusterExtensionInstallConfig struct {
	// namespace is a reference to the Namespace in which the bundle of
	// content for the package referenced in the packageName field will be applied.
	// The bundle may contain cluster-scoped resources or resources that are
	// applied to other Namespaces. This Namespace is expected to exist.
	//
	// namespace is required, immutable, and follows the DNS label standard
	// as defined in [RFC 1123]. This means that valid values:
	//   - Contain no more than 63 characters
	//   - Contain only lowercase alphanumeric characters or '-'
	//   - Start with an alphanumeric character
	//   - End with an alphanumeric character
	//
	// Some examples of valid values are:
	//   - some-namespace
	//   - 123-namespace
	//   - 1-namespace-2
	//   - somenamespace
	//
	// Some examples of invalid values are:
	//   - -some-namespace
	//   - some-namespace-
	//   - thisisareallylongnamespacenamethatisgreaterthanthemaximumlength
	//   - some.namespace
	//
	// [RFC 1123]: https://tools.ietf.org/html/rfc1123
	//
	//+kubebuilder:validation:Pattern:=^[a-z0-9]([-a-z0-9]*[a-z0-9])?$
	//+kubebuilder:validation:MaxLength:=63
	//+kubebuilder:validation:XValidation:rule="self == oldSelf",message="namespace is immutable"
	Namespace string `json:"namespace"`

	// serviceAccount is a required reference to a ServiceAccount that exists
	// in the installNamespace. The provided ServiceAccount is used to install and
	// manage the content for the package specified in the packageName field.
	//
	// In order to successfully install and manage the content for the package,
	// the ServiceAccount provided via this field should be configured with the
	// appropriate permissions to perform the necessary operations on all the
	// resources that are included in the bundle of content being applied.
	ServiceAccount ServiceAccountReference `json:"serviceAccount"`

	// preflight is an optional field that can be used to configure the preflight checks run before installation or upgrade of the content for the package specified in the packageName field.
	//
	// When specified, it overrides the default configuration of the preflight checks that are required to execute successfully during an install/upgrade operation.
	//
	// When not specified, the default configuration for each preflight check will be used.
	//
	//+optional
	Preflight *PreflightConfig `json:"preflight,omitempty"`
}

// CatalogSource defines the required fields for catalog source.
type CatalogSource struct {
	// packageName is a reference to the name of the package to be installed
	// and is used to filter the content from catalogs.
	//
	// This field is required, immutable and follows the DNS subdomain name
	// standard as defined in [RFC 1123]. This means that valid entries:
	//   - Contain no more than 253 characters
	//   - Contain only lowercase alphanumeric characters, '-', or '.'
	//   - Start with an alphanumeric character
	//   - End with an alphanumeric character
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
	//+kubebuilder:validation:MaxLength:=253
	//+kubebuilder:validation:Pattern:=^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$
	//+kubebuilder:validation:XValidation:rule="self == oldSelf",message="packageName is immutable"
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
	//+kubebuilder:validation:MaxLength:=64
	//+kubebuilder:validation:Pattern=`^(\s*(=||!=|>|<|>=|=>|<=|=<|~|~>|\^)\s*(v?(0|[1-9]\d*|[x|X|\*])(\.(0|[1-9]\d*|x|X|\*]))?(\.(0|[1-9]\d*|x|X|\*))?(-([0-9A-Za-z\-]+(\.[0-9A-Za-z\-]+)*))?(\+([0-9A-Za-z\-]+(\.[0-9A-Za-z\-]+)*))?)\s*)((?:\s+|,\s*|\s*\|\|\s*)(=||!=|>|<|>=|=>|<=|=<|~|~>|\^)\s*(v?(0|[1-9]\d*|x|X|\*])(\.(0|[1-9]\d*|x|X|\*))?(\.(0|[1-9]\d*|x|X|\*]))?(-([0-9A-Za-z\-]+(\.[0-9A-Za-z\-]+)*))?(\+([0-9A-Za-z\-]+(\.[0-9A-Za-z\-]+)*))?)\s*)*$`
	//+optional
	Version string `json:"version,omitempty"`

	// channel is an optional reference to a channel belonging to
	// the package specified in the packageName field.
	//
	// A "channel" is a package author defined stream of updates for an extension.
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
	// This field follows the DNS subdomain name standard as defined in [RFC
	// 1123]. This means that valid entries:
	//   - Contain no more than 253 characters
	//   - Contain only lowercase alphanumeric characters, '-', or '.'
	//   - Start with an alphanumeric character
	//   - End with an alphanumeric character
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
	//+kubebuilder:validation:MaxLength:=253
	//+kubebuilder:validation:Pattern:=^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$
	//+optional
	Channel string `json:"channel,omitempty"`

	// selector is an optional field that can be used
	// to filter the set of ClusterCatalogs used in the bundle
	// selection process.
	//
	// When unspecified, all ClusterCatalogs will be used in
	// the bundle selection process.
	//
	//+optional
	Selector metav1.LabelSelector `json:"selector,omitempty"`

	// upgradeConstraintPolicy is an optional field that controls whether
	// the upgrade path(s) defined in the catalog are enforced for the package
	// referenced in the packageName field.
	//
	// Allowed values are: ["Enforce", "Ignore"].
	//
	// When this field is set to "Enforce", automatic upgrades will only occur
	// when upgrade constraints specified by the package author are met.
	//
	// When this field is set to "Ignore", the upgrade constraints specified by
	// the package author are ignored. This allows for upgrades and downgrades to
	// any version of the package. This is considered a dangerous operation as it
	// can lead to unknown and potentially disastrous outcomes, such as data
	// loss. It is assumed that users have independently verified changes when
	// using this option.
	//
	// If unspecified, the default value is "Enforce".
	//
	//+kubebuilder:validation:Enum:=Enforce;Ignore
	//+kubebuilder:default:=Enforce
	//+optional
	UpgradeConstraintPolicy UpgradeConstraintPolicy `json:"upgradeConstraintPolicy,omitempty"`
}

// ServiceAccountReference references a serviceAccount.
type ServiceAccountReference struct {
	// name is a required, immutable reference to the name of the ServiceAccount
	// to be used for installation and management of the content for the package
	// specified in the packageName field.
	//
	// This ServiceAccount is expected to exist in the installNamespace.
	//
	// This field follows the DNS subdomain name standard as defined in [RFC
	// 1123]. This means that valid values:
	//   - Contain no more than 253 characters
	//   - Contain only lowercase alphanumeric characters, '-', or '.'
	//   - Start with an alphanumeric character
	//   - End with an alphanumeric character
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
	//+kubebuilder:validation:MaxLength:=253
	//+kubebuilder:validation:Pattern:=^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$
	//+kubebuilder:validation:XValidation:rule="self == oldSelf",message="name is immutable"
	Name string `json:"name"`
}

// PreflightConfig holds the configuration for the preflight checks.
type PreflightConfig struct {
	// crdUpgradeSafety is used to configure the CRD Upgrade Safety pre-flight
	// checks that run prior to upgrades of installed content.
	//
	// The CRD Upgrade Safety pre-flight check safeguards from unintended
	// consequences of upgrading a CRD, such as data loss.
	//
	// This field is required if the spec.preflight field is specified.
	CRDUpgradeSafety *CRDUpgradeSafetyPreflightConfig `json:"crdUpgradeSafety"`
}

// CRDUpgradeSafetyPreflightConfig is the configuration for CRD upgrade safety preflight check.
type CRDUpgradeSafetyPreflightConfig struct {
	// policy is used to configure the state of the CRD Upgrade Safety pre-flight check.
	//
	// This field is required when the spec.preflight.crdUpgradeSafety field is
	// specified.
	//
	// Allowed values are ["Enabled", "Disabled"]. The default value is "Enabled".
	//
	// When set to "Disabled", the CRD Upgrade Safety pre-flight check will be skipped
	// when performing an upgrade operation. This should be used with caution as
	// unintended consequences such as data loss can occur.
	//
	// When set to "Enabled", the CRD Upgrade Safety pre-flight check will be run when
	// performing an upgrade operation.
	//
	//+kubebuilder:validation:Enum:="Enabled";"Disabled"
	//+kubebuilder:default:=Enabled
	Policy CRDUpgradeSafetyPolicy `json:"policy"`
}

const (
	// TODO(user): add more Types, here and into init()
	TypeInstalled = "Installed"
	TypeResolved  = "Resolved"

	// TypeDeprecated is a rollup condition that is present when
	// any of the deprecated conditions are present.
	TypeDeprecated        = "Deprecated"
	TypePackageDeprecated = "PackageDeprecated"
	TypeChannelDeprecated = "ChannelDeprecated"
	TypeBundleDeprecated  = "BundleDeprecated"
	TypeUnpacked          = "Unpacked"

	ReasonErrorGettingClient = "ErrorGettingClient"
	ReasonBundleLoadFailed   = "BundleLoadFailed"

	ReasonInstallationFailed = "InstallationFailed"
	ReasonResolutionFailed   = "ResolutionFailed"

	ReasonSuccess       = "Success"
	ReasonDeprecated    = "Deprecated"
	ReasonUpgradeFailed = "UpgradeFailed"

	ReasonUnpackSuccess = "UnpackSuccess"
	ReasonUnpackFailed  = "UnpackFailed"

	ReasonErrorGettingReleaseState = "ErrorGettingReleaseState"

	CRDUpgradeSafetyPolicyEnabled  CRDUpgradeSafetyPolicy = "Enabled"
	CRDUpgradeSafetyPolicyDisabled CRDUpgradeSafetyPolicy = "Disabled"
)

func init() {
	// TODO(user): add Types from above
	conditionsets.ConditionTypes = append(conditionsets.ConditionTypes,
		TypeInstalled,
		TypeResolved,
		TypeDeprecated,
		TypePackageDeprecated,
		TypeChannelDeprecated,
		TypeBundleDeprecated,
		TypeUnpacked,
	)
	// TODO(user): add Reasons from above
	conditionsets.ConditionReasons = append(conditionsets.ConditionReasons,
		ReasonResolutionFailed,
		ReasonInstallationFailed,
		ReasonSuccess,
		ReasonDeprecated,
		ReasonUpgradeFailed,
		ReasonBundleLoadFailed,
		ReasonErrorGettingClient,
		ReasonUnpackSuccess,
		ReasonUnpackFailed,
		ReasonErrorGettingReleaseState,
	)
}

type BundleMetadata struct {
	// name is a required field and is a reference
	// to the name of a bundle
	Name string `json:"name"`
	// version is a required field and is a reference
	// to the version that this bundle represents
	Version string `json:"version"`
}

// ClusterExtensionStatus defines the observed state of ClusterExtension.
type ClusterExtensionStatus struct {
	Install *ClusterExtensionInstallStatus `json:"install,omitempty"`

	Resolution *ClusterExtensionResolutionStatus `json:"resolution,omitempty"`

	// conditions is a representation of the current state for this ClusterExtension.
	// The status is represented by a set of "conditions".
	//
	// Each condition is generally structured in the following format:
	//   - Type: a string representation of the condition type. More or less the condition "name".
	//   - Status: a string representation of the state of the condition. Can be one of ["True", "False", "Unknown"].
	//   - Reason: a string representation of the reason for the current state of the condition. Typically useful for building automation around particular Type+Reason combinations.
	//   - Message: a human readable message that further elaborates on the state of the condition
	//
	// The current set of condition types are:
	//   - "Installed", represents whether or not the package referenced in the spec.packageName field has been installed
	//   - "Resolved", represents whether or not a bundle was found that satisfies the selection criteria outlined in the spec
	//   - "Deprecated", represents an aggregation of the PackageDeprecated, ChannelDeprecated, and BundleDeprecated condition types.
	//   - "PackageDeprecated", represents whether or not the package specified in the spec.packageName field has been deprecated
	//   - "ChannelDeprecated", represents whether or not the channel specified in spec.channel has been deprecated
	//   - "BundleDeprecated", represents whether or not the bundle installed is deprecated
	//   - "Unpacked", represents whether or not the bundle contents have been successfully unpacked
	//
	// The current set of reasons are:
	//   - "ResolutionFailed", this reason is set on the "Resolved" condition when an error has occurred during resolution.
	//   - "InstallationFailed", this reason is set on the "Installed" condition when an error has occurred during installation
	//   - "Success", this reason is set on the "Resolved" and "Installed" conditions when resolution and installation/upgrading is successful
	//   - "UnpackSuccess", this reason is set on the "Unpacked" condition when unpacking a bundle's content is successful
	//   - "UnpackFailed", this reason is set on the "Unpacked" condition when an error has been encountered while unpacking the contents of a bundle
	//
	// +patchMergeKey=type
	// +patchStrategy=merge
	// +listType=map
	// +listMapKey=type
	Conditions []metav1.Condition `json:"conditions,omitempty" patchStrategy:"merge" patchMergeKey:"type" protobuf:"bytes,1,rep,name=conditions"`
}

type ClusterExtensionInstallStatus struct {
	// bundle is a representation of the currently installed bundle.
	//
	// A "bundle" is a versioned set of content that represents the resources that
	// need to be applied to a cluster to install a package.
	//
	// This field is only updated once a bundle has been successfully installed and
	// once set will only be updated when a new version of the bundle has
	// successfully replaced the currently installed version.
	//
	//+optional
	Bundle *BundleMetadata `json:"bundle,omitempty"`
}

type ClusterExtensionResolutionStatus struct {
	// bundle is a representation of the bundle that was identified during
	// resolution to meet all installation/upgrade constraints and is slated to be
	// installed or upgraded to.
	//
	//+optional
	Bundle *BundleMetadata `json:"bundle,omitempty"`
}

//+kubebuilder:object:root=true
//+kubebuilder:resource:scope=Cluster
//+kubebuilder:subresource:status

// ClusterExtension is the Schema for the clusterextensions API
type ClusterExtension struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ClusterExtensionSpec   `json:"spec,omitempty"`
	Status ClusterExtensionStatus `json:"status,omitempty"`
}

//+kubebuilder:object:root=true

// ClusterExtensionList contains a list of ClusterExtension
type ClusterExtensionList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []ClusterExtension `json:"items"`
}

func init() {
	SchemeBuilder.Register(&ClusterExtension{}, &ClusterExtensionList{})
}
