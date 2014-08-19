package server

import (
	"fmt"
	"html/template"
	"net/http"
	"os"
	"path"

	"github.com/coreos-inc/bridge/Godeps/_workspace/src/github.com/gorilla/mux"

	"github.com/coreos-inc/bridge/api"
	"github.com/coreos-inc/bridge/config"
)

const (
	staticPrefix = "/static"
)

var (
	indexTemplate *template.Template
)

// Serve the front-end index page.
func IndexHandler(w http.ResponseWriter, r *http.Request) {
	// TODO (sym3tri): config option to cache template.
	indexTemplate = template.Must(template.ParseFiles(path.Join(*config.PublicDir, "index.html")))
	if err := indexTemplate.ExecuteTemplate(w, "index.html", nil); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func Handle() {
	if _, err := os.Stat(path.Join(*config.PublicDir, "index.html")); err != nil {
		fmt.Println("index.html not found in configured public-dir")
		os.Exit(1)
	}

	r := mux.NewRouter()

	// Simple static file server for requests containing static prefix.
	r.PathPrefix(staticPrefix).Handler(http.StripPrefix(staticPrefix, http.FileServer(http.Dir(*config.PublicDir))))

	// Endpoints for API XHR requests.
	api.Setup(r)

	// Serve index page for all other requests.
	r.HandleFunc("/{path:.*}", IndexHandler)

	http.Handle("/", r)
}
