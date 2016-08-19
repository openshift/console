package server

import (
	"bytes"
	"net/http"
	"path"
	"time"

	log "github.com/Sirupsen/logrus"

	"github.com/coreos-inc/tectonic/bootstrap/binassets"
)

var (
	indexReader = bytes.NewReader(binassets.MustAsset("index.html"))
)

func serveIndex(w http.ResponseWriter, r *http.Request) {
	http.ServeContent(w, r, "index.html", time.Now(), indexReader)
}

func servePublicAsset(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	assetName := "public/" + path
	asset, err := binassets.Asset(assetName)
	log.Infof("Serving asset %s", assetName)
	if err != nil {
		http.Error(w, "no such asset", http.StatusNotFound)
		return
	}

	reader := bytes.NewReader(asset)
	http.ServeContent(w, r, path, time.Now(), reader)
}

func serveAssetFromDir(assetDir string, w http.ResponseWriter, r *http.Request) {
	servePath := path.Join(assetDir, r.URL.Path)
	log.Infof("Serving LOCAL FILE %s\n", servePath)
	http.ServeFile(w, r, servePath)
}

func frontendHandler(assetDir string) http.Handler {
	mux := http.NewServeMux()
	assetHandler := http.HandlerFunc(servePublicAsset)
	if assetDir != "" {
		assetHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			serveAssetFromDir(assetDir, w, r)
		})
	}
	mux.Handle("/public/", http.StripPrefix("/public/", assetHandler))
	mux.HandleFunc("/", serveIndex)
	return mux
}
