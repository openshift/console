package auth

import (
	"net/http"
)

const (
	UserContextKey = "user"
)

func GetUserFromRequestContext(r *http.Request) *User {
	if r == nil {
		return nil
	}

	userValue := r.Context().Value(UserContextKey)
	if userValue == nil {
		return nil
	}

	if user, ok := userValue.(*User); ok {
		return user
	}
	return nil
}
