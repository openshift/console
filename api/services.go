package api

import (
	"net/http"

	"github.com/coreos-inc/bridge/Godeps/_workspace/src/github.com/gorilla/mux"
)

func registerServices(router *mux.Router) {
	router.HandleFunc("/services", serviceList).Methods("GET")
	router.HandleFunc("/services", serviceCreate).Methods("POST")
	router.HandleFunc("/services/{id}", serviceGet).Methods("GET")
	router.HandleFunc("/services/{id}", serviceGet).Methods("DELETE")
}

// Get Service api endpoint.
func serviceGet(w http.ResponseWriter, r *http.Request) {
	err := k8sproxy.DoAndRespond(w, r)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
	}
}

func serviceCreate(w http.ResponseWriter, r *http.Request) {
	err := k8sproxy.DoAndRespond(w, r)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
	}
}

func serviceDelete(w http.ResponseWriter, r *http.Request) {
	err := k8sproxy.DoAndRespond(w, r)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
	}
}

// List Services api endpoint.
func serviceList(w http.ResponseWriter, r *http.Request) {
	err := k8sproxy.DoAndRespond(w, r)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
	}
}
