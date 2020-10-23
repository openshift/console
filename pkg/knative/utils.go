package knative

import (
	"encoding/json"
	"net/http"

	"github.com/openshift/console/pkg/serverutils"

	"k8s.io/klog"
)

// EventSourceFilter shall filter partial metadata from knative event sources CRDs before propagating
func EventSourceFilter(w http.ResponseWriter, r *http.Response) {
	var eventSourceList EventSourceList

	if err := json.NewDecoder(r.Body).Decode(&eventSourceList); err != nil {
		klog.Errorf("Event Source CRD response deserialization failed: %s", err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: err.Error()})
	}

	if err := json.NewEncoder(w).Encode(eventSourceList); err != nil {
		klog.Errorf("Event Source CRD response serialization failed: %s", err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: err.Error()})
	}
}

// ChannelFilter shall filter partial metadata from knative channel CRDs before propagating
func ChannelFilter(w http.ResponseWriter, r *http.Response) {
	var channelList ChannelList

	if err := json.NewDecoder(r.Body).Decode(&channelList); err != nil {
		klog.Errorf("Channel CRD response deserialization failed: %s", err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: err.Error()})
	}

	if err := json.NewEncoder(w).Encode(channelList); err != nil {
		klog.Errorf("Channel CRD response serialization failed: %s", err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: err.Error()})
	}
}
