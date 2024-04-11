package sessions

import (
	"context"
	"encoding/base64"
	"fmt"
	"testing"
	"time"

	"github.com/coreos/go-oidc"
	"golang.org/x/oauth2"
)

// testKeySet allows us to use foobar signatures
type testKeySet struct {
	payload []byte
}

func (ks *testKeySet) VerifySignature(ctx context.Context, jwt string) ([]byte, error) {
	return ks.payload, nil
}

func newTestVerifier(payload string) IDTokenVerifier {
	verifier := oidc.NewVerifier("", &testKeySet{payload: []byte(payload)}, &oidc.Config{SkipClientIDCheck: true, SkipExpiryCheck: true, SkipIssuerCheck: true})
	return verifier.Verify
}

func testErrVerifier(context.Context, string) (*oidc.IDToken, error) {
	return nil, fmt.Errorf("not a valid token: this is a test")
}

func TestNewLoginState(t *testing.T) {
	exp := time.Now().Unix()
	tests := []struct {
		encoded   string
		claims    string
		wantErr   bool
		wantEmail string
		wantID    string
		wantExp   int64
	}{
		// happy case
		{
			encoded: "rando-token-string",
			claims: fmt.Sprintf(`{
				"sub": "user-id",
				"email": "penny@example.com",
				"exp": %d
			}`, exp),
			wantErr:   false,
			wantEmail: "penny@example.com",
			wantID:    "user-id",
			wantExp:   exp,
		},
		// missing sub
		{
			encoded: "rando-token-string",
			claims: fmt.Sprintf(`{
				"email": "penny@example.com",
				"exp": %d
			}`, time.Now().Unix()),
			wantErr: true,
		},
	}

	for i, tt := range tests {

		rawToken := createTestIDToken(tt.claims)
		tokenResp := &oauth2.Token{RefreshToken: tt.encoded}
		tokenResp = tokenResp.WithExtra(map[string]interface{}{"id_token": rawToken})

		ls, err := newLoginState(newTestVerifier(tt.claims), tokenResp)
		if err != nil {
			if tt.wantErr {
				continue
			}
			t.Errorf("case %d: unexpected error: %v", i, err)
		}

		if len(ls.sessionToken) == 0 {
			t.Errorf("case %d: session token is empty", i)
		}

		if ls.rawToken != rawToken {
			t.Errorf("case %d: raw token mismatch, want: %s, got: %s", i, tt.encoded, ls.rawToken)
		}

		if ls.refreshToken != tt.encoded {
			t.Errorf("case %d: refresh token mismatch, want: %s, got: %s", i, tt.encoded, ls.rawToken)
		}

		if ls.email != tt.wantEmail {
			t.Errorf("case %d: email mismatch, want: %s, got: %s", i, tt.wantEmail, ls.email)
		}

		if ls.userID != tt.wantID {
			t.Errorf("case %d: user id mismatch, want: %s, got: %s", i, tt.wantID, ls.userID)
		}

		if ls.exp.Unix() != tt.wantExp {
			t.Errorf("case %d: exp mismatch, want: %v, got: %v", i, tt.wantExp, ls.exp.Unix())
		}
	}
}

// createTestIDToken creates a token with the proper payload but a bogus signature
// which should be good enough for testing sessions at least
func createTestIDToken(payload string) string {
	return base64.RawStdEncoding.EncodeToString([]byte(`{"alg":"RS256","typ":"JWT"}`)) +
		"." + base64.RawStdEncoding.EncodeToString([]byte(payload)) +
		"." + base64.RawStdEncoding.EncodeToString([]byte("whoopsie"))
}
