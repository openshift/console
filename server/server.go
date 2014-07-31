package server

import (
	"fmt"
	"html/template"
	"net/http"
	"os"
	"path"

	"github.com/coreos-inc/bridge/Godeps/_workspace/src/github.com/gorilla/mux"

	"github.com/coreos-inc/bridge/api"
)

const (
	staticPrefix = "/static"
)

var (
	publicDir     string
	indexTemplate *template.Template
)

// Serve the front-end index page.
func IndexHandler(w http.ResponseWriter, r *http.Request) {
	// TODO (sym3tri): config option to cache template.
	indexTemplate = template.Must(template.ParseFiles(path.Join(publicDir, "index.html")))
	if err := indexTemplate.ExecuteTemplate(w, "index.html", nil); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func init() {
	publicDir = os.Getenv("PUBLIC_DIR")
	if publicDir == "" {
		publicDir = "./frontend/public"
	}

	if _, err := os.Stat(path.Join(publicDir, "index.html")); err != nil {
		fmt.Println("Static files do not exist in provided PUBLIC_DIR env variable.")
		os.Exit(1)
	}
}

func Handle() {
	r := mux.NewRouter()

	// Simple static file server for requests containing static prefix.
	r.PathPrefix(staticPrefix).Handler(http.StripPrefix(staticPrefix, http.FileServer(http.Dir(publicDir))))

	// Endpoints for API XHR requests.
	api.Setup(r)

	// Serve index page for all other requests.
	r.HandleFunc("/{path:.*}", IndexHandler)

	http.Handle("/", r)
}
