package oauth2

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	oidc "github.com/coreos/go-oidc"
	"golang.org/x/oauth2"
	"k8s.io/client-go/rest"

	"github.com/openshift/console/pkg/auth"
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
	metrics  *auth.Metrics

	refreshLock sync.Map // map [refreshToken -> sync.Mutex]
}

type oidcConfig struct {
	getClient              func() *http.Client
	issuerURL              string
	logoutRedirectOverride string
	clientID               string
	cookiePath             string
	secureCookies          bool
	constructOAuth2Config  oauth2ConfigConstructor
	internalK8sConfig      *rest.Config
}

func newOIDCAuth(ctx context.Context, sessionStore *sessions.CombinedSessionStore, c *oidcConfig, metrics *auth.Metrics) (*oidcAuth, error) {
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
		metrics:       metrics,
		refreshLock:   sync.Map{},
	}, nil
}

func (o *oidcAuth) login(w http.ResponseWriter, r *http.Request, token *oauth2.Token) (*sessions.LoginState, error) {
	ls, err := o.sessions.AddSession(w, r, o.verify, token)
	if err != nil {
		return nil, err
	}

	return ls, nil
}

func (o *oidcAuth) refreshSession(ctx context.Context, w http.ResponseWriter, r *http.Request, oauthConfig *oauth2.Config, cookieRefreshToken string) (*sessions.LoginState, error) {
	actual, _ := o.refreshLock.LoadOrStore(cookieRefreshToken, &sync.Mutex{})
	actual.(*sync.Mutex).Lock()
	defer actual.(*sync.Mutex).Unlock()

	tokenRefreshHandling := auth.TokenRefreshUnknown
	defer func() {
		o.metrics.TokenRefreshRequest(tokenRefreshHandling)
	}()

	session, err := o.sessions.GetSession(w, r)
	if err != nil {
		return nil, err
	}

	// if the refresh token got changed by someone else in the meantime (guarded by the refreshLock),
	//  use the most current session instead of doing the full token refresh
	if session != nil && session.RefreshToken() != cookieRefreshToken {
		tokenRefreshHandling = auth.TokenRefreshShortCircuit
		o.sessions.UpdateCookieRefreshToken(w, r, session.RefreshToken()) // we must update our own client session, too!
		return session, nil
	}

	tokenRefreshHandling = auth.TokenRefreshFull
	newTokens, err := oauthConfig.TokenSource(
		context.WithValue(ctx, oauth2.HTTPClient, o.getClient()), // supply our client with custom trust
		&oauth2.Token{RefreshToken: cookieRefreshToken},
	).Token()
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
	o.sessions.DeleteSession(w, r)
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

	if ls == nil || ls.ShouldRotate() {
		if refreshToken := o.sessions.GetCookieRefreshToken(r); refreshToken != "" {
			return o.refreshSession(r.Context(), w, r, o.oauth2Config(), refreshToken)
		}

		return nil, fmt.Errorf("a session was not found on server or is expired")
	}
	return ls, nil
}

func (o *oidcAuth) Authenticate(w http.ResponseWriter, r *http.Request) (*auth.User, error) {
	ls, err := o.getLoginState(w, r)
	if err != nil {
		return nil, err
	}

	return &auth.User{
		ID:       ls.UserID(),
		Username: ls.Username(),
		Token:    ls.AccessToken(),
	}, nil
}

func (o *oidcAuth) GetSpecialURLs() auth.SpecialAuthURLs {
	return auth.SpecialAuthURLs{}
}

func (o *oidcAuth) LogoutRedirectURL() string {
	if len(o.logoutRedirectOverride) > 0 {
		return o.logoutRedirectOverride
	}

	sessionEndpoints := struct {
		// Get the RP-initiated logout endpoint (https://openid.net/specs/openid-connect-rpinitiated-1_0.html)
		EndSessionEndpoint string `json:"end_session_endpoint"`
	}{}

	provider := o.providerCache.GetItem()
	provider.Claims(&sessionEndpoints)

	return sessionEndpoints.EndSessionEndpoint
}

func (o *oidcAuth) oauth2Config() *oauth2.Config {
	return o.oidcConfig.constructOAuth2Config(o.providerCache.GetItem().Endpoint())
}
