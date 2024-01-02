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

	"github.com/openshift/console/pkg/auth/sessions"
)

type oidcAuth struct {
	issuerURL string
	clientID  string

	providerCache *AsyncCache[*oidc.Provider]

	// This preserves the old logic of associating users with session keys
	// and requires smart routing when running multiple backend instances.
	sessions *sessions.SessionStore

	cookiePath    string
	secureCookies bool
}

type oidcConfig struct {
	getClient     func() *http.Client
	issuerURL     string
	clientID      string
	cookiePath    string
	secureCookies bool
}

func newOIDCAuth(ctx context.Context, sessionStore *sessions.SessionStore, c *oidcConfig) (*oidcAuth, error) {
	// NewProvider attempts to do OIDC Discovery
	providerCache, err := NewAsyncCache[*oidc.Provider](
		ctx, 5*time.Minute,
		func(cacheCtx context.Context) (*oidc.Provider, error) {
			oidcCtx := oidc.ClientContext(cacheCtx, c.getClient())
			return oidc.NewProvider(oidcCtx, c.issuerURL)
		},
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

func (o *oidcAuth) login(w http.ResponseWriter, token *oauth2.Token) (*sessions.LoginState, error) {
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
	ls, err := sessions.NewLoginState(rawIDToken, []byte(c))
	if err != nil {
		return nil, err
	}
	if err := o.sessions.AddSession(ls); err != nil {
		return nil, err
	}

	cookie := http.Cookie{
		Name:     sessions.OpenshiftAccessTokenCookieName,
		Value:    ls.SessionToken(),
		MaxAge:   maxAge(ls.Expiry(), time.Now()),
		HttpOnly: true,
		Path:     o.cookiePath,
		Secure:   o.secureCookies,
	}
	http.SetCookie(w, &cookie)

	o.sessions.PruneSessions()
	return ls, nil
}

func (o *oidcAuth) verify(ctx context.Context, rawIDToken string) (*oidc.IDToken, error) {
	provider := o.providerCache.GetItem()
	return provider.Verifier(&oidc.Config{ClientID: o.clientID}).Verify(ctx, rawIDToken)
}

func (o *oidcAuth) DeleteCookie(w http.ResponseWriter, r *http.Request) {
	// The returned login state can be nil even if err == nil.
	if ls, _ := o.getLoginState(r); ls != nil {
		o.sessions.DeleteSession(ls.SessionToken())
	}

	// Delete session cookie
	cookie := http.Cookie{
		Name:     sessions.OpenshiftAccessTokenCookieName,
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

func (o *oidcAuth) getLoginState(r *http.Request) (*sessions.LoginState, error) {
	sessionCookie, err := r.Cookie(sessions.OpenshiftAccessTokenCookieName)
	if err != nil {
		return nil, err
	}
	sessionToken := sessionCookie.Value
	ls := o.sessions.GetSession(sessionToken)
	if ls == nil {
		return nil, fmt.Errorf("No session found on server")
	}
	if ls.IsExpired() {
		o.sessions.DeleteSession(sessionToken)
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
		ID:       ls.UserID(),
		Username: ls.Username(),
		Token:    ls.AccessToken(),
	}, nil
}

func (o *oidcAuth) GetSpecialURLs() SpecialAuthURLs {
	return SpecialAuthURLs{}
}

func (o *oidcAuth) getEndpointConfig() oauth2.Endpoint {
	return o.providerCache.GetItem().Endpoint()
}

func maxAge(exp time.Time, curr time.Time) int {
	age := exp.Sub(curr)
	return int(age.Seconds())
}
