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
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
)

const (
	ClusterObjectSetKind = "ClusterObjectSet"

	// Condition Types
	ClusterObjectSetTypeAvailable   = "Available"
	ClusterObjectSetTypeProgressing = "Progressing"
	ClusterObjectSetTypeSucceeded   = "Succeeded"

	// Condition Reasons
	ClusterObjectSetReasonArchived        = "Archived"
	ClusterObjectSetReasonBlocked         = "Blocked"
	ClusterObjectSetReasonProbeFailure    = "ProbeFailure"
	ClusterObjectSetReasonProbesSucceeded = "ProbesSucceeded"
	ClusterObjectSetReasonReconciling     = "Reconciling"
	ClusterObjectSetReasonRetrying        = "Retrying"
)

// ClusterObjectSetSpec defines the desired state of ClusterObjectSet.
type ClusterObjectSetSpec struct {
	// lifecycleState specifies the lifecycle state of the ClusterObjectSet.
	//
	// When set to "Active", the revision is actively managed and reconciled.
	// When set to "Archived", the revision is inactive and any resources not managed by a subsequent revision are deleted.
	// The revision is removed from the owner list of all objects previously under management.
	// All objects that did not transition to a succeeding revision are deleted.
	//
	// Once a revision is set to "Archived", it cannot be un-archived.
	//
	// It is possible for more than one revision to be "Active" simultaneously. This will occur when
	// moving from one revision to another. The old revision will not be set to "Archived" until the
	// new revision has been completely rolled out.
	//
	// +required
	// +kubebuilder:validation:Enum=Active;Archived
	// +kubebuilder:validation:XValidation:rule="oldSelf == 'Active' || oldSelf == 'Archived' && oldSelf == self", message="cannot un-archive"
	LifecycleState ClusterObjectSetLifecycleState `json:"lifecycleState,omitempty"`

	// revision is a required, immutable sequence number representing a specific revision
	// of the parent ClusterExtension.
	//
	// The revision field must be a positive integer.
	// Each ClusterObjectSet belonging to the same parent ClusterExtension must have a unique revision number.
	// The revision number must always be the previous revision number plus one, or 1 for the first revision.
	//
	// +required
	// +kubebuilder:validation:Minimum:=1
	// +kubebuilder:validation:XValidation:rule="self == oldSelf", message="revision is immutable"
	Revision int64 `json:"revision"`

	// phases is an optional, immutable list of phases that group objects to be applied together.
	//
	// Objects are organized into phases based on their Group-Kind. Common phases include:
	//   - namespaces: Namespace objects
	//   - policies: ResourceQuota, LimitRange, NetworkPolicy objects
	//   - rbac: ServiceAccount, Role, RoleBinding, ClusterRole, ClusterRoleBinding objects
	//   - crds: CustomResourceDefinition objects
	//   - storage: PersistentVolume, PersistentVolumeClaim, StorageClass objects
	//   - deploy: Deployment, StatefulSet, DaemonSet, Service, ConfigMap, Secret objects
	//   - publish: Ingress, APIService, Route, Webhook objects
	//
	// All objects in a phase are applied in no particular order.
	// The revision progresses to the next phase only after all objects in the current phase pass their readiness probes.
	//
	// Once set, even if empty, the phases field is immutable.
	//
	// Each phase in the list must have a unique name. The maximum number of phases is 20.
	//
	// +kubebuilder:validation:XValidation:rule="self == oldSelf || oldSelf.size() == 0", message="phases is immutable"
	// +kubebuilder:validation:MaxItems=20
	// +listType=map
	// +listMapKey=name
	// +optional
	Phases []ClusterObjectSetPhase `json:"phases,omitempty"`

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

	// progressionProbes is an optional field which provides the ability to define custom readiness probes
	// for objects defined within spec.phases. As documented in that field, most kubernetes-native objects
	// within the phases already have some kind of readiness check built-in, but this field allows for checks
	// which are tailored to the objects being rolled out - particularly custom resources.
	//
	// Probes defined within the progressionProbes list will apply to every phase in the revision. However, the probes will only
	// execute against phase objects which are a match for the provided selector type. For instance, a probe using a GroupKind selector
	// for ConfigMaps will automatically be considered to have passed for any non-ConfigMap object, but will halt any phase containing
	// a ConfigMap if that particular object does not pass the probe check.
	//
	// The maximum number of probes is 20.
	//
	// +kubebuilder:validation:MinItems=1
	// +kubebuilder:validation:MaxItems=20
	// +listType=atomic
	// +optional
	// <opcon:experimental>
	ProgressionProbes []ProgressionProbe `json:"progressionProbes,omitempty"`

	// collisionProtection specifies the default collision protection strategy for all objects
	// in this revision. Individual phases or objects can override this value.
	//
	// When set, this value is used as the default for any phase or object that does not
	// explicitly specify its own collisionProtection.
	//
	// The resolution order is: object > phase > spec
	//
	// +required
	// +kubebuilder:validation:Enum=Prevent;IfNoController;None
	// +kubebuilder:validation:XValidation:rule="self == oldSelf",message="collisionProtection is immutable"
	CollisionProtection CollisionProtection `json:"collisionProtection,omitempty"`
}

// ProgressionProbe provides a custom probe definition, consisting of an object selection method and assertions.
type ProgressionProbe struct {
	// selector is a required field which defines the method by which we select objects to apply the below
	// assertions to. Any object which matches the defined selector will have all the associated assertions
	// applied against it.
	//
	// If no objects within a phase are selected by the provided selector, then all assertions defined here
	// are considered to have succeeded.
	//
	// +required
	// <opcon:experimental>
	Selector ObjectSelector `json:"selector,omitzero"`

	// assertions is a required list of checks which will run against the objects selected by the selector. If
	// one or more assertions fail then the phase within which the object lives will be not be considered
	// 'Ready', blocking rollout of all subsequent phases.
	//
	// +kubebuilder:validation:MinItems=1
	// +kubebuilder:validation:MaxItems=20
	// +listType=atomic
	// +required
	// <opcon:experimental>
	Assertions []Assertion `json:"assertions,omitempty"`
}

// ObjectSelector is a discriminated union which defines the method by which we select objects to make assertions against.
// +union
// +kubebuilder:validation:XValidation:rule="self.type == 'GroupKind' ?has(self.groupKind) : !has(self.groupKind)",message="groupKind is required when type is GroupKind, and forbidden otherwise"
// +kubebuilder:validation:XValidation:rule="self.type == 'Label' ?has(self.label) : !has(self.label)",message="label is required when type is Label, and forbidden otherwise"
type ObjectSelector struct {
	// type is a required field which specifies the type of selector to use.
	//
	// The allowed selector types are "GroupKind" and "Label".
	//
	// When set to "GroupKind", all objects which match the specified group and kind will be selected.
	// When set to "Label", all objects which match the specified labels and/or expressions will be selected.
	//
	// +unionDiscriminator
	// +kubebuilder:validation:Enum=GroupKind;Label
	// +required
	// <opcon:experimental>
	Type SelectorType `json:"type,omitempty"`

	// groupKind specifies the group and kind of objects to select.
	//
	// Required when type is "GroupKind".
	//
	// Uses the Kubernetes format specified here:
	// https://pkg.go.dev/k8s.io/apimachinery/pkg/apis/meta/v1#GroupKind
	//
	// +optional
	// +unionMember
	// <opcon:experimental>
	GroupKind metav1.GroupKind `json:"groupKind,omitempty,omitzero"`

	// label is the label selector definition.
	//
	// Required when type is "Label".
	//
	// A probe using a Label selector will be executed against every object matching the labels or expressions; you must use care
	// when using this type of selector. For example, if multiple Kind objects are selected via labels then the probe is
	// likely to fail because the values of different Kind objects rarely share the same schema.
	//
	// The LabelSelector field uses the following Kubernetes format:
	// https://pkg.go.dev/k8s.io/apimachinery/pkg/apis/meta/v1#LabelSelector
	// Requires exactly one of matchLabels or matchExpressions.
	//
	// +optional
	// +unionMember
	// +kubebuilder:validation:XValidation:rule="(has(self.matchExpressions) && !has(self.matchLabels)) || (!has(self.matchExpressions) && has(self.matchLabels))",message="exactly one of matchLabels or matchExpressions must be set"
	// <opcon:experimental>
	Label metav1.LabelSelector `json:"label,omitempty,omitzero"`
}

// SelectorType defines the type of selector used for progressionProbes.
// +enum
type SelectorType string

const (
	SelectorTypeGroupKind SelectorType = "GroupKind"
	SelectorTypeLabel     SelectorType = "Label"
)

// ProbeType defines the type of probe used as an assertion.
// +enum
type ProbeType string

const (
	ProbeTypeConditionEqual ProbeType = "ConditionEqual"
	ProbeTypeFieldsEqual    ProbeType = "FieldsEqual"
	ProbeTypeFieldValue     ProbeType = "FieldValue"
)

// Assertion is a discriminated union which defines the probe type and definition used as an assertion.
// +union
// +kubebuilder:validation:XValidation:rule="self.type == 'ConditionEqual' ?has(self.conditionEqual) : !has(self.conditionEqual)",message="conditionEqual is required when type is ConditionEqual, and forbidden otherwise"
// +kubebuilder:validation:XValidation:rule="self.type == 'FieldsEqual' ?has(self.fieldsEqual) : !has(self.fieldsEqual)",message="fieldsEqual is required when type is FieldsEqual, and forbidden otherwise"
// +kubebuilder:validation:XValidation:rule="self.type == 'FieldValue' ?has(self.fieldValue) : !has(self.fieldValue)",message="fieldValue is required when type is FieldValue, and forbidden otherwise"
type Assertion struct {
	// type is a required field which specifies the type of probe to use.
	//
	// The allowed probe types are "ConditionEqual", "FieldsEqual", and "FieldValue".
	//
	// When set to "ConditionEqual", the probe checks objects that have reached a condition of specified type and status.
	// When set to "FieldsEqual", the probe checks that the values found at two provided field paths are matching.
	// When set to "FieldValue", the probe checks that the value found at the provided field path matches what was specified.
	//
	// +unionDiscriminator
	// +kubebuilder:validation:Enum=ConditionEqual;FieldsEqual;FieldValue
	// +required
	// <opcon:experimental>
	Type ProbeType `json:"type,omitempty"`

	// conditionEqual contains the expected condition type and status.
	//
	// +unionMember
	// +optional
	// <opcon:experimental>
	ConditionEqual ConditionEqualProbe `json:"conditionEqual,omitzero"`

	// fieldsEqual contains the two field paths whose values are expected to match.
	//
	// +unionMember
	// +optional
	// <opcon:experimental>
	FieldsEqual FieldsEqualProbe `json:"fieldsEqual,omitzero"`

	// fieldValue contains the expected field path and value found within.
	//
	// +unionMember
	// +optional
	// <opcon:experimental>
	FieldValue FieldValueProbe `json:"fieldValue,omitzero"`
}

// ConditionEqualProbe defines the condition type and status required for the probe to succeed.
type ConditionEqualProbe struct {
	// type sets the expected condition type, i.e. "Ready".
	//
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=200
	// +required
	// <opcon:experimental>
	Type string `json:"type,omitempty"`

	// status sets the expected condition status.
	//
	// Allowed values are "True" and "False".
	//
	// +kubebuilder:validation:Enum=True;False
	// +required
	// <opcon:experimental>
	Status string `json:"status,omitempty"`
}

// FieldsEqualProbe defines the paths of the two fields required to match for the probe to succeed.
type FieldsEqualProbe struct {
	// fieldA sets the field path for the first field, i.e. "spec.replicas". The probe will fail
	// if the path does not exist.
	//
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=200
	// +kubebuilder:validation:XValidation:rule="self.matches('^[a-zA-Z0-9]+(?:\\\\.[a-zA-Z0-9]+)*$')",message="must contain a valid field path. valid fields contain upper or lower-case alphanumeric characters separated by the \".\" character."
	// +required
	// <opcon:experimental>
	FieldA string `json:"fieldA,omitempty"`

	// fieldB sets the field path for the second field, i.e. "status.readyReplicas". The probe will fail
	// if the path does not exist.
	//
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=200
	// +kubebuilder:validation:XValidation:rule="self.matches('^[a-zA-Z0-9]+(?:\\\\.[a-zA-Z0-9]+)*$')",message="must contain a valid field path. valid fields contain upper or lower-case alphanumeric characters separated by the \".\" character."
	// +required
	// <opcon:experimental>
	FieldB string `json:"fieldB,omitempty"`
}

// FieldValueProbe defines the path and value expected within for the probe to succeed.
type FieldValueProbe struct {
	// fieldPath sets the field path for the field to check, i.e. "status.phase". The probe will fail
	// if the path does not exist.
	//
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=200
	// +kubebuilder:validation:XValidation:rule="self.matches('^[a-zA-Z0-9]+(?:\\\\.[a-zA-Z0-9]+)*$')",message="must contain a valid field path. valid fields contain upper or lower-case alphanumeric characters separated by the \".\" character."
	// +required
	// <opcon:experimental>
	FieldPath string `json:"fieldPath,omitempty"`

	// value sets the expected value found at fieldPath, i.e. "Bound".
	//
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=200
	// +required
	// <opcon:experimental>
	Value string `json:"value,omitempty"`
}

// ClusterObjectSetLifecycleState specifies the lifecycle state of the ClusterObjectSet.
type ClusterObjectSetLifecycleState string

const (
	// ClusterObjectSetLifecycleStateActive / "Active" is the default lifecycle state.
	ClusterObjectSetLifecycleStateActive ClusterObjectSetLifecycleState = "Active"
	// ClusterObjectSetLifecycleStateArchived / "Archived" archives the revision for historical or auditing purposes.
	// The revision is removed from the owner list of all other objects previously under management and all objects
	// that did not transition to a succeeding revision are deleted.
	ClusterObjectSetLifecycleStateArchived ClusterObjectSetLifecycleState = "Archived"
)

// ClusterObjectSetPhase represents a group of objects that are applied together. The phase is considered
// complete only after all objects pass their status probes.
type ClusterObjectSetPhase struct {
	// name is a required identifier for this phase.
	//
	// phase names must follow the DNS label standard as defined in [RFC 1123].
	// They must contain only lowercase alphanumeric characters or hyphens (-),
	// start and end with an alphanumeric character, and be no longer than 63 characters.
	//
	// Common phase names include: namespaces, policies, rbac, crds, storage, deploy, publish.
	//
	// [RFC 1123]: https://tools.ietf.org/html/rfc1123
	//
	// +required
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=63
	// +kubebuilder:validation:XValidation:rule=`!format.dns1123Label().validate(self).hasValue()`,message="the value must consist of only lowercase alphanumeric characters and hyphens, and must start and end with an alphanumeric character."
	Name string `json:"name"`

	// objects is a required list of all Kubernetes objects that belong to this phase.
	//
	// All objects in this list are applied to the cluster in no particular order. The maximum number of objects per phase is 50.
	// +required
	// +kubebuilder:validation:MaxItems=50
	Objects []ClusterObjectSetObject `json:"objects"`

	// collisionProtection specifies the default collision protection strategy for all objects
	// in this phase. Individual objects can override this value.
	//
	// When set, this value is used as the default for any object in this phase that does not
	// explicitly specify its own collisionProtection.
	//
	// When omitted, we use .spec.collistionProtection as the default for any object in this phase that does not
	// explicitly specify its own collisionProtection.
	//
	// +optional
	// +kubebuilder:validation:Enum=Prevent;IfNoController;None
	CollisionProtection CollisionProtection `json:"collisionProtection,omitempty"`
}

// ClusterObjectSetObject represents a Kubernetes object to be applied as part
// of a phase, along with its collision protection settings.
//
// Exactly one of object or ref must be set.
//
// +kubebuilder:validation:ExactlyOneOf={object,ref}
type ClusterObjectSetObject struct {
	// object is an optional embedded Kubernetes object to be applied.
	//
	// Exactly one of object or ref must be set.
	//
	// This object must be a valid Kubernetes resource with apiVersion, kind, and metadata fields.
	//
	// +kubebuilder:validation:EmbeddedResource
	// +kubebuilder:pruning:PreserveUnknownFields
	// +optional
	Object unstructured.Unstructured `json:"object,omitzero"`

	// ref is an optional reference to a Secret that holds the serialized
	// object manifest.
	//
	// Exactly one of object or ref must be set.
	//
	// +optional
	Ref ObjectSourceRef `json:"ref,omitzero"`

	// collisionProtection controls whether the operator can adopt and modify objects
	// that already exist on the cluster.
	//
	// Allowed values are: "Prevent", "IfNoController", and "None".
	//
	// When set to "Prevent", the operator only manages objects it created itself.
	// This prevents ownership collisions.
	//
	// When set to "IfNoController", the operator can adopt and modify pre-existing objects
	// that are not owned by another controller.
	// This is useful for taking over management of manually-created resources.
	//
	// When set to "None", the operator can adopt and modify any pre-existing object, even if
	// owned by another controller.
	// Use this setting with extreme caution as it may cause multiple controllers to fight over
	// the same resource, resulting in increased load on the API server and etcd.
	//
	// When omitted, the value is inherited from the phase, then spec.
	//
	// +optional
	// +kubebuilder:validation:Enum=Prevent;IfNoController;None
	CollisionProtection CollisionProtection `json:"collisionProtection,omitempty"`
}

// ObjectSourceRef references content within a Secret that contains a
// serialized object manifest.
type ObjectSourceRef struct {
	// name is the name of the referenced Secret.
	//
	// +required
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=253
	Name string `json:"name"`

	// namespace is the namespace of the referenced Secret.
	// When empty, defaults to the OLM system namespace during ref resolution.
	//
	// +optional
	// +kubebuilder:validation:MaxLength=63
	Namespace string `json:"namespace,omitempty"`

	// key is the data key within the referenced Secret containing the
	// object manifest content. The value at this key must be a
	// JSON-serialized Kubernetes object manifest.
	//
	// +required
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=253
	Key string `json:"key"`
}

// CollisionProtection specifies if and how ownership collisions are prevented.
type CollisionProtection string

const (
	// CollisionProtectionPrevent prevents owner collisions entirely
	// by only allowing to work with objects itself has created.
	CollisionProtectionPrevent CollisionProtection = "Prevent"
	// CollisionProtectionIfNoController allows to patch and override
	// objects already present if they are not owned by another controller.
	CollisionProtectionIfNoController CollisionProtection = "IfNoController"
	// CollisionProtectionNone allows to patch and override objects
	// already present and owned by other controllers.
	// Be careful! This setting may cause multiple controllers to fight over a resource,
	// causing load on the API server and etcd.
	CollisionProtectionNone CollisionProtection = "None"
)

// ClusterObjectSetStatus defines the observed state of a ClusterObjectSet.
type ClusterObjectSetStatus struct {
	// conditions is an optional list of status conditions describing the state of the
	// ClusterObjectSet.
	//
	// The Progressing condition represents whether the revision is actively rolling out:
	//   - When status is True and reason is RollingOut, the ClusterObjectSet rollout is actively making progress and is in transition.
	//   - When status is True and reason is Retrying, the ClusterObjectSet has encountered an error that could be resolved on subsequent reconciliation attempts.
	//   - When status is True and reason is Succeeded, the ClusterObjectSet has reached the desired state.
	//   - When status is False and reason is Blocked, the ClusterObjectSet has encountered an error that requires manual intervention for recovery.
	//   - When status is False and reason is Archived, the ClusterObjectSet is archived and not being actively reconciled.
	//
	// The Available condition represents whether the revision has been successfully rolled out and is available:
	//   - When status is True and reason is ProbesSucceeded, the ClusterObjectSet has been successfully rolled out and all objects pass their readiness probes.
	//   - When status is False and reason is ProbeFailure, one or more objects are failing their readiness probes during rollout.
	//   - When status is Unknown and reason is Reconciling, the ClusterObjectSet has encountered an error that prevented it from observing the probes.
	//   - When status is Unknown and reason is Archived, the ClusterObjectSet has been archived and its objects have been torn down.
	//   - When status is Unknown and reason is Migrated, the ClusterObjectSet was migrated from an existing release and object status probe results have not yet been observed.
	//
	// The Succeeded condition represents whether the revision has successfully completed its rollout:
	//   - When status is True and reason is Succeeded, the ClusterObjectSet has successfully completed its rollout. This condition is set once and persists even if the revision later becomes unavailable.
	//
	// +listType=map
	// +listMapKey=type
	// +optional
	Conditions []metav1.Condition `json:"conditions,omitempty"`

	// observedPhases records the content hashes of resolved phases
	// at first successful reconciliation. This is used to detect if
	// referenced object sources were deleted and recreated with
	// different content. Each entry covers all fully-resolved object
	// manifests within a phase, making it source-agnostic.
	//
	// +kubebuilder:validation:XValidation:rule="self == oldSelf || oldSelf.size() == 0",message="observedPhases is immutable"
	// +kubebuilder:validation:MaxItems=20
	// +listType=map
	// +listMapKey=name
	// +optional
	ObservedPhases []ObservedPhase `json:"observedPhases,omitempty"`
}

// ObservedPhase records the observed content digest of a resolved phase.
type ObservedPhase struct {
	// name is the phase name matching a phase in spec.phases.
	//
	// +required
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=63
	// +kubebuilder:validation:XValidation:rule=`!format.dns1123Label().validate(self).hasValue()`,message="the value must consist of only lowercase alphanumeric characters and hyphens, and must start and end with an alphanumeric character."
	Name string `json:"name"`

	// digest is the digest of the phase's resolved object content
	// at first successful resolution, in the format "<algorithm>:<hex>".
	//
	// +required
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=256
	// +kubebuilder:validation:XValidation:rule=`self.matches('^[a-z0-9]+:[a-f0-9]+$')`,message="digest must be in the format '<algorithm>:<hex>'"
	Digest string `json:"digest"`
}

// +genclient
// +genclient:nonNamespaced
// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Available",type=string,JSONPath=`.status.conditions[?(@.type=='Available')].status`
// +kubebuilder:printcolumn:name="Progressing",type=string,JSONPath=`.status.conditions[?(@.type=='Progressing')].status`
// +kubebuilder:printcolumn:name=Age,type=date,JSONPath=`.metadata.creationTimestamp`

// ClusterObjectSet represents an immutable snapshot of Kubernetes objects
// for a specific version of a ClusterExtension. Each revision contains objects
// organized into phases that roll out sequentially. The same object can only be managed by a single revision
// at a time. Ownership of objects is transitioned from one revision to the next as the extension is upgraded
// or reconfigured. Once the latest revision has rolled out successfully, previous active revisions are archived for
// posterity.
type ClusterObjectSet struct {
	metav1.TypeMeta `json:",inline"`

	// metadata is the standard object's metadata.
	// More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
	// +optional
	metav1.ObjectMeta `json:"metadata,omitempty"`

	// spec defines the desired state of the ClusterObjectSet.
	// +optional
	Spec ClusterObjectSetSpec `json:"spec,omitempty"`

	// status is optional and defines the observed state of the ClusterObjectSet.
	// +optional
	Status ClusterObjectSetStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// ClusterObjectSetList contains a list of ClusterObjectSet
type ClusterObjectSetList struct {
	metav1.TypeMeta `json:",inline"`

	// +optional
	metav1.ListMeta `json:"metadata,omitempty"`

	// items is a required list of ClusterObjectSet objects.
	//
	// +required
	Items []ClusterObjectSet `json:"items"`
}

func init() {
	SchemeBuilder.Register(func(s *runtime.Scheme) error {
		s.AddKnownTypes(GroupVersion, &ClusterObjectSet{}, &ClusterObjectSetList{})
		return nil
	})
}
