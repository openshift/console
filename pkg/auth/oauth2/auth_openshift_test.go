package oauth2

import (
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"golang.org/x/oauth2"

	"github.com/openshift/console/pkg/auth/csrfverifier"
	"github.com/openshift/console/pkg/auth/sessions"
	"github.com/openshift/console/pkg/middleware"
)

func Test_openShiftAuth_logout(t *testing.T) {
	tests := []struct {
		name             string
		recoveryCookie   string
		removeSession    bool
		refreshToken     string
		invalidIssuer    bool
		revocationStatus int
		wantStatus       int
		wantDeletes      int32
	}{
		{
			name: "existing session", recoveryCookie: "valid",
			wantStatus: http.StatusNoContent, wantDeletes: 1,
		},
		{
			name:       "existing session without recovery cookie",
			wantStatus: http.StatusNoContent, wantDeletes: 1,
		},
		{
			name: "existing session with expired recovery cookie", recoveryCookie: "expired",
			wantStatus: http.StatusNoContent, wantDeletes: 1,
		},
		{
			name: "existing session with invalid recovery cookie", recoveryCookie: "invalid",
			wantStatus: http.StatusNoContent, wantDeletes: 1,
		},
		{
			name: "recovery cookie only", recoveryCookie: "valid", removeSession: true,
			wantStatus: http.StatusNoContent, wantDeletes: 1,
		},
		{
			name: "missing session and recovery cookie", removeSession: true,
			wantStatus: http.StatusInternalServerError,
		},
		{
			name: "expired recovery cookie only", recoveryCookie: "expired", removeSession: true,
			wantStatus: http.StatusInternalServerError,
		},
		{
			name: "invalid recovery cookie only", recoveryCookie: "invalid", removeSession: true,
			wantStatus: http.StatusInternalServerError,
		},
		{
			name: "revocation failure", recoveryCookie: "valid", revocationStatus: http.StatusInternalServerError,
			wantStatus: http.StatusInternalServerError, wantDeletes: 1,
		},
		{
			name: "invalid issuer", recoveryCookie: "valid", invalidIssuer: true,
			wantStatus: http.StatusInternalServerError,
		},
		{
			name: "existing session with refresh token", recoveryCookie: "valid",
			refreshToken: "test-refresh-token",
			wantStatus:   http.StatusNoContent, wantDeletes: 2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			const accessToken = "sha256~test-access-token"
			var deletes atomic.Int32
			provider := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				deletes.Add(1)
				if r.Method != http.MethodDelete {
					t.Errorf("unexpected OAuth method: %s", r.Method)
				}
				if r.Header.Get("Authorization") != "Bearer "+accessToken {
					t.Error("unexpected OAuth authorization header")
				}
				if r.URL.Path != "/apis/oauth.openshift.io/v1/oauthaccesstokens/"+tokenToObjectName(accessToken) &&
					(tt.refreshToken == "" || r.URL.Path != "/apis/oauth.openshift.io/v1/oauthauthorizetokens/"+tokenToObjectName(tt.refreshToken)) {
					t.Errorf("unexpected OAuth request: %s", r.URL.Path)
				}
				w.Header().Set("Content-Type", "application/json")
				if tt.revocationStatus != 0 {
					w.WriteHeader(tt.revocationStatus)
					_, _ = w.Write([]byte(`{"kind":"Status","apiVersion":"v1","status":"Failure","reason":"InternalError","code":500}`))
					return
				}
				_, _ = w.Write([]byte(`{"kind":"Status","apiVersion":"v1","status":"Success"}`))
			}))
			defer provider.Close()

			o := &openShiftAuth{
				oidcConfig: &oidcConfig{issuerURL: provider.URL},
				k8sClient:  provider.Client(),
				sessions: sessions.NewSessionStore(
					[]byte(randomString(64)), []byte(randomString(32)), false, "/api",
				),
			}
			if tt.invalidIssuer {
				o.issuerURL = ":invalid"
			}

			logoutURL, err := url.Parse("http://console.example.com/api/console/logout")
			require.NoError(t, err)
			jar, err := cookiejar.New(nil)
			require.NoError(t, err)
			expiry := time.Now().Add(time.Hour)
			loginRequest := httptest.NewRequest(http.MethodGet, logoutURL.String(), nil)
			loginWriter := httptest.NewRecorder()
			ls, err := o.login(loginWriter, loginRequest, &oauth2.Token{
				AccessToken: accessToken, RefreshToken: tt.refreshToken, Expiry: expiry,
			})
			require.NoError(t, err)
			jar.SetCookies(logoutURL, loginWriter.Result().Cookies())

			switch tt.recoveryCookie {
			case "valid", "expired":
				recoveryExpiry := time.Now().Add(time.Hour)
				if tt.recoveryCookie == "expired" {
					recoveryExpiry = time.Now().Add(-time.Hour)
				}
				writer := httptest.NewRecorder()
				require.NoError(t, o.sessions.SetRecoveryCookie(writer, loginRequest, accessToken, recoveryExpiry))
				jar.SetCookies(logoutURL, writer.Result().Cookies())
			case "invalid":
				jar.SetCookies(logoutURL, []*http.Cookie{{Name: "openshift-recovery-token", Value: "invalid", Path: "/api"}})
			default:
				jar.SetCookies(logoutURL, []*http.Cookie{{Name: "openshift-recovery-token", MaxAge: -1, Path: "/api"}})
			}
			if tt.removeSession {
				o.sessions.ServerStore().DeleteBySessionToken(ls.SessionToken())
			}

			request := httptest.NewRequest(http.MethodPost, logoutURL.String(), nil)
			for _, cookie := range jar.Cookies(logoutURL) {
				request.AddCookie(cookie)
			}
			writer := httptest.NewRecorder()
			o.logout(writer, request)

			response := writer.Result()
			require.Equal(t, tt.wantStatus, response.StatusCode)
			require.Equal(t, tt.wantDeletes, deletes.Load())
			require.Nil(t, o.sessions.ServerStore().GetSession(ls.SessionToken(), ""))
			require.NotEmpty(t, response.Cookies())
			for _, cookie := range response.Cookies() {
				require.Equal(t, -1, cookie.MaxAge, "logout must only expire cookies: %s", cookie.Name)
				require.Equal(t, "/api", cookie.Path)
			}
			jar.SetCookies(logoutURL, response.Cookies())
			require.Empty(t, jar.Cookies(logoutURL))

			authenticator := &OAuth2Authenticator{loginMethod: o}
			upstreamCalled := false
			handler := middleware.AuthMiddleware(authenticator, csrfverifier.NewCSRFVerifier(nil, false), func(w http.ResponseWriter, r *http.Request) {
				upstreamCalled = true
			})
			followup := httptest.NewRequest(http.MethodGet, "http://console.example.com/api/kubernetes/apis/user.openshift.io/v1/users/~", nil)
			for _, cookie := range jar.Cookies(followup.URL) {
				followup.AddCookie(cookie)
			}
			followupWriter := httptest.NewRecorder()
			handler.ServeHTTP(followupWriter, followup)
			require.Equal(t, http.StatusUnauthorized, followupWriter.Code)
			require.Empty(t, followupWriter.Body.String())
			require.False(t, upstreamCalled)
		})
	}
}

func Test_openShiftAuth_recoverSession(t *testing.T) {
	o := &openShiftAuth{
		sessions: sessions.NewSessionStore([]byte(randomString(64)), []byte(randomString(32)), false, "/api"),
	}
	request := httptest.NewRequest(http.MethodGet, "/api/kubernetes/", nil)
	writer := httptest.NewRecorder()
	require.NoError(t, o.sessions.SetRecoveryCookie(writer, request, "test-access-token", time.Now().Add(time.Hour)))
	for _, cookie := range writer.Result().Cookies() {
		request.AddCookie(cookie)
	}

	recoveredWriter := httptest.NewRecorder()
	user, err := o.Authenticate(recoveredWriter, request)
	require.NoError(t, err)
	require.Equal(t, "test-access-token", user.Token)
	var sessionCookie *http.Cookie
	for _, cookie := range recoveredWriter.Result().Cookies() {
		if cookie.Name == sessions.SessionCookieName() {
			sessionCookie = cookie
		}
	}
	require.NotNil(t, sessionCookie)
	require.Positive(t, sessionCookie.MaxAge)
}
