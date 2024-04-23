package sessions

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"sync"
	"time"

	"golang.org/x/oauth2"
	"k8s.io/klog/v2"
)

const (
	OpenshiftAccessTokenCookieName  = "openshift-session-token"
	openshiftRefreshTokenCookieName = "openshift-refresh-token"
)

type SessionStore struct {
	byToken map[string]*LoginState
	// TODO: implement delayed pruning (so that all clients with old refresh token can get the session correctly) when two instances are pointing to the same item (key != ls.refreshToken)
	// TODO: maybe only store indexed by the old refresh tokens and have each item have lifespan of ~10s
	byRefreshToken map[string]*LoginState
	byAge          []*LoginState
	maxSessions    int
	now            nowFunc
	mux            sync.Mutex
}

func NewServerSessionStore(maxSessions int) *SessionStore {
	return &SessionStore{
		byToken:        make(map[string]*LoginState),
		byRefreshToken: make(map[string]*LoginState),
		maxSessions:    maxSessions,
		now:            time.Now,
	}
}

// addSession sets sessionToken to a random value and adds loginState to session data structures
func (ss *SessionStore) AddSession(tokenVerifier IDTokenVerifier, token *oauth2.Token) (*LoginState, error) {
	ls, err := newLoginState(tokenVerifier, token)
	if err != nil {
		return nil, fmt.Errorf("failed to create new session: %w", err)
	}

	sessionToken := ls.sessionToken
	if ss.byToken[sessionToken] != nil {
		ss.DeleteSession(sessionToken)
		return nil, fmt.Errorf("session token collision! THIS SHOULD NEVER HAPPEN! Token: %s", sessionToken)
	}
	ls.sessionToken = sessionToken
	ss.mux.Lock()
	ss.byToken[sessionToken] = ls

	// Assume token expiration is always the same time in the future. Should be close enough for government work.
	ss.byAge = append(ss.byAge, ls)
	ss.mux.Unlock()
	return ls, nil
}

func (ss *SessionStore) GetSession(sessionToken, refreshToken string) *LoginState {
	ss.mux.Lock()
	defer ss.mux.Unlock()
	if state, ok := ss.byToken[sessionToken]; ok {
		return state
	}
	return ss.byRefreshToken[refreshToken]
}

func (ss *SessionStore) DeleteSession(sessionToken string) error {
	ss.mux.Lock()
	defer ss.mux.Unlock()

	// not found - return fast
	if _, ok := ss.byToken[sessionToken]; !ok {
		return nil
	}

	delete(ss.byToken, sessionToken)
	for i := 0; i < len(ss.byAge); i++ {
		s := ss.byAge[i]
		if s.sessionToken == sessionToken {
			ss.byAge = append(ss.byAge[:i], ss.byAge[i+1:]...)
			return nil
		}
	}
	klog.Errorf("ss.byAge did not contain session %v", sessionToken)
	return fmt.Errorf("ss.byAge did not contain session %v", sessionToken)
}

func (ss *SessionStore) DeleteByRefreshToken(refreshToken string) {
	ss.mux.Lock()
	defer ss.mux.Unlock()

	session, ok := ss.byRefreshToken[refreshToken]
	if !ok {
		return
	}

	delete(ss.byRefreshToken, refreshToken)
	delete(ss.byToken, session.sessionToken)

	ss.byAge = spliceOut(ss.byAge, session)
}

func (ss *SessionStore) DeleteBySessionToken(sessionToken string) {
	ss.mux.Lock()
	defer ss.mux.Unlock()

	session, ok := ss.byToken[sessionToken]
	if !ok {
		return
	}

	delete(ss.byToken, sessionToken)
	ss.byAge = spliceOut(ss.byAge, session)

	for k, v := range ss.byRefreshToken {
		if v == session {
			delete(ss.byRefreshToken, k)
			return
		}
	}
}

func (ss *SessionStore) PruneSessions() {
	ss.mux.Lock()
	defer ss.mux.Unlock()
	expired := 0
	for i := 0; i < len(ss.byAge); i++ {
		s := ss.byAge[i]
		if s.IsExpired() {
			delete(ss.byToken, s.sessionToken)
			delete(ss.byRefreshToken, s.refreshToken)
			ss.byAge = append(ss.byAge[:i], ss.byAge[i+1:]...)
			expired++
		}
	}
	klog.V(4).Infof("Pruned %v expired sessions.", expired)
	toRemove := len(ss.byAge) - ss.maxSessions
	if toRemove > 0 {
		klog.V(4).Infof("Still too many sessions. Pruning oldest %v sessions...", toRemove)
		// TODO: account for user ids when pruning old sessions. Otherwise one user could log in 16k times and boot out everyone else.
		for _, s := range ss.byAge[:toRemove] {
			delete(ss.byToken, s.sessionToken)
		}
		ss.byAge = ss.byAge[toRemove:]
	}
	if expired+toRemove > 0 {
		klog.V(4).Infof("Pruned %v old sessions.", expired+toRemove)
	}
}

func RandomString(length int) string {
	bytes := make([]byte, length)
	_, err := rand.Read(bytes)
	if err != nil {
		panic(fmt.Sprintf("FATAL ERROR: Unable to get random bytes for session token: %v", err))
	}
	return base64.StdEncoding.EncodeToString(bytes)
}

func spliceOut(slice []*LoginState, toRemove *LoginState) []*LoginState {
	for i := 0; i < len(slice); i++ {
		s := slice[i]
		// compare pointers, these should be the same in the byAge cache
		if s == toRemove {
			// splice out the session from the slice
			return append(slice[:i], slice[i+1:]...)

		}
	}
	return slice
}
