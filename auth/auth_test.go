package auth

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/coreos/go-oidc/oidc"
)

func TestRedirectAuthError(t *testing.T) {
	errURL := "http://example.com/error"
	sucURL := "http://example.com/success"
	w := httptest.NewRecorder()

	ccfg := oidc.ClientConfig{
		Credentials: oidc.ClientCredentials{
			ID:     "fake-client-id",
			Secret: "fake-secret",
		},
		RedirectURL: "http://example.com/callback",
	}
	a, err := NewAuthenticator(ccfg, &url.URL{Scheme: "http", Host: "auth.example.com"}, errURL, sucURL)

	a.redirectAuthError(w, "fake_error")
	if err != nil {
		t.Fatal("error instantiating test authenticator")
	}

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
