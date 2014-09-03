package api

import (
	"net/http"

	"github.com/coreos-inc/bridge/Godeps/_workspace/src/github.com/gorilla/mux"
)

func registerPods(router *mux.Router) {
	router.HandleFunc("/pods", podList).Methods("GET")
	router.HandleFunc("/pods", podCreate).Methods("POST")
	router.HandleFunc("/pods/{id}", podGet).Methods("GET")
}

// Get Pod api endpoint.
func podGet(w http.ResponseWriter, r *http.Request) {
	err := k8sproxy.DoAndRespond(w, r)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
	}
}

func podCreate(w http.ResponseWriter, r *http.Request) {
	err := k8sproxy.DoAndRespond(w, r)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
	}
}

// List Pods api endpoint.
func podList(w http.ResponseWriter, r *http.Request) {
	err := k8sproxy.DoAndRespond(w, r)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
	}
}
