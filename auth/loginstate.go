package auth

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/coreos/go-oidc/oidc"
)

// loginState represents the current login state of a user.
// None of the serializable fields contain any sensitive information,
// and should be safe to send as a non-http-only cookie.
type loginState struct {
	UserID string `json:"userID"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	exp    time.Time
	token  token
	now    nowFunc
}

// newLoginState unpacks a token and generates a new loginState from it.
func newLoginState(tok token) (*loginState, error) {
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

// stateCookie serializes the loginState to a cookie.
// This cookie is considered insecure, contains no sensitive info, and is used primarly for influencing UI decisions.
// Its expiration should match that of the auth cookie.
func (ls *loginState) stateCookie() (*http.Cookie, error) {
	enc, err := json.Marshal(&ls)
	if err != nil {
		return nil, err
	}

	return &http.Cookie{
		HttpOnly: false,
		Name:     cookieNameLoginState,
		Value:    base64.StdEncoding.EncodeToString(enc),
		Path:     "/",
		MaxAge:   maxAge(ls.exp, ls.now()),
		// For old IE, ignored by most browsers.
		Expires: ls.exp,
	}, nil
}

// tokenCookie generates a new cookie for the user's token.
func (ls *loginState) tokenCookie() *http.Cookie {
	return &http.Cookie{
		HttpOnly: true,
		Name:     cookieNameToken,
		Value:    ls.token.Encode(),
		Path:     "/",
		MaxAge:   maxAge(ls.exp, ls.now()),
		// For old IE, ignored by most browsers.
		Expires: ls.exp,
	}
}
