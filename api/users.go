package api

import (
	"log"
	"net/http"

	"github.com/coreos-inc/bridge/Godeps/_workspace/src/github.com/gorilla/mux"

	"github.com/coreos-inc/bridge/schema"
)

func registerUsers(router *mux.Router) {
	router.HandleFunc("/users", userList).Methods("GET")
	router.HandleFunc("/users/{id}", userGet).Methods("GET")
}

func userGet(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	log.Printf("getting user id: %s", id)
	user := &schema.User{FirstName: "Ed", LastName: "Rooth"}
	sendResponse(w, http.StatusOK, user)
}

// List Users api endpoint.
func userList(w http.ResponseWriter, r *http.Request) {
	userPage := &schema.UserPage{
		NextPageToken: "foo",
		Users: []*schema.User{
			&schema.User{
				FirstName: "Ed",
				LastName:  "Rooth",
			},
		},
	}
	sendResponse(w, http.StatusOK, userPage)
}
