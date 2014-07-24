package api

import (
	"log"
	"net/http"

	"github.com/coreos-inc/bridge/Godeps/_workspace/src/github.com/gorilla/mux"
)

func registerControllers(router *mux.Router) {
	router.HandleFunc("/controllers", controllerList).Methods("GET")
	router.HandleFunc("/controllers/{id}", controllerGet).Methods("GET")
}

// Get Controller api endpoint.
func controllerGet(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	log.Printf("getting controller id: %s", id)
	http.ServeFile(w, r, "api/mock/controller.json")
}

// List Controllers api endpoint.
func controllerList(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "api/mock/controller-list.json")
}
