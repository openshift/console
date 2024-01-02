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
	sessions *sessions.CombinedSessionStore

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

func newOIDCAuth(ctx context.Context, sessionStore *sessions.CombinedSessionStore, c *oidcConfig) (*oidcAuth, error) {
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

func (o *oidcAuth) login(w http.ResponseWriter, r *http.Request, token *oauth2.Token) (*sessions.LoginState, error) {
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
	if err := o.sessions.AddSession(w, r, ls); err != nil {
		return nil, err
	}

	o.sessions.PruneSessions()
	return ls, nil
}

func (o *oidcAuth) verify(ctx context.Context, rawIDToken string) (*oidc.IDToken, error) {
	provider := o.providerCache.GetItem()
	return provider.Verifier(&oidc.Config{ClientID: o.clientID}).Verify(ctx, rawIDToken)
}

func (o *oidcAuth) DeleteCookie(w http.ResponseWriter, r *http.Request) {
	// The returned login state can be nil even if err == nil.
	if ls, _ := o.getLoginState(w, r); ls != nil {
		o.sessions.DeleteSession(w, r, ls.SessionToken()) // TODO: could we just use the session token from the cookie instead of trying to retrieving the session first?
	}
}

func (o *oidcAuth) logout(w http.ResponseWriter, r *http.Request) {
	o.DeleteCookie(w, r)
	w.WriteHeader(http.StatusNoContent)
}

func (o *oidcAuth) getLoginState(w http.ResponseWriter, r *http.Request) (*sessions.LoginState, error) {
	ls, err := o.sessions.GetSession(w, r)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve login state: %v", err)
	}
	if ls == nil {
		return nil, fmt.Errorf("no session found on server")
	}
	return ls, nil
}

func (o *oidcAuth) Authenticate(w http.ResponseWriter, r *http.Request) (*User, error) {
	ls, err := o.getLoginState(w, r)
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
