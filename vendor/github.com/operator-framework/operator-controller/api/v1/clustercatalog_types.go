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
)

//+kubebuilder:object:root=true
//+kubebuilder:resource:scope=Cluster
//+kubebuilder:subresource:status
//+kubebuilder:printcolumn:name=LastUnpacked,type=date,JSONPath=`.status.lastUnpacked`
//+kubebuilder:printcolumn:name="Serving",type=string,JSONPath=`.status.conditions[?(@.type=="Serving")].status`
//+kubebuilder:printcolumn:name=Age,type=date,JSONPath=`.metadata.creationTimestamp`

// ClusterCatalog enables users to make File-Based Catalog (FBC) catalog data available to the cluster.
// For more information on FBC, see https://olm.operatorframework.io/docs/reference/file-based-catalogs/#docs
type ClusterCatalog struct {
	metav1.TypeMeta `json:",inline"`

	// metadata is the standard object's metadata.
	// More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
	metav1.ObjectMeta `json:"metadata"`

	// spec is the desired state of the ClusterCatalog.
	// spec is required.
	// The controller will work to ensure that the desired
	// catalog is unpacked and served over the catalog content HTTP server.
	// +kubebuilder:validation:Required
	Spec ClusterCatalogSpec `json:"spec"`

	// status contains information about the state of the ClusterCatalog such as:
	//   - Whether or not the catalog contents are being served via the catalog content HTTP server
	//   - Whether or not the ClusterCatalog is progressing to a new state
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
	// +kubebuilder:validation:Required
	Items []ClusterCatalog `json:"items"`
}

// ClusterCatalogSpec defines the desired state of ClusterCatalog
type ClusterCatalogSpec struct {
	// source allows a user to define the source of a catalog.
	// A "catalog" contains information on content that can be installed on a cluster.
	// Providing a catalog source makes the contents of the catalog discoverable and usable by
	// other on-cluster components.
	// These on-cluster components may do a variety of things with this information, such as
	// presenting the content in a GUI dashboard or installing content from the catalog on the cluster.
	// The catalog source must contain catalog metadata in the File-Based Catalog (FBC) format.
	// For more information on FBC, see https://olm.operatorframework.io/docs/reference/file-based-catalogs/#docs.
	// source is a required field.
	//
	// Below is a minimal example of a ClusterCatalogSpec that sources a catalog from an image:
	//
	//  source:
	//    type: Image
	//    image:
	//      ref: quay.io/operatorhubio/catalog:latest
	//
	// +kubebuilder:validation:Required
	Source CatalogSource `json:"source"`

	// priority allows the user to define a priority for a ClusterCatalog.
	// priority is optional.
	//
	// A ClusterCatalog's priority is used by clients as a tie-breaker between ClusterCatalogs that meet the client's requirements.
	// A higher number means higher priority.
	//
	// It is up to clients to decide how to handle scenarios where multiple ClusterCatalogs with the same priority meet their requirements.
	// When deciding how to break the tie in this scenario, it is recommended that clients prompt their users for additional input.
	//
	// When omitted, the default priority is 0 because that is the zero value of integers.
	//
	// Negative numbers can be used to specify a priority lower than the default.
	// Positive numbers can be used to specify a priority higher than the default.
	//
	// The lowest possible value is -2147483648.
	// The highest possible value is 2147483647.
	//
	// +kubebuilder:default:=0
	// +kubebuilder:validation:minimum:=-2147483648
	// +kubebuilder:validation:maximum:=2147483647
	// +optional
	Priority int32 `json:"priority"`

	// availabilityMode allows users to define how the ClusterCatalog is made available to clients on the cluster.
	// availabilityMode is optional.
	//
	// Allowed values are "Available" and "Unavailable" and omitted.
	//
	// When omitted, the default value is "Available".
	//
	// When set to "Available", the catalog contents will be unpacked and served over the catalog content HTTP server.
	// Setting the availabilityMode to "Available" tells clients that they should consider this ClusterCatalog
	// and its contents as usable.
	//
	// When set to "Unavailable", the catalog contents will no longer be served over the catalog content HTTP server.
	// When set to this availabilityMode it should be interpreted the same as the ClusterCatalog not existing.
	// Setting the availabilityMode to "Unavailable" can be useful in scenarios where a user may not want
	// to delete the ClusterCatalog all together, but would still like it to be treated as if it doesn't exist.
	//
	// +kubebuilder:validation:Enum:="Unavailable";"Available"
	// +kubebuilder:default:="Available"
	// +optional
	AvailabilityMode AvailabilityMode `json:"availabilityMode,omitempty"`
}

// ClusterCatalogStatus defines the observed state of ClusterCatalog
type ClusterCatalogStatus struct {
	// conditions is a representation of the current state for this ClusterCatalog.
	//
	// The current condition types are Serving and Progressing.
	//
	// The Serving condition is used to represent whether or not the contents of the catalog is being served via the HTTP(S) web server.
	// When it has a status of True and a reason of Available, the contents of the catalog are being served.
	// When it has a status of False and a reason of Unavailable, the contents of the catalog are not being served because the contents are not yet available.
	// When it has a status of False and a reason of UserSpecifiedUnavailable, the contents of the catalog are not being served because the catalog has been intentionally marked as unavailable.
	//
	// The Progressing condition is used to represent whether or not the ClusterCatalog is progressing or is ready to progress towards a new state.
	// When it has a status of True and a reason of Retrying, there was an error in the progression of the ClusterCatalog that may be resolved on subsequent reconciliation attempts.
	// When it has a status of True and a reason of Succeeded, the ClusterCatalog has successfully progressed to a new state and is ready to continue progressing.
	// When it has a status of False and a reason of Blocked, there was an error in the progression of the ClusterCatalog that requires manual intervention for recovery.
	//
	// In the case that the Serving condition is True with reason Available and Progressing is True with reason Retrying, the previously fetched
	// catalog contents are still being served via the HTTP(S) web server while we are progressing towards serving a new version of the catalog
	// contents. This could occur when we've initially fetched the latest contents from the source for this catalog and when polling for changes
	// to the contents we identify that there are updates to the contents.
	//
	// +listType=map
	// +listMapKey=type
	// +optional
	Conditions []metav1.Condition `json:"conditions,omitempty" patchStrategy:"merge" patchMergeKey:"type" protobuf:"bytes,1,rep,name=conditions"`
	// resolvedSource contains information about the resolved source based on the source type.
	// +optional
	ResolvedSource *ResolvedCatalogSource `json:"resolvedSource,omitempty"`
	// urls contains the URLs that can be used to access the catalog.
	// +optional
	URLs *ClusterCatalogURLs `json:"urls,omitempty"`
	// lastUnpacked represents the last time the contents of the
	// catalog were extracted from their source format. As an example,
	// when using an Image source, the OCI image will be pulled and the
	// image layers written to a file-system backed cache. We refer to the
	// act of this extraction from the source format as "unpacking".
	// +optional
	LastUnpacked *metav1.Time `json:"lastUnpacked,omitempty"`
}

// ClusterCatalogURLs contains the URLs that can be used to access the catalog.
type ClusterCatalogURLs struct {
	// base is a cluster-internal URL that provides endpoints for
	// accessing the content of the catalog.
	//
	// It is expected that clients append the path for the endpoint they wish
	// to access.
	//
	// Currently, only a single endpoint is served and is accessible at the path
	// /api/v1.
	//
	// The endpoints served for the v1 API are:
	//   - /all - this endpoint returns the entirety of the catalog contents in the FBC format
	//
	// As the needs of users and clients of the evolve, new endpoints may be added.
	//
	// +kubebuilder:validation:Required
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
	// type is a reference to the type of source the catalog is sourced from.
	// type is required.
	//
	// The only allowed value is "Image".
	//
	// When set to "Image", the ClusterCatalog content will be sourced from an OCI image.
	// When using an image source, the image field must be set and must be the only field defined for this type.
	//
	// +unionDiscriminator
	// +kubebuilder:validation:Enum:="Image"
	// +kubebuilder:validation:Required
	Type SourceType `json:"type"`
	// image is used to configure how catalog contents are sourced from an OCI image.
	// This field is required when type is Image, and forbidden otherwise.
	// +optional
	Image *ImageSource `json:"image,omitempty"`
}

// ResolvedCatalogSource is a discriminated union of resolution information for a Catalog.
// ResolvedCatalogSource contains the information about a sourced Catalog
// +union
// +kubebuilder:validation:XValidation:rule="has(self.type) && self.type == 'Image' ? has(self.image) : !has(self.image)",message="image is required when source type is Image, and forbidden otherwise"
type ResolvedCatalogSource struct {
	// type is a reference to the type of source the catalog is sourced from.
	// type is required.
	//
	// The only allowed value is "Image".
	//
	// When set to "Image", information about the resolved image source will be set in the 'image' field.
	//
	// +unionDiscriminator
	// +kubebuilder:validation:Enum:="Image"
	// +kubebuilder:validation:Required
	Type SourceType `json:"type"`
	// image is a field containing resolution information for a catalog sourced from an image.
	// This field must be set when type is Image, and forbidden otherwise.
	Image *ResolvedImageSource `json:"image"`
}

// ResolvedImageSource provides information about the resolved source of a Catalog sourced from an image.
type ResolvedImageSource struct {
	// ref contains the resolved image digest-based reference.
	// The digest format is used so users can use other tooling to fetch the exact
	// OCI manifests that were used to extract the catalog contents.
	// +kubebuilder:validation:Required
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
	// ref allows users to define the reference to a container image containing Catalog contents.
	// ref is required.
	// ref can not be more than 1000 characters.
	//
	// A reference can be broken down into 3 parts - the domain, name, and identifier.
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
	// +kubebuilder:validation:Required
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

	// pollIntervalMinutes allows the user to set the interval, in minutes, at which the image source should be polled for new content.
	// pollIntervalMinutes is optional.
	// pollIntervalMinutes can not be specified when ref is a digest-based reference.
	//
	// When omitted, the image will not be polled for new content.
	// +kubebuilder:validation:Minimum:=1
	// +optional
	PollIntervalMinutes *int `json:"pollIntervalMinutes,omitempty"`
}

func init() {
	SchemeBuilder.Register(&ClusterCatalog{}, &ClusterCatalogList{})
}
