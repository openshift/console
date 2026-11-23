package session

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/openshift/console/cmd/bridge/config/flagvalues"
)

func TestSessionOptions_ValidateSessionSecretNamespace(t *testing.T) {
	tests := []struct {
		name     string
		authType flagvalues.AuthType
		opts     SessionOptions
		wantErr  bool
	}{
		{
			name:     "oidc with namespace",
			authType: flagvalues.AuthTypeOIDC,
			opts: SessionOptions{
				CookieEncryptionKeyPath:     "/enc",
				CookieAuthenticationKeyPath: "/auth",
				SessionSecretNamespace:      "console-sessions",
			},
		},
		{
			name:     "openshift with namespace",
			authType: flagvalues.AuthTypeOpenShift,
			opts:     SessionOptions{SessionSecretNamespace: "console-sessions"},
			wantErr:  true,
		},
		{
			name:     "disabled with namespace",
			authType: flagvalues.AuthTypeDisabled,
			opts:     SessionOptions{SessionSecretNamespace: "console-sessions"},
			wantErr:  true,
		},
		{
			name:     "openshift without namespace",
			authType: flagvalues.AuthTypeOpenShift,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errs := tt.opts.Validate(tt.authType)
			if tt.wantErr {
				require.NotEmpty(t, errs)
			} else {
				require.Empty(t, errs)
			}
		})
	}
}
