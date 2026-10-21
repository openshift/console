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

// expireOldPodCookies expires session cookies from other pods to prevent cookie accumulation
// when users are load-balanced across multiple pods.
func (cs *CombinedSessionStore) expireOldPodCookies(w http.ResponseWriter, r *http.Request) {
	currentCookieName := SessionCookieName()
	for _, cookie := range r.Cookies() {
		// Expire any session cookies that are not for the current pod
		if strings.HasPrefix(cookie.Name, OpenshiftAccessTokenCookieName) && cookie.Name != currentCookieName {
			// Must match all attributes of the original cookie for browsers to properly delete it
			http.SetCookie(w, &http.Cookie{
				Name:     cookie.Name,
				Value:    "",
				Path:     cs.clientStore.Options.Path,
				MaxAge:   -1,
				Secure:   cs.clientStore.Options.Secure,
				HttpOnly: cs.clientStore.Options.HttpOnly,
				SameSite: cs.clientStore.Options.SameSite,
			})
		}
	}
}

func (cs *CombinedSessionStore) AddSession(w http.ResponseWriter, r *http.Request, tokenVerifier IDTokenVerifier, token *oauth2.Token) (*LoginState, error) {
	cs.sessionLock.Lock()
	defer cs.sessionLock.Unlock()

	// Clean up old session cookies from previous pods before creating new session
	// This prevents cookie accumulation when users are load-balanced across multiple pods
	cs.expireOldPodCookies(w, r)

	ls, err := cs.serverStore.AddSession(tokenVerifier, token)
	if err != nil {
		return nil, fmt.Errorf("failed to add session to server store: %w", err)
	}

	clientSession := cs.getCookieSession(r)
	clientSession.sessionToken.Values["session-token"] = ls.sessionToken
	// Store only the small reference ID in the cookie, not the full refresh token
	clientSession.refreshToken.Values["refresh-token-id"] = ls.refreshTokenID

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

	// Clean up old session cookies from previous pods
	// This is done here because GetSession is called on /api/* requests where
	// session cookies (with Path=/api) are actually sent by the browser
	cs.expireOldPodCookies(w, r)

	// Get always returns a session, even if empty.
	clientSession := cs.getCookieSession(r)

	var (
		sessionToken string
		refreshToken string
	)

	if sessionTokenIface, ok := clientSession.sessionToken.Values["session-token"]; ok {
		sessionToken = sessionTokenIface.(string)
	}
	if refreshTokenID, ok := clientSession.refreshToken.Values["refresh-token-id"]; ok {
		// Look up the actual refresh token from the ID
		if actualToken, exists := cs.serverStore.byRefreshTokenID[refreshTokenID.(string)]; exists {
			refreshToken = actualToken
		}
	}

	loginState := cs.serverStore.GetSession(sessionToken, refreshToken)
	return loginState, nil
}

func (cs *CombinedSessionStore) GetCookieRefreshToken(r *http.Request) string {
	// Get always returns a session, even if empty.
	clientSession, _ := cs.clientStore.Get(r, openshiftRefreshTokenCookieName)
	if refreshTokenID, ok := clientSession.Values["refresh-token-id"].(string); ok {
		// Look up the actual refresh token using the ID
		if actualToken, exists := cs.serverStore.byRefreshTokenID[refreshTokenID]; exists {
			return actualToken
		}
	}
	return ""
}

func (cs *CombinedSessionStore) UpdateCookieRefreshToken(w http.ResponseWriter, r *http.Request, refreshToken string) error {
	// Generate a new ID for the refresh token
	newID := RandomString(32)
	cs.serverStore.byRefreshTokenID[newID] = refreshToken

	// Store the ID in the cookie, not the full token
	clientSession, _ := cs.clientStore.Get(r, openshiftRefreshTokenCookieName)
	clientSession.Values["refresh-token-id"] = newID
	return clientSession.Save(r, w)
}

func (cs *CombinedSessionStore) UpdateTokens(w http.ResponseWriter, r *http.Request, tokenVerifier IDTokenVerifier, tokenResponse *oauth2.Token) (*LoginState, error) {
	cs.sessionLock.Lock()
	defer cs.sessionLock.Unlock()

	// Clean up old session cookies from previous pods when refreshing tokens
	// This handles the case where a user is load-balanced to a different pod
	cs.expireOldPodCookies(w, r)

	clientSession := cs.getCookieSession(r)
	var oldRefreshTokenID string
	var oldRefreshToken string
	if oldID, ok := clientSession.refreshToken.Values["refresh-token-id"]; ok {
		oldRefreshTokenID = oldID.(string)
		// Look up the actual refresh token from the ID
		if actualToken, exists := cs.serverStore.byRefreshTokenID[oldRefreshTokenID]; exists {
			oldRefreshToken = actualToken
		}
	}

	// Generate a new ID for the new refresh token
	newRefreshTokenID := RandomString(32)
	newRefreshToken := tokenResponse.RefreshToken
	if newRefreshToken != "" {
		cs.serverStore.byRefreshTokenID[newRefreshTokenID] = newRefreshToken
	}

	// Store the new ID in the cookie
	clientSession.refreshToken.Values["refresh-token-id"] = newRefreshTokenID

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
		// AddSession already generated an ID, so update the cookie with it
		clientSession.refreshToken.Values["refresh-token-id"] = loginState.refreshTokenID
	} else {
		// loginState is a pointer to the cache so this effectively mutates it for everyone
		if err := loginState.UpdateTokens(tokenVerifier, tokenResponse); err != nil {
			return nil, err
		}
		// Update the ID in the LoginState
		loginState.refreshTokenID = newRefreshTokenID
	}

	// index by the old refresh token so that any follow-up requests that arrived
	// before their cookie was updated with an actual session can still find the login state
	if oldRefreshToken != "" {
		cs.serverStore.byRefreshToken[oldRefreshToken] = loginState
	}
	return loginState, clientSession.save(r, w)
}

func (cs *CombinedSessionStore) DeleteSession(w http.ResponseWriter, r *http.Request) error {
	cs.sessionLock.Lock()
	defer cs.sessionLock.Unlock()

	for _, cookie := range r.Cookies() {
		if strings.HasPrefix(cookie.Name, OpenshiftAccessTokenCookieName) {
			http.SetCookie(w, &http.Cookie{
				Name:     cookie.Name,
				Value:    "",
				Path:     cs.clientStore.Options.Path,
				MaxAge:   -1,
				Secure:   cs.clientStore.Options.Secure,
				HttpOnly: cs.clientStore.Options.HttpOnly,
				SameSite: cs.clientStore.Options.SameSite,
			})
		}
	}

	cookieSession := cs.getCookieSession(r)
	if refreshTokenID, ok := cookieSession.refreshToken.Values["refresh-token-id"]; ok {
		refreshTokenIDStr := refreshTokenID.(string)
		// Look up the actual refresh token from the ID and delete
		if actualToken, exists := cs.serverStore.byRefreshTokenID[refreshTokenIDStr]; exists {
			cs.serverStore.DeleteByRefreshToken(actualToken)
			// Clean up the ID mapping
			delete(cs.serverStore.byRefreshTokenID, refreshTokenIDStr)
		}
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

// ServerStore returns the underlying server session store.
// This is primarily used for testing purposes.
func (cs *CombinedSessionStore) ServerStore() *SessionStore {
	return cs.serverStore
}
