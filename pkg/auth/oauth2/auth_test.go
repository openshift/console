package oauth2

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"k8s.io/client-go/rest"
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
		SecureCookies: true,
		K8sConfig:     &rest.Config{},
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	a, err := NewOAuth2Authenticator(ctx, ccfg)
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
		SecureCookies: true,
		K8sConfig:     &rest.Config{},
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	a, err := NewOAuth2Authenticator(ctx, ccfg)
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

	cfg := &Config{
		ClientID:      "fake-client-id",
		ClientSecret:  "fake-secret",
		RedirectURL:   "http://example.com/callback",
		IssuerURL:     "http://auth.example.com",
		ErrorURL:      errURL,
		SuccessURL:    sucURL,
		CookiePath:    "/",
		SecureCookies: true,
		K8sConfig:     &rest.Config{},
	}

	ccfg, err := cfg.Complete()
	if err != nil {
		t.Fatalf("failed to complete config: %v", err)
	}

	a := newUnstartedAuthenticator(ccfg)
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

func makeAuthenticator() (*OAuth2Authenticator, error) {
	errURL := "https://example.com/error"
	sucURL := "https://example.com/success"

	cfg := &Config{
		ClientID:      "fake-client-id",
		ClientSecret:  "fake-secret",
		RedirectURL:   "http://example.com/callback",
		IssuerURL:     "http://auth.example.com",
		ErrorURL:      errURL,
		SuccessURL:    sucURL,
		SecureCookies: true,
	}

	ccfg, err := cfg.Complete()
	if err != nil {
		return nil, err
	}

	return newUnstartedAuthenticator(ccfg), nil
}
