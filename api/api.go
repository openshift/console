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
	k8sproxy *proxy.K8sProxy
)

func Setup(r *mux.Router) {
	var err error
	k8sproxy, err = proxy.NewK8sProxy("api/bridge/v1")
	if err != nil {
		panic("failed to initialize k8s proxy")
	}

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
