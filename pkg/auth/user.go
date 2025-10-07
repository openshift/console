package auth

import (
	"net/http"
)

const (
	UserContextKey = "user"
)

func GetUserFromRequestContext(r *http.Request) *User {
	user, ok := r.Context().Value(UserContextKey).(*User)
	if !ok {
		return nil
	}
	return user
}
