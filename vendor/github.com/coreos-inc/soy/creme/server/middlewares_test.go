package server

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/coreos/go-oidc/jose"

	"github.com/coreos-inc/soy/creme/middleware"
)

var (
	unauthorizedBody = `{"error":"unauthenticated","description":""}`
)

type fakeToken struct {
	encoded string
	claims  jose.Claims
}

func (f fakeToken) Claims() (jose.Claims, error) {
	return f.claims, nil
}

func (f fakeToken) Encode() string {
	return f.encoded
}

func fakeTokenExtractor(fail bool) tokenExtractor {
	return func(r *http.Request) (string, error) {
		if fail {
			return "", errors.New("error extracting fake token")
		}
		return "fake-encoded-token", nil
	}
}

func fakeTokenVerifier(fail bool, claims jose.Claims) tokenVerifier {
	return func(encTok string) (token, error) {
		if fail {
			return nil, errors.New("error verifiying fake token")
		}
		t := fakeToken{
			claims:  claims,
			encoded: "fake-encoded-token",
		}
		return t, nil
	}
}

func TestAuthMiddleware(t *testing.T) {
	exp := time.Now().Add(time.Hour * 1).Unix()

	validClaims := jose.Claims{
		"email":          "penny@example.com",
		"email_verified": true,
		"exp":            exp,
		"sub":            "fake-user-id",
	}

	tests := []struct {
		extractor tokenExtractor
		verifier  tokenVerifier
		wantErr   bool
	}{
		// Extractor fails
		{
			extractor: fakeTokenExtractor(true),
			verifier:  fakeTokenVerifier(false, validClaims),
			wantErr:   true,
		},
		// Verifier fails
		{
			extractor: fakeTokenExtractor(false),
			verifier:  fakeTokenVerifier(true, validClaims),
			wantErr:   true,
		},
		// Missing 'email' claim fails
		{
			extractor: fakeTokenExtractor(false),
			verifier: fakeTokenVerifier(false, jose.Claims{
				"email_verified": true,
				"exp":            exp,
			}),
			wantErr: true,
		},
		// Empty 'email' claim fails
		{
			extractor: fakeTokenExtractor(false),
			verifier: fakeTokenVerifier(false, jose.Claims{
				"email":          "",
				"email_verified": true,
				"exp":            exp,
			}),
			wantErr: true,
		},
		// Missing 'email_verified' claim fails
		{
			extractor: fakeTokenExtractor(false),
			verifier: fakeTokenVerifier(false, jose.Claims{
				"email": "penny@example.com",
				"exp":   exp,
			}),
			wantErr: true,
		},
		// false 'email_verified' claim fails
		{
			extractor: fakeTokenExtractor(false),
			verifier: fakeTokenVerifier(false, jose.Claims{
				"email":          "penny@example.com",
				"email_verified": false,
				"exp":            exp,
			}),
			wantErr: true,
		},
		// Missing 'exp' claim fails
		{
			extractor: fakeTokenExtractor(false),
			verifier: fakeTokenVerifier(false, jose.Claims{
				"email":          "penny@example.com",
				"email_verified": true,
			}),
			wantErr: true,
		},
		// missing 'sub' claim
		{
			extractor: fakeTokenExtractor(false),
			verifier: fakeTokenVerifier(false, jose.Claims{
				"email":          "penny@example.com",
				"email_verified": true,
				"exp":            exp,
			}),
			wantErr: true,
		},
		// empty 'sub' claim
		{
			extractor: fakeTokenExtractor(false),
			verifier: fakeTokenVerifier(false, jose.Claims{
				"email":          "penny@example.com",
				"email_verified": true,
				"exp":            exp,
				"sub":            "",
			}),
			wantErr: true,
		},
		// Happy path
		{
			extractor: fakeTokenExtractor(false),
			verifier:  fakeTokenVerifier(false, validClaims),
			wantErr:   false,
		},
	}

	for i, tt := range tests {
		a := &Authenticator{
			TokenExtractor: tt.extractor,
			tokenVerifier:  tt.verifier,
		}

		var ewErr error
		ew := func(w http.ResponseWriter, err error) {
			ewErr = err
		}

		mm := middleware.NewManager(ew)
		hdlr := mm.Chain(AuthMiddleware(mm, a))
		req, err := http.NewRequest("GET", "http://example.com", nil)
		if err != nil {
			t.Errorf("case %d: unable to create HTTP request: %v", i, err)
			continue
		}

		hdlr(httptest.NewRecorder(), req, nil)

		if tt.wantErr {
			if ewErr == nil {
				t.Errorf("case %d: unexpected pass through auth middleware", i)
				continue
			}
			aerr, ok := ewErr.(PublicError)
			if !ok {
				t.Errorf("case %d: expected PublicError, got: %v", i, ewErr)
			}
			if aerr.HTTPStatus != http.StatusUnauthorized {
				t.Errorf("case %d: want code: 401, got: %d", i, aerr.HTTPStatus)
			}
		} else if ewErr != nil {
			t.Errorf("case %d: expected middleware error: %v", i, ewErr)
		}
	}
}

func TestMiddlewareUnverifiedEmail(t *testing.T) {
	exp := time.Now().Add(time.Hour * 1).Unix()

	validClaims := jose.Claims{
		"email": "penny@example.com",
		"exp":   exp,
		"sub":   "fake-user-id",
	}

	tests := []struct {
		extractor tokenExtractor
		verifier  tokenVerifier
		wantErr   bool
	}{
		// Extractor fails
		{
			extractor: fakeTokenExtractor(true),
			verifier:  fakeTokenVerifier(false, validClaims),
			wantErr:   true,
		},
		// Verifier fails
		{
			extractor: fakeTokenExtractor(false),
			verifier:  fakeTokenVerifier(true, validClaims),
			wantErr:   true,
		},
		// Missing 'email' claim fails
		{
			extractor: fakeTokenExtractor(false),
			verifier: fakeTokenVerifier(false, jose.Claims{
				"email_verified": true,
				"exp":            exp,
			}),
			wantErr: true,
		},
		// Empty 'email' claim fails
		{
			extractor: fakeTokenExtractor(false),
			verifier: fakeTokenVerifier(false, jose.Claims{
				"email":          "",
				"email_verified": true,
				"exp":            exp,
			}),
			wantErr: true,
		},
		// Missing 'exp' claim fails
		{
			extractor: fakeTokenExtractor(false),
			verifier: fakeTokenVerifier(false, jose.Claims{
				"email":          "penny@example.com",
				"email_verified": true,
			}),
			wantErr: true,
		},
		// Missing 'email_verified' claim fails, still ok
		{
			extractor: fakeTokenExtractor(false),
			verifier: fakeTokenVerifier(false, jose.Claims{
				"email": "penny@example.com",
				"exp":   exp,
				"sub":   "fake-user-id",
			}),
			wantErr: false,
		},
		// false 'email_verified' claim fails, still ok
		{
			extractor: fakeTokenExtractor(false),
			verifier: fakeTokenVerifier(false, jose.Claims{
				"email":          "penny@example.com",
				"email_verified": false,
				"exp":            exp,
				"sub":            "fake-user-id",
			}),
			wantErr: false,
		},
		// missing 'sub' claim
		{
			extractor: fakeTokenExtractor(false),
			verifier: fakeTokenVerifier(false, jose.Claims{
				"email":          "penny@example.com",
				"email_verified": true,
				"exp":            exp,
			}),
			wantErr: true,
		},
		// empty 'sub' claim
		{
			extractor: fakeTokenExtractor(false),
			verifier: fakeTokenVerifier(false, jose.Claims{
				"email":          "penny@example.com",
				"email_verified": true,
				"exp":            exp,
				"sub":            "",
			}),
			wantErr: true,
		},
		// Happy path
		{
			extractor: fakeTokenExtractor(false),
			verifier:  fakeTokenVerifier(false, validClaims),
			wantErr:   false,
		},
	}

	for i, tt := range tests {
		a := &Authenticator{
			TokenExtractor: tt.extractor,
			tokenVerifier:  tt.verifier,
		}

		var ewErr error
		ew := func(w http.ResponseWriter, err error) {
			ewErr = err
		}

		mm := middleware.NewManager(ew)
		hdlr := mm.Chain(AuthUnverifiedEmailMiddleware(mm, a))
		req, err := http.NewRequest("GET", "http://example.com", nil)
		if err != nil {
			t.Errorf("case %d: unable to create HTTP request: %v", i, err)
			continue
		}

		hdlr(httptest.NewRecorder(), req, nil)

		if tt.wantErr {
			if ewErr == nil {
				t.Errorf("case %d: unexpected pass through auth middleware", i)
				continue
			}
			aerr, ok := ewErr.(PublicError)
			if !ok {
				t.Errorf("case %d: expected PublicError, got: %v", i, ewErr)
			}
			if aerr.HTTPStatus != http.StatusUnauthorized {
				t.Errorf("case %d: want code: 401, got: %d", i, aerr.HTTPStatus)
			}
		} else if ewErr != nil {
			t.Errorf("case %d: expected middleware error: %v", i, ewErr)
		}

	}
}
