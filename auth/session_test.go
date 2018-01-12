package auth

import (
	"testing"
	"time"

	"github.com/coreos/go-oidc/jose"
)

func checkSessions(t *testing.T, ss *SessionStore) {
	if len(ss.byAge) != len(ss.byToken) {
		t.Fatalf("age: %v != token %v", len(ss.byAge), len(ss.byToken))
	}
	for _, s := range ss.byAge {
		ls := ss.byToken[s.token]
		if ls == nil {
			t.Fatalf("ss.byAge %v not in ss.byToken", s.token)
		}
	}
}

func TestSessions(t *testing.T) {
	ss := NewSessionStore(3)
	notExpired := time.Now().Add(time.Duration(3600) * time.Second)
	expired := time.Now().Add(time.Duration(3600) * time.Second * -1)
	fakeTokens := []fakeToken{
		{"rando-token-string", jose.Claims{"sub": "user-id-0", "email": "user-0@example.com", "exp": notExpired.Unix()}},
		{"rando-token-string", jose.Claims{"sub": "user-id-1", "email": "user-1@example.com", "exp": notExpired.Unix()}},
		{"rando-token-string", jose.Claims{"sub": "user-id-2", "email": "user-2@example.com", "exp": notExpired.Unix()}},
		{"rando-token-string", jose.Claims{"sub": "user-id-3", "email": "user-3@example.com", "exp": expired.Unix()}},
	}

	for _, ft := range fakeTokens {
		ls, err := newLoginState(ft)
		if err != nil {
			t.Fatalf("newLoginState error: %v", err)
		}

		err = ss.AddSession(ls)
		if err != nil {
			t.Fatalf("AddSession error: %v", err)
		}

		sessionToken := ls.sessionToken
		if sessionToken == "" {
			t.Fatal("sessionToken is empty!")
		}
		checkSessions(t, ss)
	}

	if len(ss.byAge) != 4 {
		t.Fatal("ss.byAge != 4")
	}

	ss.PruneSessions()

	if len(ss.byAge) != 3 {
		t.Fatal("ss.byAge != 3")
	}

	checkSessions(t, ss)

	err := ss.DeleteSession(ss.byAge[0].token)
	if err != nil {
		t.Fatalf("deleteSession error: %v", err)
	}

	checkSessions(t, ss)

	if len(ss.byAge) != 2 {
		t.Fatal("ss.byAge != 2")
	}
}
