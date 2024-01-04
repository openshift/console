package sessions

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/coreos/go-oidc"
	"golang.org/x/oauth2"
)

// for unit testing
type nowFunc func() time.Time

type IDTokenVerifier func(context.Context, string) (*oidc.IDToken, error)

// loginState represents the current login state of a user.
// None of the serializable fields contain any sensitive information,
// and should be safe to send as a non-http-only cookie.
type LoginState struct {
	// IMPORTANT: if adding any ref type, change the DeepCopy() implementation
	userID       string
	name         string
	email        string
	exp          time.Time // 80% of token's lifetime
	now          nowFunc
	sessionToken string
	rawToken     string
	refreshToken string
}

type LoginJSON struct {
	UserID string `json:"userID"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Exp    int64  `json:"exp"`
}

type interestingClaims struct {
	Subject string   `json:"sub"`
	Expiry  jsonTime `json:"exp"`
	Email   string   `json:"email"`
	Name    string   `json:"name"`
}

// NewRawLoginState creates a new login state in cases where the access token
// is just an opaque string.
func NewRawLoginState(accessToken string) *LoginState {
	return &LoginState{
		rawToken: accessToken,
	}
}

// newLoginState unpacks a token and generates a new loginState from it.
func NewLoginState(tokenVerifier IDTokenVerifier, token *oauth2.Token) (*LoginState, error) {
	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok {
		return nil, errors.New("token response did not have an id_token field")
	}

	tokenClaims, err := parseIDToken(tokenVerifier, rawIDToken)
	if err != nil {
		return nil, err
	}

	ls := &LoginState{
		now:          time.Now,
		rawToken:     rawIDToken,
		refreshToken: token.RefreshToken,
		userID:       tokenClaims.Subject,
		email:        tokenClaims.Email,
		name:         tokenClaims.Name,
	}
	ls.UpdateExpiry(tokenClaims.Expiry)

	return ls, nil
}

func (ls *LoginState) UserID() string {
	return ls.userID
}

func (ls *LoginState) Username() string {
	return ls.name
}

func (ls *LoginState) Expiry() time.Time {
	return ls.exp
}

func (ls *LoginState) UpdateTokens(verifier IDTokenVerifier, tokenResponse *oauth2.Token) error {
	rawIDToken, ok := tokenResponse.Extra("id_token").(string)
	if !ok {
		return errors.New("token response did not have an id_token field")
	}

	tokenClaims, err := parseIDToken(verifier, rawIDToken)
	if err != nil {
		return fmt.Errorf("failed to update session tokens: %w", err)
	}

	if tokenClaims.Subject != ls.userID {
		// this might be an attempt to impersonate another user
		return fmt.Errorf("the new token's subject does not match the old one")
	}

	ls.rawToken = rawIDToken
	ls.refreshToken = tokenResponse.RefreshToken
	ls.UpdateExpiry(tokenClaims.Expiry)

	return nil
}

func (ls *LoginState) UpdateExpiry(expiry jsonTime) {
	now := ls.now()
	expiringAt := now.Add(time.Duration(0.8 * float64(time.Time(expiry).Sub(now))))
	ls.exp = expiringAt
}

func (ls *LoginState) AccessToken() string {
	return ls.rawToken
}

func (ls *LoginState) SessionToken() string {
	return ls.sessionToken
}

func (ls *LoginState) RefreshToken() string {
	return ls.refreshToken
}

func (ls *LoginState) IsExpired() bool {
	return ls.now().After(ls.exp)
}

func (ls *LoginState) ToLoginJSON() LoginJSON {
	return LoginJSON{
		UserID: ls.userID,
		Name:   ls.name,
		Email:  ls.email,
		Exp:    ls.exp.Unix(),
	}
}

func parseIDToken(tokenVerifier IDTokenVerifier, rawIDToken string) (*interestingClaims, error) {
	idToken, err := tokenVerifier(context.TODO(), rawIDToken)
	if err != nil {
		return nil, err
	}

	var claims json.RawMessage
	if err := idToken.Claims(&claims); err != nil {
		return nil, fmt.Errorf("parsing claims: %v", err)
	}

	c := &interestingClaims{}
	if err := json.Unmarshal(claims, c); err != nil {
		return nil, fmt.Errorf("error getting claims from token: %v", err)
	}

	if c.Subject == "" {
		return nil, fmt.Errorf("token missing require claim 'sub'")
	}

	return c, nil
}

// jsonTime copied from github.com/coreos/go-oidc

type jsonTime time.Time

func (j *jsonTime) UnmarshalJSON(b []byte) error {
	var n json.Number
	if err := json.Unmarshal(b, &n); err != nil {
		return err
	}
	var unix int64

	if t, err := n.Int64(); err == nil {
		unix = t
	} else {
		f, err := n.Float64()
		if err != nil {
			return err
		}
		unix = int64(f)
	}
	*j = jsonTime(time.Unix(unix, 0))
	return nil
}
