package auth

import (
	"fmt"
	"time"

	"github.com/coreos/go-oidc/oidc"
)

// loginState represents the current login state of a user.
// None of the serializable fields contain any sensitive information,
// and should be safe to send as a non-http-only cookie.
type loginState struct {
	UserID       string
	Name         string
	Email        string
	exp          time.Time
	token        Token
	now          nowFunc
	sessionToken string
}

type LoginJSON struct {
	UserID string `json:"userID"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Exp    int64  `json:"exp"`
}

// newLoginState unpacks a token and generates a new loginState from it.
func newLoginState(tok Token) (*loginState, error) {
	ls := &loginState{
		token: tok,
		now:   defaultNow,
	}

	claims, err := tok.Claims()
	if err != nil {
		return nil, fmt.Errorf("error getting claims from token: %v", err)
	}

	id, err := oidc.IdentityFromClaims(claims)
	if err != nil {
		return nil, err
	}

	if ls.Name, _, err = claims.StringClaim("name"); err != nil {
		return nil, err
	}

	ls.UserID = id.ID
	ls.Email = id.Email
	ls.exp = id.ExpiresAt
	return ls, nil
}

func (ls *loginState) toLoginJSON() LoginJSON {
	return LoginJSON{
		UserID: ls.UserID,
		Name:   ls.Name,
		Email:  ls.Email,
		Exp:    ls.exp.Unix(),
	}
}
