package server

import (
	"net/http"
	"path"
)

func registerDiscovery(prefix string, mux *http.ServeMux) {
	p := path.Join(prefix, "discovery/v1/rest")
	mux.HandleFunc(p, discoveryGet)
}

// Serve the discovery json file.
// TODO: server from compiled go source instead
func discoveryGet(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "schema/v1.json")
}
