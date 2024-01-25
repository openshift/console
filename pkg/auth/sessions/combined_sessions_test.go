package sessions

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strconv"
	"testing"

	"github.com/coreos/go-oidc"
	"github.com/gorilla/securecookie"
	"github.com/stretchr/testify/require"
	"golang.org/x/oauth2"
	utilptr "k8s.io/utils/ptr"
)

func TestCombinedSessionStore_AddSession(t *testing.T) {
	testIDToken := createTestIDToken([]byte(`{"sub":"user-id-0"}`))
	testVerifier := newTestVerifier([]byte(`{"sub":"user-id-0"}`))
	testErrVerifier := func(context.Context, string) (*oidc.IDToken, error) {
		return nil, fmt.Errorf("not a valid token: this is a test")
	}

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

			req, err := http.NewRequest(http.MethodGet, "/", nil)
			require.NoError(t, err)

			if len(tt.sessionToken) > 0 {
				attachCookieOrDie(t, req, SessionCookieName(),
					map[interface{}]interface{}{
						"session-token": tt.sessionToken,
					},
					cookieCodecs)
			}
			if len(tt.refreshToken) > 0 {
				attachCookieOrDie(t, req, openshiftRefreshTokenCookieName,
					map[interface{}]interface{}{
						"refresh-token": tt.refreshToken,
					},
					cookieCodecs)
			}

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

func randomBytes(size int) []byte {
	b := make([]byte, size)
	if _, err := rand.Read(b); err != nil {
		panic(err) // rand should never fail
	}
	return b
}

func randomString(size int) string {
	// each byte (8 bits) gives us 4/3 base64 (6 bits) characters
	// we account for that conversion and add one to handle truncation
	b64size := base64.RawURLEncoding.DecodedLen(size) + 1
	// trim down to the original requested size since we added one above
	return base64.RawURLEncoding.EncodeToString(randomBytes(b64size))[:size]
}

func attachCookieOrDie(t *testing.T, req *http.Request, cookieName string, cookieValue map[interface{}]interface{}, cookieCodecs []securecookie.Codec) {
	encoded, err := securecookie.EncodeMulti(cookieName, cookieValue, cookieCodecs...)
	require.NoError(t, err)
	req.AddCookie(&http.Cookie{Name: cookieName, Value: encoded})
}
