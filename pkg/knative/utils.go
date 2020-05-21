package knative

import (
	"encoding/json"
	"net/http"

	"github.com/coreos/pkg/capnslog"
	"github.com/openshift/console/pkg/serverutils"
)

var (
	plog = capnslog.NewPackageLogger("github.com/openshift/console", "knative")
)

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
