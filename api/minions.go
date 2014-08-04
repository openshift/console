package api

import (
	"net/http"

	"github.com/coreos-inc/bridge/Godeps/_workspace/src/github.com/gorilla/mux"
)

func registerMinions(router *mux.Router) {
	router.HandleFunc("/minions", minionList).Methods("GET")
	router.HandleFunc("/minions/{id}", minionGet).Methods("GET")
}

// Get Minion api endpoint.
func minionGet(w http.ResponseWriter, r *http.Request) {
	err := k8proxy.DoAndRespond(w, r)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
	}
}

// List Minions api endpoint.
func minionList(w http.ResponseWriter, r *http.Request) {
	err := k8proxy.DoAndRespond(w, r)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
	}
}
