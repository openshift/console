package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	oidc "github.com/coreos/go-oidc"
	"golang.org/x/oauth2"
)

type oidcAuth struct {
	verifier *oidc.IDTokenVerifier

	// This preserves the old logic of associating users with session keys
	// and requires smart routing when running multiple backend instances.
	sessions *SessionStore

	cookiePath    string
	secureCookies bool
}

type oidcConfig struct {
	client        *http.Client
	issuerURL     string
	clientID      string
	cookiePath    string
	secureCookies bool
}

func newOIDCAuth(ctx context.Context, c *oidcConfig) (oauth2.Endpoint, *oidcAuth, error) {
	ctx = oidc.ClientContext(ctx, c.client)
	p, err := oidc.NewProvider(ctx, c.issuerURL)
	if err != nil {
		return oauth2.Endpoint{}, nil, err
	}

	return p.Endpoint(), &oidcAuth{
		verifier: p.Verifier(&oidc.Config{
			ClientID: c.clientID,
		}),
		sessions:      NewSessionStore(32768),
		cookiePath:    c.cookiePath,
		secureCookies: c.secureCookies,
	}, nil
}

func (o *oidcAuth) login(w http.ResponseWriter, token *oauth2.Token) (*loginState, error) {
	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok {
		return nil, errors.New("token response did not have an id_token field")
	}

	idToken, err := o.verifier.Verify(context.Background(), rawIDToken)
	if err != nil {
		return nil, err
	}
	var c json.RawMessage
	if err := idToken.Claims(&c); err != nil {
		return nil, fmt.Errorf("parsing claims: %v", err)
	}
	ls, err := newLoginState(rawIDToken, []byte(c))
	if err != nil {
		return nil, err
	}
	if err := o.sessions.addSession(ls); err != nil {
		return nil, err
	}

	cookie := http.Cookie{
		Name:     openshiftSessionCookieName,
		Value:    ls.sessionToken,
		MaxAge:   maxAge(ls.exp, time.Now()),
		HttpOnly: true,
		Path:     o.cookiePath,
		Secure:   o.secureCookies,
	}
	http.SetCookie(w, &cookie)

	o.sessions.pruneSessions()
	return ls, nil
}

func (o *oidcAuth) logout(w http.ResponseWriter, r *http.Request) {
	// The returned login state can be nil even if err == nil.
	if ls, _ := o.getLoginState(r); ls != nil {
		o.sessions.deleteSession(ls.sessionToken)
	}
	// Delete session cookie
	cookie := http.Cookie{
		Name:     openshiftSessionCookieName,
		Value:    "",
		MaxAge:   0,
		HttpOnly: true,
		Path:     o.cookiePath,
		Secure:   o.secureCookies,
	}
	http.SetCookie(w, &cookie)
	w.WriteHeader(http.StatusNoContent)
}

func (o *oidcAuth) getLoginState(r *http.Request) (*loginState, error) {
	sessionCookie, err := r.Cookie(openshiftSessionCookieName)
	if err != nil {
		return nil, err
	}
	sessionToken := sessionCookie.Value
	ls := o.sessions.getSession(sessionToken)
	if ls == nil {
		return nil, fmt.Errorf("No session found on server")
	}
	if ls.exp.Sub(ls.now()) < 0 {
		o.sessions.deleteSession(sessionToken)
		return nil, fmt.Errorf("Session is expired.")
	}
	return ls, nil
}

func (o *oidcAuth) authenticate(r *http.Request) (*User, error) {
	ls, err := o.getLoginState(r)
	if err != nil {
		return nil, err
	}

	return &User{
		ID:       ls.UserID,
		Username: ls.Name,
		Token:    ls.rawToken,
	}, nil
}
