package main

import (
	"fmt"
	"html/template"
	"log"
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
	listenAddress string
	publicDir     string
	indexTemplate *template.Template
)

// Serve the front-end index page.
func IndexHandler(w http.ResponseWriter, r *http.Request) {
	if err := indexTemplate.ExecuteTemplate(w, "index.html", nil); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func main() {
	publicDir = os.Getenv("PUBLIC_DIR")
	if publicDir == "" {
		publicDir = "./frontend/public"
	}

	listenAddress = os.Getenv("ADDRESS")
	if listenAddress == "" {
		listenAddress = "0.0.0.0:9000"
	}

	if _, err := os.Stat(path.Join(publicDir, "index.html")); err != nil {
		fmt.Println("Static files do not exist in provided PUBLIC_DIR env variable.")
		os.Exit(1)
	}

	handle()
}

func handle() {
	r := mux.NewRouter()

	// Simple static file server for requests containing static prefix.
	r.PathPrefix(staticPrefix).Handler(http.StripPrefix(staticPrefix, http.FileServer(http.Dir(publicDir))))

	// Endpoints for API XHR requests.
	api.Setup(r)

	// Serve index page for all other requests.
	indexTemplate = template.Must(template.ParseFiles(path.Join(publicDir, "index.html")))
	r.HandleFunc("/{path:.*}", IndexHandler)

	http.Handle("/", r)

	log.Printf("listening on: %s", listenAddress)
	if err := http.ListenAndServe(listenAddress, nil); err != nil {
		log.Fatal("error on ListenAndServe: %s", err)
	}
}
