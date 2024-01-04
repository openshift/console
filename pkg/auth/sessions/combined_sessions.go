package sessions

import (
	"fmt"
	"net/http"
	"sync"

	gorilla "github.com/gorilla/sessions"
	"golang.org/x/oauth2"
)

type CombinedSessionStore struct {
	serverStore *SessionStore
	clientStore *gorilla.CookieStore // FIXME: we need to determine what the default session expiration should be, possibly make it configurable

	sessionLock sync.Mutex
}

func NewSessionStore(authnKey, encryptKey []byte, secureCookies bool, cookiePath string) *CombinedSessionStore {
	clientStore := gorilla.NewCookieStore(authnKey, encryptKey)
	clientStore.Options.Secure = secureCookies
	clientStore.Options.HttpOnly = true
	clientStore.Options.SameSite = http.SameSiteLaxMode
	clientStore.Options.Path = cookiePath

	return &CombinedSessionStore{
		serverStore: NewServerSessionStore(32768),
		clientStore: clientStore,

		sessionLock: sync.Mutex{},
	}
}

func (cs *CombinedSessionStore) AddSession(w http.ResponseWriter, r *http.Request, ls *LoginState) error {
	cs.sessionLock.Lock()
	defer cs.sessionLock.Unlock()

	if err := cs.serverStore.AddSession(ls); err != nil {
		return fmt.Errorf("failed to add session to server store: %w", err)
	}

	clientSession, _ := cs.clientStore.Get(r, OpenshiftAccessTokenCookieName)
	clientSession.Values["session-token"] = ls.sessionToken
	clientSession.Values["refresh-token"] = ls.refreshToken

	return clientSession.Save(r, w)
}

// GetSession returns a session identified by the cookie from the current request.
// If the session is already expired, it deletes it and returns nil instead.
func (cs *CombinedSessionStore) GetSession(w http.ResponseWriter, r *http.Request) (*LoginState, error) {
	cs.sessionLock.Lock()
	defer cs.sessionLock.Unlock()

	// Get always returns a session, even if empty.
	clientSession, _ := cs.clientStore.Get(r, OpenshiftAccessTokenCookieName)

	// TODO: what happens if session-token is set by another instance and we get here?
	// Will we loop in redirects forever since it's set but we don't know anything about that session
	// and so we redirect back to login, which sees session token exists?
	var sessionToken, refreshToken string
	if sessionTokenIface, ok := clientSession.Values["session-token"]; ok { // FIXME: allow for multiple session tokens, add pruning
		sessionToken = sessionTokenIface.(string)
	}
	if refreshTokenIface, ok := clientSession.Values["refresh-token"]; ok {
		refreshToken = refreshTokenIface.(string)
	}

	loginState := cs.serverStore.GetSession(sessionToken, refreshToken)
	if loginState == nil {
		// // the session-token was created by someone else (or it was pruned), we need to get our own server session
		// clientSession.Values["session-token"] = "" // FIXME: wrong for non-sticky sessions but should be ok for PoC
		// clientSession.Save(r, w)
		return nil, nil
	}

	return loginState, nil
}

func (cs *CombinedSessionStore) GetCookieRefreshToken(r *http.Request) string {
	// Get always returns a session, even if empty.
	clientSession, _ := cs.clientStore.Get(r, OpenshiftAccessTokenCookieName)
	if refreshToken, ok := clientSession.Values["refresh-token"].(string); ok {
		return refreshToken
	}
	return ""
}

func (cs *CombinedSessionStore) UpdateCookieRefreshToken(w http.ResponseWriter, r *http.Request, refreshToken string) error {
	// no need to lock here since there shouldn't be any races around the client session
	clientSession, _ := cs.clientStore.Get(r, OpenshiftAccessTokenCookieName)
	clientSession.Values["refresh-token"] = refreshToken
	return clientSession.Save(r, w)
}

func (cs *CombinedSessionStore) UpdateTokens(w http.ResponseWriter, r *http.Request, tokenVerifier IDTokenVerifier, tokenResponse *oauth2.Token) (*LoginState, error) {
	cs.sessionLock.Lock()
	defer cs.sessionLock.Unlock()

	clientSession, _ := cs.clientStore.Get(r, OpenshiftAccessTokenCookieName)
	var oldRefreshToken string
	if oldToken, ok := clientSession.Values["refresh-token"]; ok {
		oldRefreshToken = oldToken.(string)
	}

	refreshToken := tokenResponse.RefreshToken
	clientSession.Values["refresh-token"] = refreshToken

	var loginState *LoginState
	sessionToken, ok := clientSession.Values["session-token"]
	if ok { // TODO: since we only have a single session token in the cookie, we need to check that the session was actually created by us or not
		loginState = cs.serverStore.GetSession(sessionToken.(string), "")
	}
	if loginState == nil {
		var err error
		// FIXME: all the below should be a part of AddSession
		loginState, err = NewLoginState(tokenVerifier, tokenResponse)
		if err != nil {
			return nil, err
		}
		if err := cs.serverStore.AddSession(loginState); err != nil {
			return nil, fmt.Errorf("failed to add session to server store: %w", err)
		}
		cs.serverStore.byRefreshToken[oldRefreshToken] = loginState
		clientSession.Values["session-token"] = loginState.sessionToken
	} else {
		if err := loginState.UpdateTokens(tokenVerifier, tokenResponse); err != nil {
			return nil, err
		}
		cs.serverStore.byRefreshToken[oldRefreshToken] = loginState // TODO: figure out a nicer way to do this in an internal method probably
		// loginState is a pointer to the cache so this effectively mutates it for everyone

	}

	return loginState, clientSession.Save(r, w)
}

func (cs *CombinedSessionStore) deleteSession(w http.ResponseWriter, r *http.Request, sessionToken string) error {
	clientSession, _ := cs.clientStore.Get(r, OpenshiftAccessTokenCookieName)
	delete(clientSession.Values, "session-token")
	clientSession.Save(r, w)
	return cs.serverStore.DeleteSession(sessionToken)
}

func (cs *CombinedSessionStore) DeleteSession(w http.ResponseWriter, r *http.Request, sessionToken string) error {
	cs.sessionLock.Lock()
	defer cs.sessionLock.Unlock()

	return cs.deleteSession(w, r, sessionToken)
}

// FIXME: do this regulary in a separate goroutine on background
func (cs *CombinedSessionStore) PruneSessions() {
	cs.serverStore.PruneSessions()
}
