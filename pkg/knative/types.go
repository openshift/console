package knative

import (
	apiextensions "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// EventSourceVersion describes a version for CRD.
type EventSourceVersion struct {
	Name    string `json:"name" protobuf:"bytes,1,opt,name=name"`
	Served  bool   `json:"served" protobuf:"varint,2,opt,name=served"`
	Storage bool   `json:"storage" protobuf:"varint,3,opt,name=storage"`
}

// EventSourceSpec describes how a user wants their resource to appear
type EventSourceSpec struct {
	Group    string                                      `json:"group" protobuf:"bytes,1,opt,name=group"`
	Names    apiextensions.CustomResourceDefinitionNames `json:"names" protobuf:"bytes,3,opt,name=names"`
	Versions []EventSourceVersion                        `json:"versions" protobuf:"bytes,7,rep,name=versions"`
}

// EventSourceMeta is metadata that all persisted resources must have, which includes all objects users must create
type EventSourceMeta struct {
	Name   string            `json:"name,omitempty" protobuf:"bytes,1,opt,name=name"`
	Labels map[string]string `json:"labels,omitempty" protobuf:"bytes,11,rep,name=labels"`
}

// EventSourceDefinition represents a resource that should be exposed on the API server.
type EventSourceDefinition struct {
	metav1.TypeMeta `json:",inline"`
	EventSourceMeta `json:"metadata,omitempty" protobuf:"bytes,1,opt,name=metadata"`
	EventSourceSpec `json:"spec" protobuf:"bytes,2,opt,name=spec"`
}

// EventSourceList is a list of EventSourceDefinition objects.
type EventSourceList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty" protobuf:"bytes,1,opt,name=metadata"`

	// items list individual EventSourceDefinition objects
	Items []EventSourceDefinition `json:"items" protobuf:"bytes,2,rep,name=items"`
}

// ChannelList is a list of CRD per Channel
type ChannelList = EventSourceList
