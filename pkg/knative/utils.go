package knative

import (
	"encoding/json"
	"net/http"

	apiextensions "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"github.com/coreos/pkg/capnslog"
	"github.com/openshift/console/pkg/serverutils"
)

var (
	plog = capnslog.NewPackageLogger("github.com/openshift/console", "knative")
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
	Name string `json:"name,omitempty" protobuf:"bytes,1,opt,name=name"`
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

// EventSourceFilter shall filter partial metadata from knative event sources CRDs before propagating
func EventSourceFilter(w http.ResponseWriter, r *http.Response) {
	var eventSourceList EventSourceList

	if err := json.NewDecoder(r.Body).Decode(&eventSourceList); err != nil {
		plog.Errorf("Event Source CRD response deserialization failed: %s", err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: err.Error()})
	}

	if err := json.NewEncoder(w).Encode(eventSourceList); err != nil {
		plog.Errorf("Event Source CRD response serialization failed: %s", err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: err.Error()})
	}
}
