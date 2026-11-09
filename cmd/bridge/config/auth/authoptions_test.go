package auth

import (
	"testing"

	"github.com/openshift/console/pkg/auth/httpclient"
	"github.com/stretchr/testify/require"

	"github.com/openshift/console/cmd/bridge/config/flagvalues"
	"github.com/openshift/console/pkg/serverconfig"
)

func TestComplete_ProxyValidation(t *testing.T) {
	for _, tt := range []struct {
		name    string
		proxy   *serverconfig.AuthProxy
		wantErr string
	}{
		{"absent", nil, ""},
		{"empty", &serverconfig.AuthProxy{}, ""},
		{"bare address", &serverconfig.AuthProxy{HTTPProxy: "proxy.example.com:3128"}, ""},
		{"invalid HTTP", &serverconfig.AuthProxy{HTTPProxy: "http://[broken"}, "auth.proxy.httpProxy"},
		{"invalid HTTPS", &serverconfig.AuthProxy{HTTPSProxy: "http://user:secret@proxy%zz:3128"}, "auth.proxy.httpsProxy"},
	} {
		t.Run(tt.name, func(t *testing.T) {
			options := &AuthOptions{
				AuthType:     flagvalues.AuthTypeOIDC,
				IssuerURL:    "https://idp.example.com",
				ClientID:     "console",
				ClientSecret: "secret",
				Proxy:        tt.proxy,
			}
			completed, err := options.Complete()
			if tt.wantErr != "" {
				require.ErrorContains(t, err, tt.wantErr)
				require.NotContains(t, err.Error(), "secret")
			} else {
				require.NoError(t, err)
				require.Equal(t, effectiveProxy(options.AuthType, options.Proxy), completed.Proxy)
			}
		})
	}
	// A component proxy cannot affect integrated OAuth, even when bypassing ApplyConfig.
	options := &AuthOptions{AuthType: flagvalues.AuthTypeOpenShift, ClientID: "console", ClientSecret: "secret", Proxy: &serverconfig.AuthProxy{HTTPProxy: "http://[broken"}}
	completed, err := options.Complete()
	require.NoError(t, err)
	require.Nil(t, completed.Proxy)
}

func TestApplyConfig_Proxy(t *testing.T) {
	proxy := &serverconfig.AuthProxy{HTTPProxy: "http://proxy.example.com:3128"}
	for _, authType := range []flagvalues.AuthType{flagvalues.AuthTypeOIDC, flagvalues.AuthTypeOpenShift, flagvalues.AuthTypeDisabled} {
		t.Run(string(authType), func(t *testing.T) {
			options := NewAuthOptions()
			options.ApplyConfig(&serverconfig.Auth{AuthType: string(authType), Proxy: proxy})
			if authType == flagvalues.AuthTypeOIDC {
				require.Equal(t, proxy, options.Proxy)
			} else {
				require.Nil(t, options.Proxy)
			}
		})
	}
}

func TestEffectiveProxy(t *testing.T) {
	proxy := &serverconfig.AuthProxy{
		HTTPProxy:         "http://proxy.example.com:3128",
		HTTPSProxy:        "https://proxy.example.com:3128",
		NoProxy:           []string{".svc"},
		TrustedCAFilePath: "/proxy/ca.pem",
	}
	for _, authType := range []flagvalues.AuthType{flagvalues.AuthTypeOIDC, flagvalues.AuthTypeOpenShift, flagvalues.AuthTypeDisabled} {
		t.Run(string(authType), func(t *testing.T) {
			// Effective proxy for nil is always nil.
			require.Nil(t, effectiveProxy(authType, nil))

			// Only OIDC returns an actual proxy.
			effective := effectiveProxy(authType, proxy)
			if authType == flagvalues.AuthTypeOIDC {
				require.Equal(t, &httpclient.ProxyConfig{
					HTTPProxy:         proxy.HTTPProxy,
					HTTPSProxy:        proxy.HTTPSProxy,
					NoProxy:           proxy.NoProxy,
					TrustedCAFilePath: proxy.TrustedCAFilePath,
				}, effective)
			} else {
				require.Nil(t, effective)
			}
		})
	}
}
