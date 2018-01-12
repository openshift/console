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

var maxSessions = 16384

var sessionsByToken = make(map[string]*loginState)
var sessionsByAge []OldSession

// addSession sets sessionToken to a random value and adds loginState to session data structures
func addSession(ls *loginState) error {
	sessionToken := randomString(128)
	if sessionsByToken[sessionToken] != nil {
		deleteSession(sessionToken)
		return fmt.Errorf("Session token collision! THIS SHOULD NEVER HAPPEN! Token: %s", sessionToken)
	}
	ls.sessionToken = sessionToken
	sessionsByToken[sessionToken] = ls
	sessionsByAge = append(sessionsByAge, OldSession{sessionToken, ls.exp})
	return nil
}

func deleteSession(token string) error {
	delete(sessionsByToken, token)
	for i := 0; i < len(sessionsByAge); i++ {
		s := sessionsByAge[i]
		if s.token == token {
			sessionsByAge = append(sessionsByAge[:i], sessionsByAge[i+1:]...)
			return nil
		}
	}
	log.Errorf("sessionsByAge did not contain session %v", token)
	return fmt.Errorf("sessionsByAge did not contain session %v", token)
}

func pruneSessions() {
	expired := 0
	for i := 0; i < len(sessionsByAge); i++ {
		s := sessionsByAge[i]
		if s.exp.Sub(time.Now()) < 0 {
			delete(sessionsByToken, s.token)
			sessionsByAge = append(sessionsByAge[:i], sessionsByAge[i+1:]...)
			expired++
		}
	}
	log.Debugf("Pruned %v expired sessions.", expired)
	toRemove := len(sessionsByAge) - maxSessions
	if toRemove > 0 {
		log.Debugf("Still too many sessions. Pruning oldest %v sessions...", toRemove)
		// TODO: account for user ids when pruning old sessions. Otherwise one user could log in 16k times and boot out everyone else.
		for _, s := range sessionsByAge[:toRemove] {
			delete(sessionsByToken, s.token)
		}
		sessionsByAge = sessionsByAge[toRemove:]
	}
	if expired+toRemove > 0 {
		log.Debugf("Pruned %v old sessions.", expired+toRemove)
	}
}
