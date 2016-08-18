package server

import (
	"net/http"
	"net/url"
	"testing"
)

func TestConfigValid(t *testing.T) {
	tests := []struct {
		cfg       AuthConfig
		wantValid bool
	}{
		// Empty config
		{
			cfg:       AuthConfig{},
			wantValid: false,
		},
		// Missing ClientID
		{
			cfg: AuthConfig{
				ClientID:     "",
				ClientSecret: "yyy",
				RedirectURL:  &url.URL{Scheme: "https", Host: "example.com", Path: "/callback"},
				IssuerURL:    &url.URL{Scheme: "https", Host: "issuer.example.com", Path: "/auth-endpoint"},
			},
			wantValid: false,
		},
		// Missing Client Secret
		{
			cfg: AuthConfig{
				ClientID:     "xxx",
				ClientSecret: "",
				RedirectURL:  &url.URL{Scheme: "https", Host: "example.com", Path: "/callback"},
				IssuerURL:    &url.URL{Scheme: "https", Host: "issuer.example.com", Path: "/auth-endpoint"},
			},
			wantValid: false,
		},
		// Missing RedirectURL Scheme
		{
			cfg: AuthConfig{
				ClientID:     "xxx",
				ClientSecret: "yyy",
				RedirectURL:  &url.URL{Scheme: "", Host: "example.com", Path: "/callback"},
				IssuerURL:    &url.URL{Scheme: "https", Host: "issuer.example.com", Path: "/auth-endpoint"},
			},
			wantValid: false,
		},
		// Missing RedirectURL Host
		{
			cfg: AuthConfig{
				ClientID:     "xxx",
				ClientSecret: "yyy",
				RedirectURL:  &url.URL{Scheme: "https", Host: "", Path: "/callback"},
				IssuerURL:    &url.URL{Scheme: "https", Host: "issuer.example.com", Path: "/auth-endpoint"},
			},
			wantValid: false,
		},
		// Missing IssuerURL Scheme
		{
			cfg: AuthConfig{
				ClientID:     "xxx",
				ClientSecret: "yyy",
				RedirectURL:  &url.URL{Scheme: "https", Host: "example.com", Path: "/callback"},
				IssuerURL:    &url.URL{Scheme: "", Host: "issuer.example.com", Path: "/auth-endpoint"},
			},
			wantValid: false,
		},
		// Missing IssuerURL Host
		{
			cfg: AuthConfig{
				ClientID:     "xxx",
				ClientSecret: "yyy",
				RedirectURL:  &url.URL{Scheme: "https", Host: "example.com", Path: "/callback"},
				IssuerURL:    &url.URL{Scheme: "https", Host: "", Path: "/auth-endpoint"},
			},
			wantValid: false,
		},
		// Valid
		{
			cfg: AuthConfig{
				ClientID:     "xxx",
				ClientSecret: "yyy",
				RedirectURL:  &url.URL{Scheme: "https", Host: "example.com", Path: "/callback"},
				IssuerURL:    &url.URL{Scheme: "https", Host: "issuer.example.com", Path: "/auth-endpoint"},
			},
			wantValid: true,
		},
	}

	for i, tt := range tests {
		err := tt.cfg.Valid()
		gotValid := err == nil
		if gotValid != tt.wantValid {
			t.Errorf("case %d: incorrect config validation: want=%t got=%t", i, tt.wantValid, gotValid)
		}
	}
}

func TestCookieTokenExtractor(t *testing.T) {
	cname := "auth-cookie"
	cval := "some-cookie-value"
	ck := &http.Cookie{
		Name:  cname,
		Value: cval,
	}

	fn := cookieTokenExtractor(cname)

	req, err := http.NewRequest("GET", "http://example.com", nil)
	if err != nil {
		t.Errorf("unable to create HTTP request: %v", err)
	}

	_, err = fn(req)
	if err == nil {
		t.Errorf("error extracting cookie token. should have errored with no cookie.")
	}

	req.AddCookie(ck)
	tok, err := fn(req)
	if err != nil {
		t.Errorf("error extracting cookie token: %v", err)
	}

	if tok != cval {
		t.Errorf("cookie token value incorrect. want %s, got: %s", cval, tok)
	}
}

func TestParseNext(t *testing.T) {
	tests := []struct {
		s    string
		want string
	}{
		// Should ignore host portion
		{
			s:    "http://evilsite.com/give/us/your/credit-card",
			want: "/give/us/your/credit-card",
		},
		{
			s:    "/some/valid/path",
			want: "/some/valid/path",
		},
		{
			s:    "/",
			want: "/",
		},
		{
			s:    "",
			want: "/",
		},
	}

	for i, tt := range tests {
		got := parseNext(tt.s)

		if tt.want != got {
			t.Errorf("case %d: want=%s got=%s", i, tt.want, got)
		}
	}
}
