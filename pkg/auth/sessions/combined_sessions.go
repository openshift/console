package sessions

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/securecookie"
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

func NewSessionStore(authnKey, encryptKey []byte, secureCookies bool, cookiePath string, previousKeyPairs ...[]byte) *CombinedSessionStore {
	keyPairs := [][]byte{authnKey, encryptKey}
	keyPairs = append(keyPairs, previousKeyPairs...)
	clientStore := gorilla.NewCookieStore(keyPairs...)
	clientStore.Options.Secure = secureCookies
	clientStore.Options.HttpOnly = true
	clientStore.Options.SameSite = http.SameSiteStrictMode
	clientStore.Options.Path = cookiePath

	for _, codec := range clientStore.Codecs {
		if sc, ok := codec.(*securecookie.SecureCookie); ok {
			sc.MaxLength(8192)
		}
	}

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

	if sessionTokenStr, ok := clientSession.sessionToken.Values["session-token"].(string); ok {
		sessionToken = sessionTokenStr
	}
	if rt, ok := clientSession.refreshToken.Values["refresh-token"].(string); ok {
		refreshToken = rt
	} else if refreshTokenID, ok := clientSession.refreshToken.Values["refresh-token-id"].(string); ok {
		if actualToken, exists := cs.serverStore.byRefreshTokenID[refreshTokenID]; exists {
			refreshToken = actualToken
		}
	}

	loginState := cs.serverStore.GetSession(sessionToken, refreshToken)
	return loginState, nil
}

func (cs *CombinedSessionStore) GetCookieRefreshToken(r *http.Request) string {
	clientSession, _ := cs.clientStore.Get(r, openshiftRefreshTokenCookieName)
	if refreshToken, ok := clientSession.Values["refresh-token"].(string); ok {
		return refreshToken
	}
	// Backward compatibility: fall back to reference ID lookup
	if refreshTokenID, ok := clientSession.Values["refresh-token-id"].(string); ok {
		if actualToken, exists := cs.serverStore.byRefreshTokenID[refreshTokenID]; exists {
			return actualToken
		}
	}
	return ""
}

func (cs *CombinedSessionStore) UpdateCookieRefreshToken(w http.ResponseWriter, r *http.Request, refreshToken string) error {
	clientSession, _ := cs.clientStore.Get(r, openshiftRefreshTokenCookieName)
	clientSession.Values["refresh-token"] = refreshToken
	delete(clientSession.Values, "refresh-token-id")
	return clientSession.Save(r, w)
}

func (cs *CombinedSessionStore) UpdateTokens(w http.ResponseWriter, r *http.Request, tokenVerifier IDTokenVerifier, tokenResponse *oauth2.Token) (*LoginState, error) {
	cs.sessionLock.Lock()
	defer cs.sessionLock.Unlock()

	cs.expireOldPodCookies(w, r)

	clientSession := cs.getCookieSession(r)

	// Resolve old refresh token from cookie (new format or legacy ID lookup)
	var oldRefreshToken string
	if rt, ok := clientSession.refreshToken.Values["refresh-token"].(string); ok {
		oldRefreshToken = rt
	} else if oldID, ok := clientSession.refreshToken.Values["refresh-token-id"].(string); ok {
		if actualToken, exists := cs.serverStore.byRefreshTokenID[oldID]; exists {
			oldRefreshToken = actualToken
		}
		delete(cs.serverStore.byRefreshTokenID, oldID)
	}

	newRefreshToken := tokenResponse.RefreshToken

	// Store actual refresh token in cookie
	clientSession.refreshToken.Values["refresh-token"] = newRefreshToken
	delete(clientSession.refreshToken.Values, "refresh-token-id")

	var loginState *LoginState
	if sessionToken, ok := clientSession.sessionToken.Values["session-token"].(string); ok {
		loginState = cs.serverStore.GetSession(sessionToken, "")
	}
	if loginState == nil {
		var err error
		loginState, err = cs.serverStore.AddSession(tokenVerifier, tokenResponse)
		if err != nil {
			return nil, fmt.Errorf("failed to add session to server store: %w", err)
		}
		clientSession.sessionToken.Values["session-token"] = loginState.sessionToken
	} else {
		if err := loginState.UpdateTokens(tokenVerifier, tokenResponse); err != nil {
			return nil, err
		}
	}

	// Index by old refresh token for in-flight requests with stale cookies
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
	if refreshToken, ok := cookieSession.refreshToken.Values["refresh-token"].(string); ok && refreshToken != "" {
		cs.serverStore.DeleteByRefreshToken(refreshToken)
	} else if refreshTokenIDStr, ok := cookieSession.refreshToken.Values["refresh-token-id"].(string); ok {
		if actualToken, exists := cs.serverStore.byRefreshTokenID[refreshTokenIDStr]; exists {
			cs.serverStore.DeleteByRefreshToken(actualToken)
			delete(cs.serverStore.byRefreshTokenID, refreshTokenIDStr)
		}
	}

	if sessionToken, ok := cookieSession.sessionToken.Values["session-token"].(string); ok {
		cs.serverStore.DeleteBySessionToken(sessionToken)
	}

	refreshTokenCookie, _ := cs.clientStore.Get(r, openshiftRefreshTokenCookieName)
	if !refreshTokenCookie.IsNew {
		refreshTokenCookie.Options.MaxAge = -1
		if err := cs.clientStore.Save(r, w, refreshTokenCookie); err != nil {
			return err
		}
	}

	return nil
}

func (cs *CombinedSessionStore) SetRecoveryCookie(w http.ResponseWriter, r *http.Request, accessToken string, expiry time.Time) error {
	s, _ := cs.clientStore.Get(r, openshiftRecoveryTokenCookieName)
	s.Values["access-token"] = accessToken
	s.Values["expiry"] = expiry.Unix()
	maxAge := int(time.Until(expiry).Seconds())
	if maxAge > 0 {
		s.Options.MaxAge = maxAge
	}
	return s.Save(r, w)
}

func (cs *CombinedSessionStore) GetRecoveryCookie(r *http.Request) (string, time.Time, bool) {
	s, _ := cs.clientStore.Get(r, openshiftRecoveryTokenCookieName)
	accessToken, ok := s.Values["access-token"].(string)
	if !ok || accessToken == "" {
		return "", time.Time{}, false
	}
	expiryUnix, ok := s.Values["expiry"].(int64)
	if !ok {
		return "", time.Time{}, false
	}
	return accessToken, time.Unix(expiryUnix, 0), true
}

func (cs *CombinedSessionStore) ClearRecoveryCookie(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     openshiftRecoveryTokenCookieName,
		Value:    "",
		Path:     cs.clientStore.Options.Path,
		MaxAge:   -1,
		Secure:   cs.clientStore.Options.Secure,
		HttpOnly: cs.clientStore.Options.HttpOnly,
		SameSite: cs.clientStore.Options.SameSite,
	})
}

// ServerStore returns the underlying server session store.
// This is primarily used for testing purposes.
func (cs *CombinedSessionStore) ServerStore() *SessionStore {
	return cs.serverStore
}
