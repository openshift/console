package server

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/auth/csrfverifier"
	"github.com/openshift/console/pkg/auth/sessions"
	"github.com/openshift/console/pkg/proxy"
)

// failingAuthenticator always fails Authenticate, simulating an unauthenticated request.
type failingAuthenticator struct{}

func (failingAuthenticator) Authenticate(w http.ResponseWriter, req *http.Request) (*auth.User, error) {
	return nil, fmt.Errorf("no session")
}
func (failingAuthenticator) LoginFunc(w http.ResponseWriter, req *http.Request)  {}
func (failingAuthenticator) LogoutFunc(w http.ResponseWriter, req *http.Request) {}
func (failingAuthenticator) CallbackFunc(fn func(loginInfo sessions.LoginJSON, successURL string, w http.ResponseWriter)) func(w http.ResponseWriter, req *http.Request) {
	return func(w http.ResponseWriter, req *http.Request) {}
}
func (failingAuthenticator) GetOCLoginCommand() string            { return "" }
func (failingAuthenticator) LogoutRedirectURL() string            { return "" }
func (failingAuthenticator) GetSpecialURLs() auth.SpecialAuthURLs { return auth.SpecialAuthURLs{} }
func (failingAuthenticator) IsStatic() bool                       { return false }

// passingAuthenticator always succeeds, simulating an authenticated request.
type passingAuthenticator struct{}

func (passingAuthenticator) Authenticate(w http.ResponseWriter, req *http.Request) (*auth.User, error) {
	return &auth.User{Token: "test-token"}, nil
}
func (passingAuthenticator) LoginFunc(w http.ResponseWriter, req *http.Request)  {}
func (passingAuthenticator) LogoutFunc(w http.ResponseWriter, req *http.Request) {}
func (passingAuthenticator) CallbackFunc(fn func(loginInfo sessions.LoginJSON, successURL string, w http.ResponseWriter)) func(w http.ResponseWriter, req *http.Request) {
	return func(w http.ResponseWriter, req *http.Request) {}
}
func (passingAuthenticator) GetOCLoginCommand() string            { return "" }
func (passingAuthenticator) LogoutRedirectURL() string            { return "" }
func (passingAuthenticator) GetSpecialURLs() auth.SpecialAuthURLs { return auth.SpecialAuthURLs{} }
func (passingAuthenticator) IsStatic() bool                       { return false }

// TestCatalogdHandlerRequiresAuth verifies that the catalogd proxy route rejects
// unauthenticated requests instead of forwarding them to the catalogd service.
// Regression test: the /api/catalogd/ route was previously registered without an
// auth wrapper, allowing anonymous access to the cluster-internal catalogd service.
func TestCatalogdHandlerRequiresAuth(t *testing.T) {
	// Back the proxy with a stub upstream so that, if auth were ever bypassed, the
	// request would reach it and we'd see a 200 instead of the expected 401.
	handler, lastUpstreamReq := buildCatalogdHandler(t, failingAuthenticator{}, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/catalogd/catalogs/foo/all.json", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401 for unauthenticated request, got %d", rec.Code)
	}
	if *lastUpstreamReq != nil {
		t.Error("unauthenticated request was forwarded to the catalogd upstream")
	}
}

// buildCatalogdHandler wires the catalogd route the same way HTTPHandler does:
// AuthMiddleware around a GET/HEAD method restriction around the proxy. It
// returns the handler and a pointer to the last request the upstream received
// (nil until the upstream is hit).
func buildCatalogdHandler(t *testing.T, authenticator auth.Authenticator, headerBlacklist []string) (http.Handler, **http.Request) {
	t.Helper()

	var lastUpstreamReq *http.Request
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		lastUpstreamReq = r
		w.WriteHeader(http.StatusOK)
	}))
	t.Cleanup(upstream.Close)

	upstreamURL, err := url.Parse(upstream.URL)
	if err != nil {
		t.Fatal(err)
	}

	baseURL, _ := url.Parse("https://console.example.com/")
	s := &Server{
		BaseURL:       baseURL,
		Authenticator: authenticator,
		CSRFVerifier:  csrfverifier.NewCSRFVerifier(nil, false),
		CatalogdProxyConfig: &proxy.Config{
			Endpoint:        upstreamURL,
			HeaderBlacklist: headerBlacklist,
		},
	}

	authHandler := func(h http.HandlerFunc) http.HandlerFunc {
		return authMiddleware(s.Authenticator, s.CSRFVerifier, h)
	}
	handler := authHandler(allowMethods(
		[]string{http.MethodGet, http.MethodHead},
		s.CatalogdHandler().ServeHTTP,
	))

	return handler, &lastUpstreamReq
}

// TestCatalogdHandlerAllowsAuthenticatedGET verifies that an authenticated GET
// is forwarded to the catalogd upstream, and that non-GET/HEAD methods are
// rejected before reaching it (OPTIONS via the method restriction, POST via
// CSRF verification).
func TestCatalogdHandlerAllowsAuthenticatedGET(t *testing.T) {
	handler, lastUpstreamReq := buildCatalogdHandler(t, passingAuthenticator{}, nil)

	// Authenticated GET should reach the upstream.
	req := httptest.NewRequest(http.MethodGet, "/api/catalogd/catalogs/foo/all.json", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status 200 for authenticated GET, got %d", rec.Code)
	}
	if *lastUpstreamReq == nil {
		t.Fatal("authenticated GET was not forwarded to the catalogd upstream")
	}

	// A non-GET/HEAD method should be rejected by the method restriction before
	// reaching the upstream. OPTIONS is CSRF-exempt, so it exercises the method
	// check specifically (rather than being short-circuited by CSRF verification,
	// which is what happens to POST/PUT/DELETE without a CSRF token).
	*lastUpstreamReq = nil
	req = httptest.NewRequest(http.MethodOptions, "/api/catalogd/catalogs/foo/all.json", nil)
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected status 405 for OPTIONS, got %d", rec.Code)
	}
	if *lastUpstreamReq != nil {
		t.Error("OPTIONS request was forwarded to the catalogd upstream")
	}

	// A state-changing method (POST) must also never reach the upstream. Without
	// a CSRF token it is rejected at the CSRF layer (403) ahead of the method
	// check; either way it must not be forwarded.
	*lastUpstreamReq = nil
	req = httptest.NewRequest(http.MethodPost, "/api/catalogd/catalogs/foo/all.json", nil)
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code == http.StatusOK {
		t.Errorf("expected POST to be rejected, got %d", rec.Code)
	}
	if *lastUpstreamReq != nil {
		t.Error("POST request was forwarded to the catalogd upstream")
	}
}

// TestCatalogdHandlerStripsSessionHeaders verifies that the session cookie and
// CSRF token are stripped from the request before it is proxied to the
// cluster-internal catalogd service, so they are never disclosed upstream.
func TestCatalogdHandlerStripsSessionHeaders(t *testing.T) {
	// Mirror ProxyHeaderDenyList (cmd/bridge/main.go).
	handler, lastUpstreamReq := buildCatalogdHandler(t, passingAuthenticator{}, []string{"Cookie", "X-CSRFToken"})

	req := httptest.NewRequest(http.MethodGet, "/api/catalogd/catalogs/foo/all.json", nil)
	req.Header.Set("Cookie", "openshift-session-token=super-secret")
	req.Header.Set("X-CSRFToken", "csrf-secret")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if *lastUpstreamReq == nil {
		t.Fatal("authenticated GET was not forwarded to the catalogd upstream")
	}
	if got := (*lastUpstreamReq).Header.Get("Cookie"); got != "" {
		t.Errorf("expected Cookie header to be stripped, got %q", got)
	}
	if got := (*lastUpstreamReq).Header.Get("X-CSRFToken"); got != "" {
		t.Errorf("expected X-CSRFToken header to be stripped, got %q", got)
	}
}
