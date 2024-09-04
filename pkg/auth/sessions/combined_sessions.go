package sessions

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"

	gorilla "github.com/gorilla/sessions"
	"golang.org/x/oauth2"
)

type CombinedSessionStore struct {
	serverStore *SessionStore
	clientStore *gorilla.CookieStore // FIXME: we need to determine what the default session expiration should be, possibly make it configurable

	sessionLock sync.Mutex
}

type session struct {
	sessionToken *gorilla.Session
	refreshToken *gorilla.Session
}

func SessionCookieName() string {
	podName, _ := os.LookupEnv("POD_NAME")
	return OpenshiftAccessTokenCookieName + "-" + podName
}

func NewSessionStore(authnKey, encryptKey []byte, secureCookies bool, cookiePath string) *CombinedSessionStore {
	clientStore := gorilla.NewCookieStore(authnKey, encryptKey)
	clientStore.Options.Secure = secureCookies
	clientStore.Options.HttpOnly = true
	clientStore.Options.SameSite = http.SameSiteStrictMode
	clientStore.Options.Path = cookiePath

	return &CombinedSessionStore{
		serverStore: NewServerSessionStore(32768),
		clientStore: clientStore,

		sessionLock: sync.Mutex{},
	}
}

func (cs *CombinedSessionStore) AddSession(w http.ResponseWriter, r *http.Request, tokenVerifier IDTokenVerifier, token *oauth2.Token) (*LoginState, error) {
	cs.sessionLock.Lock()
	defer cs.sessionLock.Unlock()

	ls, err := cs.serverStore.AddSession(tokenVerifier, token)
	if err != nil {
		return nil, fmt.Errorf("failed to add session to server store: %w", err)
	}

	clientSession := cs.getCookieSession(r)
	clientSession.sessionToken.Values["session-token"] = ls.sessionToken
	clientSession.refreshToken.Values["refresh-token"] = ls.refreshToken

	return ls, clientSession.save(r, w)
}

func (cs *CombinedSessionStore) getCookieSession(r *http.Request) *session {
	clientSession, _ := cs.clientStore.Get(r, SessionCookieName())
	refreshSession, _ := cs.clientStore.Get(r, openshiftRefreshTokenCookieName)
	return &session{
		sessionToken: clientSession,
		refreshToken: refreshSession,
	}
}

func (s *session) save(r *http.Request, w http.ResponseWriter) error {
	if err := s.sessionToken.Save(r, w); err != nil {
		return fmt.Errorf("failed to save session token cookie: %w", err)
	}

	if err := s.refreshToken.Save(r, w); err != nil {
		return fmt.Errorf("failed to save refresh token cookie: %w", err)
	}

	return nil
}

// GetSession returns a session identified by the cookie from the current request.
// If the session is already expired, it deletes it and returns nil instead.
func (cs *CombinedSessionStore) GetSession(w http.ResponseWriter, r *http.Request) (*LoginState, error) {
	cs.sessionLock.Lock()
	defer cs.sessionLock.Unlock()

	// Get always returns a session, even if empty.
	clientSession := cs.getCookieSession(r)

	var sessionToken, refreshToken string
	if sessionTokenIface, ok := clientSession.sessionToken.Values["session-token"]; ok {
		sessionToken = sessionTokenIface.(string)
	}
	if refreshTokenIface, ok := clientSession.refreshToken.Values["refresh-token"]; ok {
		refreshToken = refreshTokenIface.(string)
	}

	loginState := cs.serverStore.GetSession(sessionToken, refreshToken)
	return loginState, nil
}

func (cs *CombinedSessionStore) GetCookieRefreshToken(r *http.Request) string {
	// Get always returns a session, even if empty.
	clientSession, _ := cs.clientStore.Get(r, openshiftRefreshTokenCookieName)
	if refreshToken, ok := clientSession.Values["refresh-token"].(string); ok {
		return refreshToken
	}
	return ""
}

func (cs *CombinedSessionStore) UpdateCookieRefreshToken(w http.ResponseWriter, r *http.Request, refreshToken string) error {
	// no need to lock here since there shouldn't be any races around the client session
	clientSession, _ := cs.clientStore.Get(r, openshiftRefreshTokenCookieName)
	clientSession.Values["refresh-token"] = refreshToken
	return clientSession.Save(r, w)
}

func (cs *CombinedSessionStore) UpdateTokens(w http.ResponseWriter, r *http.Request, tokenVerifier IDTokenVerifier, tokenResponse *oauth2.Token) (*LoginState, error) {
	cs.sessionLock.Lock()
	defer cs.sessionLock.Unlock()

	clientSession := cs.getCookieSession(r)
	var oldRefreshToken string
	if oldToken, ok := clientSession.refreshToken.Values["refresh-token"]; ok {
		oldRefreshToken = oldToken.(string)
	}

	refreshToken := tokenResponse.RefreshToken
	clientSession.refreshToken.Values["refresh-token"] = refreshToken

	var loginState *LoginState
	sessionToken, ok := clientSession.sessionToken.Values["session-token"]
	if ok {
		loginState = cs.serverStore.GetSession(sessionToken.(string), "")
	}
	if loginState == nil {
		var err error
		loginState, err = cs.serverStore.AddSession(tokenVerifier, tokenResponse)
		if err != nil {
			return nil, fmt.Errorf("failed to add session to server store: %w", err)
		}
		clientSession.sessionToken.Values["session-token"] = loginState.sessionToken
	} else {
		// loginState is a pointer to the cache so this effectively mutates it for everyone
		if err := loginState.UpdateTokens(tokenVerifier, tokenResponse); err != nil {
			return nil, err
		}
	}

	// index by the old refresh token so that any follow-up requests that arrived
	// before their cookie was updated with an actual session can still find the login state
	cs.serverStore.byRefreshToken[oldRefreshToken] = loginState
	return loginState, clientSession.save(r, w)
}

func (cs *CombinedSessionStore) DeleteSession(w http.ResponseWriter, r *http.Request) error {
	cs.sessionLock.Lock()
	defer cs.sessionLock.Unlock()

	for _, cookie := range r.Cookies() {
		cookie := cookie
		if strings.HasPrefix(cookie.Name, OpenshiftAccessTokenCookieName) {
			cookie.MaxAge = -1
			http.SetCookie(w, cookie)
		}
	}

	cookieSession := cs.getCookieSession(r)
	if refreshToken, ok := cookieSession.refreshToken.Values["refresh-token"]; ok {
		cs.serverStore.DeleteByRefreshToken(refreshToken.(string))
	}

	if sessionToken, ok := cookieSession.sessionToken.Values["session-token"]; ok {
		cs.serverStore.DeleteBySessionToken(sessionToken.(string))
	}

	refreshTokenCookie, _ := cs.clientStore.Get(r, openshiftRefreshTokenCookieName)
	if !refreshTokenCookie.IsNew {
		// Get always returns a session, only timeout current sessions
		refreshTokenCookie.Options.MaxAge = -1
		return cs.clientStore.Save(r, w, refreshTokenCookie)
	}

	return nil
}
