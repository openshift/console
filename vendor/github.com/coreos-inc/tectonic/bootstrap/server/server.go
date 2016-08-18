package server

import (
	"net/http"

	"github.com/coreos-inc/tectonic/bootstrap/server/ctxh"
)

// Config configures a bootstrap server.
type Config struct {
	// If not "", serve assets from this local directory rather than from binassets
	AssetDir string
	// If true, don't attempt to configure a remote bootcfg server
	NoConfigMode bool
	// Store stores named clusters committed to bootcfg
	Store Store
}

// NewServer returns a new bootstrap server handler.
func NewServer(config *Config) http.Handler {
	mux := http.NewServeMux()
	mux.Handle("/", logRequests(frontendHandler(config.AssetDir)))
	mux.Handle("/images", logRequests(ctxh.NewHandler(listImagesHandler())))
	mux.Handle("/cluster/create", logRequests(syncHandler(ctxh.NewHandler(createHandler(config.Store, config.NoConfigMode)))))
	mux.Handle("/cluster/assets.zip", logRequests(ctxh.NewHandler(assetsHandler(config.Store))))
	mux.Handle("/cluster/status", logRequests(ctxh.NewHandler(statusHandler(config.Store))))
	return mux
}
