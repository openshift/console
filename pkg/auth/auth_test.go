package auth

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
)

// mockOpenShiftProvider is test OpenShift provider that only supports discovery
//
// https://openid.net/specs/openid-connect-discovery-1_0.html
type mockOpenShiftProvider struct {
	issuer string
}

func (m *mockOpenShiftProvider) handleDiscovery(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/.well-known/oauth-authorization-server" {
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{
 "issuer": "%s",
 "authorization_endpoint": "%s/auth",
 "token_endpoint": "%s/token"
}`, m.issuer, m.issuer, m.issuer)
}

// mockOIDICProvider is test provider that only supports discovery
//
// https://openid.net/specs/openid-connect-discovery-1_0.html
type mockOIDCProvider struct {
	issuer string
}

func (m *mockOIDCProvider) handleDiscovery(w http.ResponseWriter, r *http.Request) {
	// https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationRequest
	if r.URL.Path != "/.well-known/openid-configuration" {
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{
 "issuer": "%s",
 "authorization_endpoint": "%s/auth",
 "token_endpoint": "%s/token",
 "jwks_uri": "%s/keys"
}`, m.issuer, m.issuer, m.issuer, m.issuer)
}

func TestNewAuthenticator(t *testing.T) {
	errURL := "http://example.com/error"
	sucURL := "http://example.com/success"

	p := &mockOIDCProvider{}

	s := httptest.NewServer(http.HandlerFunc(p.handleDiscovery))
	defer s.Close()
	p.issuer = s.URL

	ccfg := &Config{
		ClientID:      "fake-client-id",
		ClientSecret:  "fake-secret",
		Scope:         []string{"foo", "bar"},
		RedirectURL:   "http://example.com/callback",
		IssuerURL:     p.issuer,
		ErrorURL:      errURL,
		SuccessURL:    sucURL,
		CookiePath:    "/",
		RefererPath:   "http://auth.example.com/",
		SecureCookies: true,
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	a, err := NewAuthenticator(ctx, ccfg)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "http://example.com/", nil)

	a.LoginFunc(rr, req)

	u, err := url.Parse(rr.HeaderMap.Get("Location"))
	if err != nil {
		t.Fatalf("failed to parse location header: %v", err)
	}

	got := (&url.URL{Scheme: u.Scheme, Host: u.Host, Path: u.Path}).String()
	if got != p.issuer+"/auth" {
		t.Errorf("redirect didn't go to %s/auth, got %s", p.issuer+"/auth", u)
	}
}

func TestNewOpenShiftAuthenticator(t *testing.T) {
	errURL := "http://example.com/error"
	sucURL := "http://example.com/success"

	p := &mockOpenShiftProvider{}

	s := httptest.NewServer(http.HandlerFunc(p.handleDiscovery))
	defer s.Close()
	p.issuer = s.URL

	ccfg := &Config{
		AuthSource:    AuthSourceOpenShift,
		ClientID:      "fake-client-id",
		ClientSecret:  "fake-secret",
		Scope:         []string{"foo", "bar"},
		RedirectURL:   "http://example.com/callback",
		IssuerURL:     p.issuer,
		ErrorURL:      errURL,
		SuccessURL:    sucURL,
		CookiePath:    "/",
		RefererPath:   "http://auth.example.com/",
		SecureCookies: true,
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	a, err := NewAuthenticator(ctx, ccfg)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "http://example.com/", nil)

	a.LoginFunc(rr, req)

	u, err := url.Parse(rr.HeaderMap.Get("Location"))
	if err != nil {
		t.Fatalf("failed to parse location header: %v", err)
	}

	got := (&url.URL{Scheme: u.Scheme, Host: u.Host, Path: u.Path}).String()
	if got != p.issuer+"/auth" {
		t.Errorf("redirect didn't go to %s/auth, got %s", p.issuer+"/auth", u)
	}
}

func TestRedirectAuthError(t *testing.T) {
	errURL := "http://example.com/error"
	sucURL := "http://example.com/success"
	w := httptest.NewRecorder()

	ccfg := &Config{
		ClientID:      "fake-client-id",
		ClientSecret:  "fake-secret",
		RedirectURL:   "http://example.com/callback",
		IssuerURL:     "http://auth.example.com",
		ErrorURL:      errURL,
		SuccessURL:    sucURL,
		CookiePath:    "/",
		RefererPath:   "http://auth.example.com/",
		SecureCookies: true,
	}

	a, err := newUnstartedAuthenticator(ccfg)
	if err != nil {
		t.Fatal("error instantiating test authenticator")
	}

	a.redirectAuthError(w, "fake_error")
	if w.Code != http.StatusSeeOther {
		t.Fatalf("wrong http status, want: %d, got: %d", http.StatusSeeOther, w.Code)
		return
	}

	wantLoc, err := url.Parse(errURL)
	if err != nil {
		t.Fatal("error parsing test URL")
	}
	wantLoc.RawQuery = "error=fake_error&error_type=auth"

	loc := w.Header().Get("Location")
	if loc != wantLoc.String() {
		t.Fatalf("wrong location header, want: %s, got: %s", wantLoc.String(), loc)
	}
}

const validReferer string = "https://example.com/asdf/"

func makeAuthenticator() (*Authenticator, error) {
	errURL := "https://example.com/error"
	sucURL := "https://example.com/success"

	ccfg := &Config{
		ClientID:      "fake-client-id",
		ClientSecret:  "fake-secret",
		RedirectURL:   "http://example.com/callback",
		IssuerURL:     "http://auth.example.com",
		ErrorURL:      errURL,
		SuccessURL:    sucURL,
		CookiePath:    "/",
		RefererPath:   validReferer,
		SecureCookies: true,
	}

	return newUnstartedAuthenticator(ccfg)
}

func testReferer(t *testing.T, referer string, accept bool) {
	a, err := makeAuthenticator()
	if err != nil {
		t.Fatal(err)
		return
	}

	r, err := http.NewRequest("POST", "/some-path", nil)

	if err != nil {
		t.Fatal(err)
		return
	}

	if len(referer) > 0 {
		r.Header.Set("Referer", referer)
	}

	err = a.VerifySourceOrigin(r)

	if err != nil && accept {
		t.Errorf("Unexpected error for referer `%v`:\n%v", referer, err)
		return
	}

	if err == nil && !accept {
		t.Errorf("Unexpected pass for referer: `%v:`\n%v", referer, err)
	}

	if accept {
		t.Logf("referer accepted %v", referer)
	} else {
		t.Logf("referer rejected %v", referer)
	}
}

func TestReferer(t *testing.T) {
	testReferer(t, validReferer, true)
	testReferer(t, validReferer, true)
	testReferer(t, validReferer, true)
	testReferer(t, validReferer+"other/path", true)
	testReferer(t, validReferer+"?a=b&b=c#33", true)
	testReferer(t, "", false)
	testReferer(t, "http://example.com/asdf/", false)
	testReferer(t, "http://example.com:8000/asdf/", false)
	testReferer(t, "https://google.com/asdf/", false)
	testReferer(t, "https://example.com/", false)
	testReferer(t, "https://example.com/asdff/", false)
	testReferer(t, "/asdff/", false)
	testReferer(t, "🍆🍆🍆🍆🍆🍆", false)
	testReferer(t, "https://google.com/asdf/", false)
}

func testCSRF(t *testing.T, token string, cookie string, accept bool) {
	a, err := makeAuthenticator()
	if err != nil {
		t.Fatal(err)
		return
	}

	r, err := http.NewRequest("POST", "/some-path", nil)

	if err != nil {
		t.Fatal(err)
		return
	}

	if len(cookie) > 0 {
		r.Header.Set(CSRFHeader, token)
		r.AddCookie(&http.Cookie{
			Name:     CSRFCookieName,
			Value:    cookie,
			MaxAge:   1000000,
			HttpOnly: true,
			Path:     a.cookiePath,
		})
	}

	err = a.VerifyCSRFToken(r)

	if err != nil && accept {
		t.Errorf("Unexpected error for CSRF `%v//%v`:\n%v", token, cookie, err)
		return
	}

	if err == nil && !accept {
		t.Errorf("Unexpected pass  for CSRF `%v//%v`:\n%v", token, cookie, err)
	}

	if accept {
		t.Logf("CSRF accepted `%v` / `%v`", cookie, token)
	} else {
		t.Logf("CSRF rejected `%v` / `%v`", cookie, token)
	}
}
func TestCSRF(t *testing.T) {
	testCSRF(t, "a", "a", true)
	testCSRF(t, "a", "b", false)
	testCSRF(t, "a", "", false)
	testCSRF(t, "", "b", false)
	testCSRF(t, "", "", false)
}
