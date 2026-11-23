package sessions

import (
	"context"
	"errors"
	"fmt"
	"hash/fnv"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	gorilla "github.com/gorilla/sessions"
	"golang.org/x/oauth2"
	"k8s.io/apimachinery/pkg/util/wait"
	"k8s.io/klog/v2"
)

const (
	persisterTimeout      = 5 * time.Second
	persisterPruneTimeout = time.Minute
)

type CombinedSessionStore struct {
	serverStore *SessionStore
	clientStore *gorilla.CookieStore // FIXME: we need to determine what the default session expiration should be, possibly make it configurable

	sessionLock sync.Mutex

	// persister is nil when sessions live only in this process. Otherwise its
	// copy of a session is authoritative: a change to a session reaches memory
	// and cookies only once it is persisted, and a session it does not have is
	// logged out.
	persister SessionPersister
	// sessionLocks serialise the persister calls and memory updates for one
	// session in this pod, so that a load, a token update and a logout of the
	// same session cannot interleave. Take one before sessionLock, never after.
	sessionLocks [256]sync.Mutex
}

type session struct {
	sessionToken *gorilla.Session
	refreshToken *gorilla.Session
}

func SessionCookieName() string {
	podName, _ := os.LookupEnv("POD_NAME")
	return OpenshiftAccessTokenCookieName + "-" + podName
}

// sessionCookieName is per pod when sessions live in memory, since only that
// pod knows them. Persisted sessions are readable by any pod, so the name is
// stable and survives rollouts.
func (cs *CombinedSessionStore) sessionCookieName() string {
	if cs.persister != nil {
		return OpenshiftAccessTokenCookieName
	}
	return SessionCookieName()
}

func NewSessionStore(authnKey, encryptKey []byte, secureCookies bool, cookiePath string) *CombinedSessionStore {
	return NewPersistentSessionStore(authnKey, encryptKey, secureCookies, cookiePath, nil)
}

// NewPersistentSessionStore keeps sessions in memory and writes them through to
// persister, if it is not nil.
func NewPersistentSessionStore(authnKey, encryptKey []byte, secureCookies bool, cookiePath string, persister SessionPersister) *CombinedSessionStore {
	clientStore := gorilla.NewCookieStore(authnKey, encryptKey)
	clientStore.Options.Secure = secureCookies
	clientStore.Options.HttpOnly = true
	clientStore.Options.SameSite = http.SameSiteStrictMode
	clientStore.Options.Path = cookiePath

	cs := &CombinedSessionStore{
		serverStore: NewServerSessionStore(32768),
		clientStore: clientStore,

		sessionLock: sync.Mutex{},
		persister:   persister,
	}
	if persister != nil {
		go wait.Forever(cs.prunePersisted, sessionPruningPeriod)
	}
	return cs
}

func (cs *CombinedSessionStore) prunePersisted() {
	ctx, cancel := context.WithTimeout(context.Background(), persisterPruneTimeout)
	defer cancel()
	maxAge := time.Duration(cs.clientStore.Options.MaxAge) * time.Second
	if err := cs.persister.Prune(ctx, maxAge); err != nil {
		klog.Errorf("failed to prune persisted sessions: %v", err)
	}
}

// persist runs a persister call without sessionLock, so that a slow API
// server does not hold up requests that memory can answer. The caller holds
// sessionLock, and must expect memory to have changed meanwhile.
func (cs *CombinedSessionStore) persist(call func(ctx context.Context, p SessionPersister) error) error {
	cs.sessionLock.Unlock()
	defer cs.sessionLock.Lock()
	ctx, cancel := context.WithTimeout(context.Background(), persisterTimeout)
	defer cancel()
	return call(ctx, cs.persister)
}

// lockSession takes the lock for one session token; see sessionLocks.
func (cs *CombinedSessionStore) lockSession(sessionToken string) func() {
	h := fnv.New32a()
	h.Write([]byte(sessionToken))
	l := &cs.sessionLocks[h.Sum32()%uint32(len(cs.sessionLocks))]
	l.Lock()
	return l.Unlock
}

func cookieSessionToken(clientSession *session) string {
	sessionToken, _ := clientSession.sessionToken.Values["session-token"].(string)
	return sessionToken
}

// syncSession loads the request's session from the persister on a memory
// miss, or always if fresh is set: before a token refresh, since a logout
// elsewhere deleted the Secret, or another replica rotated the tokens. The
// caller holds neither sessionLock nor the session's lock.
func (cs *CombinedSessionStore) syncSession(r *http.Request, fresh bool) {
	if cs.persister == nil {
		return
	}
	clientSession := cs.getCookieSession(r)
	sessionToken := cookieSessionToken(clientSession)
	if sessionToken == "" {
		return
	}
	if !fresh {
		cs.sessionLock.Lock()
		cached := cs.serverStore.GetSession(sessionToken, "") != nil
		cs.sessionLock.Unlock()
		if cached {
			return
		}
	}
	defer cs.lockSession(sessionToken)()
	cs.loadSession(clientSession, sessionToken, fresh)
}

// loadSession is syncSession for a caller that holds the session's lock but
// not sessionLock.
func (cs *CombinedSessionStore) loadSession(clientSession *session, sessionToken string, fresh bool) {
	if !fresh {
		cs.sessionLock.Lock()
		cached := cs.serverStore.GetSession(sessionToken, "") != nil
		cs.sessionLock.Unlock()
		if cached {
			return
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), persisterTimeout)
	defer cancel()
	s, err := cs.persister.Get(ctx, sessionToken)
	if err != nil {
		klog.Errorf("failed to load persisted session: %v", err)
		return
	}

	cs.sessionLock.Lock()
	defer cs.sessionLock.Unlock()
	if s != nil {
		cs.serverStore.replaceSession(s.loginState())
		return
	}
	cs.serverStore.DeleteBySessionToken(sessionToken)
	if refreshTokenID, ok := clientSession.refreshToken.Values["refresh-token-id"].(string); ok {
		delete(cs.serverStore.byRefreshTokenID, refreshTokenID)
	}
}

// addSession adds a session to memory and to the persister. The caller holds sessionLock.
func (cs *CombinedSessionStore) addSession(tokenVerifier IDTokenVerifier, token *oauth2.Token) (*LoginState, error) {
	ls, err := cs.serverStore.AddSession(tokenVerifier, token)
	if err != nil || cs.persister == nil {
		return ls, err
	}
	s := newPersistedSession(ls)
	if err := cs.persist(func(ctx context.Context, p SessionPersister) error { return p.Create(ctx, s) }); err != nil {
		// Nobody knows the session yet, and it would not outlive this pod.
		cs.serverStore.DeleteBySessionToken(ls.sessionToken)
		delete(cs.serverStore.byRefreshTokenID, ls.refreshTokenID)
		return nil, fmt.Errorf("failed to persist session: %w", err)
	}
	return ls, nil
}

// expireOldPodCookies expires session cookies from other pods to prevent cookie accumulation
// when users are load-balanced across multiple pods.
func (cs *CombinedSessionStore) expireOldPodCookies(w http.ResponseWriter, r *http.Request) {
	currentCookieName := cs.sessionCookieName()
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

	ls, err := cs.addSession(tokenVerifier, token)
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
	clientSession, _ := cs.clientStore.Get(r, cs.sessionCookieName())
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
	cs.syncSession(r, false)
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
	if cs.persister != nil {
		// Only a session whose Secret still exists may refresh. A refresh
		// cookie alone could outlive a logout on another replica.
		sessionToken := cookieSessionToken(cs.getCookieSession(r))
		if sessionToken == "" {
			return ""
		}
		cs.syncSession(r, true)
		cs.sessionLock.Lock()
		defer cs.sessionLock.Unlock()
		if ls := cs.serverStore.GetSession(sessionToken, ""); ls != nil {
			return ls.refreshToken
		}
		return ""
	}
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
	if cs.persister != nil {
		// The cookie already holds the session's refresh token ID, which never changes.
		return nil
	}
	// Generate a new ID for the refresh token
	newID := RandomString(32)
	cs.serverStore.byRefreshTokenID[newID] = refreshToken

	// Store the ID in the cookie, not the full token
	clientSession, _ := cs.clientStore.Get(r, openshiftRefreshTokenCookieName)
	clientSession.Values["refresh-token-id"] = newID
	return clientSession.Save(r, w)
}

func (cs *CombinedSessionStore) UpdateTokens(w http.ResponseWriter, r *http.Request, tokenVerifier IDTokenVerifier, tokenResponse *oauth2.Token) (*LoginState, error) {
	if cs.persister != nil {
		clientSession := cs.getCookieSession(r)
		if sessionToken := cookieSessionToken(clientSession); sessionToken != "" {
			defer cs.lockSession(sessionToken)()
			cs.loadSession(clientSession, sessionToken, false)
		}
	}
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
	if newRefreshToken != "" && cs.persister == nil {
		cs.serverStore.byRefreshTokenID[newRefreshTokenID] = newRefreshToken
	}

	// Store the new ID in the cookie
	clientSession.refreshToken.Values["refresh-token-id"] = newRefreshTokenID

	var loginState *LoginState
	sessionToken, ok := clientSession.sessionToken.Values["session-token"]
	if ok {
		loginState = cs.serverStore.GetSession(sessionToken.(string), "")
	}
	if loginState == nil && cs.persister != nil {
		// Logged out, maybe on another replica while this refresh was in
		// flight. A refresh never starts a persisted session; only a login does.
		return nil, errSessionDeleted
	} else if loginState == nil {
		var err error
		loginState, err = cs.addSession(tokenVerifier, tokenResponse)
		if err != nil {
			return nil, fmt.Errorf("failed to add session to server store: %w", err)
		}
		clientSession.sessionToken.Values["session-token"] = loginState.sessionToken
		// AddSession already generated an ID, so update the cookie with it
		clientSession.refreshToken.Values["refresh-token-id"] = loginState.refreshTokenID
	} else if cs.persister != nil {
		// Requests may still read the cached LoginState, so update a copy, and
		// cache it once persisted. Update does not recreate a logged-out session.
		// The refresh token ID stays, so replicas refreshing at once agree on the cookie.
		updated := *loginState
		if err := updated.UpdateTokens(tokenVerifier, tokenResponse); err != nil {
			return nil, err
		}
		s := newPersistedSession(&updated)
		if err := cs.persist(func(ctx context.Context, p SessionPersister) error { return p.Update(ctx, s) }); err != nil {
			if errors.Is(err, errSessionDeleted) {
				cs.serverStore.DeleteBySessionToken(updated.sessionToken)
			}
			return nil, fmt.Errorf("failed to persist session tokens: %w", err)
		}
		loginState = &updated
		cs.serverStore.replaceSession(loginState)
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
	if cs.persister != nil {
		if sessionToken := cookieSessionToken(cs.getCookieSession(r)); sessionToken != "" {
			defer cs.lockSession(sessionToken)()
		}
	}
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
	if sessionToken, ok := cookieSession.sessionToken.Values["session-token"].(string); ok && cs.persister != nil {
		// The cookies are cleared either way. A Secret left behind is pruned
		// once it expires.
		if err := cs.persist(func(ctx context.Context, p SessionPersister) error { return p.Delete(ctx, sessionToken) }); err != nil {
			klog.Errorf("failed to delete persisted session: %v", err)
		}
	}
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
