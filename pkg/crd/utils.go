package crd

import (
	"encoding/json"
	"net/http"

	"github.com/coreos/pkg/capnslog"
	"github.com/openshift/console/pkg/serverutils"
)

var (
	plog = capnslog.NewPackageLogger("github.com/openshift/console", "crd")
)

// CRDFilter filters all but the CRD UIDs before propagating. This lets the
// client detect new CRD without leaking any information about the content.
func CRDFilter(w http.ResponseWriter, r *http.Response) {
	var crdList CRDList

	if err := json.NewDecoder(r.Body).Decode(&crdList); err != nil {
		plog.Errorf("CRD response deserialization failed: %s", err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: err.Error()})
	}

	if err := json.NewEncoder(w).Encode(crdList); err != nil {
		plog.Errorf("CRD response serialization failed: %s", err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: err.Error()})
	}
}
