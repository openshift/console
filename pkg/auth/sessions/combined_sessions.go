package sessions

import (
	"fmt"
	"net/http"
	"sync"

	gorilla "github.com/gorilla/sessions"
	"k8s.io/klog"
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
		clientStore: gorilla.NewCookieStore(authnKey, encryptKey),

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
	clientSession.Values["session-token"] = ls.SessionToken()

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
	sessionToken, ok := clientSession.Values["session-token"] // FIXME: allow for multiple session tokens, add pruning
	if !ok {
		return nil, nil
	}

	loginState := cs.serverStore.GetSession(sessionToken.(string))
	if loginState != nil && loginState.IsExpired() {
		klog.V(4).Infof("session %s is expired, deleting", loginState.SessionToken())
		return nil, cs.deleteSession(w, r, loginState.SessionToken())
	}

	if loginState == nil {
		// the session-token was created by someone else (or it was pruned), we need to get our own server session
		clientSession.Values["session-token"] = "" // FIXME: wrong for non-sticky sessions but should be ok for PoC
		clientSession.Save(r, w)
		return nil, nil
	}

	return loginState, nil
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
