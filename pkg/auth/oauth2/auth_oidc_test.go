package auth

import (
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math/big"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"reflect"
	"strconv"
	"strings"
	"testing"
	"time"

	oidc "github.com/coreos/go-oidc"
	"github.com/gorilla/securecookie"
	"github.com/stretchr/testify/require"
	"golang.org/x/oauth2"

	"github.com/openshift/console/pkg/auth/sessions"
)

const (
	testClientID          = "testclient"
	testClientSecret      = "testsecret"
	testValidRefreshToken = "valid-refresh-token"
	testNewRefreshToken   = "new-refresh-token"
)

// mockOIDCProvider serves so that we are able to serve basic discovery endpoints
// such as the JWKs and OIDC discovery.
// It's also capable of signing tokens so that these can be used in testing and
// verified against the key from the jwks_uri.
type mockOIDCProvider struct {
	issuer  string
	privKey *rsa.PrivateKey
}

func newMockOIDCProvider(issuer *url.URL, privKey *rsa.PrivateKey) *mockOIDCProvider {
	return &mockOIDCProvider{
		issuer:  issuer.String(),
		privKey: privKey,
	}
}

func (m *mockOIDCProvider) handleJWKS(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write(
		[]byte(fmt.Sprintf(`
{
 "keys": [
  {
   "kty": "RSA",
   "alg": "RS256",
   "use": "sig",
   "kid": "testkey-0",
   "n": "%s",
   "e": "%s"
  }
 ]
}`,
			base64.RawURLEncoding.EncodeToString(m.privKey.N.Bytes()),
			base64.RawURLEncoding.EncodeToString(big.NewInt(int64(m.privKey.E)).Bytes()),
		),
		),
	)
}

func (m *mockOIDCProvider) handleDiscovery(w http.ResponseWriter, r *http.Request) {
	// https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationRequest
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(fmt.Sprintf(`{
 "issuer": "%s",
 "authorization_endpoint": "%s/auth",
 "token_endpoint": "%s/token",
 "jwks_uri": "%s/keys"
}`, m.issuer, m.issuer, m.issuer, m.issuer,
	),
	),
	)
}

func (m *mockOIDCProvider) handleToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "invalid HTTP method", http.StatusBadRequest)
		return
	}

	if err := r.ParseForm(); err != nil {
		http.Error(w, "failed parsing request form", http.StatusBadRequest)
		return
	}

	switch r.Form.Get("grant_type") {
	case "authorization_code":
		panic("not implemented")
	case "refresh_token":
		clientID, clientSecret, ok := r.BasicAuth()
		if !ok {
			clientID, clientSecret = r.Form.Get("client_id"), r.Form.Get("client_secret")
			if len(clientID) == 0 || len(clientSecret) == 0 {
				http.Error(w, `{"error": "invalid_request"}`, http.StatusBadRequest)
				return
			}
		}

		if clientID != testClientID || clientSecret != testClientSecret {
			http.Error(w, `{"error": "invalid_client"}`, http.StatusBadRequest)
			return
		}

		if r.Form.Get("refresh_token") != testValidRefreshToken {
			http.Error(w, `{"error": "invalid_grant"}`, http.StatusBadRequest)
			return
		}

		resp := map[string]string{
			"access_token":  "new-access-token",
			"token_type":    "bearer",
			"refresh_token": "new-refresh-token",
			"id_token":      m.signPayload(`{"sub":"testuser","exp":` + strconv.FormatInt(time.Now().Add(5*time.Minute).Unix(), 10) + `}`),
		}
		var respJSON []byte
		respJSON, err := json.Marshal(resp)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to JSON-marshal the response: %v", err), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(respJSON)
	}
}

func (m *mockOIDCProvider) verifyIDToken(ctx context.Context, token string) (*oidc.IDToken, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid token format")
	}

	// go-oidc expects some private fields of the IDToken to be set in order to
	// accept it successfully, this seems to be the easiest way to set up the verifier
	provider, err := oidc.NewProvider(ctx, m.issuer)
	if err != nil {
		return nil, err
	}

	verifier := provider.Verifier(&oidc.Config{ClientID: testClientID, SkipExpiryCheck: true})
	return verifier.Verify(ctx, token)
}

func (m *mockOIDCProvider) signPayload(payload string) string {
	var injectedPayload map[string]interface{}
	if err := json.Unmarshal([]byte(payload), &injectedPayload); err != nil {
		panic(err)
	}
	injectedPayload["iss"] = m.issuer
	injectedPayload["aud"] = testClientID

	finalPayload, err := json.Marshal(injectedPayload)
	if err != nil {
		panic(err)
	}
	finalPayloadB64 := base64.RawURLEncoding.EncodeToString(finalPayload)

	header := base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"RS256","kid":"testkey-0"}`))
	hashToSign := sha256.Sum256([]byte(header + "." + finalPayloadB64))
	signature, err := rsa.SignPKCS1v15(rand.Reader, m.privKey, crypto.SHA256, hashToSign[:])
	if err != nil {
		panic(err)
	}

	token := fmt.Sprintf(
		"%s.%s.%s",
		header,
		finalPayloadB64,
		base64.RawURLEncoding.EncodeToString(signature),
	)
	return token
}

func (m *mockOIDCProvider) attachEndpoints(server *http.ServeMux) error {
	server.HandleFunc("/token", m.handleToken)
	server.HandleFunc("/keys", m.handleJWKS)
	server.HandleFunc("/.well-known/openid-configuration", m.handleDiscovery)
	return nil
}

func (m *mockOIDCProvider) endpointConfig() oauth2.Endpoint {
	return oauth2.Endpoint{
		AuthURL:  m.issuer + "/auth",
		TokenURL: m.issuer + "/token",
	}
}

func startMockProvider(t *testing.T) (*mockOIDCProvider, *url.URL, func() error) {
	privKey, err := rsa.GenerateKey(rand.Reader, 2048)
	require.NoError(t, err)

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)

	providerURL := &url.URL{Scheme: "http", Host: listener.Addr().String()}
	provider := newMockOIDCProvider(providerURL, privKey)
	handler := http.NewServeMux()
	provider.attachEndpoints(handler)

	go http.Serve(listener, handler)

	return provider, providerURL, listener.Close
}

func Test_oidcAuth_login(t *testing.T) {
	encryptionKey := []byte(randomString(32))
	authnKey := []byte(randomString(64))

	oidcProvider, providerURL, closePort := startMockProvider(t)
	defer closePort()

	tests := []struct {
		name       string
		token      *oauth2.Token
		wantUserID string
		wantErr    bool
	}{
		{
			name:    "no token",
			wantErr: true,
		},
		{
			name:       "id_token only",
			token:      addIDToken(&oauth2.Token{}, oidcProvider.signPayload(`{"sub":"testuser","exp":`+strconv.FormatInt(time.Now().Add(5*time.Minute).Unix(), 10)+`}`)),
			wantUserID: "testuser",
		},
		{
			name:       "ID and refresh tokens",
			token:      addIDToken(&oauth2.Token{RefreshToken: "testing-refresh"}, oidcProvider.signPayload(`{"sub":"testuser","exp":`+strconv.FormatInt(time.Now().Add(5*time.Minute).Unix(), 10)+`}`)),
			wantUserID: "testuser",
		},
		{
			name:    "invalid ID token signature",
			token:   addIDToken(&oauth2.Token{RefreshToken: "testing-refresh"}, oidcProvider.signPayload(`{"sub":"testuser","exp":`+strconv.FormatInt(time.Now().Add(5*time.Minute).Unix(), 10)+`}`)+"abbaba"),
			wantErr: true,
		},
		{
			name:    "id_token missing sub claim",
			token:   addIDToken(&oauth2.Token{RefreshToken: "testing-refresh"}, oidcProvider.signPayload(`{"exp":`+strconv.FormatInt(time.Now().Add(5*time.Minute).Unix(), 10)+`}`)),
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			o, err := newOIDCAuth(
				context.Background(),
				sessions.NewSessionStore(authnKey, encryptionKey, true, "/"),
				&oidcConfig{
					getClient: func() *http.Client {
						return http.DefaultClient
					},
					issuerURL:             providerURL.String(),
					clientID:              testClientID,
					secureCookies:         true,
					constructOAuth2Config: testOAuth2ConfigConstructor,
				},
			)
			require.NoError(t, err)

			req := httptest.NewRequest("GET", "/", nil)

			writer := httptest.NewRecorder()
			got, err := o.login(writer, req, tt.token)
			if (err != nil) != tt.wantErr {
				t.Errorf("oidcAuth.login() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if err != nil {
				return
			}

			if !reflect.DeepEqual(got.UserID(), tt.wantUserID) {
				t.Errorf("oidcAuth.login() = %v, want %v", got.UserID(), tt.wantUserID)
			}

			wantIDToken := tt.token.Extra("id_token").(string)
			require.Equal(t, wantIDToken, got.AccessToken())

			if tt.token.RefreshToken != "" {
				require.Equal(t, tt.token.RefreshToken, got.RefreshToken())
			}
		})
	}
}

func Test_oidcAuth_refreshSession(t *testing.T) {
	encryptionKey := []byte(randomString(32))
	authnKey := []byte(randomString(64))

	oidcProvider, providerURL, closePort := startMockProvider(t)
	defer closePort()

	tests := []struct {
		name               string
		cookieRefreshToken string
		wantRefreshToken   string
		initSessions       func(*sessions.CombinedSessionStore) string
		wantErr            bool
	}{
		{
			name:    "no session, no refresh token",
			wantErr: true,
		},
		{
			name:               "no session, refresh token",
			cookieRefreshToken: testValidRefreshToken,
			wantRefreshToken:   testNewRefreshToken,
		},
		{
			name:               "no session, invalid refresh token",
			cookieRefreshToken: "invalid-token",
			wantErr:            true,
		},
		{
			name: "session exists, no refresh token",
			initSessions: func(s *sessions.CombinedSessionStore) string {
				s.AddSession(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/", nil), oidcProvider.verifyIDToken, addIDToken(&oauth2.Token{}, oidcProvider.signPayload(`{"sub":"testuser","exp":`+strconv.FormatInt(time.Now().Add(5*time.Minute).Unix(), 10)+`}`)))
				return ""
			},
			wantErr: true,
		},
		{
			name: "session exists with different refresh token - session tokens match short-circuit to prevent multiple refreshes",
			initSessions: func(s *sessions.CombinedSessionStore) (initSessionToken string) {
				testCookieFactory := &testCookieFactory{
					cookieCodecs: securecookie.CodecsFromPairs(authnKey, encryptionKey),
				}
				// inject the refresh token into the refresh token cache
				testCookieFactory.WithRefreshToken("test-original-refresh-token")
				req := httptest.NewRequest(http.MethodGet, "/", nil)
				req = testCookieFactory.Complete(t, req)

				session, err := s.UpdateTokens(httptest.NewRecorder(), req, oidcProvider.verifyIDToken, addIDToken(&oauth2.Token{RefreshToken: "test-already-refreshed-token"}, oidcProvider.signPayload(`{"sub":"testuser","exp":`+strconv.FormatInt(time.Now().Add(5*time.Minute).Unix(), 10)+`}`)))
				require.NoError(t, err)

				return session.SessionToken()
			},
			cookieRefreshToken: testValidRefreshToken,
			wantRefreshToken:   "test-already-refreshed-token",
		},
		{
			name: "session exists with the same refresh token - legit refresh request",
			initSessions: func(s *sessions.CombinedSessionStore) string {
				session, err := s.AddSession(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/", nil), oidcProvider.verifyIDToken, addIDToken(&oauth2.Token{RefreshToken: testValidRefreshToken}, oidcProvider.signPayload(`{"sub":"testuser","exp":`+strconv.FormatInt(time.Now().Add(5*time.Minute).Unix(), 10)+`}`)))
				require.NoError(t, err)

				return session.SessionToken()
			},
			cookieRefreshToken: testValidRefreshToken,
			wantRefreshToken:   testNewRefreshToken,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			o, err := newOIDCAuth(
				context.Background(),
				sessions.NewSessionStore(authnKey, encryptionKey, true, "/"),
				&oidcConfig{
					getClient: func() *http.Client {
						return http.DefaultClient
					},
					issuerURL:             providerURL.String(),
					clientID:              testClientID,
					secureCookies:         true,
					constructOAuth2Config: testOAuth2ConfigConstructor,
				},
			)
			require.NoError(t, err)

			testCookieFactory := &testCookieFactory{
				cookieCodecs: securecookie.CodecsFromPairs(authnKey, encryptionKey),
			}
			if len(tt.cookieRefreshToken) > 0 {
				testCookieFactory.WithRefreshToken(tt.cookieRefreshToken)
			}

			if tt.initSessions != nil {
				initSessionToken := tt.initSessions(o.sessions)
				if len(initSessionToken) > 0 {
					testCookieFactory.WithSessionToken(initSessionToken)
				}
			}

			req := httptest.NewRequest("GET", "/", nil)
			req = testCookieFactory.Complete(t, req)

			writer := httptest.NewRecorder()
			got, err := o.refreshSession(
				context.Background(),
				writer,
				req,
				testOAuth2ConfigConstructor(oidcProvider.endpointConfig()),
				tt.cookieRefreshToken,
			)
			if (err != nil) != tt.wantErr {
				t.Errorf("oidcAuth.refreshSession() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if err == nil {
				require.Equal(t, tt.wantRefreshToken, got.RefreshToken())
			}

			if len(tt.wantRefreshToken) > 0 {
				var refreshTokenCookieSet bool
				for _, c := range writer.Result().Cookies() {
					if c.Name == "openshift-refresh-token" {
						refreshTokenCookieSet = true
						break
					}
				}
				require.Equal(t, refreshTokenCookieSet, true)
			}
		})
	}
}

func Test_oidcAuth_getLoginState(t *testing.T) {

	encryptionKey := []byte(randomString(32))
	authnKey := []byte(randomString(64))

	oidcProvider, providerURL, closePort := startMockProvider(t)
	defer closePort()

	tests := []struct {
		name               string
		cookieRefreshToken string
		initSessions       func(*sessions.CombinedSessionStore) string
		wantUserUID        string
		wantErr            bool
	}{
		{
			name:    "no session, no refresh token",
			wantErr: true,
		},
		{
			name: "valid session",
			initSessions: func(s *sessions.CombinedSessionStore) string {
				session, err := s.AddSession(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/", nil), oidcProvider.verifyIDToken, addIDToken(&oauth2.Token{}, oidcProvider.signPayload(`{"sub":"testuser","exp":`+strconv.FormatInt(time.Now().Add(5*time.Minute).Unix(), 10)+`}`)))
				require.NoError(t, err)
				return session.SessionToken()
			},
			wantUserUID: "testuser",
		},
		{
			name: "expired session, no refresh tokens",
			initSessions: func(s *sessions.CombinedSessionStore) string {
				session, err := s.AddSession(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/", nil), oidcProvider.verifyIDToken, addIDToken(&oauth2.Token{}, oidcProvider.signPayload(`{"sub":"testuser","exp":`+strconv.FormatInt(time.Now().Add(-5*time.Minute).Unix(), 10)+`}`)))
				require.NoError(t, err)
				return session.SessionToken()
			},
			wantErr: true,
		},
		{
			name: "expired session, invalid refresh token",
			initSessions: func(s *sessions.CombinedSessionStore) string {
				session, err := s.AddSession(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/", nil), oidcProvider.verifyIDToken, addIDToken(&oauth2.Token{RefreshToken: "invalid-refresh-token"}, oidcProvider.signPayload(`{"sub":"testuser","exp":`+strconv.FormatInt(time.Now().Add(-5*time.Minute).Unix(), 10)+`}`)))
				require.NoError(t, err)
				return session.SessionToken()
			},
			cookieRefreshToken: "invalid-refresh-token",
			wantErr:            true,
		},
		{
			name: "expired session, valid refresh token",
			initSessions: func(s *sessions.CombinedSessionStore) string {
				session, err := s.AddSession(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/", nil), oidcProvider.verifyIDToken, addIDToken(&oauth2.Token{RefreshToken: testValidRefreshToken}, oidcProvider.signPayload(`{"sub":"testuser","exp":`+strconv.FormatInt(time.Now().Add(-5*time.Minute).Unix(), 10)+`}`)))
				require.NoError(t, err)
				return session.SessionToken()
			},
			cookieRefreshToken: testValidRefreshToken,
			wantUserUID:        "testuser",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			o, err := newOIDCAuth(
				context.Background(),
				sessions.NewSessionStore(authnKey, encryptionKey, true, "/"),
				&oidcConfig{
					getClient: func() *http.Client {
						return http.DefaultClient
					},
					issuerURL:             providerURL.String(),
					clientID:              testClientID,
					secureCookies:         true,
					constructOAuth2Config: testOAuth2ConfigConstructor,
				},
			)
			require.NoError(t, err)

			testCookieFactory := &testCookieFactory{
				cookieCodecs: securecookie.CodecsFromPairs(authnKey, encryptionKey),
			}
			if len(tt.cookieRefreshToken) > 0 {
				testCookieFactory.WithRefreshToken(tt.cookieRefreshToken)
			}

			if tt.initSessions != nil {
				initSessionToken := tt.initSessions(o.sessions)
				if len(initSessionToken) > 0 {
					testCookieFactory.WithSessionToken(initSessionToken)
				}
			}

			req := httptest.NewRequest("GET", "/", nil)
			req = testCookieFactory.Complete(t, req)

			writer := httptest.NewRecorder()
			got, err := o.getLoginState(writer, req)
			if (err != nil) != tt.wantErr {
				t.Errorf("oidcAuth.getLoginState() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if err == nil {
				require.Equal(t, tt.wantUserUID, got.UserID())
			}
		})
	}
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

func addIDToken(t *oauth2.Token, idtoken string) *oauth2.Token {
	extra := map[string]interface{}{
		"id_token": idtoken,
	}
	t = t.WithExtra(extra)
	return t
}

func testOAuth2ConfigConstructor(endpointConfig oauth2.Endpoint) *oauth2.Config {
	baseOAuth2Config := oauth2.Config{
		ClientID:     testClientID,
		ClientSecret: testClientSecret,
		RedirectURL:  "", // TODO?
		Scopes:       []string{"openid"},
		Endpoint:     endpointConfig,
	}

	return &baseOAuth2Config
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
		attachCookieOrDie(t, req, sessions.SessionCookieName(),
			map[interface{}]interface{}{
				"session-token": f.sessionToken,
			},
			f.cookieCodecs)
	}
	if f.refreshToken != nil {
		attachCookieOrDie(t, req, "openshift-refresh-token",
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
