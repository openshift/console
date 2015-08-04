package auth

import (
	"encoding/json"
	"net/url"
	"testing"
	"time"

	"github.com/coreos/go-oidc/jose"
	"github.com/kylelemons/godebug/pretty"
)

type fakeToken struct {
	encoded string
	claims  jose.Claims
}

func (f fakeToken) Encode() string {
	return f.encoded
}

func (f fakeToken) Claims() (jose.Claims, error) {
	return f.claims, nil
}

func TestNewLoginState(t *testing.T) {
	tests := []struct {
		encoded string
		claims  jose.Claims
		wantErr bool
	}{
		// happy case
		{
			encoded: "rando-token-string",
			claims:  jose.Claims{"sub": "user-id", "email": "penny@example.com", "exp": time.Now().Unix()},
			wantErr: false,
		},
		// missing sub
		{
			encoded: "rando-token-string",
			claims:  jose.Claims{"email": "penny@example.com", "exp": time.Now().Unix()},
			wantErr: true,
		},
	}

	for i, tt := range tests {
		tok := fakeToken{tt.encoded, tt.claims}
		ls, err := newLoginState(tok)
		if err != nil {
			if tt.wantErr {
				continue
			}
			t.Errorf("case %d: unexpected error: %v", i, err)
		}

		if ls.token.Encode() != tt.encoded {
			t.Errorf("case %d: encoded token mismatch, want: %s, got: %s", i, tt.encoded, ls.token.Encode())
		}

		cEmail := tt.claims["email"]
		if ls.Email != cEmail {
			t.Errorf("case %d: email mismatch, want: %s, got: %s", i, ls.Email, cEmail)
		}

		cSub := tt.claims["sub"]
		if ls.UserID != cSub {
			t.Errorf("case %d: user id mismatch, want: %s, got: %s", i, ls.UserID, cSub)
		}

		cExp := tt.claims["exp"]
		if ls.exp.Unix() != cExp {
			t.Errorf("case %d: exp mismatch, want: %v, got: %v", i, ls.exp.Unix(), cExp)
		}
	}
}

func TestTokenCookie(t *testing.T) {
	epoch := time.Time{}
	exp := epoch.Add(2 * time.Hour)
	encoded := "rando-encoded-token-string"
	claims := jose.Claims{"sub": "user-id", "email": "penny@example.com", "exp": exp.Unix()}
	tok := fakeToken{encoded, claims}
	ls, err := newLoginState(tok)
	if err != nil {
		t.Errorf("unexpected error instantiating loginstate: %v", err)
	}

	ls.now = func() time.Time {
		return epoch
	}

	ck := ls.tokenCookie()
	if ck.Value != encoded {
		t.Errorf("unexpected cookie value, want: %v, got: %v", encoded, ck.Value)
	}

	if ck.HttpOnly != true {
		t.Error("expected HttpOnly to be true")
	}

	if ck.Expires.Unix() != exp.Unix() {
		t.Errorf("unexpected cookie expiration, want: %v, got: %v", exp.Unix(), ck.Expires.Unix())
	}

	wantAge := int(exp.Sub(epoch).Seconds())
	if ck.MaxAge != wantAge {
		t.Errorf("unexpected cookie max-age, want: %d, got: %d", wantAge, ck.MaxAge)
	}
}

func TestStateCookie(t *testing.T) {
	epoch := time.Time{}
	exp := epoch.Add(2 * time.Hour)
	claims := jose.Claims{"sub": "user-id", "email": "penny@example.com", "exp": exp.Unix()}
	tok := fakeToken{"rando-encoded-token", claims}
	ls, err := newLoginState(tok)
	if err != nil {
		t.Errorf("unexpected error instantiating loginstate: %v", err)
	}

	ls.now = func() time.Time {
		return epoch
	}

	ck, err := ls.stateCookie()
	if err != nil {
		t.Errorf("unexpected error generating statek cookie: %v", err)
	}

	if ck.HttpOnly == true {
		t.Error("expected HttpOnly to be false")
	}

	if ck.Expires.Unix() != exp.Unix() {
		t.Errorf("unexpected cookie expiration, want: %v, got: %v", exp.Unix(), ck.Expires.Unix())
	}

	wantAge := int(exp.Sub(epoch).Seconds())
	if ck.MaxAge != wantAge {
		t.Errorf("unexpected cookie max-age, want: %d, got: %d", wantAge, ck.MaxAge)
	}

	unesc, err := url.QueryUnescape(ck.Value)
	if err != nil {
		t.Errorf("unexpected error unescaping cookie value: %v", err)
	}

	var lsDec loginState
	if err = json.Unmarshal([]byte(unesc), &lsDec); err != nil {
		t.Errorf("unexpected error unmarshaling cookie value: %v", err)
	}

	// Reset the non-marshalled fields before comparing.
	ls.exp = time.Time{}
	ls.token = nil
	ls.now = nil
	if diff := pretty.Compare(ls, lsDec); diff != "" {
		t.Errorf("login-state values do not match: %v", diff)
	}
}
