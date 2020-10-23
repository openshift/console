package serverutils

import (
	"encoding/json"
	"net/http"

	"k8s.io/klog"
)

// Copied from Server package to maintain error response consistency
func SendResponse(rw http.ResponseWriter, code int, resp interface{}) {
	enc, err := json.Marshal(resp)
	if err != nil {
		klog.Errorf("Failed JSON-encoding HTTP response: %v", err)
		rw.WriteHeader(http.StatusInternalServerError)
		return
	}

	rw.Header().Set("Content-Type", "application/json")
	rw.WriteHeader(code)

	_, err = rw.Write(enc)
	if err != nil {
		klog.Errorf("Failed sending HTTP response body: %v", err)
	}
}

type ApiError struct {
	Err string `json:"error"`
}
