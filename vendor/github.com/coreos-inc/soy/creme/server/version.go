package server

import (
	"net/http"

	"github.com/coreos/pkg/httputil"
)

// Expect versionCode to be defined at build time with
// -ldflags "-X github.com/coreos-inc/soy/creme/server.versionCode $GIT_TAG"
var versionCode string

type versionResponse struct {
	Version string `json:"version"`
}

func versionFunc(w http.ResponseWriter, r *http.Request) {
	err := httputil.WriteJSONResponse(w, http.StatusOK, versionResponse{
		Version: versionCode,
	})
	if err != nil {
		plog.Errorf("Failed to write JSON response: %v", err)
	}
}
