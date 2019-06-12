package auth

import (
	"fmt"
	"testing"
	"time"
)

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
		ls, err := newLoginState(tt.encoded, []byte(tt.claims))
		if err != nil {
			if tt.wantErr {
				continue
			}
			t.Errorf("case %d: unexpected error: %v", i, err)
		}

		if ls.rawToken != tt.encoded {
			t.Errorf("case %d: encoded token mismatch, want: %s, got: %s", i, tt.encoded, ls.rawToken)
		}

		if ls.Email != tt.wantEmail {
			t.Errorf("case %d: email mismatch, want: %s, got: %s", i, tt.wantEmail, ls.Email)
		}

		if ls.UserID != tt.wantID {
			t.Errorf("case %d: user id mismatch, want: %s, got: %s", i, tt.wantID, ls.UserID)
		}

		if ls.exp.Unix() != tt.wantExp {
			t.Errorf("case %d: exp mismatch, want: %v, got: %v", i, tt.wantExp, ls.exp.Unix())
		}
	}
}
