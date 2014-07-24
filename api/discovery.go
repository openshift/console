package api

import (
	"net/http"

	"github.com/coreos-inc/bridge/Godeps/_workspace/src/github.com/gorilla/mux"
)

func registerDiscovery(router *mux.Router) {
	router.HandleFunc("/discovery/v1/rest", discoveryGet).Methods("GET")
}

// Serve the discovery json file.
func discoveryGet(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "schema/"+Version+".json")
}
