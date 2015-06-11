package server

import (
	"errors"
	"net/http"
	"path"

	"github.com/coreos-inc/bridge/schema"
	"github.com/coreos/pkg/capnslog"
)

var (
	log = capnslog.NewPackageLogger("github.com/coreos-inc/bridge", "server")
)

func registerDiscovery(prefix string, mux *http.ServeMux) {
	p := path.Join(prefix, "discovery/v1/rest")
	mux.HandleFunc(p, discoveryGet)
}

// Serve the discovery json file.
func discoveryGet(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		sendError(w, http.StatusMethodNotAllowed, errors.New("only HTTP GET supported against this resource"))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if _, err := w.Write([]byte(schema.DiscoveryJSON)); err != nil {
		log.Errorf("Failed sending discovery JSON HTTP response body: %v", err)
		sendError(w, http.StatusInternalServerError, errors.New("error serving discovery JSON"))
	}
}
