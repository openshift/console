package api

import (
	"net/http"

	"github.com/coreos-inc/bridge/Godeps/_workspace/src/github.com/gorilla/mux"
)

func registerControllers(router *mux.Router) {
	router.HandleFunc("/replicationControllers", controllerList).Methods("GET")
	router.HandleFunc("/replicationControllers/{id}", controllerGet).Methods("GET")
}

// Get Controller api endpoint.
func controllerGet(w http.ResponseWriter, r *http.Request) {
	err := k8proxy.DoAndRespond(w, r)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
	}
	//http.ServeFile(w, r, "api/mock/controller.json")
}

// List Controllers api endpoint.
func controllerList(w http.ResponseWriter, r *http.Request) {
	err := k8proxy.DoAndRespond(w, r)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
	}
	//http.ServeFile(w, r, "api/mock/controller-list.json")
}
