package api

import (
	"net/http"

	"github.com/coreos-inc/bridge/Godeps/_workspace/src/github.com/gorilla/mux"
)

func registerControllers(router *mux.Router) {
	router.HandleFunc("/replicationControllers", controllerList).Methods("GET")
	router.HandleFunc("/replicationControllers", controllerCreate).Methods("POST")
	router.HandleFunc("/replicationControllers/{id}", controllerGet).Methods("GET")
	router.HandleFunc("/replicationControllers/{id}", controllerDelete).Methods("DELETE")
}

// Get Controller api endpoint.
func controllerGet(w http.ResponseWriter, r *http.Request) {
	err := k8sproxy.DoAndRespond(w, r)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
	}
}

func controllerCreate(w http.ResponseWriter, r *http.Request) {
	err := k8sproxy.DoAndRespond(w, r)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
	}
}

func controllerDelete(w http.ResponseWriter, r *http.Request) {
	err := k8sproxy.DoAndRespond(w, r)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
	}
}

// List Controllers api endpoint.
func controllerList(w http.ResponseWriter, r *http.Request) {
	err := k8sproxy.DoAndRespond(w, r)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
	}
}
