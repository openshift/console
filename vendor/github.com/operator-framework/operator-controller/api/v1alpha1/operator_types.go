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
	operatorutil "github.com/operator-framework/operator-controller/internal/util"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// OperatorSpec defines the desired state of Operator
type OperatorSpec struct {
	//+kubebuilder:validation:MaxLength:=48
	//+kubebuilder:validation:Pattern:=^[a-z0-9]+(-[a-z0-9]+)*$
	PackageName string `json:"packageName"`
}

const (
	// TODO(user): add more Types, here and into init()
	TypeReady = "Ready"

	ReasonNotImplemented      = "NotImplemented"
	ReasonResolutionFailed    = "ResolutionFailed"
	ReasonResolutionSucceeded = "ResolutionSucceeded"
)

func init() {
	// TODO(user): add Types from above
	operatorutil.ConditionTypes = append(operatorutil.ConditionTypes,
		TypeReady,
	)
	// TODO(user): add Reasons from above
	operatorutil.ConditionReasons = append(operatorutil.ConditionReasons,
		ReasonNotImplemented, ReasonResolutionSucceeded, ReasonResolutionFailed,
	)
}

// OperatorStatus defines the observed state of Operator
type OperatorStatus struct {
	// +patchMergeKey=type
	// +patchStrategy=merge
	// +listType=map
	// +listMapKey=type
	Conditions []metav1.Condition `json:"conditions,omitempty" patchStrategy:"merge" patchMergeKey:"type" protobuf:"bytes,1,rep,name=conditions"`
}

//+kubebuilder:object:root=true
//+kubebuilder:resource:scope=Cluster
//+kubebuilder:subresource:status

// Operator is the Schema for the operators API
type Operator struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   OperatorSpec   `json:"spec,omitempty"`
	Status OperatorStatus `json:"status,omitempty"`
}

//+kubebuilder:object:root=true

// OperatorList contains a list of Operator
type OperatorList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Operator `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Operator{}, &OperatorList{})
}
