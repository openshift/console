package server

import (
	"net/http"

	"github.com/coreos/pkg/httputil"
)

type Key struct {
	ID    string `json:"id"`
	Value string `json:"value"`
}

type keysResponse struct {
	Keys []Key `json:"keys"`
}

func keysFunc(keys []Key) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		err := httputil.WriteJSONResponse(w, http.StatusOK, keysResponse{
			Keys: keys,
		})
		if err != nil {
			plog.Errorf("Failed to write JSON response: %v", err)
		}
	}
}
