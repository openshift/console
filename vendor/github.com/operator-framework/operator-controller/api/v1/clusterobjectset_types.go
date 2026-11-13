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

	// ClusterObjectSetMaxRevision is the largest revision whose canonical name fits
	// in a 63-character label value with a 52-character group and a separating hyphen.
	// Keep the revision validation maximum below in sync with this value.
	ClusterObjectSetMaxRevision int64 = 9999999999

	// Condition Types
	ClusterObjectSetTypeReady = "Ready"

	// Condition Reasons
	ClusterObjectSetReasonPending              = "Pending"
	ClusterObjectSetReasonArchived             = "Archived"
	ClusterObjectSetReasonArchiving            = "Archiving"
	ClusterObjectSetReasonObjectsNotReady      = "ObjectsNotReady"
	ClusterObjectSetReasonSuperseded           = "Superseded"
	ClusterObjectSetReasonObjectCollision      = "ObjectCollision"
	ClusterObjectSetReasonPreconditionsNotMet  = "PreconditionsNotMet"
	ClusterObjectSetReasonInvalidSpecification = "InvalidSpecification"
	ClusterObjectSetReasonAllObjectsReady      = "AllObjectsReady"
)

// ClusterObjectSetSpec defines the desired state of ClusterObjectSet.
// +kubebuilder:validation:XValidation:rule="!has(oldSelf.phases) || has(self.phases)",message="phases cannot be removed once set"
// +kubebuilder:validation:XValidation:rule="!has(oldSelf.progressionProbes) || has(self.progressionProbes)",message="progressionProbes cannot be removed once set"
type ClusterObjectSetSpec struct {
	// group is a required, immutable identifier that links related revisions together.
	// All revisions sharing the same group form an ordered sequence, regardless of owner references.
	// The value must be 1 to 52 characters long, start with a lowercase letter,
	// contain only lowercase letters, digits or hyphens, and end with a letter or digit.
	//
	// +required
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=52
	// +kubebuilder:validation:XValidation:rule=`self.matches('^[a-z]([a-z0-9-]*[a-z0-9])?$')`,message="group must start with a lowercase letter, contain only lowercase letters, digits or hyphens, and end with a letter or digit"
	// +kubebuilder:validation:XValidation:rule="self == oldSelf",message="group is immutable"
	Group string `json:"group,omitempty"`

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
	// +kubebuilder:validation:XValidation:rule="oldSelf == 'Active' || oldSelf == 'Archived' && oldSelf == self", message="cannot un-archive"
	LifecycleState ClusterObjectSetLifecycleState `json:"lifecycleState,omitempty"`

	// revision is a required, immutable sequence number identifying a specific
	// ClusterObjectSet within a sequence of related revisions.
	//
	// The revision field must be an integer from 1 to 9999999999, inclusive.
	// Each ClusterObjectSet in the same group must have a unique revision number.
	//
	// +required
	// +kubebuilder:validation:Minimum:=1
	// +kubebuilder:validation:Maximum:=9999999999
	// +kubebuilder:validation:XValidation:rule="self == oldSelf", message="revision is immutable"
	Revision int64 `json:"revision,omitempty"`

	// phases is a required, immutable list of phases that group objects to be applied together.
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
	// Once set, the phases field is immutable.
	//
	// Each phase in the list must have a unique name. The maximum number of phases is 20.
	//
	// +kubebuilder:validation:XValidation:rule="self == oldSelf || oldSelf.size() == 0", message="phases is immutable"
	// +kubebuilder:validation:MinItems=1
	// +kubebuilder:validation:MaxItems=20
	// +listType=map
	// +listMapKey=name
	// +required
	Phases []ClusterObjectSetPhase `json:"phases,omitempty"`

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
	// Once set, the progressionProbes field is immutable, as it is
	// part of the immutable content of a revision.
	//
	// +kubebuilder:validation:XValidation:rule="self == oldSelf || oldSelf.size() == 0", message="progressionProbes is immutable"
	// +kubebuilder:validation:MinItems=1
	// +kubebuilder:validation:MaxItems=20
	// +listType=atomic
	// +optional
	// <opcon:experimental>
	ProgressionProbes []ProgressionProbe `json:"progressionProbes,omitempty"`

	// collisionProtection is a required field that specifies the default collision protection
	// strategy for all objects in this revision. Individual phases or objects can override this value.
	//
	// This value is used as the default for any phase or object that does not explicitly specify
	// its own collisionProtection. The resolution order is: object > phase > spec.
	//
	// +required
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
	// one or more assertions fail then the phase within which the object lives will not be considered
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

	// groupKind specifies the group and kind of objects to select. Note that this selector
	// has a limitation in that it does not discriminate based on the version of the object;
	// until this gap is closed users of this selector should take into account the possibility
	// of different versions of the same groupKind not being able to pass assertions in the
	// same way.
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
// +kubebuilder:validation:Enum=Active;Archived
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
	Name string `json:"name,omitempty"`

	// objects is a required list of all Kubernetes objects that belong to this phase.
	//
	// All objects in this list are applied to the cluster in no particular order. The maximum number of objects per phase is 50.
	// +required
	// +listType=atomic
	// +kubebuilder:validation:MaxItems=50
	Objects []ClusterObjectSetObject `json:"objects"`

	// collisionProtection specifies the default collision protection strategy for all objects
	// in this phase. Individual objects can override this value.
	//
	// When set, this value is used as the default for any object in this phase that does not
	// explicitly specify its own collisionProtection.
	//
	// When omitted, objects in this phase that do not specify their own collisionProtection inherit the
	// enclosing spec default: the ClusterObjectSet's .spec.collisionProtection or, for a
	// ClusterObjectDeployment, the .spec.template.spec.collisionProtection.
	//
	// +optional
	CollisionProtection CollisionProtection `json:"collisionProtection,omitempty"`
}

// ObjectType defines the type of objects provided in the Objects set.
// +kubebuilder:validation:Enum=InlineManifest;SecretReference
type ObjectType string

const (
	ObjectTypeInlineManifest  ObjectType = "InlineManifest"
	ObjectTypeSecretReference ObjectType = "SecretReference"
)

// ClusterObjectSetObject represents a Kubernetes object to be applied as part
// of a phase, along with its collision protection settings.
//
// Exactly one of inlineManifest or secretRef must be set.
//
// +union
// +kubebuilder:validation:XValidation:rule="self.type == 'InlineManifest' ?has(self.inlineManifest) : !has(self.inlineManifest)",message="inlineManifest is required when type is InlineManifest, and forbidden otherwise"
// +kubebuilder:validation:XValidation:rule="self.type == 'SecretReference' ?has(self.secretRef) : !has(self.secretRef)",message="secretRef is required when type is SecretReference, and forbidden otherwise"
type ClusterObjectSetObject struct {
	// type is a required field which specifies the type of object to use.
	//
	// The allowed object types are "InlineManifest" and "SecretReference".
	//
	// When set to "InlineManifest", object manifests are supplied inline, as valid Kubernetes resources with apiVersion, kind, and metadata fields.
	// When set to "SecretReference", objects are supplied as references to a Secret that holds the serialized object manifest.
	//
	// +unionDiscriminator
	// +required
	// <opcon:experimental>
	Type ObjectType `json:"type,omitempty"`

	// inlineManifest is an optional embedded Kubernetes object to be applied.
	//
	// Exactly one of inlineManifest or secretRef must be set.
	//
	// This object must be a valid Kubernetes resource with apiVersion, kind, and metadata fields.
	//
	// +kubebuilder:validation:EmbeddedResource
	// +kubebuilder:pruning:PreserveUnknownFields
	// +kubebuilder:validation:XValidation:rule="has(self.apiVersion) && has(self.kind) && has(self.metadata)",message="inlineManifest must be a valid Kubernetes resource with apiVersion, kind, and metadata"
	// +kubebuilder:validation:XValidation:rule="self.apiVersion != '' && self.kind != ''",message="apiVersion and kind must be non-empty"
	// +kubebuilder:validation:XValidation:rule="has(self.metadata.name) && self.metadata.name != ''",message="metadata.name is required"
	// +unionMember
	// +optional
	InlineManifest unstructured.Unstructured `json:"inlineManifest,omitempty,omitzero"`

	// secretRef is an optional reference to a Secret that holds the serialized
	// object manifest.
	//
	// Exactly one of inlineManifest or secretRef must be set.
	//
	// +unionMember
	// +optional
	SecretRef SecretSourceRef `json:"secretRef,omitzero"`

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
	CollisionProtection CollisionProtection `json:"collisionProtection,omitempty"`
}

// SecretSourceRef references content within a Secret that contains a
// serialized object manifest.
type SecretSourceRef struct {
	// name is the name of the referenced Secret.
	//
	// +required
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=253
	// +kubebuilder:validation:XValidation:rule=`!format.dns1123Subdomain().validate(self).hasValue()`,message="the value must consist of only lowercase alphanumeric characters, hyphens, and dots, and must start and end with an alphanumeric character."
	Name string `json:"name,omitempty"`

	// namespace is the namespace of the referenced Secret.
	// When empty, defaults to the OLM system namespace during ref resolution.
	//
	// +optional
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=63
	// +kubebuilder:validation:XValidation:rule=`!format.dns1123Label().validate(self).hasValue()`,message="the value must consist of only lowercase alphanumeric characters and hyphens, and must start and end with an alphanumeric character."
	Namespace string `json:"namespace,omitempty"`

	// key is the data key within the referenced Secret containing the
	// object manifest content. The value at this key must be a
	// JSON-serialized Kubernetes object manifest.
	//
	// +required
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=253
	// +kubebuilder:validation:XValidation:rule=`self.matches('^[-._a-zA-Z0-9]+$')`,message="must consist only of alphanumeric characters, '-', '_', or '.'"
	Key string `json:"key,omitempty"`
}

// CollisionProtection specifies if and how ownership collisions are prevented.
// +kubebuilder:validation:Enum=Prevent;IfNoController;None
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
//
// The completedAt removal guard lives here at the parent level because a
// field-level transition rule is skipped when the field is absent from an
// update, which would otherwise allow the timestamp to be cleared and re-set.
//
// +kubebuilder:validation:XValidation:rule="!has(oldSelf.completedAt) || has(self.completedAt)",message="completedAt cannot be removed once set"
type ClusterObjectSetStatus struct {
	// conditions is an optional list of status conditions describing the state of the
	// ClusterObjectSet.
	//
	// The Ready condition represents the state of the revision.
	// True means all objects are at the desired state; False means one or more
	// objects are not at the desired state; Unknown is the initial state, before
	// the first reconciliation has evaluated the revision.
	//   - Unknown with reason Pending: the revision has not yet been evaluated (initial state, set when the condition is first created).
	//   - True with reason AllObjectsReady: the revision has rolled out and all objects are at the desired state.
	//   - False with reason ObjectsNotReady: one or more objects are still being applied or have not yet passed their readiness probes during rollout.
	//   - False with reason Superseded: one or more objects have been adopted by a newer revision of the object set.
	//   - False with reason ObjectCollision: one or more objects are controlled by another owner, or are unowned while collision protection prevents adoption, so this revision cannot take ownership of them.
	//   - False with reason PreconditionsNotMet: a precondition for applying the revision is not yet satisfied (a referenced Secret is mutable or has invalid or changed content, or a preflight dry-run was rejected, e.g. an immutable field, a conflicting object, or RBAC/dependency CRDs not yet propagated); the revision keeps retrying and recovers once the precondition is met.
	//   - False with reason InvalidSpecification: the revision spec is invalid (a malformed revision/phase object or progression probe) and requires a spec change to proceed.
	//   - False with reason Archiving: the revision is being archived and its owned objects are still being torn down.
	//   - False with reason Archived: the revision has been archived and its objects have been torn down.
	//
	// Rollout completion is recorded separately by status.completedAt.
	//
	// +listType=map
	// +listMapKey=type
	// +optional
	// +patchStrategy=merge
	// +patchMergeKey=type
	Conditions []metav1.Condition `json:"conditions,omitempty" patchStrategy:"merge" patchMergeKey:"type"` //nolint:kubeapilinter // This CRD uses structural list-map validation, not protobuf serialization.

	// objectCounts reports aggregate object counts across all phases.
	// Values are sums across all observed phases.
	// It is omitted until counts have been computed; when present, all count
	// fields are reported (including zeros).
	// +optional
	ObjectCounts ObjectCounts `json:"objectCounts,omitzero"`

	// observedPhases records the content hashes of resolved phases
	// at first successful reconciliation. This is used to detect if
	// referenced object sources were deleted and recreated with
	// different content. Each entry covers all fully-resolved object
	// manifests within a phase, making it source-agnostic.
	//
	// +kubebuilder:validation:MaxItems=20
	// +listType=map
	// +listMapKey=name
	// +optional
	ObservedPhases []ObservedPhase `json:"observedPhases,omitempty"`

	// completedAt is the timestamp at which the revision was first observed to be
	// ready, meaning it had successfully rolled out and all of its objects passed
	// their probes. It is set once and is immutable thereafter.
	//
	// +kubebuilder:validation:XValidation:rule="self == oldSelf || oldSelf == null",message="completedAt is immutable, once set"
	// +optional
	CompletedAt metav1.Time `json:"completedAt,omitempty,omitzero"`
}

// ObservedPhase records the observed content digest of a resolved phase.
// +kubebuilder:validation:XValidation:rule="!has(oldSelf.completedAt) || has(self.completedAt)",message="completedAt cannot be removed once set"
type ObservedPhase struct {
	// name is the phase name matching a phase in spec.phases.
	//
	// +required
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=63
	// +kubebuilder:validation:XValidation:rule=`!format.dns1123Label().validate(self).hasValue()`,message="the value must consist of only lowercase alphanumeric characters and hyphens, and must start and end with an alphanumeric character."
	Name string `json:"name,omitempty"`

	// status is the current state of this phase in the rollout. Must be one of
	// InvalidSpecification, PreconditionsNotMet, Pending, Reconciling,
	// Stabilizing, Ready, Unknown, Superseded, Archiving, or Archived.
	// +required
	Status PhaseStatus `json:"status,omitempty"`

	// completedAt is the timestamp when this phase first became Ready.
	// Set once and never modified. Nil means the phase has never been
	// Ready.
	// +optional
	// +kubebuilder:validation:XValidation:rule="self == oldSelf || oldSelf == null",message="completedAt is immutable, once set"
	CompletedAt metav1.Time `json:"completedAt,omitempty,omitzero"`

	// message is a phase-level message providing context about the
	// current status (e.g. a validation error for InvalidSpecification
	// phases, or a summary for Pending phases). At most 1024 characters;
	// longer messages are truncated by the controller.
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=1024
	// +optional
	Message string `json:"message,omitempty"`

	// digest is the digest of the phase's resolved object content
	// at first successful resolution, in the format "<algorithm>:<hex>".
	// Currently, sha256 is the only supported algorithm.
	//
	// +required
	// +kubebuilder:validation:XValidation:rule="self == oldSelf || oldSelf.size() == 0",message="digest is immutable"
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=256
	// +kubebuilder:validation:XValidation:rule=`self.matches('^[a-z0-9]+:[a-f0-9]+$')`,message="digest must be in the format '<algorithm>:<hex>'"
	Digest string `json:"digest,omitempty"`

	// lastTransitionTime is the last time the phase transitioned from one status to another.
	// +required
	// +kubebuilder:validation:Type=string
	// +kubebuilder:validation:Format=date-time
	LastTransitionTime metav1.Time `json:"lastTransitionTime,omitempty,omitzero"`

	// objectDetails lists objects in this phase that are not yet
	// complete. For Reconciling, Pending, and Stabilizing phases, this
	// includes probe failures, collisions, creation/update errors, and
	// any other condition preventing completion. For Archiving phases,
	// this lists objects still awaiting deletion. Each entry identifies
	// the object and carries failure messages. Empty when status is
	// Ready, Superseded, Archived, or Unknown. The list may contain at
	// most 50 entries, matching the maximum number of objects per phase.
	// +kubebuilder:validation:MaxItems=50
	// +listType=atomic
	// +optional
	ObjectDetails []ObjectStatus `json:"objectDetails,omitempty"`
}

// ObjectCounts reports the number of objects in a ClusterObjectSet by state.
type ObjectCounts struct {
	// total is the number of objects in this object set.
	// +required
	// +kubebuilder:validation:Minimum:=0
	// +kubebuilder:validation:Maximum:=1000
	Total *int64 `json:"total,omitempty"`

	// present is the number of objects in this object set that exist on the
	// cluster and are owned by this object set, or another in the same group.
	// During reconcile, this counts objects that the controller has found or
	// created. During teardown, this decrements toward zero as objects are deleted.
	// +required
	// +kubebuilder:validation:Minimum:=0
	// +kubebuilder:validation:Maximum:=1000
	Present *int64 `json:"present,omitempty"`

	// synced is the number of objects in this object set whose cluster state
	// matches the desired state. Set to zero during teardown.
	// +required
	// +kubebuilder:validation:Minimum:=0
	// +kubebuilder:validation:Maximum:=1000
	Synced *int64 `json:"synced,omitempty"`

	// ready is the number of objects in this object set that are synced
	// and pass their assertions.
	// +required
	// +kubebuilder:validation:Minimum:=0
	// +kubebuilder:validation:Maximum:=1000
	Ready *int64 `json:"ready,omitempty"`
}

// ObjectStatus identifies a managed object and its failure messages.
type ObjectStatus struct {
	// group is the API group of the object (empty string for core
	// resources). At most 253 characters (DNS subdomain max).
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=253
	// +kubebuilder:validation:XValidation:rule=`!format.dns1123Subdomain().validate(self).hasValue()`,message="the value must be a valid DNS subdomain: lowercase alphanumeric characters, hyphens, and dots, starting and ending with an alphanumeric character."
	// +optional
	Group string `json:"group,omitempty"`

	// resource is the lowercase, plural resource type of the object
	// (for example, "pods" or "configmaps"). Must be between 1 and 63
	// characters.
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=63
	// +kubebuilder:validation:XValidation:rule=`!format.dns1035Label().validate(self).hasValue()`,message="the value must consist of only lowercase alphanumeric characters and hyphens, must start with a letter, and must end with an alphanumeric character."
	// +required
	Resource string `json:"resource,omitempty"`

	// namespace is the namespace of the object. Empty for cluster-scoped
	// resources. At most 253 characters (DNS subdomain max).
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=253
	// +kubebuilder:validation:XValidation:rule=`!format.dns1123Label().validate(self).hasValue()`,message="the value must consist of only lowercase alphanumeric characters and hyphens, and must start and end with an alphanumeric character."
	// +optional
	Namespace string `json:"namespace,omitempty"`

	// name is the name of the object. Must be between 1 and 253
	// characters (DNS subdomain max).
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=253
	// +kubebuilder:validation:XValidation:rule=`self != "." && self != ".." && !self.contains("/") && !self.contains("%")`,message="name must be a valid object name: it may not be '.' or '..' or contain '/' or '%'"
	// +required
	Name string `json:"name,omitempty"`

	// messages lists the failure reasons for this object. The maximum
	// of 18 entries accounts for up to 16 assertion probe failures,
	// one collision message, and one message to note truncation if necessary.
	// Each message is at most 1024 characters; longer messages are truncated
	// by the controller.
	// +kubebuilder:validation:MaxItems=18
	// +kubebuilder:validation:items:MinLength=1
	// +kubebuilder:validation:items:MaxLength=1024
	// +listType=atomic
	// +optional
	Messages []string `json:"messages,omitempty"`
}

// PhaseStatus describes the current state of a phase in the rollout.
//
// +kubebuilder:validation:Enum=InvalidSpecification;PreconditionsNotMet;Pending;Reconciling;Stabilizing;Ready;Unknown;Superseded;Archiving;Archived
type PhaseStatus string

const (
	// PhaseStatusInvalidSpecification indicates the phase failed preflight validation
	// in a permanent way that requires a spec change to resolve (e.g. a schema
	// violation, cross-phase object duplication, or an invalid phase name).
	PhaseStatusInvalidSpecification PhaseStatus = "InvalidSpecification"

	// PhaseStatusPreconditionsNotMet indicates the phase failed a recoverable preflight
	// dry-run check — for example, RBAC permissions or a dependency CRD that has not
	// yet propagated to the cluster. The controller retries automatically; no spec
	// change is required.
	PhaseStatusPreconditionsNotMet PhaseStatus = "PreconditionsNotMet"

	// PhaseStatusPending indicates the phase is not being actively
	// reconciled, but the controller has checked and some objects do not
	// match the desired state.
	PhaseStatusPending PhaseStatus = "Pending"

	// PhaseStatusReconciling indicates the controller is actively applying
	// objects in this phase and not all objects are synced yet.
	PhaseStatusReconciling PhaseStatus = "Reconciling"

	// PhaseStatusStabilizing indicates all objects in this phase are
	// synced but some assertions are not yet passing. The controller is
	// not actively writing; it is waiting for other controllers or
	// external actions to bring the objects into the expected state.
	PhaseStatusStabilizing PhaseStatus = "Stabilizing"

	// PhaseStatusReady indicates all objects in this phase are synced
	// and pass their assertions.
	PhaseStatusReady PhaseStatus = "Ready"

	// PhaseStatusUnknown indicates this phase was not evaluated during
	// the most recent reconcile.
	PhaseStatusUnknown PhaseStatus = "Unknown"

	// PhaseStatusSuperseded indicates all objects in this phase have been
	// adopted by a newer revision.
	PhaseStatusSuperseded PhaseStatus = "Superseded"

	// PhaseStatusArchiving indicates the controller is actively deleting
	// objects in this phase.
	PhaseStatusArchiving PhaseStatus = "Archiving"

	// PhaseStatusArchived indicates all objects in this phase have
	// been deleted from the cluster.
	PhaseStatusArchived PhaseStatus = "Archived"
)

// TODO(COD): Update the archival description below when archival decisions move
// to ClusterObjectDeployment reconciliation.

// +genclient
// +genclient:nonNamespaced
// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster
// +kubebuilder:subresource:status
// +kubebuilder:validation:XValidation:rule="self.metadata.name == '%s-%d'.format([self.spec.group, self.spec.revision])",message="metadata.name must be <spec.group>-<spec.revision>"
// +kubebuilder:selectablefield:JSONPath=`.spec.group`
// +kubebuilder:printcolumn:name="Group",type=string,JSONPath=`.spec.group`
// +kubebuilder:printcolumn:name="Revision",type=integer,JSONPath=`.spec.revision`
// +kubebuilder:printcolumn:name="Ready",type=string,JSONPath=`.status.conditions[?(@.type=='Ready')].status`
// +kubebuilder:printcolumn:name="Reason",type=string,JSONPath=`.status.conditions[?(@.type=='Ready')].reason`
// +kubebuilder:printcolumn:name="#Total",type=integer,JSONPath=`.status.objectCounts.total`
// +kubebuilder:printcolumn:name="#Present",type=integer,JSONPath=`.status.objectCounts.present`
// +kubebuilder:printcolumn:name="#Synced",type=integer,JSONPath=`.status.objectCounts.synced`
// +kubebuilder:printcolumn:name="#Ready",type=integer,JSONPath=`.status.objectCounts.ready`
// +kubebuilder:printcolumn:name=Age,type=date,JSONPath=`.metadata.creationTimestamp`

// ClusterObjectSet represents an immutable snapshot of Kubernetes objects to
// apply and manage on the cluster. Each revision contains objects organized into
// phases that roll out sequentially. The same object can only be managed by a
// single revision at a time. Ownership of objects is transitioned from one revision
// to the next as new revisions are rolled out. Once the latest revision has rolled
// out successfully, previous active revisions are archived for posterity.
// Set metadata.name explicitly to <spec.group>-<spec.revision>, using decimal
// notation without leading zeros. This ensures revision uniqueness within a group.
// Name generation through metadata.generateName is not supported.
// +kubebuilder:validation:XValidation:rule="!has(oldSelf.status) || has(self.status)",message="status cannot be removed once set"
type ClusterObjectSet struct {
	metav1.TypeMeta `json:",inline"`

	// metadata is the standard object's metadata.
	// More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
	// +optional
	metav1.ObjectMeta `json:"metadata,omitempty"`

	// spec defines the desired state of the ClusterObjectSet.
	// +required
	Spec ClusterObjectSetSpec `json:"spec,omitzero"`

	// status is optional and defines the observed state of the ClusterObjectSet.
	// Cannot be removed once set; this is to prevent immutable fields such as completedAt
	// from being cleared by an update which omits the status.
	// +optional
	Status ClusterObjectSetStatus `json:"status,omitzero"`
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
