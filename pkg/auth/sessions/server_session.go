package sessions

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"sync"
	"time"

	"k8s.io/klog"
)

const OpenshiftAccessTokenCookieName = "openshift-session-token"

type SessionStore struct {
	byToken     map[string]*LoginState
	byAge       []*LoginState
	maxSessions int
	now         nowFunc
	mux         sync.Mutex
}

// TODO: how is this shared between console instances? I doubt it is, we may want to use encrypted cookies instead
func NewSessionStore(maxSessions int) *SessionStore {
	return &SessionStore{
		byToken:     make(map[string]*LoginState),
		maxSessions: maxSessions,
		now:         time.Now,
	}
}

// addSession sets sessionToken to a random value and adds loginState to session data structures
func (ss *SessionStore) AddSession(ls *LoginState) error {
	sessionToken := RandomString(128)
	if ss.byToken[sessionToken] != nil {
		ss.DeleteSession(sessionToken)
		return fmt.Errorf("session token collision! THIS SHOULD NEVER HAPPEN! Token: %s", sessionToken)
	}
	ls.sessionToken = sessionToken
	ss.mux.Lock()
	ss.byToken[sessionToken] = ls
	// Assume token expiration is always the same time in the future. Should be close enough for government work.
	ss.byAge = append(ss.byAge, ls)
	ss.mux.Unlock()
	return nil
}

func (ss *SessionStore) GetSession(token string) *LoginState {
	ss.mux.Lock()
	defer ss.mux.Unlock()
	return ss.byToken[token]
}

func (ss *SessionStore) DeleteSession(token string) error {
	ss.mux.Lock()
	defer ss.mux.Unlock()

	// not found - return fast
	if _, ok := ss.byToken[token]; !ok {
		return nil
	}

	delete(ss.byToken, token)
	for i := 0; i < len(ss.byAge); i++ {
		s := ss.byAge[i]
		if s.sessionToken == token {
			ss.byAge = append(ss.byAge[:i], ss.byAge[i+1:]...)
			return nil
		}
	}
	klog.Errorf("ss.byAge did not contain session %v", token)
	return fmt.Errorf("ss.byAge did not contain session %v", token)
}

func (ss *SessionStore) PruneSessions() {
	ss.mux.Lock()
	defer ss.mux.Unlock()
	expired := 0
	for i := 0; i < len(ss.byAge); i++ {
		s := ss.byAge[i]
		if s.IsExpired() {
			delete(ss.byToken, s.sessionToken)
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
