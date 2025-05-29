package sessions

import (
	"fmt"
	"reflect"
	"strconv"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"golang.org/x/oauth2"

	"k8s.io/apimachinery/pkg/util/sets"
)

func checkSessions(t *testing.T, ss *SessionStore) {
	if len(ss.byAge) != len(ss.byToken) {
		t.Fatalf("age: %v != token %v", len(ss.byAge), len(ss.byToken))
	}
	for _, s := range ss.byAge {
		ls := ss.byToken[s.sessionToken]
		if ls == nil {
			t.Fatalf("ss.byAge %v not in ss.byToken", s.sessionToken)
		}
	}
}

func TestSessions(t *testing.T) {
	ss := NewServerSessionStore(3)
	notExpired := time.Now().Add(time.Duration(3600) * time.Second)
	expired := time.Now().Add(time.Duration(3600) * time.Second * -1)
	fakeTokens := []struct {
		raw    string
		claims string
	}{
		{"rando-token-string", fmt.Sprintf(`{"sub": "user-id-0", "email": "user-0@example.com", "exp": %d}`, notExpired.Unix())},
		{"rando-token-string", fmt.Sprintf(`{"sub": "user-id-1", "email": "user-1@example.com", "exp": %d}`, notExpired.Unix())},
		{"rando-token-string", fmt.Sprintf(`{"sub": "user-id-2", "email": "user-2@example.com", "exp": %d}`, notExpired.Unix())},
		{"rando-token-string", fmt.Sprintf(`{"sub": "user-id-3", "email": "user-3@example.com", "exp": %d}`, expired.Unix())},
	}

	for _, ft := range fakeTokens {
		rawToken := createTestIDToken(ft.claims)
		tokenResp := &oauth2.Token{RefreshToken: rawToken}
		tokenResp = tokenResp.WithExtra(map[string]interface{}{"id_token": rawToken})

		_, err := ss.AddSession(newTestVerifier(ft.claims), tokenResp)
		if err != nil {
			t.Fatalf("addSession error: %v", err)
		}

		checkSessions(t, ss)
	}

	if len(ss.byAge) != 4 {
		t.Fatal("ss.byAge != 4")
	}

	ss.pruneSessions()

	if len(ss.byAge) != 3 {
		t.Fatal("ss.byAge != 3")
	}

	checkSessions(t, ss)

	err := ss.DeleteSession(ss.byAge[0].sessionToken)
	if err != nil {
		t.Fatalf("deleteSession error: %v", err)
	}

	checkSessions(t, ss)

	if len(ss.byAge) != 2 {
		t.Fatal("ss.byAge != 2")
	}
}

func TestSessionStore_GetSession(t *testing.T) {
	testStore := NewServerSessionStore(10)
	for i := 0; i < 10; i++ {
		sessionToken := strconv.Itoa(i)
		testStore.byToken[sessionToken] = &LoginState{sessionToken: sessionToken}
	}

	refreshedSession := testStore.byToken["5"]
	refreshedSession.refreshToken = "refresh-new"
	testStore.byRefreshToken["refresh-old"] = refreshedSession

	tests := []struct {
		name         string
		sessionToken string
		refreshToken string
		want         *LoginState
	}{
		{
			name:         "cache miss",
			sessionToken: "10",
			refreshToken: "2",
			want:         nil,
		},
		{
			name:         "session hit",
			sessionToken: "2",
			want:         testStore.byToken["2"],
		},
		{
			name:         "session miss, refresh hit",
			sessionToken: "10",
			refreshToken: "refresh-old",
			want:         testStore.byToken["5"],
		},
		{
			name:         "no session, refresh hit",
			refreshToken: "refresh-old",
			want:         testStore.byToken["5"],
		},
		{
			name:         "session hit priority",
			sessionToken: "4",
			refreshToken: "refresh-old",
			want:         testStore.byToken["4"],
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := testStore.GetSession(tt.sessionToken, tt.refreshToken); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("SessionStore.GetSession() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestSessionStore_pruneSessions(t *testing.T) {
	tests := []struct {
		name                  string
		modifyStorage         func(*SessionStore)
		expectedSessionTokens sets.Set[string]
		expectedRefreshTokens sets.Set[string]
		expectedByAgeLen      int
	}{
		{
			name: "no sessions",
		},
		{
			name: "single, expired session",
			modifyStorage: withServerSessions(
				&LoginState{
					sessionToken: "session-1",
					refreshToken: "refresh-1",
					exp:          time.Now().Add(-time.Minute * 5),
				},
			),
			expectedByAgeLen: 0,
		},
		{
			name: "expired session among others",
			modifyStorage: withServerSessions(
				&LoginState{
					sessionToken: "s1",
					refreshToken: "r1",
					exp:          time.Now().Add(time.Minute * 12),
				},
				&LoginState{
					sessionToken: "session-expired",
					refreshToken: "refresh-expired",
					exp:          time.Now().Add(-time.Minute * 5),
				},
				&LoginState{
					sessionToken: "s2",
					refreshToken: "r2",
					exp:          time.Now().Add(time.Minute * 5),
				},
				&LoginState{
					sessionToken: "s3",
					refreshToken: "r3",
					exp:          time.Now().Add(time.Minute * 7),
				},
			),
			expectedSessionTokens: sets.New("s1", "s2", "s3"),
			expectedRefreshTokens: sets.New("r1", "r2", "r3"),
			expectedByAgeLen:      3,
		},
		{
			name: "picking sessions that are still valid",
			modifyStorage: withServerSessions(
				&LoginState{
					sessionToken: "s1",
					refreshToken: "r1",
					exp:          time.Now().Add(time.Minute * 12),
				},
				&LoginState{
					sessionToken: "s2",
					refreshToken: "r2",
					exp:          time.Now().Add(time.Minute * 5),
				},
				&LoginState{
					sessionToken: "s3",
					refreshToken: "r3",
					exp:          time.Now().Add(time.Minute * 7),
				},
				&LoginState{
					sessionToken: "s4",
					refreshToken: "r4",
					exp:          time.Now().Add(time.Minute * 15),
				},
				&LoginState{
					sessionToken: "s5",
					refreshToken: "r5",
					exp:          time.Now().Add(time.Minute * 3),
				},
			),
			expectedSessionTokens: sets.New("s1", "s3", "s4"),
			expectedRefreshTokens: sets.New("r1", "r3", "r4"),
			expectedByAgeLen:      3,
		},
		{
			name: "noop at limit",
			modifyStorage: withServerSessions(
				&LoginState{
					sessionToken: "s1",
					refreshToken: "r1",
					exp:          time.Now().Add(time.Minute * 12),
				},
				&LoginState{
					sessionToken: "s2",
					refreshToken: "r2",
					exp:          time.Now().Add(time.Minute * 5),
				},
				&LoginState{
					sessionToken: "s3",
					refreshToken: "r3",
					exp:          time.Now().Add(time.Minute * 7),
				},
			),
			expectedSessionTokens: sets.New("s1", "s2", "s3"),
			expectedRefreshTokens: sets.New("r1", "r2", "r3"),
			expectedByAgeLen:      3,
		},
		{
			name: "noop",
			modifyStorage: withServerSessions(
				&LoginState{
					sessionToken: "s1",
					refreshToken: "r1",
					exp:          time.Now().Add(time.Minute * 12),
				},
				&LoginState{
					sessionToken: "s2",
					refreshToken: "r2",
					exp:          time.Now().Add(time.Minute * 5),
				},
			),
			expectedSessionTokens: sets.New("s1", "s2"),
			expectedRefreshTokens: sets.New("r1", "r2"),
			expectedByAgeLen:      2,
		},
		{
			name: "picking valid and expired sessions",
			modifyStorage: withServerSessions(
				&LoginState{
					sessionToken: "s1",
					refreshToken: "r1",
					exp:          time.Now().Add(time.Minute * 12),
				},
				&LoginState{
					sessionToken: "s2",
					refreshToken: "r2",
					exp:          time.Now().Add(time.Minute * 5),
				},
				&LoginState{
					sessionToken: "s3",
					refreshToken: "r3",
					exp:          time.Now().Add(-time.Minute * 7),
				},
				&LoginState{
					sessionToken: "s4",
					refreshToken: "r4",
					exp:          time.Now().Add(time.Minute * 15),
				},
				&LoginState{
					sessionToken: "s5",
					refreshToken: "r5",
					exp:          time.Now().Add(-time.Minute * 1),
				},
				&LoginState{
					sessionToken: "s6",
					refreshToken: "r6",
					exp:          time.Now().Add(time.Minute * 1),
				},
				&LoginState{
					sessionToken: "s7",
					refreshToken: "r7",
					exp:          time.Now().Add(time.Minute * 14),
				},
			),
			expectedSessionTokens: sets.New("s1", "s4", "s7"),
			expectedRefreshTokens: sets.New("r1", "r4", "r7"),
			expectedByAgeLen:      3,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ss := &SessionStore{
				byToken:        map[string]*LoginState{},
				byRefreshToken: map[string]*LoginState{},
				byAge:          []*LoginState{},
				maxSessions:    3,
				now:            time.Now,
				mux:            sync.Mutex{},
			}
			if tt.modifyStorage != nil {
				tt.modifyStorage(ss)
			}
			ss.pruneSessions()

			require.Equal(t, tt.expectedByAgeLen, len(ss.byAge))
			refreshKeys, sessionKeys := sets.New[string](), sets.New[string]()
			for k := range ss.byRefreshToken {
				refreshKeys.Insert(k)
			}
			for k := range ss.byToken {
				sessionKeys.Insert(k)
			}
			require.True(t, tt.expectedRefreshTokens.Equal(refreshKeys), "remaining refresh tokens: %v", refreshKeys)
			require.True(t, tt.expectedSessionTokens.Equal(sessionKeys), "remaining session tokens: %v", sessionKeys)

		})
	}
}

func withServerSessions(sessions ...*LoginState) func(ss *SessionStore) {
	return func(ss *SessionStore) {
		for _, s := range sessions {
			s := s
			s.now = time.Now
			ss.byToken[s.sessionToken] = s
			ss.byRefreshToken[s.refreshToken] = s
			ss.byAge = append(ss.byAge, s)
		}
	}
}
