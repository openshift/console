package sessions

import (
	"net/http"
	"net/http/httptest"
	"reflect"
	"strconv"
	"testing"
	"time"

	"github.com/gorilla/securecookie"
	consoleUtils "github.com/openshift/console/pkg/utils"
	"github.com/stretchr/testify/require"
	"golang.org/x/oauth2"
	utilptr "k8s.io/utils/ptr"
)

func TestCombinedSessionStore_AddSession(t *testing.T) {
	testIDToken := createTestIDToken(`{"sub":"user-id-0"}`)
	testVerifier := newTestVerifier(`{"sub":"user-id-0"}`)

	encryptionKey := []byte(randomString(32))
	authnKey := []byte(randomString(64))
	cookieCodecs := securecookie.CodecsFromPairs(authnKey, encryptionKey)

	tests := []struct {
		name             string
		token            *oauth2.Token
		verifier         IDTokenVerifier
		origSessionToken *string
		origRefreshToken *string
		wantRefreshToken string
		wantRawToken     string
		wantErr          bool
	}{
		{
			name: "no previous info",
			token: addIDToken(
				&oauth2.Token{
					RefreshToken: "random-token-string",
				},
				testIDToken,
			),
			wantRefreshToken: "random-token-string",
			wantRawToken:     testIDToken,
		},
		{
			name: "pre-existing refresh token",
			token: addIDToken(
				&oauth2.Token{
					RefreshToken: "random-token-string",
				},
				testIDToken,
			),
			origRefreshToken: utilptr.To[string]("orig-refresh-token"),
			wantRefreshToken: "random-token-string",
			wantRawToken:     testIDToken,
		},
		{
			name: "pre-existing session token",
			token: addIDToken(
				&oauth2.Token{
					RefreshToken: "random-token-string",
				},
				testIDToken,
			),
			origSessionToken: utilptr.To[string]("orig-session-token"),
			wantRefreshToken: "random-token-string",
			wantRawToken:     testIDToken,
		},
		{
			name: "id-token verification error",
			token: addIDToken(
				&oauth2.Token{
					RefreshToken: "random-token-string",
				},
				testIDToken,
			),
			verifier: testErrVerifier,
			wantErr:  true,
		},
		{
			name: "no refresh token",
			token: addIDToken(
				&oauth2.Token{},
				testIDToken,
			),
			wantRawToken: testIDToken,
		},
		{
			name: "no refresh token with previous refresh token",
			token: addIDToken(
				&oauth2.Token{},
				testIDToken,
			),
			origRefreshToken: utilptr.To[string]("random-token-string"),
			wantRawToken:     testIDToken,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			cs := NewSessionStore(authnKey, encryptionKey, true, "/")

			testWriter := httptest.NewRecorder()

			req, err := http.NewRequest("GET", "/", nil)
			require.NoError(t, err, "failed to create test request")

			if tt.origSessionToken != nil {
				origSession, err := securecookie.EncodeMulti(
					SessionCookieName(),
					map[interface{}]interface{}{
						"session-token": tt.origSessionToken,
					},
					cookieCodecs...,
				)
				require.NoError(t, err, "failed to encode test cookie")

				req.AddCookie(&http.Cookie{Name: SessionCookieName(), Value: origSession})
			}

			if tt.origRefreshToken != nil {
				origSession, err := securecookie.EncodeMulti(
					SessionCookieName(),
					map[interface{}]interface{}{
						"session-token": tt.origRefreshToken,
					},
					cookieCodecs...,
				)
				require.NoError(t, err, "failed to encode test cookie")

				req.AddCookie(&http.Cookie{Name: SessionCookieName(), Value: origSession})
			}

			testVerifier := testVerifier
			if tt.verifier != nil {
				testVerifier = tt.verifier
			}
			got, err := cs.AddSession(testWriter, req, testVerifier, tt.token)
			if (err != nil) != tt.wantErr {
				t.Errorf("CombinedSessionStore.AddSession() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if err != nil {
				return
			}

			require.Equal(t, tt.wantRawToken, got.rawToken)
			require.Equal(t, tt.wantRefreshToken, got.refreshToken)

			cookies := testWriter.Result().Cookies()
			var sessionFound, refreshFound bool
			for _, c := range cookies {
				// got session token cookie
				if c.Name == SessionCookieName() {
					sessionFound = true
					gotSession := make(map[interface{}]interface{})
					require.NoError(t, securecookie.DecodeMulti(SessionCookieName(), c.Value, &gotSession, cookieCodecs...))
					if gotSession["session-token"] != got.sessionToken {
						t.Errorf("wanted session cookie to be %q, got %q", got.sessionToken, c.Value)
					}
				} else if c.Name == openshiftRefreshTokenCookieName {
					// got refresh token cookie
					refreshFound = true
					gotRefresh := make(map[interface{}]interface{})
					require.NoError(t, securecookie.DecodeMulti(openshiftRefreshTokenCookieName, c.Value, &gotRefresh, cookieCodecs...))
					if gotRefresh["refresh-token"] != tt.wantRefreshToken {
						t.Errorf("wanted refresh cookie to be %q, got %q", tt.wantRefreshToken, c.Value)
					}
				}

			}

			require.True(t, sessionFound, "session cookie not found")
			if len(tt.wantRefreshToken) > 0 {
				require.True(t, refreshFound, "refresh cookie not found")
			}
		})
	}
}

func TestCombinedSessionStore_GetSession(t *testing.T) {
	encryptionKey := []byte(randomString(32))
	authnKey := []byte(randomString(64))
	cookieCodecs := securecookie.CodecsFromPairs(authnKey, encryptionKey)

	testServerSessions := NewServerSessionStore(10)
	for i := 0; i < 5; i++ {
		sessionToken := strconv.Itoa(i)
		testServerSessions.byToken[sessionToken] = &LoginState{sessionToken: sessionToken}
	}

	refreshedSession := testServerSessions.byToken["4"]
	refreshedSession.refreshToken = "refresh-new"
	testServerSessions.byRefreshToken["refresh-old"] = refreshedSession

	tests := []struct {
		name         string
		sessionToken string
		refreshToken string
		want         *LoginState
		wantErr      bool
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
			want:         testServerSessions.byToken["2"],
		},
		{
			name:         "session miss, refresh hit",
			sessionToken: "10",
			refreshToken: "refresh-old",
			want:         testServerSessions.byToken["4"],
		},
		{
			name:         "no session, refresh hit",
			refreshToken: "refresh-old",
			want:         testServerSessions.byToken["4"],
		},
		{
			name:         "session hit priority",
			sessionToken: "0",
			refreshToken: "refresh-old",
			want:         testServerSessions.byToken["0"],
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cs := NewSessionStore(authnKey, encryptionKey, true, "/")
			cs.serverStore = testServerSessions

			testCookies := &testCookieFactory{
				cookieCodecs: cookieCodecs,
			}

			req, err := http.NewRequest(http.MethodGet, "/", nil)
			require.NoError(t, err)

			if len(tt.sessionToken) > 0 {
				testCookies.WithSessionToken(tt.sessionToken)
			}
			if len(tt.refreshToken) > 0 {
				testCookies.WithRefreshToken(tt.refreshToken)
			}
			req = testCookies.Complete(t, req)

			testWriter := httptest.NewRecorder()
			got, err := cs.GetSession(testWriter, req)
			if (err != nil) != tt.wantErr {
				t.Errorf("CombinedSessionStore.GetSession() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("CombinedSessionStore.GetSession() = %v, want %v", got, tt.want)
			}
		})
	}
}

func addIDToken(t *oauth2.Token, idtoken string) *oauth2.Token {
	extra := map[string]interface{}{
		"id_token": idtoken,
	}
	t = t.WithExtra(extra)
	return t
}

func randomString(size int) string {
	str, err := consoleUtils.RandomString(size)
	if err != nil {
		panic(err) // should never fail
	}
	return str
}

func TestCombinedSessionStore_UpdateTokens(t *testing.T) {

	encryptionKey := []byte(randomString(32))
	authnKey := []byte(randomString(64))
	cookieCodecs := securecookie.CodecsFromPairs(authnKey, encryptionKey)

	currentTime := strconv.FormatInt(time.Now().Add(5*time.Minute).Unix(), 10)
	idTokens := []string{
		createTestIDToken(`{"sub":"user-id-0","exp":` + currentTime + `}`),
	}

	tests := []struct {
		name                               string
		currentSessionToken                string
		currentRefreshToken                string
		token                              *oauth2.Token
		verifier                           IDTokenVerifier
		serverStore                        *SessionStore
		wantRefreshToken                   string
		wantIdToken                        string
		wantSession                        bool
		wantServerSessionRefreshTokenIndex string
		wantErr                            bool
	}{
		{
			name:                               "no session",
			currentSessionToken:                "",
			currentRefreshToken:                "old-token",
			token:                              addIDToken(&oauth2.Token{RefreshToken: "new-token"}, idTokens[0]),
			verifier:                           newTestVerifier(`{"sub":"user-id-0","exp":` + currentTime + `}`),
			serverStore:                        NewServerSessionStore(10),
			wantRefreshToken:                   "new-token",
			wantServerSessionRefreshTokenIndex: "old-token",
			wantIdToken:                        idTokens[0],
		},
		{
			name:                "failed to verify token",
			currentSessionToken: "",
			currentRefreshToken: "old-token",
			token:               addIDToken(&oauth2.Token{RefreshToken: "new-token"}, idTokens[0]),
			verifier:            testErrVerifier,
			serverStore:         NewServerSessionStore(10),
			wantErr:             true,
		},
		{
			name:                "pre-existing session indexed by session token with a different sub - possible impersonation attack",
			currentSessionToken: "000",
			currentRefreshToken: "old-token",
			token:               addIDToken(&oauth2.Token{RefreshToken: "new-token"}, idTokens[0]),
			verifier:            newTestVerifier(`{"sub":"user-id-0","exp":` + currentTime + `}`),
			serverStore:         addServerSession(NewServerSessionStore(10), &LoginState{now: time.Now, sessionToken: "000", refreshToken: "different-old-token", userID: "verified-user"}),
			wantRefreshToken:    "",
			wantIdToken:         "",
			wantErr:             true,
		},
		{
			name:                               "pre-existing session indexed by session token",
			currentSessionToken:                "000",
			currentRefreshToken:                "old-token",
			token:                              addIDToken(&oauth2.Token{RefreshToken: "new-token"}, idTokens[0]),
			verifier:                           newTestVerifier(`{"sub":"user-id-0","exp":` + currentTime + `}`),
			serverStore:                        addServerSession(NewServerSessionStore(10), &LoginState{now: time.Now, sessionToken: "000", refreshToken: "different-old-token", userID: "user-id-0"}),
			wantRefreshToken:                   "new-token",
			wantServerSessionRefreshTokenIndex: "old-token",
			wantIdToken:                        idTokens[0],
		},
		{
			name:                               "pre-existing session indexed by refresh token - second request with old refresh token came at the same time as the first request that refreshed successfully",
			currentSessionToken:                "",
			currentRefreshToken:                "old-token",
			token:                              addIDToken(&oauth2.Token{RefreshToken: "new-token"}, idTokens[0]),
			verifier:                           newTestVerifier(`{"sub":"user-id-0","exp":` + currentTime + `}`),
			serverStore:                        indexSessionByRefreshToken(NewServerSessionStore(10), "old-token", &LoginState{now: time.Now, sessionToken: "000", refreshToken: "different-old-token", userID: "user-id-0"}),
			wantRefreshToken:                   "new-token",
			wantServerSessionRefreshTokenIndex: "old-token",
			wantIdToken:                        idTokens[0],
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cs := NewSessionStore(authnKey, encryptionKey, true, "/")
			cs.serverStore = tt.serverStore

			req, err := http.NewRequest(http.MethodGet, "/", nil)
			require.NoError(t, err)

			testCookieFactory := &testCookieFactory{cookieCodecs: cookieCodecs}
			if len(tt.currentSessionToken) > 0 {
				testCookieFactory.WithSessionToken(tt.currentSessionToken)
			}
			if len(tt.currentRefreshToken) > 0 {
				testCookieFactory.WithRefreshToken(tt.currentRefreshToken)
			}
			req = testCookieFactory.Complete(t, req)

			testWriter := httptest.NewRecorder()
			got, err := cs.UpdateTokens(testWriter, req, tt.verifier, tt.token)
			if (err != nil) != tt.wantErr {
				t.Errorf("CombinedSessionStore.UpdateTokens() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if err != nil {
				return
			}

			if !reflect.DeepEqual(got.refreshToken, tt.wantRefreshToken) {
				t.Errorf("CombinedSessionStore.UpdateTokens().refreshToken = %v, want %v", got.refreshToken, tt.wantRefreshToken)
			}
			if !reflect.DeepEqual(got.rawToken, tt.wantIdToken) {
				t.Errorf("CombinedSessionStore.UpdateTokens().rawToken = %v, want %v", got.rawToken, tt.wantIdToken)
			}
			if len(tt.wantServerSessionRefreshTokenIndex) > 0 {
				require.NotNil(t, cs.serverStore.byRefreshToken[tt.wantServerSessionRefreshTokenIndex], "refreshToken index %s not found", tt.wantServerSessionRefreshTokenIndex)
			}
		})
	}
}

func TestCombinedSessionStore_DeleteSession(t *testing.T) {

	encryptionKey := []byte(randomString(32))
	authnKey := []byte(randomString(64))
	cookieCodecs := securecookie.CodecsFromPairs(authnKey, encryptionKey)

	setupServerStore := func() *SessionStore {
		testServerSessions := NewServerSessionStore(10)
		// lock the sessions lock to prevent data race check being
		// triggered in the test setup
		testServerSessions.mux.Lock()
		defer testServerSessions.mux.Unlock()

		for i := 0; i < 5; i++ {
			sessionToken := strconv.Itoa(i)
			testServerSessions.byToken[sessionToken] = &LoginState{sessionToken: sessionToken, exp: time.Now().Add(5 * time.Minute), now: time.Now}
			testServerSessions.byAge = append(testServerSessions.byAge, testServerSessions.byToken[sessionToken])

		}

		refreshedSession := testServerSessions.byToken["4"]
		refreshedSession.refreshToken = "refresh-new"
		testServerSessions.byRefreshToken["refresh-old"] = refreshedSession

		return testServerSessions
	}

	tests := []struct {
		name                          string
		serverStore                   *SessionStore
		cookieStore                   *testCookieFactory
		wantErr                       bool
		wantCookieTimeouts            []string
		wantServerSesionTokenRemoved  []string
		wantServerRefreshTokenRemoved string
		expectedSessionTokenIndices   int
		expectedRefreshTokenIndices   int
	}{
		{
			name:                        "no session",
			cookieStore:                 (&testCookieFactory{}).WithCustomCookie("random-cookie", map[interface{}]interface{}{"random-value": "50"}),
			expectedRefreshTokenIndices: 1,
			expectedSessionTokenIndices: 5,
		},
		{
			name: "client session only, no refresh token",
			cookieStore: (&testCookieFactory{}).
				WithCustomCookie("random-cookie", map[interface{}]interface{}{"random-value": "50"}).
				WithSessionToken("some-session-token"),
			wantCookieTimeouts:          []string{SessionCookieName()},
			expectedRefreshTokenIndices: 1,
			expectedSessionTokenIndices: 5,
		},
		{
			name: "client refresh token only",
			cookieStore: (&testCookieFactory{}).
				WithCustomCookie("random-cookie", map[interface{}]interface{}{"random-value": "50"}).
				WithRefreshToken("some-refresh-token"),
			wantCookieTimeouts:          []string{openshiftRefreshTokenCookieName},
			expectedRefreshTokenIndices: 1,
			expectedSessionTokenIndices: 5,
		},
		{
			name: "combined refresh and session tokens",
			cookieStore: (&testCookieFactory{}).
				WithCustomCookie("random-cookie", map[interface{}]interface{}{"random-value": "50"}).
				WithRefreshToken("some-refresh-token").
				WithSessionToken("some-session-token"),
			wantCookieTimeouts:          []string{SessionCookieName(), openshiftRefreshTokenCookieName},
			expectedRefreshTokenIndices: 1,
			expectedSessionTokenIndices: 5,
		},
		{
			name: "session tokens for multiple instances",
			cookieStore: (&testCookieFactory{}).
				WithCustomCookie(OpenshiftAccessTokenCookieName+"-pod1", map[interface{}]interface{}{"session-token": "50"}).
				WithCustomCookie(OpenshiftAccessTokenCookieName+"-pod2", map[interface{}]interface{}{"session-token": "60"}).
				WithCustomCookie(OpenshiftAccessTokenCookieName+"-pod3", map[interface{}]interface{}{"session-token": "200"}).
				WithCustomCookie("just-a-cookie", map[interface{}]interface{}{"session-token": "why not"}).
				WithRefreshToken("some-refresh-token"),
			wantCookieTimeouts: []string{
				OpenshiftAccessTokenCookieName + "-pod1",
				OpenshiftAccessTokenCookieName + "-pod2",
				OpenshiftAccessTokenCookieName + "-pod3",
				openshiftRefreshTokenCookieName,
			},
			expectedRefreshTokenIndices: 1,
			expectedSessionTokenIndices: 5,
		},
		{
			name:                        "someone else's server sessions - empty cookies",
			serverStore:                 NewServerSessionStore(10),
			expectedRefreshTokenIndices: 1,
			expectedSessionTokenIndices: 5,
		},
		{
			name:                        "someone else's server sessions - session token set in cookie",
			serverStore:                 NewServerSessionStore(10),
			cookieStore:                 (&testCookieFactory{}).WithSessionToken("some-session-token"),
			wantCookieTimeouts:          []string{SessionCookieName()},
			expectedRefreshTokenIndices: 1,
			expectedSessionTokenIndices: 5,
		},
		{
			name:                         "our server session - session token set in cookie",
			serverStore:                  NewServerSessionStore(10),
			cookieStore:                  (&testCookieFactory{}).WithSessionToken("0"),
			wantCookieTimeouts:           []string{SessionCookieName()},
			wantServerSesionTokenRemoved: []string{"0"},
			expectedRefreshTokenIndices:  1,
			expectedSessionTokenIndices:  4,
		},
		{
			name:                          "our server session - refresh token set in cookie",
			serverStore:                   NewServerSessionStore(10),
			cookieStore:                   (&testCookieFactory{}).WithRefreshToken("refresh-old"),
			wantCookieTimeouts:            []string{openshiftRefreshTokenCookieName},
			wantServerSesionTokenRemoved:  []string{"4"},
			wantServerRefreshTokenRemoved: "refresh-old",
			expectedRefreshTokenIndices:   0,
			expectedSessionTokenIndices:   4,
		},
		{
			name:        "our server session - both tokens set in cookie point to the same session",
			serverStore: NewServerSessionStore(10),
			cookieStore: (&testCookieFactory{}).
				WithRefreshToken("refresh-old").
				WithSessionToken("4"),
			wantCookieTimeouts:            []string{openshiftRefreshTokenCookieName, SessionCookieName()},
			wantServerSesionTokenRemoved:  []string{"4"},
			wantServerRefreshTokenRemoved: "refresh-old",
			expectedRefreshTokenIndices:   0,
			expectedSessionTokenIndices:   4,
		},
		{
			name:        "our server session - tokens point to different sessions",
			serverStore: NewServerSessionStore(10),
			cookieStore: (&testCookieFactory{}).
				WithRefreshToken("refresh-old").
				WithSessionToken("2"),
			wantCookieTimeouts:            []string{openshiftRefreshTokenCookieName, SessionCookieName()},
			wantServerSesionTokenRemoved:  []string{"4", "2"},
			wantServerRefreshTokenRemoved: "refresh-old",
			expectedRefreshTokenIndices:   0,
			expectedSessionTokenIndices:   3,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cs := NewSessionStore(authnKey, encryptionKey, true, "/")
			cs.serverStore = setupServerStore()

			req, err := http.NewRequest(http.MethodGet, "/", nil)
			require.NoError(t, err)

			if tt.cookieStore != nil {
				tt.cookieStore.cookieCodecs = cookieCodecs
				req = tt.cookieStore.Complete(t, req)
			}

			testWriter := httptest.NewRecorder()
			if err := cs.DeleteSession(testWriter, req); (err != nil) != tt.wantErr {
				t.Errorf("CombinedSessionStore.DeleteSession() error = %v, wantErr %v", err, tt.wantErr)
			}

			setCookies := testWriter.Result().Header.Values("Set-Cookie")
			if len(tt.wantCookieTimeouts) == 0 && len(setCookies) > 0 {
				t.Errorf("CombinedSessionStore.DeleteSession() unexpected cookies set: %v", setCookies)
			}

			gotCookies := map[string]*http.Cookie{}
			for _, c := range testWriter.Result().Cookies() {
				if c.MaxAge == -1 {
					gotCookies[c.Name] = c
				}
			}

			for _, cookieName := range tt.wantCookieTimeouts {
				cookie, ok := gotCookies[cookieName]
				if !ok {
					t.Errorf("CombinedSessionStore.DeleteSession() expected cookie %q to be set for timeout", cookieName)
					continue
				}
				if cookie.MaxAge != -1 {
					t.Errorf("CombinedSessionStore.DeleteSession() expected cookie %q to be set for timeout but its MaxAge is", cookie.MaxAge)
				}
				delete(gotCookies, cookieName)
			}
			if len(gotCookies) > 0 {
				t.Errorf("these cookies shouldn't have been affected: %#v", gotCookies)
			}

			if len(cs.serverStore.byToken) != tt.expectedSessionTokenIndices {
				t.Errorf("CombinedSessionStore.DeleteSession() expected %d session token indices, %d remain", tt.expectedSessionTokenIndices, len(cs.serverStore.byToken))
			}

			if len(cs.serverStore.byAge) != tt.expectedSessionTokenIndices {
				t.Errorf("CombinedSessionStore.DeleteSession() expected %d sessions in byAge, %d remain", tt.expectedSessionTokenIndices, len(cs.serverStore.byAge))
			}

			if len(cs.serverStore.byRefreshToken) != tt.expectedRefreshTokenIndices {
				t.Errorf("CombinedSessionStore.DeleteSession() expected %d refresh token indices, %d remain", tt.expectedRefreshTokenIndices, len(cs.serverStore.byRefreshToken))
			}

			for _, wantRemoved := range tt.wantServerSesionTokenRemoved {
				if cs.serverStore.byToken[wantRemoved] != nil {
					t.Errorf("CombinedSessionStore.DeleteSession() expected session token %q to be removed: %v", tt.wantServerSesionTokenRemoved, cs.serverStore.byToken[wantRemoved])
				}
			}

			if len(tt.wantServerRefreshTokenRemoved) > 0 && cs.serverStore.byRefreshToken[tt.wantServerRefreshTokenRemoved] != nil {
				t.Errorf("CombinedSessionStore.DeleteSession() expected refresh token %q to be removed: %v", tt.wantServerRefreshTokenRemoved, cs.serverStore.byRefreshToken[tt.wantServerRefreshTokenRemoved])
			}

		})
	}
}

type testCookieFactory struct {
	cookieCodecs  []securecookie.Codec
	sessionToken  *string
	refreshToken  *string
	customCookies map[string]map[interface{}]interface{}
}

func (f *testCookieFactory) WithSessionToken(sessionToken string) *testCookieFactory {
	f.sessionToken = &sessionToken
	return f
}

func (f *testCookieFactory) WithRefreshToken(refreshToken string) *testCookieFactory {
	f.refreshToken = &refreshToken
	return f
}

func (f *testCookieFactory) WithCustomCookie(cookieName string, cookieValue map[interface{}]interface{}) *testCookieFactory {
	if f.customCookies == nil {
		f.customCookies = make(map[string]map[interface{}]interface{})
	}
	f.customCookies[cookieName] = cookieValue
	return f
}

func (f *testCookieFactory) Complete(t *testing.T, req *http.Request) *http.Request {
	if f.sessionToken != nil {
		attachCookieOrDie(t, req, SessionCookieName(),
			map[interface{}]interface{}{
				"session-token": f.sessionToken,
			},
			f.cookieCodecs)
	}
	if f.refreshToken != nil {
		attachCookieOrDie(t, req, openshiftRefreshTokenCookieName,
			map[interface{}]interface{}{
				"refresh-token": f.refreshToken,
			},
			f.cookieCodecs)
	}

	for cookieName, cookieValue := range f.customCookies {
		attachCookieOrDie(t, req, cookieName, cookieValue, f.cookieCodecs)
	}
	return req
}

func attachCookieOrDie(t *testing.T, req *http.Request, cookieName string, cookieValue map[interface{}]interface{}, cookieCodecs []securecookie.Codec) {
	encoded, err := securecookie.EncodeMulti(cookieName, cookieValue, cookieCodecs...)
	require.NoError(t, err)
	req.AddCookie(&http.Cookie{Name: cookieName, Value: encoded})
}

func addServerSession(serverStore *SessionStore, session *LoginState) *SessionStore {
	serverStore.byToken[session.sessionToken] = session
	return serverStore
}

func indexSessionByRefreshToken(serverStore *SessionStore, refreshToken string, session *LoginState) *SessionStore {
	serverStore.byToken[session.sessionToken] = session
	serverStore.byRefreshToken[refreshToken] = session
	return serverStore
}
