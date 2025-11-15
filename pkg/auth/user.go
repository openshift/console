package auth

import (
	"net/http"
)

const (
	UserContextKey = "user"
)

func GetUserFromRequestContext(r *http.Request) *User {
	if user := r.Context().Value(UserContextKey); user != nil {
		if user, ok := user.(*User); ok {
			return user
		}
	}
	return nil
}
