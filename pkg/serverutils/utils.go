package serverutils

import (
	"encoding/json"
	"github.com/coreos/pkg/capnslog"
	"net/http"
)

var (
	plog = capnslog.NewPackageLogger("github.com/openshift/console", "serverutils")
)

// Copied from Server package to maintain error response consistency
func SendResponse(rw http.ResponseWriter, code int, resp interface{}) {
	enc, err := json.Marshal(resp)
	if err != nil {
		plog.Printf("Failed JSON-encoding HTTP response: %v", err)
		rw.WriteHeader(http.StatusInternalServerError)
		return
	}

	rw.Header().Set("Content-Type", "application/json")
	rw.WriteHeader(code)

	_, err = rw.Write(enc)
	if err != nil {
		plog.Errorf("Failed sending HTTP response body: %v", err)
	}
}

type ApiError struct {
	Err string `json:"error"`
}
