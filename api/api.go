package api

import (
	"log"
	"path"

	"github.com/coreos-inc/bridge/Godeps/_workspace/src/github.com/gorilla/mux"

	"github.com/coreos-inc/bridge/proxy"
)

const (
	Version = "v1"
	Name    = "bridge"
)

var (
	k8proxy *proxy.K8Proxy
)

func init() {
	// TODO(sym3tri): move to config
	p, err := proxy.NewK8Proxy("http://localhost:9909/api/v1beta1", "api/bridge/v1")
	if err != nil {
		panic("failed to initialize k8 proxy")
	}
	k8proxy = p
}

func Setup(r *mux.Router) {
	basePath := "/" + path.Join("api", Name, Version)
	log.Printf("subrouter basePath=%s", basePath)

	apiRouter := r.PathPrefix(basePath).Subrouter()

	registerDiscovery(apiRouter)
	registerUsers(apiRouter)
	registerPods(apiRouter)
	registerControllers(apiRouter)
	registerServices(apiRouter)
	registerMinions(apiRouter)
}
