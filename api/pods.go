package api

import (
	"net/http"

	"github.com/coreos-inc/bridge/Godeps/_workspace/src/github.com/gorilla/mux"
)

func registerPods(router *mux.Router) {
	router.HandleFunc("/pods", podList).Methods("GET")
	router.HandleFunc("/pods/{id}", podGet).Methods("GET")
}

// Get Pod api endpoint.
func podGet(w http.ResponseWriter, r *http.Request) {
	err := k8proxy.DoAndRespond(w, r)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
	}
	//http.ServeFile(w, r, "api/mock/pod.json")
}

// List Pods api endpoint.
func podList(w http.ResponseWriter, r *http.Request) {
	err := k8proxy.DoAndRespond(w, r)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
	}
	//http.ServeFile(w, r, "api/mock/pod-list.json")
}
