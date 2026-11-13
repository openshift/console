/*
Copyright 2026.

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

const (
	ClusterObjectDeploymentKind = "ClusterObjectDeployment"

	// Condition types.
	ClusterObjectDeploymentTypeProgressing = "Progressing"
	ClusterObjectDeploymentTypeAvailable   = "Available"

	// Progressing condition reasons.
	ClusterObjectDeploymentReasonNewClusterObjectSetProgressed  = "NewClusterObjectSetProgressed"
	ClusterObjectDeploymentReasonNewClusterObjectSetProgressing = "NewClusterObjectSetProgressing"
	ClusterObjectDeploymentReasonProgressDeadlineExceeded       = ReasonProgressDeadlineExceeded
	ClusterObjectDeploymentReasonInvalidSpecification           = "InvalidSpecification"
	ClusterObjectDeploymentReasonRevisionPreconditionsNotMet    = "RevisionPreconditionsNotMet"
	ClusterObjectDeploymentReasonRevisionObjectCollision        = "RevisionObjectCollision"
	ClusterObjectDeploymentReasonRevisionInvalidSpecification   = "RevisionInvalidSpecification"
	ClusterObjectDeploymentReasonOwnerConflict                  = "OwnerConflict"
	ClusterObjectDeploymentReasonUnmanagedRevision              = "UnmanagedRevision"

	// Available condition reasons.
	ClusterObjectDeploymentReasonAvailable        = "Available"
	ClusterObjectDeploymentReasonUnavailable      = "Unavailable"
	ClusterObjectDeploymentReasonNoActiveRevision = "NoActiveRevision"
)

// ClusterObjectDeploymentSpec defines the mutable desired state of a deployment.
type ClusterObjectDeploymentSpec struct {
	// revisionHistoryLimit is the maximum number of archived (superseded)
	// ClusterObjectSet revisions to retain, so that rollout history can be
	// inspected and earlier revisions rolled back to. Active revisions are never
	// removed and do not count against this limit. When the number of archived
	// revisions exceeds this value, the oldest archived revisions are deleted
	// until the limit is met.
	//
	// A value of 0 retains no archived revisions. The minimum is 0, the maximum
	// is 50, and the default is 5.
	//
	// +kubebuilder:validation:Minimum=0
	// +kubebuilder:validation:Maximum=50
	// +kubebuilder:default=5
	// +optional
	RevisionHistoryLimit *int32 `json:"revisionHistoryLimit,omitempty"`

	// progressDeadlineMinutes is the maximum number of minutes a revision may take
	// to roll out, measured from the ClusterObjectSet's creation timestamp. Time
	// spent waiting for the ClusterObjectSet to be created is not counted. The
	// deadline covers all phases together; completing a phase does not reset it.
	// Once a revision has completed, the deadline no longer applies, even if it
	// later becomes unhealthy. When omitted, no deadline is enforced. The minimum
	// period is 1 minute, and the maximum is 720 minutes (12 hours).
	//
	// The deadline is rollout policy, not revision content: changing it does not
	// create a new revision and applies immediately to the latest active revision.
	//
	// +kubebuilder:validation:Minimum:=1
	// +kubebuilder:validation:Maximum:=720
	// +optional
	ProgressDeadlineMinutes int32 `json:"progressDeadlineMinutes,omitempty"`

	// template is the desired content of newly created ClusterObjectSets.
	// Changes to template create a new revision; existing revisions remain immutable.
	// +required
	Template ClusterObjectDeploymentTemplate `json:"template,omitzero"`
}

// ClusterObjectDeploymentTemplate describes the caller-controlled part of a revision.
type ClusterObjectDeploymentTemplate struct {
	// metadata contains labels and annotations propagated to each ClusterObjectSet
	// created from this template, except the reserved
	// olm.operatorframework.io/template-hash label, whose value is always set by the
	// controller. Changes to metadata change template identity and therefore create
	// a new revision.
	// +optional
	Metadata ClusterObjectDeploymentTemplateMetadata `json:"metadata,omitzero"`

	// spec contains the desired revision content. Group, revision, lifecycle state,
	// and ownership are assigned by the controller and cannot be set here.
	// +required
	Spec ClusterObjectDeploymentTemplateSpec `json:"spec,omitzero"`
}

// ClusterObjectDeploymentTemplateMetadata contains labels and annotations
// propagated to each ClusterObjectSet revision created from the template.
// At least one of labels or annotations must be set.
// +kubebuilder:validation:MinProperties=1
type ClusterObjectDeploymentTemplateMetadata struct {
	// labels is a set of key/value pairs propagated to each revision's metadata.
	// +optional
	// +kubebuilder:validation:MinProperties=1
	// +kubebuilder:validation:MaxProperties=32
	Labels map[string]string `json:"labels,omitempty"`

	// annotations is a set of key/value pairs propagated to each revision's
	// metadata. The controller validates them against the Kubernetes annotation
	// rules (key format and total size) before creating a revision; invalid
	// annotations are reported on the deployment's Progressing condition.
	// +optional
	// +kubebuilder:validation:MinProperties=1
	// +kubebuilder:validation:MaxProperties=32
	Annotations map[string]string `json:"annotations,omitempty"`
}

// ClusterObjectDeploymentTemplateSpec contains mutable ClusterObjectSet content.
type ClusterObjectDeploymentTemplateSpec struct {
	// phases is an ordered list of 1 to 20 uniquely named phases. Each phase contains
	// at most 50 objects, each expressed either as an inlineManifest (an embedded
	// Kubernetes object) or a secretRef (a reference to an immutable Secret holding
	// a serialized manifest). Phase, object, and probe order participate in template identity.
	// +required
	// +kubebuilder:validation:MinItems=1
	// +kubebuilder:validation:MaxItems=20
	// +listType=map
	// +listMapKey=name
	Phases []ClusterObjectSetPhase `json:"phases,omitempty"` // These are ordered groups of objects, not an enum describing lifecycle state.

	// progressionProbes supplies custom readiness probes for objects in every phase.
	// The same selector and assertion semantics as ClusterObjectSet.spec.progressionProbes apply.
	// When set, must contain 1 to 20 probes.
	// +optional
	// +kubebuilder:validation:MinItems=1
	// +kubebuilder:validation:MaxItems=20
	// +listType=atomic
	ProgressionProbes []ProgressionProbe `json:"progressionProbes,omitempty"`

	// collisionProtection is the required default collision protection strategy for all objects
	// in the revision. Individual phases or objects may override this value.
	// The resolution order is: object > phase > spec.
	// +required
	CollisionProtection CollisionProtection `json:"collisionProtection,omitempty"`
}

// ClusterObjectDeploymentStatus reports rollout progress.
type ClusterObjectDeploymentStatus struct {
	// conditions describes rollout progress and availability for the observed generation.
	//
	// Progressing is True with reason NewClusterObjectSetProgressing while the desired
	// rollout is incomplete, or False with reason NewClusterObjectSetProgressed after
	// completion. Completion remains recorded even if the completed revision later
	// becomes unhealthy. Progressing is False with reason ProgressDeadlineExceeded when
	// the latest revision does not roll out within spec.progressDeadlineMinutes.
	// Progressing is False with reason InvalidSpecification when spec.template.metadata
	// contains labels or annotations that are not valid for the resulting
	// ClusterObjectSet; no new revision is created until the metadata is corrected.
	// Progressing is False with reason OwnerConflict when the highest active,
	// non-deleting revision in the deployment's group is controlled by another
	// controller. No new revision is created while the conflict persists, even if
	// an owned revision has completed or exceeded its progress deadline.
	// Progressing is False with reason UnmanagedRevision when the highest active,
	// non-deleting revision in the deployment's group has no controller owner and is
	// not labeled apps.kubernetes.io/managed-by=object-controller, the proof that the
	// object-controller created it; such a revision is not adopted and no higher
	// revision is created while it persists. Recover by removing the revision or by
	// restoring the managed-by label on it. A revision that instead still references an
	// older UID of this deployment (for example after a restore) is left to garbage
	// collection rather than adopted, and no higher revision is created until GC removes
	// it; this resolves without user action and is not reported as a distinct condition.
	//
	// While a rollout is incomplete, Progressing also reflects why the latest (head
	// active) ClusterObjectSet revision is not yet Ready. It is True with reason
	// RevisionPreconditionsNotMet when the revision's preconditions are not yet met
	// (for example RBAC or a dependency CRD that has not propagated); the controller
	// keeps retrying. It is False with reason RevisionObjectCollision when the
	// revision's objects are owned by another controller or already exist, which the
	// user must resolve. It is False with reason RevisionInvalidSpecification when the
	// revision's own objects are invalid; this is distinct from InvalidSpecification
	// above, which refers to the deployment's spec.template.metadata. Inspect the
	// named ClusterObjectSet revision for the specific cause.
	//
	// Available is True with reason Available when at least one active (non-archived)
	// owned ClusterObjectSet revision is Ready, so the deployment remains available across
	// rollouts while a previous revision is still Ready. It is False with reason
	// Unavailable when owned active revisions exist but none are Ready yet, or with reason
	// NoActiveRevision when no owned active revision exists. Only an ownerless revision
	// is adopted before status is calculated, and only when it carries the
	// apps.kubernetes.io/managed-by=object-controller label that proves the
	// object-controller created it; an ownerless revision missing that label is left
	// untouched and, when it leads the group, blocks the rollout and is reported on the
	// Progressing condition with reason UnmanagedRevision. A revision that still carries a
	// controller owner reference is never adopted: foreign-owned revisions are excluded,
	// and a stale reference to an older UID of this deployment (for example after a
	// restore) is left to garbage collection rather than rewriting the reference to race
	// it.
	// +optional
	// +listType=map
	// +listMapKey=type
	// +patchStrategy=merge
	// +patchMergeKey=type
	Conditions []metav1.Condition `json:"conditions,omitempty" patchStrategy:"merge" patchMergeKey:"type"` //nolint:kubeapilinter // This CRD uses structural list-map validation, not protobuf serialization.
}

// +genclient
// +genclient:nonNamespaced
// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster,shortName=cod
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name=Available,type=string,JSONPath=`.status.conditions[?(@.type=='Available')].status`
// +kubebuilder:printcolumn:name=Progressing,type=string,JSONPath=`.status.conditions[?(@.type=='Progressing')].status`
// +kubebuilder:printcolumn:name=Age,type=date,JSONPath=`.metadata.creationTimestamp`
// +kubebuilder:validation:XValidation:rule="size(self.metadata.name) <= 52 && self.metadata.name.matches('^[a-z]([a-z0-9-]*[a-z0-9])?$')",message="name must be 1 to 52 lowercase alphanumeric or hyphen characters, starting with a letter and ending with an alphanumeric character"

// ClusterObjectDeployment manages mutable desired content through immutable
// ClusterObjectSet revisions. It is an experimental, cluster-scoped API.
type ClusterObjectDeployment struct {
	metav1.TypeMeta `json:",inline"`

	// metadata is the standard object's metadata. Names must be valid ClusterObjectSet group
	// names of at most 52 characters; child ClusterObjectSet names also include a hyphen and
	// up to ten revision digits.
	// +optional
	metav1.ObjectMeta `json:"metadata,omitempty"`

	// spec defines the desired deployment template.
	// +required
	Spec ClusterObjectDeploymentSpec `json:"spec,omitzero"`

	// status defines the observed state and is written through the status subresource.
	// +optional
	Status ClusterObjectDeploymentStatus `json:"status,omitzero"` //nolint:kubeapilinter // OpenShift APIs use value structs with omitzero for optional status.
}

// +kubebuilder:object:root=true

// ClusterObjectDeploymentList contains ClusterObjectDeployment objects.
type ClusterObjectDeploymentList struct {
	metav1.TypeMeta `json:",inline"`

	// metadata is the standard list metadata.
	// +optional
	metav1.ListMeta `json:"metadata,omitempty"`

	// items is the list of deployments.
	// +required
	Items []ClusterObjectDeployment `json:"items"`
}

func init() {
	SchemeBuilder.Register(func(s *runtime.Scheme) error {
		s.AddKnownTypes(GroupVersion, &ClusterObjectDeployment{}, &ClusterObjectDeploymentList{})
		return nil
	})
}
