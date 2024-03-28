package auth

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	oidc "github.com/coreos/go-oidc"
	"golang.org/x/oauth2"

	"github.com/openshift/console/pkg/auth/sessions"
	"github.com/openshift/console/pkg/serverutils/asynccache"
)

type oauth2ConfigConstructor func(oauth2.Endpoint) *oauth2.Config

type oidcAuth struct {
	*oidcConfig

	providerCache *asynccache.AsyncCache[*oidc.Provider]

	// This preserves the old logic of associating users with session keys
	// and requires smart routing when running multiple backend instances.
	sessions *sessions.CombinedSessionStore

	refreshLock sync.Mutex
}

type oidcConfig struct {
	getClient             func() *http.Client
	issuerURL             string
	clientID              string
	cookiePath            string
	secureCookies         bool
	constructOAuth2Config oauth2ConfigConstructor
}

func newOIDCAuth(ctx context.Context, sessionStore *sessions.CombinedSessionStore, c *oidcConfig) (*oidcAuth, error) {
	// NewProvider attempts to do OIDC Discovery
	providerCache, err := asynccache.NewAsyncCache[*oidc.Provider](
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
		oidcConfig:    c,
		providerCache: providerCache,
		sessions:      sessionStore,
		refreshLock:   sync.Mutex{},
	}, nil
}

func (o *oidcAuth) login(w http.ResponseWriter, r *http.Request, token *oauth2.Token) (*sessions.LoginState, error) {

	ls, err := sessions.NewLoginState(o.verify, token)
	if err != nil {
		return nil, err
	}
	if err := o.sessions.AddSession(w, r, ls); err != nil {
		return nil, err
	}

	o.sessions.PruneSessions()
	return ls, nil
}

func (o *oidcAuth) refreshSession(ctx context.Context, w http.ResponseWriter, r *http.Request, oauthConfig *oauth2.Config, cookieRefreshToken string) (*sessions.LoginState, error) {
	o.refreshLock.Lock()
	defer o.refreshLock.Unlock()

	session, err := o.sessions.GetSession(w, r)
	if err != nil {
		return nil, err
	}

	// if the refresh token got changed by someone else in the meantime (guarded by the refreshLock),
	//  use the most current session instead of doing the full token refresh
	if session != nil && session.RefreshToken() != cookieRefreshToken {
		// TODO: add metrics here
		o.sessions.UpdateCookieRefreshToken(w, r, session.RefreshToken()) // we must update our own client session, too!
		return session, nil
	}

	newTokens, err := oauthConfig.TokenSource(ctx, &oauth2.Token{RefreshToken: cookieRefreshToken}).Token()
	if err != nil {
		return nil, fmt.Errorf("failed to refresh a token %s: %w", cookieRefreshToken, err)
	}

	ls, err := o.sessions.UpdateTokens(w, r, o.verify, newTokens)
	if err != nil {
		return nil, fmt.Errorf("failed to update session tokens: %w", err)
	}

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

	if ls == nil || ls.IsExpired() {
		if refreshToken := o.sessions.GetCookieRefreshToken(r); refreshToken != "" {
			return o.refreshSession(r.Context(), w, r, o.oauth2Config(), refreshToken)
		}

		return nil, fmt.Errorf("a session was not found on server or is expired")
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

func (o *oidcAuth) oauth2Config() *oauth2.Config {
	return o.oidcConfig.constructOAuth2Config(o.providerCache.GetItem().Endpoint())
}
