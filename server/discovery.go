package server

import (
	"net/http"

	"github.com/gorilla/mux"
)

func registerDiscovery(router *mux.Router) {
	router.HandleFunc("/discovery/v1/rest", discoveryGet).Methods("GET")
}

// Serve the discovery json file.
// TODO: server from compiled go source instead
func discoveryGet(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "schema/v1.json")
}
