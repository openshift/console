package auth

import (
	"testing"
	"time"

	"github.com/coreos/go-oidc/jose"
)

func checkSessions(t *testing.T) {
	if len(sessionsByAge) != len(sessionsByToken) {
		t.Fatalf("age: %v != token %v", len(sessionsByAge), len(sessionsByToken))
	}
	for _, s := range sessionsByAge {
		ls := sessionsByToken[s.token]
		if ls == nil {
			t.Fatalf("sessionsByAge %v not in sessionsByToken", s.token)
		}
	}
}

func TestSessions(t *testing.T) {
	maxSessions = 3
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

		err = addSession(ls)
		if err != nil {
			t.Fatalf("addSession error: %v", err)
		}

		sessionToken := ls.sessionToken
		if sessionToken == "" {
			t.Fatal("sessionToken is empty!")
		}
		checkSessions(t)
	}

	if len(sessionsByAge) != 4 {
		t.Fatal("sessionsByAge != 4")
	}

	pruneSessions()

	if len(sessionsByAge) != 3 {
		t.Fatal("sessionsByAge != 3")
	}

	checkSessions(t)

	err := deleteSession(sessionsByAge[0].token)
	if err != nil {
		t.Fatalf("deleteSession error: %v", err)
	}

	checkSessions(t)

	if len(sessionsByAge) != 2 {
		t.Fatal("sessionsByAge != 2")
	}
}
