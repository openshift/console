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
	issuerURL string
	clientID  string

	providerCache *AsyncCache[*oidc.Provider]

	// This preserves the old logic of associating users with session keys
	// and requires smart routing when running multiple backend instances.
	sessions *SessionStore

	cookiePath    string
	secureCookies bool
}

type oidcConfig struct {
	client        *http.Client // FIXME: this should be client construct func
	issuerURL     string
	clientID      string
	cookiePath    string
	secureCookies bool
}

func newOIDCAuth(ctx context.Context, sessionStore *SessionStore, c *oidcConfig) (*oidcAuth, error) {
	ctx = oidc.ClientContext(ctx, c.client)

	// NewProvider attempts to do OIDC Discovery
	providerCache, err := NewAsyncCache[*oidc.Provider](
		ctx, 5*time.Minute,
		func(cacheCtx context.Context) (*oidc.Provider, error) { return oidc.NewProvider(cacheCtx, c.issuerURL) },
	)
	if err != nil {
		return nil, err
	}

	providerCache.Run(ctx)

	return &oidcAuth{
		issuerURL:     c.issuerURL,
		clientID:      c.clientID,
		providerCache: providerCache,
		sessions:      sessionStore,
		cookiePath:    c.cookiePath,
		secureCookies: c.secureCookies,
	}, nil
}

func (o *oidcAuth) login(w http.ResponseWriter, token *oauth2.Token) (*loginState, error) {
	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok {
		return nil, errors.New("token response did not have an id_token field")
	}

	idToken, err := o.verify(context.TODO(), rawIDToken)
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
		Name:     openshiftAccessTokenCookieName,
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

func (o *oidcAuth) verify(ctx context.Context, rawIDToken string) (*oidc.IDToken, error) {
	provider := o.providerCache.GetItem()
	return provider.Verifier(&oidc.Config{ClientID: o.clientID}).Verify(ctx, rawIDToken)
}

func (o *oidcAuth) DeleteCookie(w http.ResponseWriter, r *http.Request) {
	// The returned login state can be nil even if err == nil.
	if ls, _ := o.getLoginState(r); ls != nil {
		o.sessions.deleteSession(ls.sessionToken)
	}

	// Delete session cookie
	cookie := http.Cookie{
		Name:     openshiftAccessTokenCookieName,
		Value:    "",
		MaxAge:   0,
		HttpOnly: true,
		Path:     o.cookiePath,
		Secure:   o.secureCookies,
	}
	http.SetCookie(w, &cookie)
}

func (o *oidcAuth) logout(w http.ResponseWriter, r *http.Request) {
	o.DeleteCookie(w, r)
	w.WriteHeader(http.StatusNoContent)
}

func (o *oidcAuth) getLoginState(r *http.Request) (*loginState, error) {
	sessionCookie, err := r.Cookie(openshiftAccessTokenCookieName)
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

func (o *oidcAuth) Authenticate(r *http.Request) (*User, error) {
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

func (o *oidcAuth) GetSpecialURLs() SpecialAuthURLs {
	return SpecialAuthURLs{}
}

func (o *oidcAuth) getEndpointConfig() oauth2.Endpoint {
	return o.providerCache.GetItem().Endpoint()
}
