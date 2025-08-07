package auth

import (
	"net/http"
)

const (
	UserContextKey = "user"
)

func GetUserFromRequestContext(r *http.Request) *User {
	user := r.Context().Value(UserContextKey).(*User)
	return user
}
