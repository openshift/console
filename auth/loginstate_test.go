package auth

import (
	"testing"
	"time"

	"github.com/coreos/go-oidc/jose"
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
