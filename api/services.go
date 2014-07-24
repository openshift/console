package api

import (
	"log"
	"net/http"

	"github.com/coreos-inc/bridge/Godeps/_workspace/src/github.com/gorilla/mux"
)

func registerServices(router *mux.Router) {
	router.HandleFunc("/services", serviceList).Methods("GET")
	router.HandleFunc("/services/{id}", serviceGet).Methods("GET")
}

// Get Service api endpoint.
func serviceGet(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	log.Printf("getting service id: %s", id)
	http.ServeFile(w, r, "api/mock/service.json")
}

// List Services api endpoint.
func serviceList(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "api/mock/service-list.json")
}
