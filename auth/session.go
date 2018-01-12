package auth

import (
	"fmt"
	"time"
)

const tectonicSessionCookieName = "tectonic-session-token"

type OldSession struct {
	token string
	exp   time.Time
}

type SessionStore struct {
	byToken     map[string]*loginState
	byAge       []OldSession
	maxSessions int
}

func NewSessionStore(maxSessions int) *SessionStore {
	return &SessionStore{
		make(map[string]*loginState),
		[]OldSession{},
		maxSessions,
	}
}

// AddSession sets sessionToken to a random value and adds loginState to session data structures
func (ss *SessionStore) AddSession(ls *loginState) error {
	sessionToken := randomString(128)
	if ss.byToken[sessionToken] != nil {
		ss.DeleteSession(sessionToken)
		return fmt.Errorf("Session token collision! THIS SHOULD NEVER HAPPEN! Token: %s", sessionToken)
	}
	ls.sessionToken = sessionToken
	ss.byToken[sessionToken] = ls
	// Assume token expiration is always the same time in the future. Should be close enough for government work.
	ss.byAge = append(ss.byAge, OldSession{sessionToken, ls.exp})
	return nil
}

func (ss *SessionStore) GetSession(token string) *loginState {
	return ss.byToken[token]
}

func (ss *SessionStore) DeleteSession(token string) error {
	delete(ss.byToken, token)
	for i := 0; i < len(ss.byAge); i++ {
		s := ss.byAge[i]
		if s.token == token {
			ss.byAge = append(ss.byAge[:i], ss.byAge[i+1:]...)
			return nil
		}
	}
	log.Errorf("ss.byAge did not contain session %v", token)
	return fmt.Errorf("ss.byAge did not contain session %v", token)
}

func (ss *SessionStore) PruneSessions() {
	expired := 0
	for i := 0; i < len(ss.byAge); i++ {
		s := ss.byAge[i]
		if s.exp.Sub(time.Now()) < 0 {
			delete(ss.byToken, s.token)
			ss.byAge = append(ss.byAge[:i], ss.byAge[i+1:]...)
			expired++
		}
	}
	log.Debugf("Pruned %v expired sessions.", expired)
	toRemove := len(ss.byAge) - ss.maxSessions
	if toRemove > 0 {
		log.Debugf("Still too many sessions. Pruning oldest %v sessions...", toRemove)
		// TODO: account for user ids when pruning old sessions. Otherwise one user could log in 16k times and boot out everyone else.
		for _, s := range ss.byAge[:toRemove] {
			delete(ss.byToken, s.token)
		}
		ss.byAge = ss.byAge[toRemove:]
	}
	if expired+toRemove > 0 {
		log.Debugf("Pruned %v old sessions.", expired+toRemove)
	}
}
