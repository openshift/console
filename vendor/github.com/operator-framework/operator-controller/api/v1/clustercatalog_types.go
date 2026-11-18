/*
Copyright 2024.

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
	"k8s.io/apimachinery/pkg/runtime"
)

// SourceType defines the type of source used for catalogs.
// +enum
type SourceType string

// AvailabilityMode defines the availability of the catalog
type AvailabilityMode string

const (
	SourceTypeImage SourceType = "Image"

	MetadataNameLabel = "olm.operatorframework.io/metadata.name"

	AvailabilityModeAvailable   AvailabilityMode = "Available"
	AvailabilityModeUnavailable AvailabilityMode = "Unavailable"

	// Condition types
	TypeServing = "Serving"

	// Serving Reasons
	ReasonAvailable                = "Available"
	ReasonUnavailable              = "Unavailable"
	ReasonUserSpecifiedUnavailable = "UserSpecifiedUnavailable"
)

// +genclient
// +genclient:nonNamespaced
//+kubebuilder:object:root=true
//+kubebuilder:resource:scope=Cluster
//+kubebuilder:subresource:status
//+kubebuilder:printcolumn:name=LastUnpacked,type=date,JSONPath=`.status.lastUnpacked`
//+kubebuilder:printcolumn:name="Serving",type=string,JSONPath=`.status.conditions[?(@.type=="Serving")].status`
//+kubebuilder:printcolumn:name=Age,type=date,JSONPath=`.metadata.creationTimestamp`

// ClusterCatalog makes File-Based Catalog (FBC) data available to your cluster.
// For more information on FBC, see https://olm.operatorframework.io/docs/reference/file-based-catalogs/#docs
type ClusterCatalog struct {
	metav1.TypeMeta `json:",inline"`

	// metadata is the standard object's metadata.
	// More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
	metav1.ObjectMeta `json:"metadata"`

	// spec is a required field that defines the desired state of the ClusterCatalog.
	// The controller ensures that the catalog is unpacked and served over the catalog content HTTP server.
	// +required
	Spec ClusterCatalogSpec `json:"spec"`

	// status contains the following information about the state of the ClusterCatalog:
	//   - Whether the catalog contents are being served via the catalog content HTTP server
	//   - Whether the ClusterCatalog is progressing to a new state
	//   - A reference to the source from which the catalog contents were retrieved
	// +optional
	Status ClusterCatalogStatus `json:"status,omitempty"`
}

//+kubebuilder:object:root=true

// ClusterCatalogList contains a list of ClusterCatalog
type ClusterCatalogList struct {
	metav1.TypeMeta `json:",inline"`

	// metadata is the standard object's metadata.
	// More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
	metav1.ListMeta `json:"metadata"`

	// items is a list of ClusterCatalogs.
	// items is required.
	// +required
	Items []ClusterCatalog `json:"items"`
}

// ClusterCatalogSpec defines the desired state of ClusterCatalog
type ClusterCatalogSpec struct {
	// source is a required field that defines the source of a catalog.
	// A catalog contains information on content that can be installed on a cluster.
	// The catalog source makes catalog contents discoverable and usable by other on-cluster components.
	// These components can present the content in a GUI dashboard or install content from the catalog on the cluster.
	// The catalog source must contain catalog metadata in the File-Based Catalog (FBC) format.
	// For more information on FBC, see https://olm.operatorframework.io/docs/reference/file-based-catalogs/#docs.
	//
	// Below is a minimal example of a ClusterCatalogSpec that sources a catalog from an image:
	//
	//  source:
	//    type: Image
	//    image:
	//      ref: quay.io/operatorhubio/catalog:latest
	//
	// +required
	Source CatalogSource `json:"source"`

	// priority is an optional field that defines a priority for this ClusterCatalog.
	//
	// Clients use the ClusterCatalog priority as a tie-breaker between ClusterCatalogs that meet their requirements.
	// Higher numbers mean higher priority.
	//
	// Clients decide how to handle scenarios where multiple ClusterCatalogs with the same priority meet their requirements.
	// Clients should prompt users for additional input to break the tie.
	//
	// When omitted, the default priority is 0.
	//
	// Use negative numbers to specify a priority lower than the default.
	// Use positive numbers to specify a priority higher than the default.
	//
	// The lowest possible value is -2147483648.
	// The highest possible value is 2147483647.
	//
	// +kubebuilder:default:=0
	// +kubebuilder:validation:Minimum:=-2147483648
	// +kubebuilder:validation:Maximum:=2147483647
	// +optional
	Priority int32 `json:"priority"`

	// availabilityMode is an optional field that defines how the ClusterCatalog is made available to clients on the cluster.
	//
	// Allowed values are "Available", "Unavailable", or omitted.
	//
	// When omitted, the default value is "Available".
	//
	// When set to "Available", the catalog contents are unpacked and served over the catalog content HTTP server.
	// Clients should consider this ClusterCatalog and its contents as usable.
	//
	// When set to "Unavailable", the catalog contents are no longer served over the catalog content HTTP server.
	// Treat this the same as if the ClusterCatalog does not exist.
	// Use "Unavailable" when you want to keep the ClusterCatalog but treat it as if it doesn't exist.
	//
	// +kubebuilder:validation:Enum:="Unavailable";"Available"
	// +kubebuilder:default:="Available"
	// +optional
	AvailabilityMode AvailabilityMode `json:"availabilityMode,omitempty"`
}

// ClusterCatalogStatus defines the observed state of ClusterCatalog
type ClusterCatalogStatus struct {
	// conditions represents the current state of this ClusterCatalog.
	//
	// The current condition types are Serving and Progressing.
	//
	// The Serving condition represents whether the catalog contents are being served via the HTTP(S) web server:
	//   - When status is True and reason is Available, the catalog contents are being served.
	//   - When status is False and reason is Unavailable, the catalog contents are not being served because the contents are not yet available.
	//   - When status is False and reason is UserSpecifiedUnavailable, the catalog contents are not being served because the catalog has been intentionally marked as unavailable.
	//
	// The Progressing condition represents whether the ClusterCatalog is progressing or is ready to progress towards a new state:
	//   - When status is True and reason is Retrying, an error occurred that may be resolved on subsequent reconciliation attempts.
	//   - When status is True and reason is Succeeded, the ClusterCatalog has successfully progressed to a new state and is ready to continue progressing.
	//   - When status is False and reason is Blocked, an error occurred that requires manual intervention for recovery.
	//
	// If the system initially fetched contents and polling identifies updates, both conditions can be active simultaneously:
	//   - The Serving condition remains True with reason Available because the previous contents are still served via the HTTP(S) web server.
	//   - The Progressing condition is True with reason Retrying because the system is working to serve the new version.
	//
	// +listType=map
	// +listMapKey=type
	// +optional
	Conditions []metav1.Condition `json:"conditions,omitempty"`
	// resolvedSource contains information about the resolved source based on the source type.
	// +optional
	ResolvedSource *ResolvedCatalogSource `json:"resolvedSource,omitempty"`
	// urls contains the URLs that can be used to access the catalog.
	// +optional
	URLs *ClusterCatalogURLs `json:"urls,omitempty"`
	// lastUnpacked represents the last time the catalog contents were extracted from their source format.
	// For example, when using an Image source, the OCI image is pulled and image layers are written to a file-system backed cache.
	// This extraction from the source format is called "unpacking".
	// +optional
	LastUnpacked *metav1.Time `json:"lastUnpacked,omitempty"`
}

// ClusterCatalogURLs contains the URLs that can be used to access the catalog.
type ClusterCatalogURLs struct {
	// base is a cluster-internal URL that provides endpoints for accessing the catalog content.
	//
	// Clients should append the path for the endpoint they want to access.
	//
	// Currently, only a single endpoint is served and is accessible at the path /api/v1.
	//
	// The endpoints served for the v1 API are:
	//   - /all - this endpoint returns the entire catalog contents in the FBC format
	//
	// New endpoints may be added as needs evolve.
	//
	// +required
	// +kubebuilder:validation:MaxLength:=525
	// +kubebuilder:validation:XValidation:rule="isURL(self)",message="must be a valid URL"
	// +kubebuilder:validation:XValidation:rule="isURL(self) ? (url(self).getScheme() == \"http\" || url(self).getScheme() == \"https\") : true",message="scheme must be either http or https"
	Base string `json:"base"`
}

// CatalogSource is a discriminated union of possible sources for a Catalog.
// CatalogSource contains the sourcing information for a Catalog
// +union
// +kubebuilder:validation:XValidation:rule="has(self.type) && self.type == 'Image' ? has(self.image) : !has(self.image)",message="image is required when source type is Image, and forbidden otherwise"
type CatalogSource struct {
	// type is a required field that specifies the type of source for the catalog.
	//
	// The only allowed value is "Image".
	//
	// When set to "Image", the ClusterCatalog content is sourced from an OCI image.
	// When using an image source, the image field must be set and must be the only field defined for this type.
	//
	// +unionDiscriminator
	// +kubebuilder:validation:Enum:="Image"
	// +required
	Type SourceType `json:"type"`
	// image configures how catalog contents are sourced from an OCI image.
	// It is required when type is Image, and forbidden otherwise.
	// +optional
	Image *ImageSource `json:"image,omitempty"`
}

// ResolvedCatalogSource is a discriminated union of resolution information for a Catalog.
// ResolvedCatalogSource contains the information about a sourced Catalog
// +union
// +kubebuilder:validation:XValidation:rule="has(self.type) && self.type == 'Image' ? has(self.image) : !has(self.image)",message="image is required when source type is Image, and forbidden otherwise"
type ResolvedCatalogSource struct {
	// type is a required field that specifies the type of source for the catalog.
	//
	// The only allowed value is "Image".
	//
	// When set to "Image", information about the resolved image source is set in the image field.
	//
	// +unionDiscriminator
	// +kubebuilder:validation:Enum:="Image"
	// +required
	Type SourceType `json:"type"`
	// image contains resolution information for a catalog sourced from an image.
	// It must be set when type is Image, and forbidden otherwise.
	Image *ResolvedImageSource `json:"image"`
}

// ResolvedImageSource provides information about the resolved source of a Catalog sourced from an image.
type ResolvedImageSource struct {
	// ref contains the resolved image digest-based reference.
	// The digest format allows you to use other tooling to fetch the exact OCI manifests
	// that were used to extract the catalog contents.
	// +required
	// +kubebuilder:validation:MaxLength:=1000
	// +kubebuilder:validation:XValidation:rule="self.matches('^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])((\\\\.([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]))+)?(:[0-9]+)?\\\\b')",message="must start with a valid domain. valid domains must be alphanumeric characters (lowercase and uppercase) separated by the \".\" character."
	// +kubebuilder:validation:XValidation:rule="self.find('(\\\\/[a-z0-9]+((([._]|__|[-]*)[a-z0-9]+)+)?((\\\\/[a-z0-9]+((([._]|__|[-]*)[a-z0-9]+)+)?)+)?)') != \"\"",message="a valid name is required. valid names must contain lowercase alphanumeric characters separated only by the \".\", \"_\", \"__\", \"-\" characters."
	// +kubebuilder:validation:XValidation:rule="self.find('(@.*:)') != \"\"",message="must end with a digest"
	// +kubebuilder:validation:XValidation:rule="self.find('(@.*:)') != \"\" ? self.find('(@.*:)').matches('(@[A-Za-z][A-Za-z0-9]*([-_+.][A-Za-z][A-Za-z0-9]*)*[:])') : true",message="digest algorithm is not valid. valid algorithms must start with an uppercase or lowercase alpha character followed by alphanumeric characters and may contain the \"-\", \"_\", \"+\", and \".\" characters."
	// +kubebuilder:validation:XValidation:rule="self.find('(@.*:)') != \"\" ? self.find(':.*$').substring(1).size() >= 32 : true",message="digest is not valid. the encoded string must be at least 32 characters"
	// +kubebuilder:validation:XValidation:rule="self.find('(@.*:)') != \"\" ? self.find(':.*$').matches(':[0-9A-Fa-f]*$') : true",message="digest is not valid. the encoded string must only contain hex characters (A-F, a-f, 0-9)"
	Ref string `json:"ref"`
}

// ImageSource enables users to define the information required for sourcing a Catalog from an OCI image
//
// If we see that there is a possibly valid digest-based image reference AND pollIntervalMinutes is specified,
// reject the resource since there is no use in polling a digest-based image reference.
// +kubebuilder:validation:XValidation:rule="self.ref.find('(@.*:)') != \"\" ? !has(self.pollIntervalMinutes) : true",message="cannot specify pollIntervalMinutes while using digest-based image"
type ImageSource struct {
	// ref is a required field that defines the reference to a container image containing catalog contents.
	// It cannot be more than 1000 characters.
	//
	// A reference has 3 parts: the domain, name, and identifier.
	//
	// The domain is typically the registry where an image is located.
	// It must be alphanumeric characters (lowercase and uppercase) separated by the "." character.
	// Hyphenation is allowed, but the domain must start and end with alphanumeric characters.
	// Specifying a port to use is also allowed by adding the ":" character followed by numeric values.
	// The port must be the last value in the domain.
	// Some examples of valid domain values are "registry.mydomain.io", "quay.io", "my-registry.io:8080".
	//
	// The name is typically the repository in the registry where an image is located.
	// It must contain lowercase alphanumeric characters separated only by the ".", "_", "__", "-" characters.
	// Multiple names can be concatenated with the "/" character.
	// The domain and name are combined using the "/" character.
	// Some examples of valid name values are "operatorhubio/catalog", "catalog", "my-catalog.prod".
	// An example of the domain and name parts of a reference being combined is "quay.io/operatorhubio/catalog".
	//
	// The identifier is typically the tag or digest for an image reference and is present at the end of the reference.
	// It starts with a separator character used to distinguish the end of the name and beginning of the identifier.
	// For a digest-based reference, the "@" character is the separator.
	// For a tag-based reference, the ":" character is the separator.
	// An identifier is required in the reference.
	//
	// Digest-based references must contain an algorithm reference immediately after the "@" separator.
	// The algorithm reference must be followed by the ":" character and an encoded string.
	// The algorithm must start with an uppercase or lowercase alpha character followed by alphanumeric characters and may contain the "-", "_", "+", and "." characters.
	// Some examples of valid algorithm values are "sha256", "sha256+b64u", "multihash+base58".
	// The encoded string following the algorithm must be hex digits (a-f, A-F, 0-9) and must be a minimum of 32 characters.
	//
	// Tag-based references must begin with a word character (alphanumeric + "_") followed by word characters or ".", and "-" characters.
	// The tag must not be longer than 127 characters.
	//
	// An example of a valid digest-based image reference is "quay.io/operatorhubio/catalog@sha256:200d4ddb2a73594b91358fe6397424e975205bfbe44614f5846033cad64b3f05"
	// An example of a valid tag-based image reference is "quay.io/operatorhubio/catalog:latest"
	//
	// +required
	// +kubebuilder:validation:MaxLength:=1000
	// +kubebuilder:validation:XValidation:rule="self.matches('^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])((\\\\.([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]))+)?(:[0-9]+)?\\\\b')",message="must start with a valid domain. valid domains must be alphanumeric characters (lowercase and uppercase) separated by the \".\" character."
	// +kubebuilder:validation:XValidation:rule="self.find('(\\\\/[a-z0-9]+((([._]|__|[-]*)[a-z0-9]+)+)?((\\\\/[a-z0-9]+((([._]|__|[-]*)[a-z0-9]+)+)?)+)?)') != \"\"",message="a valid name is required. valid names must contain lowercase alphanumeric characters separated only by the \".\", \"_\", \"__\", \"-\" characters."
	// +kubebuilder:validation:XValidation:rule="self.find('(@.*:)') != \"\" || self.find(':.*$') != \"\"",message="must end with a digest or a tag"
	// +kubebuilder:validation:XValidation:rule="self.find('(@.*:)') == \"\" ? (self.find(':.*$') != \"\" ? self.find(':.*$').substring(1).size() <= 127 : true) : true",message="tag is invalid. the tag must not be more than 127 characters"
	// +kubebuilder:validation:XValidation:rule="self.find('(@.*:)') == \"\" ? (self.find(':.*$') != \"\" ? self.find(':.*$').matches(':[\\\\w][\\\\w.-]*$') : true) : true",message="tag is invalid. valid tags must begin with a word character (alphanumeric + \"_\") followed by word characters or \".\", and \"-\" characters"
	// +kubebuilder:validation:XValidation:rule="self.find('(@.*:)') != \"\" ? self.find('(@.*:)').matches('(@[A-Za-z][A-Za-z0-9]*([-_+.][A-Za-z][A-Za-z0-9]*)*[:])') : true",message="digest algorithm is not valid. valid algorithms must start with an uppercase or lowercase alpha character followed by alphanumeric characters and may contain the \"-\", \"_\", \"+\", and \".\" characters."
	// +kubebuilder:validation:XValidation:rule="self.find('(@.*:)') != \"\" ? self.find(':.*$').substring(1).size() >= 32 : true",message="digest is not valid. the encoded string must be at least 32 characters"
	// +kubebuilder:validation:XValidation:rule="self.find('(@.*:)') != \"\" ? self.find(':.*$').matches(':[0-9A-Fa-f]*$') : true",message="digest is not valid. the encoded string must only contain hex characters (A-F, a-f, 0-9)"
	Ref string `json:"ref"`

	// pollIntervalMinutes is an optional field that sets the interval, in minutes, at which the image source is polled for new content.
	// You cannot specify pollIntervalMinutes when ref is a digest-based reference.
	//
	// When omitted, the image is not polled for new content.
	// +kubebuilder:validation:Minimum:=1
	// +optional
	PollIntervalMinutes *int `json:"pollIntervalMinutes,omitempty"`
}

func init() {
	SchemeBuilder.Register(func(s *runtime.Scheme) error {
		s.AddKnownTypes(GroupVersion, &ClusterCatalog{}, &ClusterCatalogList{})
		return nil
	})
}
