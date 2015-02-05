package server

import (
	"net/http"

	"github.com/gorilla/mux"
)

func registerMinions(router *mux.Router) {
	router.HandleFunc("/minions", minionList).Methods("GET")
	router.HandleFunc("/minions/{id}", minionGet).Methods("GET")
}

// Get Minion api endpoint.
func minionGet(w http.ResponseWriter, r *http.Request) {
	err := k8sproxy.DoAndRespond(w, r)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
	}
}

// List Minions api endpoint.
func minionList(w http.ResponseWriter, r *http.Request) {
	err := k8sproxy.DoAndRespond(w, r)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
	}
}
