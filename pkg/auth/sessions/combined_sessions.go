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

	clientSession := cs.getCookieSession(r)
	clientSession.sessionToken.Values["session-token"] = ls.sessionToken
	clientSession.refreshToken.Values["refresh-token"] = ls.refreshToken

	return clientSession.save(r, w)
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
		// FIXME: all the below should be a part of AddSession
		loginState, err = NewLoginState(tokenVerifier, tokenResponse)
		if err != nil {
			return nil, err
		}
		if err := cs.serverStore.AddSession(loginState); err != nil {
			return nil, fmt.Errorf("failed to add session to server store: %w", err)
		}
		cs.serverStore.byRefreshToken[oldRefreshToken] = loginState
		clientSession.sessionToken.Values["session-token"] = loginState.sessionToken
	} else {
		if err := loginState.UpdateTokens(tokenVerifier, tokenResponse); err != nil {
			return nil, err
		}
		cs.serverStore.byRefreshToken[oldRefreshToken] = loginState // TODO: figure out a nicer way to do this in an internal method probably
		// loginState is a pointer to the cache so this effectively mutates it for everyone

	}

	return loginState, clientSession.save(r, w)
}

func (cs *CombinedSessionStore) DeleteSession(w http.ResponseWriter, r *http.Request, sessionToken string) error {
	cs.sessionLock.Lock()
	defer cs.sessionLock.Unlock()

	for _, cookie := range r.Cookies() {
		if strings.HasPrefix(cookie.Name, OpenshiftAccessTokenCookieName) {
			cookie.MaxAge = -1
			http.SetCookie(w, cookie)
		}
	}

	refreshTokenCookie, _ := cs.clientStore.Get(r, openshiftRefreshTokenCookieName)
	refreshTokenCookie.Options.MaxAge = -1
	return cs.clientStore.Save(r, w, refreshTokenCookie)
}

// FIXME: do this regulary in a separate goroutine on background
func (cs *CombinedSessionStore) PruneSessions() {
	cs.serverStore.PruneSessions()
}
