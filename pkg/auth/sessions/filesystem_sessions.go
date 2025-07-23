package sessions

import (
	"encoding/gob"
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	gorilla "github.com/gorilla/sessions"
	consoleUtils "github.com/openshift/console/pkg/utils"
	"golang.org/x/oauth2"
)

const (
	OpenshiftAccessTokenCookieName  = "openshift-session-token"
	openshiftRefreshTokenCookieName = "openshift-refresh-token"
)

func init() {
	// Register our custom type with gob for Gorilla sessions encoding
	gob.Register(persistentSessionData{})
}

func RandomString(length int) string {
	str, err := consoleUtils.RandomString(length)
	if err != nil {
		panic(fmt.Sprintf("FATAL ERROR: Unable to get random bytes for session token: %v", err))
	}
	return str
}

type FilesystemSessionStore struct {
	clientStore *gorilla.FilesystemStore

	sessionLock sync.Mutex
}

// persistentSessionData holds the session data that we store in FilesystemStore
// This struct is gob-encodable and will be handled automatically by Gorilla sessions
type persistentSessionData struct {
	SessionToken string
	UserID       string
	Username     string
	Email        string
	AccessToken  string
	RefreshToken string
	ExpiresAt    time.Time
	RotateAt     time.Time
}

type session struct {
	sessionToken *gorilla.Session
	refreshToken *gorilla.Session
}

func SessionCookieName() string {
	podName, _ := os.LookupEnv("POD_NAME")
	return OpenshiftAccessTokenCookieName + "-" + podName
}

func NewSessionStore(authnKey, encryptKey []byte, secureCookies bool, cookiePath string, sessionDir string) *FilesystemSessionStore {
	// Use FilesystemStore to persist sessions across container restarts in-cluster
	// This allows us to handle config file changes without forcing a rollout
	clientStore := gorilla.NewFilesystemStore(sessionDir, authnKey, encryptKey)
	clientStore.Options.Secure = secureCookies
	clientStore.Options.HttpOnly = true
	clientStore.Options.SameSite = http.SameSiteStrictMode
	clientStore.Options.Path = cookiePath

	return &FilesystemSessionStore{
		clientStore: clientStore,
		sessionLock: sync.Mutex{},
	}
}

func (cs *FilesystemSessionStore) AddSession(w http.ResponseWriter, r *http.Request, tokenVerifier IDTokenVerifier, token *oauth2.Token) (*LoginState, error) {
	cs.sessionLock.Lock()
	defer cs.sessionLock.Unlock()

	// Create LoginState directly from the OAuth2 token
	ls, err := newLoginState(tokenVerifier, token)
	if err != nil {
		return nil, fmt.Errorf("failed to create login state: %w", err)
	}

	// Serialize session data for persistence in FilesystemStore
	sessionData := createPersistentSessionData(ls)

	clientSession := cs.getCookieSession(r)
	// Store serialized session data in FilesystemStore
	clientSession.sessionToken.Values["session-data"] = sessionData
	clientSession.refreshToken.Values["refresh-token"] = ls.RefreshToken()

	return ls, clientSession.save(r, w)
}

func (cs *FilesystemSessionStore) getCookieSession(r *http.Request) *session {
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

// createPersistentSessionData creates persistentSessionData from a LoginState
func createPersistentSessionData(ls *LoginState) persistentSessionData {
	expiresAt := ls.exp
	now := time.Now()
	rotateAt := now.Add(time.Duration(0.8 * float64(expiresAt.Sub(now))))

	return persistentSessionData{
		SessionToken: ls.SessionToken(),
		UserID:       ls.UserID(),
		Username:     ls.Username(),
		Email:        ls.email,
		AccessToken:  ls.AccessToken(),
		RefreshToken: ls.RefreshToken(),
		ExpiresAt:    expiresAt,
		RotateAt:     rotateAt,
	}
}

// reconstructLoginState creates a LoginState from persisted session data
func reconstructLoginState(data persistentSessionData) *LoginState {
	// Create a LoginState directly with all the persisted data
	// Note: This creates a struct with unexported fields from the same package
	return &LoginState{
		userID:       data.UserID,
		name:         data.Username,
		email:        data.Email,
		exp:          data.ExpiresAt,
		rotateAt:     data.RotateAt,
		now:          time.Now, // Use default time function
		sessionToken: data.SessionToken,
		rawToken:     data.AccessToken,
		refreshToken: data.RefreshToken,
	}
}

// GetSession returns a session identified by the cookie from the current request.
// If the session is already expired, it deletes it and returns nil instead.
func (cs *FilesystemSessionStore) GetSession(w http.ResponseWriter, r *http.Request) (*LoginState, error) {
	cs.sessionLock.Lock()
	defer cs.sessionLock.Unlock()

	// Get session data from FilesystemStore
	clientSession := cs.getCookieSession(r)

	// Get serialized session data from FilesystemStore
	var sessionData persistentSessionData
	if sessionDataIface, ok := clientSession.sessionToken.Values["session-data"]; ok {
		if data, ok := sessionDataIface.(persistentSessionData); ok {
			sessionData = data
		} else {
			// Handle case where stored data is not the expected type
			return nil, nil
		}
	}

	if sessionData.SessionToken != "" {
		// Reconstruct LoginState from persisted data
		loginState := reconstructLoginState(sessionData)

		// Check if session is expired
		if loginState.IsExpired() {
			// Clean up expired session
			cs.DeleteSession(w, r)
			return nil, nil
		}

		return loginState, nil
	}

	return nil, nil
}

func (cs *FilesystemSessionStore) GetCookieRefreshToken(r *http.Request) string {
	// Get always returns a session, even if empty.
	clientSession, _ := cs.clientStore.Get(r, openshiftRefreshTokenCookieName)
	if refreshToken, ok := clientSession.Values["refresh-token"].(string); ok {
		return refreshToken
	}
	return ""
}

func (cs *FilesystemSessionStore) UpdateCookieRefreshToken(w http.ResponseWriter, r *http.Request, refreshToken string) error {
	// no need to lock here since there shouldn't be any races around the client session
	clientSession, _ := cs.clientStore.Get(r, openshiftRefreshTokenCookieName)
	clientSession.Values["refresh-token"] = refreshToken
	return clientSession.Save(r, w)
}

func (cs *FilesystemSessionStore) UpdateTokens(w http.ResponseWriter, r *http.Request, tokenVerifier IDTokenVerifier, tokenResponse *oauth2.Token) (*LoginState, error) {
	cs.sessionLock.Lock()
	defer cs.sessionLock.Unlock()

	clientSession := cs.getCookieSession(r)

	// Get current session from FilesystemStore
	var currentLoginState *LoginState
	if sessionDataIface, ok := clientSession.sessionToken.Values["session-data"]; ok {
		if data, ok := sessionDataIface.(persistentSessionData); ok {
			sessionData := data
			currentLoginState = reconstructLoginState(sessionData)
		}
	}

	var loginState *LoginState
	if currentLoginState != nil {
		// Update existing session with new tokens
		if err := currentLoginState.UpdateTokens(tokenVerifier, tokenResponse); err != nil {
			return nil, fmt.Errorf("failed to update session tokens: %w", err)
		}
		loginState = currentLoginState
	} else {
		// Create new session if none exists
		var err error
		loginState, err = newLoginState(tokenVerifier, tokenResponse)
		if err != nil {
			return nil, fmt.Errorf("failed to create new login state: %w", err)
		}
	}

	// Serialize updated session data for persistence
	sessionData := createPersistentSessionData(loginState)

	// Store updated session data in FilesystemStore
	clientSession.sessionToken.Values["session-data"] = sessionData
	clientSession.refreshToken.Values["refresh-token"] = loginState.RefreshToken()

	return loginState, clientSession.save(r, w)
}

func (cs *FilesystemSessionStore) DeleteSession(w http.ResponseWriter, r *http.Request) error {
	cs.sessionLock.Lock()
	defer cs.sessionLock.Unlock()

	// Clear all console session cookies
	for _, cookie := range r.Cookies() {
		cookie := cookie
		if strings.HasPrefix(cookie.Name, OpenshiftAccessTokenCookieName) {
			cookie.MaxAge = -1
			http.SetCookie(w, cookie)
		}
	}

	// Clear session data from FilesystemStore
	cookieSession := cs.getCookieSession(r)

	// Clear session data
	delete(cookieSession.sessionToken.Values, "session-data")
	delete(cookieSession.refreshToken.Values, "refresh-token")

	// Save the cleared session to FilesystemStore
	if err := cookieSession.sessionToken.Save(r, w); err != nil {
		return fmt.Errorf("failed to clear session token: %w", err)
	}

	// Clear refresh token cookie
	refreshTokenCookie, _ := cs.clientStore.Get(r, openshiftRefreshTokenCookieName)
	if !refreshTokenCookie.IsNew {
		refreshTokenCookie.Options.MaxAge = -1
		return cs.clientStore.Save(r, w, refreshTokenCookie)
	}

	return nil
}
