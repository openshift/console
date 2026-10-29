package oauth2

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/gorilla/securecookie"
	"github.com/stretchr/testify/require"
	"golang.org/x/oauth2"
	"k8s.io/klog/v2"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/auth/sessions"
	"github.com/openshift/console/pkg/serverutils/asynccache"
)

func (m *mockOIDCProvider) authorizeCode(w http.ResponseWriter, r *http.Request) {
	m.flowLock.Lock()
	defer m.flowLock.Unlock()
	query := r.URL.Query()
	callback, err := url.Parse(query.Get("redirect_uri"))
	if err != nil {
		http.Error(w, "invalid redirect", http.StatusBadRequest)
		return
	}
	response := callback.Query()
	response.Set("state", query.Get("state"))
	if m.requirePKCE && (query.Get("code_challenge") == "" || query.Get("code_challenge_method") != "S256") {
		response.Set("error", "invalid_request")
	} else {
		code := oauth2.GenerateVerifier()
		if m.codes == nil {
			m.codes = map[string]url.Values{}
		}
		m.codes[code] = query
		response.Set("code", code)
	}
	callback.RawQuery = response.Encode()
	http.Redirect(w, r, callback.String(), http.StatusSeeOther)
}

func (m *mockOIDCProvider) exchangeCode(w http.ResponseWriter, r *http.Request) {
	m.flowLock.Lock()
	defer m.flowLock.Unlock()
	m.exchanges = append(m.exchanges, r.PostForm)
	clientID, clientSecret, _ := r.BasicAuth()
	if clientID == "" {
		clientID, clientSecret = r.PostForm.Get("client_id"), r.PostForm.Get("client_secret")
	}
	authorization, exists := m.codes[r.PostForm.Get("code")]
	valid := exists && clientID == testClientID && clientSecret == testClientSecret &&
		authorization.Get("client_id") == clientID && authorization.Get("redirect_uri") == r.PostForm.Get("redirect_uri")
	if authorization.Get("code_challenge") != "" {
		digest := sha256.Sum256([]byte(r.PostForm.Get("code_verifier")))
		valid = valid && authorization.Get("code_challenge_method") == "S256" &&
			validVerifier(r.PostForm.Get("code_verifier")) &&
			base64.RawURLEncoding.EncodeToString(digest[:]) == authorization.Get("code_challenge")
	} else {
		valid = valid && !m.requirePKCE && r.PostForm.Get("code_verifier") == ""
	}
	w.Header().Set("Content-Type", "application/json")
	if !valid || m.failExchange {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"invalid_grant"}`))
		return
	}
	delete(m.codes, r.PostForm.Get("code"))
	idToken := m.signPayload(fmt.Sprintf(`{"sub":"testuser","exp":%d}`, time.Now().Add(5*time.Minute).Unix()))
	if m.invalidIDToken {
		idToken = "invalid-id-token"
	}
	json.NewEncoder(w).Encode(map[string]interface{}{
		"access_token": "flow-access-token", "token_type": "Bearer", "expires_in": 300,
		"refresh_token": testValidRefreshToken,
		"id_token":      idToken,
	})
}

func newFlowAuthenticator(t *testing.T, provider *mockOIDCProvider) *OAuth2Authenticator {
	t.Helper()
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)
	authenticator, err := NewOAuth2Authenticator(ctx, &Config{
		AuthSource: AuthSourceOIDC, IssuerURL: provider.issuer, ClientID: testClientID, ClientSecret: testClientSecret,
		RedirectURL: "https://console.example.test/prefix/auth/callback", SuccessURL: "/", ErrorURL: "/error",
		Scope: []string{"openid"}, SecureCookies: true, CookiePath: "/prefix/api",
		CookieAuthenticationKey: []byte(strings.Repeat("a", 64)), CookieEncryptionKey: []byte(strings.Repeat("e", 32)),
		AllowedRedirectHosts: map[string]bool{"console.example.test": true, "alternate.example.test:8443": true},
		Metrics:              auth.NewMetrics(defaultRestClientConfig),
	})
	require.NoError(t, err)
	return authenticator
}

type pendingOIDCFlow struct {
	authorization *url.URL
	callback      *url.URL
	cookie        *http.Cookie
}

func beginOIDCFlow(t *testing.T, authenticator *OAuth2Authenticator, provider *mockOIDCProvider, loginURL string) pendingOIDCFlow {
	t.Helper()
	response := httptest.NewRecorder()
	authenticator.LoginFunc(response, httptest.NewRequest(http.MethodGet, loginURL, nil))
	require.Equal(t, http.StatusSeeOther, response.Code)
	authorization, err := url.Parse(response.Header().Get("Location"))
	require.NoError(t, err)
	cookies := response.Result().Cookies()
	require.Len(t, cookies, 1)
	issuerResponse := httptest.NewRecorder()
	provider.authorizeCode(issuerResponse, httptest.NewRequest(http.MethodGet, authorization.String(), nil))
	callback, err := url.Parse(issuerResponse.Header().Get("Location"))
	require.NoError(t, err)
	return pendingOIDCFlow{authorization: authorization, callback: callback, cookie: cookies[0]}
}

func finishOIDCFlow(authenticator *OAuth2Authenticator, flow pendingOIDCFlow) (*httptest.ResponseRecorder, bool) {
	request := httptest.NewRequest(http.MethodGet, flow.callback.String(), nil)
	if flow.cookie != nil {
		request.AddCookie(flow.cookie)
	}
	response := httptest.NewRecorder()
	success := false
	authenticator.CallbackFunc(func(login sessions.LoginJSON, _ string, _ http.ResponseWriter) {
		success = login.UserID == "testuser"
	})(response, request)
	return response, success
}

func TestDiscoveryPKCEMode(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		name, metadata, mode string
		invalid              bool
	}{
		{"absent", "", pkceNone, false}, {"empty", "[]", pkceNone, false},
		{"plain", `["plain"]`, pkceNone, false}, {"unknown", `["other","s256"]`, pkceNone, false},
		{"S256", `["S256"]`, pkceS256, false}, {"both", `["plain","S256","S256"]`, pkceS256, false},
		{"null", `null`, "", true}, {"scalar", `"S256"`, "", true},
		{"object", `{}`, "", true}, {"number", `1`, "", true},
		{"mixed", `["S256",1]`, "", true}, {"null member", `["S256",null]`, "", true},
		{"bad json", `[`, "", true},
	} {
		t.Run(test.name, func(t *testing.T) {
			mode, err := discoveryPKCEMode(json.RawMessage(test.metadata))
			require.Equal(t, test.invalid, err != nil)
			require.Equal(t, test.mode, mode)
		})
	}
}

func TestTransactionCookie(t *testing.T) {
	for _, test := range []struct {
		name, redirect, cookiePath string
		invalid                    bool
	}{
		{"root", "https://console.example.test/callback", "/", false},
		{"prefix", "https://console.example.test/prefix/auth/callback", "/prefix/auth/", false},
		{"escaped prefix", "https://console.example.test/prefix%20path/auth/callback", "/prefix%20path/auth/", false},
		{"bad escape", "https://console.example.test/%zz", "", true},
		{"bad host", "https://[", "", true},
		{"control character", "https://console.example.test/\ncallback", "", true},
	} {
		t.Run(test.name, func(t *testing.T) {
			for _, secure := range []bool{false, true} {
				var cookie *http.Cookie
				var err error
				require.NotPanics(t, func() { cookie, err = transactionCookie("test-transaction", test.redirect, secure) })
				if test.invalid {
					require.EqualError(t, err, "invalid OIDC callback URL")
					require.Nil(t, cookie)
					continue
				}
				require.NoError(t, err)
				require.Equal(t, &http.Cookie{Name: "test-transaction", Path: test.cookiePath,
					HttpOnly: true, Secure: secure, SameSite: http.SameSiteLaxMode}, cookie)
			}
		})
	}
}

func TestValidLoginState(t *testing.T) {
	for _, test := range []struct {
		name, state string
		valid       bool
	}{
		{"valid", strings.Repeat("ab", 16), true},
		{"empty", "", false},
		{"short", strings.Repeat("a", 31), false},
		{"long", strings.Repeat("a", 34), false},
		{"uppercase", strings.Repeat("AB", 16), false},
		{"nonhex", strings.Repeat("g", 32), false},
	} {
		t.Run(test.name, func(t *testing.T) {
			require.Equal(t, test.valid, validLoginState(test.state))
		})
	}
}

func TestOIDCMalformedRedirectFailsClosed(t *testing.T) {
	provider, _, closeProvider := startMockProvider(t)
	defer closeProvider()
	authenticator := newFlowAuthenticator(t, provider)
	flow := beginOIDCFlow(t, authenticator, provider, "https://console.example.test/")
	authenticator.redirectURL = "https://console.example.test/%zz"
	authenticator.allowedRedirectHosts = nil
	loginResponse := httptest.NewRecorder()
	require.NotPanics(t, func() {
		authenticator.LoginFunc(loginResponse, httptest.NewRequest(http.MethodGet, "https://console.example.test/", nil))
	})
	require.Equal(t, http.StatusSeeOther, loginResponse.Code)
	require.Equal(t, "/error?error="+errorInternal+"&error_type=auth", loginResponse.Header().Get("Location"))
	require.Empty(t, loginResponse.Result().Cookies())
	var callbackResponse *httptest.ResponseRecorder
	var success bool
	require.NotPanics(t, func() { callbackResponse, success = finishOIDCFlow(authenticator, flow) })
	require.False(t, success)
	require.Equal(t, http.StatusSeeOther, callbackResponse.Code)
	require.Equal(t, "/error?error="+errorInvalidState+"&error_type=auth", callbackResponse.Header().Get("Location"))
	require.Empty(t, callbackResponse.Result().Cookies())
	provider.flowLock.Lock()
	defer provider.flowLock.Unlock()
	require.Empty(t, provider.exchanges)
}

func TestOIDCDiscoveryErrorsAreSanitized(t *testing.T) {
	for _, test := range []struct {
		name, body, message string
		status              int
	}{
		{"response body", "provider-sensitive-test-marker", "OIDC discovery failed", http.StatusServiceUnavailable},
		{"issuer mismatch", `{"issuer":"provider-sensitive-test-marker"}`, "OIDC discovery failed", http.StatusOK},
	} {
		t.Run(test.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(test.status)
				fmt.Fprint(w, test.body)
			}))
			defer server.Close()
			_, err := discoverOIDCProvider(context.Background(), &oidcConfig{
				issuerURL: server.URL, getClient: server.Client,
			})
			require.EqualError(t, err, test.message)
			require.NotContains(t, err.Error(), "provider-sensitive-test-marker")
			require.NotContains(t, err.Error(), server.URL)
		})
	}
}

func TestOIDCLoginModeMatrix(t *testing.T) {
	for _, test := range []struct {
		name, metadata          string
		required, pkce, success bool
	}{
		{"required", `["S256"]`, true, true, true},
		{"optional", `["S256"]`, false, true, true},
		{"both", `["plain","S256"]`, true, true, true},
		{"absent", "", false, false, true},
		{"empty", `[]`, false, false, true},
		{"plain", `["plain"]`, false, false, true},
		{"required unadvertised", "", true, false, false},
		{"required plain", `["plain"]`, true, false, false},
	} {
		t.Run(test.name, func(t *testing.T) {
			provider, _, closeProvider := startMockProvider(t)
			defer closeProvider()
			provider.methods, provider.requirePKCE = json.RawMessage(test.metadata), test.required
			authenticator := newFlowAuthenticator(t, provider)
			flow := beginOIDCFlow(t, authenticator, provider, "https://console.example.test/")
			require.Equal(t, test.pkce, flow.authorization.Query().Get("code_challenge") != "")
			require.Empty(t, flow.authorization.Query().Get("code_verifier"))
			if test.pkce {
				require.Equal(t, "S256", flow.authorization.Query().Get("code_challenge_method"))
			} else {
				require.Empty(t, flow.authorization.Query().Get("code_challenge_method"))
			}
			require.True(t, strings.HasPrefix(flow.cookie.Name, loginTransactionPrefix))
			require.Equal(t, "/prefix/auth/", flow.cookie.Path)
			require.Equal(t, http.SameSiteLaxMode, flow.cookie.SameSite)
			require.True(t, flow.cookie.HttpOnly && flow.cookie.Secure)
			require.Empty(t, flow.cookie.Domain)
			require.Equal(t, 300, flow.cookie.MaxAge)
			require.Less(t, len(flow.cookie.Value), loginTransactionLimit)
			require.NotContains(t, flow.cookie.Value, flow.authorization.Query().Get("state"))
			response, success := finishOIDCFlow(authenticator, flow)
			require.Equal(t, test.success, success)
			var deleted bool
			for _, cookie := range response.Result().Cookies() {
				if cookie.Name == flow.cookie.Name {
					deleted = cookie.MaxAge < 0 && cookie.Path == flow.cookie.Path
				}
			}
			require.True(t, deleted)
			provider.flowLock.Lock()
			if test.success {
				require.Len(t, provider.exchanges, 1)
				require.Equal(t, test.pkce, provider.exchanges[0].Get("code_verifier") != "")
			} else {
				require.Empty(t, provider.exchanges)
			}
			provider.flowLock.Unlock()
		})
	}
}

func decodeFlow(t *testing.T, authenticator *OAuth2Authenticator, flow pendingOIDCFlow) loginTransaction {
	t.Helper()
	var transaction loginTransaction
	require.NoError(t, securecookie.DecodeMulti(flow.cookie.Name, flow.cookie.Value, &transaction, authenticator.oidcTransactions.codecs...))
	return transaction
}

func replaceFlowTransaction(t *testing.T, authenticator *OAuth2Authenticator, flow pendingOIDCFlow, transaction loginTransaction) pendingOIDCFlow {
	t.Helper()
	encoded, err := authenticator.oidcTransactions.codecs[0].Encode(flow.cookie.Name, transaction)
	require.NoError(t, err)
	cookie := *flow.cookie
	cookie.Value = encoded
	flow.cookie = &cookie
	return flow
}

func TestOIDCInvalidTransactionsNeverExchange(t *testing.T) {
	provider, _, closeProvider := startMockProvider(t)
	defer closeProvider()
	provider.methods = json.RawMessage(`["S256"]`)
	authenticator := newFlowAuthenticator(t, provider)
	for _, test := range []struct {
		name   string
		mutate func(*loginTransaction)
	}{
		{"state", func(record *loginTransaction) { record.State = strings.Repeat("0", 32) }},
		{"state short", func(record *loginTransaction) { record.State = strings.Repeat("a", 31) }},
		{"state uppercase", func(record *loginTransaction) { record.State = strings.Repeat("AB", 16) }},
		{"state nonhex", func(record *loginTransaction) { record.State = strings.Repeat("g", 32) }},
		{"version", func(record *loginTransaction) { record.Version++ }},
		{"mode", func(record *loginTransaction) { record.Mode = "plain" }},
		{"verifier missing", func(record *loginTransaction) { record.Verifier = "" }},
		{"verifier invalid", func(record *loginTransaction) { record.Verifier = strings.Repeat("!", 43) }},
		{"none verifier", func(record *loginTransaction) { record.Mode = pkceNone }},
		{"issuer", func(record *loginTransaction) { record.Issuer += "/other" }},
		{"client", func(record *loginTransaction) { record.ClientID = "other" }},
		{"redirect", func(record *loginTransaction) { record.RedirectURI += "/other" }},
		{"future", func(record *loginTransaction) { record.IssuedAt += 10; record.ExpiresAt += 10 }},
		{"expired", func(record *loginTransaction) { record.IssuedAt -= 300; record.ExpiresAt -= 300 }},
		{"lifetime", func(record *loginTransaction) { record.ExpiresAt++ }},
	} {
		t.Run(test.name, func(t *testing.T) {
			flow := beginOIDCFlow(t, authenticator, provider, "https://console.example.test/")
			record := decodeFlow(t, authenticator, flow)
			test.mutate(&record)
			_, success := finishOIDCFlow(authenticator, replaceFlowTransaction(t, authenticator, flow, record))
			require.False(t, success)
		})
	}
	for _, mode := range []string{`["S256"]`, `[]`} {
		provider.flowLock.Lock()
		provider.methods = json.RawMessage(mode)
		provider.flowLock.Unlock()
		authenticator = newFlowAuthenticator(t, provider)
		for _, test := range []string{"missing", "tamper", "oversize", "duplicate", "duplicate state", "malformed state", "legacy", "host", "no code", "duplicate code", "denied"} {
			t.Run(mode+test, func(t *testing.T) {
				flow := beginOIDCFlow(t, authenticator, provider, "https://console.example.test/")
				request := httptest.NewRequest(http.MethodGet, flow.callback.String(), nil)
				cookie := *flow.cookie
				switch test {
				case "missing":
				case "legacy":
					cookie.Name, cookie.Value = stateCookieName, flow.callback.Query().Get("state")
				case "tamper":
					cookie.Value = "x" + cookie.Value[1:]
				case "oversize":
					cookie.Value = strings.Repeat("x", loginTransactionLimit+1)
				case "duplicate":
					request.AddCookie(&cookie)
				case "duplicate state":
					request.URL.RawQuery += "&state=" + flow.callback.Query().Get("state")
				case "malformed state":
					request.URL.RawQuery = "state=bad&code=unused"
				case "host":
					request.Host = "alternate.example.test:8443"
				case "no code":
					request.URL.RawQuery = "state=" + flow.callback.Query().Get("state")
				case "duplicate code":
					request.URL.RawQuery += "&code=other"
				case "denied":
					request.URL.RawQuery += "&error=access_denied"
				}
				if test != "missing" {
					request.AddCookie(&cookie)
				}
				success := false
				authenticator.CallbackFunc(func(sessions.LoginJSON, string, http.ResponseWriter) { success = true })(httptest.NewRecorder(), request)
				require.False(t, success)
			})
		}
	}
	provider.flowLock.Lock()
	defer provider.flowLock.Unlock()
	require.Empty(t, provider.exchanges)
}

func TestOIDCTabsHostsAndReplay(t *testing.T) {
	provider, _, closeProvider := startMockProvider(t)
	defer closeProvider()
	provider.methods = json.RawMessage(`["S256"]`)
	authenticator := newFlowAuthenticator(t, provider)
	for _, host := range []string{"console.example.test", "alternate.example.test:8443"} {
		first := beginOIDCFlow(t, authenticator, provider, "https://"+host+"/")
		second := beginOIDCFlow(t, authenticator, provider, "https://"+host+"/")
		require.NotEqual(t, first.cookie.Name, second.cookie.Name)
		firstRecord, secondRecord := decodeFlow(t, authenticator, first), decodeFlow(t, authenticator, second)
		require.True(t, firstRecord.Verifier != secondRecord.Verifier && firstRecord.Verifier != firstRecord.State)
		require.Equal(t, "https://"+host+"/prefix/auth/callback", firstRecord.RedirectURI)
		_, success := finishOIDCFlow(authenticator, second)
		require.True(t, success)
		_, success = finishOIDCFlow(authenticator, first)
		require.True(t, success)
		_, success = finishOIDCFlow(authenticator, first)
		require.False(t, success)
	}
	first := beginOIDCFlow(t, authenticator, provider, "https://console.example.test/")
	second := beginOIDCFlow(t, authenticator, provider, "https://console.example.test/")
	query := first.callback.Query()
	query.Set("code", second.callback.Query().Get("code"))
	first.callback.RawQuery = query.Encode()
	_, success := finishOIDCFlow(authenticator, first)
	require.False(t, success)
	_, success = finishOIDCFlow(authenticator, second)
	require.True(t, success)
	flow := beginOIDCFlow(t, authenticator, provider, "https://console.example.test/")
	var wait sync.WaitGroup
	results := make(chan bool, 2)
	for attempt := 0; attempt < 2; attempt++ {
		wait.Add(1)
		go func() { defer wait.Done(); _, success := finishOIDCFlow(authenticator, flow); results <- success }()
	}
	wait.Wait()
	close(results)
	successes := 0
	for success := range results {
		if success {
			successes++
		}
	}
	require.Equal(t, 1, successes)
}

func TestOIDCExpiryAndRotation(t *testing.T) {
	provider, _, closeProvider := startMockProvider(t)
	defer closeProvider()
	provider.methods = json.RawMessage(`["S256"]`)
	first := newFlowAuthenticator(t, provider)
	second := newFlowAuthenticator(t, provider)
	for _, offset := range []int64{299, 300, 301} {
		flow := beginOIDCFlow(t, first, provider, "https://console.example.test/")
		record := decodeFlow(t, first, flow)
		second.oidcTransactions.now = func() time.Time { return time.Unix(record.IssuedAt+offset, 0) }
		_, success := finishOIDCFlow(second, flow)
		require.Equal(t, offset < 300, success)
	}
	second.oidcTransactions.now = time.Now
	oldFlow := beginOIDCFlow(t, first, provider, "https://console.example.test/")
	rotated, err := newLoginTransactions(&oidcConfig{
		cookieAuthenticationKey: []byte(strings.Repeat("b", 64)), cookieEncryptionKey: []byte(strings.Repeat("f", 32)),
		previousCookieAuthenticationKey: []byte(strings.Repeat("a", 64)), previousCookieEncryptionKey: []byte(strings.Repeat("e", 32)),
	})
	require.NoError(t, err)
	second.oidcTransactions = rotated
	_, success := finishOIDCFlow(second, oldFlow)
	require.True(t, success)
	newFlow := beginOIDCFlow(t, second, provider, "https://console.example.test/")
	_, success = finishOIDCFlow(first, newFlow)
	require.False(t, success)
	legacy := *newFlow.cookie
	legacy.Name = stateCookieName + "-" + newFlow.callback.Query().Get("state")[:8]
	legacy.Value = newFlow.callback.Query().Get("state")
	newFlow.cookie = &legacy
	_, success = finishOIDCFlow(second, newFlow)
	require.False(t, success)
	_, err = newLoginTransactions(&oidcConfig{cookieAuthenticationKey: []byte("key"), cookieEncryptionKey: []byte("invalid")})
	require.Error(t, err)
}

func TestOIDCDiscoverySnapshotAndPinning(t *testing.T) {
	provider, _, closeProvider := startMockProvider(t)
	defer closeProvider()
	for _, initial := range []string{`["S256"]`, `[]`} {
		provider.flowLock.Lock()
		provider.methods = json.RawMessage(initial)
		provider.flowLock.Unlock()
		authenticator := newFlowAuthenticator(t, provider)
		method := authenticator.loginMethod.(*oidcAuth)
		flow := beginOIDCFlow(t, authenticator, provider, "https://console.example.test/")
		ctx, cancel := context.WithCancel(context.Background())
		cache, err := asynccache.NewAsyncCache(ctx, 5*time.Millisecond, func(ctx context.Context) (*oidcProviderSnapshot, error) {
			return discoverOIDCProvider(ctx, method.oidcConfig)
		})
		require.NoError(t, err)
		method.providerCache = cache
		provider.flowLock.Lock()
		if initial == `[]` {
			provider.methods = json.RawMessage(`["S256"]`)
		} else {
			provider.methods = json.RawMessage(`[]`)
		}
		provider.flowLock.Unlock()
		cache.Run(ctx)
		require.Eventually(t, func() bool { return cache.GetItem().mode != decodeFlow(t, authenticator, flow).Mode }, time.Second, time.Millisecond)
		_, success := finishOIDCFlow(authenticator, flow)
		require.True(t, success)
		fresh := beginOIDCFlow(t, authenticator, provider, "https://console.example.test/")
		freshMode := decodeFlow(t, authenticator, fresh).Mode
		require.Equal(t, cache.GetItem().mode, freshMode)
		require.Equal(t, freshMode == pkceS256, fresh.authorization.Query().Get("code_challenge") != "")
		if freshMode == pkceS256 {
			require.Equal(t, "S256", fresh.authorization.Query().Get("code_challenge_method"))
		} else {
			require.Empty(t, fresh.authorization.Query().Get("code_challenge_method"))
		}
		lastMode := cache.GetItem().mode
		for _, status := range []int{http.StatusServiceUnavailable, 0} {
			provider.flowLock.Lock()
			provider.discoveryStatus = status
			provider.methods = json.RawMessage(`null`)
			requests := provider.discoveryRequests
			provider.flowLock.Unlock()
			require.Eventually(t, func() bool {
				provider.flowLock.Lock()
				defer provider.flowLock.Unlock()
				return provider.discoveryRequests > requests+1
			}, time.Second, time.Millisecond)
			require.Equal(t, lastMode, cache.GetItem().mode)
			require.Equal(t, provider.issuer+"/token", cache.GetItem().provider.Endpoint().TokenURL)
			_, err = discoverOIDCProvider(ctx, method.oidcConfig)
			require.Error(t, err)
		}
		cancel()
		provider.flowLock.Lock()
		provider.discoveryStatus = 0
		provider.flowLock.Unlock()
	}
}

func TestOIDCExchangeFailureNeverDowngrades(t *testing.T) {
	provider, _, closeProvider := startMockProvider(t)
	defer closeProvider()
	provider.methods, provider.failExchange = json.RawMessage(`["S256"]`), true
	authenticator := newFlowAuthenticator(t, provider)
	flow := beginOIDCFlow(t, authenticator, provider, "https://console.example.test/")
	_, success := finishOIDCFlow(authenticator, flow)
	require.False(t, success)
	record := decodeFlow(t, authenticator, flow)
	provider.flowLock.Lock()
	defer provider.flowLock.Unlock()
	require.NotEmpty(t, provider.exchanges)
	for _, exchange := range provider.exchanges {
		require.True(t, exchange.Get("code_verifier") == record.Verifier)
	}
}

func TestOIDCNoneModeTabIsolation(t *testing.T) {
	provider, _, closeProvider := startMockProvider(t)
	defer closeProvider()
	authenticator := newFlowAuthenticator(t, provider)
	first := beginOIDCFlow(t, authenticator, provider, "https://console.example.test/")
	second := beginOIDCFlow(t, authenticator, provider, "https://console.example.test/")
	require.NotEqual(t, first.cookie.Name, second.cookie.Name)
	wrongCookie := second
	wrongCookie.cookie = first.cookie
	_, success := finishOIDCFlow(authenticator, wrongCookie)
	require.False(t, success)
	_, success = finishOIDCFlow(authenticator, second)
	require.True(t, success)
	_, success = finishOIDCFlow(authenticator, first)
	require.True(t, success)
}

func TestOIDCColdDiscoveryFailure(t *testing.T) {
	provider, _, closeProvider := startMockProvider(t)
	defer closeProvider()
	for _, status := range []int{http.StatusServiceUnavailable, 0} {
		provider.flowLock.Lock()
		provider.discoveryStatus, provider.methods = status, json.RawMessage(`null`)
		provider.flowLock.Unlock()
		ctx, cancel := context.WithTimeout(context.Background(), 40*time.Millisecond)
		_, err := newOIDCAuth(ctx, nil, &oidcConfig{issuerURL: provider.issuer, getClient: func() *http.Client { return http.DefaultClient }}, nil)
		cancel()
		require.Error(t, err)
	}
}

func TestOIDCMockRejectsInvalidExchange(t *testing.T) {
	provider, _, closeProvider := startMockProvider(t)
	defer closeProvider()
	provider.methods = json.RawMessage(`["S256"]`)
	authenticator := newFlowAuthenticator(t, provider)
	for _, mutation := range []string{"missing verifier", "wrong verifier", "wrong redirect", "wrong client"} {
		t.Run(mutation, func(t *testing.T) {
			flow := beginOIDCFlow(t, authenticator, provider, "https://console.example.test/")
			record := decodeFlow(t, authenticator, flow)
			form := url.Values{"grant_type": {"authorization_code"}, "code": {flow.callback.Query().Get("code")},
				"redirect_uri": {record.RedirectURI}, "code_verifier": {record.Verifier}}
			clientID := testClientID
			switch mutation {
			case "missing verifier":
				form.Del("code_verifier")
			case "wrong verifier":
				form.Set("code_verifier", oauth2.GenerateVerifier())
			case "wrong redirect":
				form.Set("redirect_uri", "https://other.example.test/auth/callback")
			case "wrong client":
				clientID = "other"
			}
			request := httptest.NewRequest(http.MethodPost, provider.issuer+"/token", strings.NewReader(form.Encode()))
			request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
			request.SetBasicAuth(clientID, testClientSecret)
			response := httptest.NewRecorder()
			provider.handleToken(response, request)
			require.Equal(t, http.StatusBadRequest, response.Code)
		})
	}
}

func TestOIDCEncodingFailureAndCallbackContext(t *testing.T) {
	provider, _, closeProvider := startMockProvider(t)
	defer closeProvider()
	authenticator := newFlowAuthenticator(t, provider)
	for _, mutation := range []string{"path", "unapproved host", "post", "cookie name", "cookie truncated"} {
		flow := beginOIDCFlow(t, authenticator, provider, "https://console.example.test/")
		request := httptest.NewRequest(http.MethodGet, flow.callback.String(), nil)
		cookie := *flow.cookie
		switch mutation {
		case "path":
			request.URL.Path += "/other"
		case "unapproved host":
			request.Host = "unapproved.example.test"
		case "post":
			request.Method = http.MethodPost
		case "cookie name":
			cookie.Name += "other"
		case "cookie truncated":
			cookie.Value = cookie.Value[:len(cookie.Value)/2]
		}
		request.AddCookie(&cookie)
		success := false
		authenticator.CallbackFunc(func(sessions.LoginJSON, string, http.ResponseWriter) { success = true })(httptest.NewRecorder(), request)
		require.False(t, success)
	}
	authenticator.oidcTransactions.codecs = []securecookie.Codec{securecookie.New(nil, nil)}
	response := httptest.NewRecorder()
	authenticator.LoginFunc(response, httptest.NewRequest(http.MethodGet, "https://console.example.test/", nil))
	require.Empty(t, response.Result().Cookies())
	require.True(t, strings.HasPrefix(response.Header().Get("Location"), "/error?"))
	provider.flowLock.Lock()
	defer provider.flowLock.Unlock()
	require.Empty(t, provider.exchanges)
}

func TestIntegratedOpenShiftRemainsNonPKCE(t *testing.T) {
	for _, configuredKeys := range []bool{false, true} {
		t.Run(fmt.Sprint(configuredKeys), func(t *testing.T) {
			var issuer string
			var exchange url.Values
			var exchangeLock sync.Mutex
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				switch r.URL.Path {
				case "/.well-known/oauth-authorization-server":
					json.NewEncoder(w).Encode(map[string]interface{}{"issuer": issuer, "authorization_endpoint": issuer + "/auth", "token_endpoint": issuer + "/token", "code_challenge_methods_supported": []string{"S256"}})
				case "/token":
					require.NoError(t, r.ParseForm())
					exchangeLock.Lock()
					exchange = r.PostForm
					exchangeLock.Unlock()
					w.Write([]byte(`{"access_token":"integrated-test-token","token_type":"Bearer","expires_in":300}`))
				}
			}))
			defer server.Close()
			issuer = server.URL
			config := &Config{AuthSource: AuthSourceOpenShift, IssuerURL: issuer, ClientID: testClientID, ClientSecret: testClientSecret,
				RedirectURL: "https://console.example.test/auth/callback", ErrorURL: "/error", CookiePath: "/api"}
			if configuredKeys {
				config.CookieAuthenticationKey = []byte(strings.Repeat("a", 64))
				config.CookieEncryptionKey = []byte(strings.Repeat("e", 32))
			}
			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()
			authenticator, err := NewOAuth2Authenticator(ctx, config)
			require.NoError(t, err)
			require.Nil(t, authenticator.oidcTransactions)
			for _, legacy := range []bool{false, true} {
				response := httptest.NewRecorder()
				authenticator.LoginFunc(response, httptest.NewRequest(http.MethodGet, "https://console.example.test/", nil))
				authorization, err := url.Parse(response.Header().Get("Location"))
				require.NoError(t, err)
				require.Empty(t, authorization.Query().Get("code_challenge"))
				require.Empty(t, authorization.Query().Get("code_challenge_method"))
				cookie := response.Result().Cookies()[0]
				require.Equal(t, "/auth", cookie.Path)
				require.Zero(t, cookie.SameSite)
				if legacy {
					cookie.Name = stateCookieName
				}
				callback := httptest.NewRequest(http.MethodGet, "https://console.example.test/auth/callback?code=synthetic&state="+authorization.Query().Get("state"), nil)
				callback.AddCookie(cookie)
				success := false
				authenticator.CallbackFunc(func(sessions.LoginJSON, string, http.ResponseWriter) { success = true })(httptest.NewRecorder(), callback)
				require.True(t, success)
				exchangeLock.Lock()
				require.Empty(t, exchange.Get("code_verifier"))
				exchangeLock.Unlock()
			}
		})
	}
}

func TestOIDCRefreshLogoutAndOldCallback(t *testing.T) {
	for _, methods := range []string{`["S256"]`, `[]`} {
		t.Run(methods, func(t *testing.T) {
			provider, _, closeProvider := startMockProvider(t)
			defer closeProvider()
			provider.methods = json.RawMessage(methods)
			authenticator := newFlowAuthenticator(t, provider)
			flow := beginOIDCFlow(t, authenticator, provider, "https://console.example.test/")
			response, success := finishOIDCFlow(authenticator, flow)
			require.True(t, success)
			request := httptest.NewRequest(http.MethodGet, "https://console.example.test/prefix/api/", nil)
			for _, cookie := range response.Result().Cookies() {
				if cookie.MaxAge >= 0 {
					request.AddCookie(cookie)
				}
			}
			method := authenticator.loginMethod.(*oidcAuth)
			_, err := method.refreshSession(context.Background(), httptest.NewRecorder(), request, method.oauth2Config(), testValidRefreshToken)
			require.NoError(t, err)
			provider.flowLock.Lock()
			require.Len(t, provider.refreshRequests, 1)
			require.Empty(t, provider.refreshRequests[0].Get("code_verifier"))
			require.Empty(t, provider.refreshRequests[0].Get("code_challenge"))
			provider.flowLock.Unlock()
			logout := httptest.NewRecorder()
			authenticator.LogoutFunc(logout, request)
			require.NotEmpty(t, logout.Result().Cookies())
			for _, cookie := range logout.Result().Cookies() {
				require.NotContains(t, cookie.Name, loginTransactionPrefix)
			}
			pending := beginOIDCFlow(t, authenticator, provider, "https://console.example.test/")
			authenticator.oidcTransactions = nil
			_, success = finishOIDCFlow(authenticator, pending)
			require.False(t, success)
		})
	}
}

func TestOIDCCallbackPrivacyAndSessionFailure(t *testing.T) {
	provider, _, closeProvider := startMockProvider(t)
	defer closeProvider()
	provider.methods = json.RawMessage(`["S256"]`)
	authenticator := newFlowAuthenticator(t, provider)
	logState := klog.CaptureState()
	defer logState.Restore()
	var logs bytes.Buffer
	klog.LogToStderr(false)
	klog.SetOutput(&logs)
	for _, failure := range []string{"none", "token", "id token"} {
		flow := beginOIDCFlow(t, authenticator, provider, "https://console.example.test/")
		record := decodeFlow(t, authenticator, flow)
		provider.flowLock.Lock()
		provider.failExchange, provider.invalidIDToken = failure == "token", failure == "id token"
		provider.flowLock.Unlock()
		response, success := finishOIDCFlow(authenticator, flow)
		require.Equal(t, failure == "none", success)
		if failure != "none" {
			require.Contains(t, response.Header().Get("Location"), "error_type=auth")
			if failure == "id token" {
				require.Contains(t, response.Header().Get("Location"), "error=internal_error")
			}
		}
		deleted := false
		for _, cookie := range response.Result().Cookies() {
			if cookie.Name == flow.cookie.Name {
				deleted = cookie.MaxAge < 0
				continue
			}
			var sessionData map[interface{}]interface{}
			require.NoError(t, securecookie.DecodeMulti(cookie.Name, cookie.Value, &sessionData, authenticator.loginMethod.(*oidcAuth).sessionsCodecsForTest()...))
			for _, value := range sessionData {
				require.False(t, value == record.Verifier || value == record.State)
			}
		}
		require.True(t, deleted)
		klog.Flush()
		require.False(t, strings.Contains(logs.String(), record.Verifier) || strings.Contains(logs.String(), record.State))
		require.False(t, strings.Contains(response.Body.String(), record.Verifier))
	}
	require.Contains(t, logs.String(), "OIDC code exchange failed")
	require.Contains(t, logs.String(), "OIDC session construction failed")
}

func (method *oidcAuth) sessionsCodecsForTest() []securecookie.Codec {
	return securecookie.CodecsFromPairs(method.cookieAuthenticationKey, method.cookieEncryptionKey)
}

func TestOIDCRejectsInvalidCallbackConfiguration(t *testing.T) {
	for _, callback := range []string{"%", "/auth/callback", "file:///auth/callback", "https:///auth/callback"} {
		_, err := NewOAuth2Authenticator(context.Background(), &Config{AuthSource: AuthSourceOIDC, RedirectURL: callback})
		require.Error(t, err)
		require.Equal(t, "invalid OIDC callback URI", err.Error())
	}
}
