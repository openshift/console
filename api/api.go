package api

import (
	"log"
	"path"

	"github.com/coreos-inc/bridge/Godeps/_workspace/src/github.com/gorilla/mux"
)

const (
	Version = "v1"
	Name    = "bridge"
)

func Setup(r *mux.Router) {
	basePath := "/" + path.Join("api", Name, Version)
	log.Printf("subrouter basePath=%s", basePath)
	apiRouter := r.PathPrefix(basePath).Subrouter()

	registerDiscovery(apiRouter)
	registerUsers(apiRouter)
	registerPods(apiRouter)
	registerControllers(apiRouter)
	registerServices(apiRouter)
}
