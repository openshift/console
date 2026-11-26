package auth

import (
	"flag"
	"net/http"
	"testing"

	"github.com/openshift/console/pkg/auth/httpclient"
	"github.com/stretchr/testify/require"
	"gopkg.in/yaml.v2"

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

func TestApplyConfig_ProxyFlags(t *testing.T) {
	fromConfig := &serverconfig.AuthProxy{
		HTTPProxy:         "http://config-http:3128",
		HTTPSProxy:        "http://config-https:3128",
		NoProxy:           []string{".config"},
		TrustedCAFilePath: "/config/ca.pem",
	}
	for _, tt := range []struct {
		name   string
		args   []string
		config *serverconfig.AuthProxy
		want   *serverconfig.AuthProxy
	}{
		{
			name:   "nothing",
			args:   nil,
			config: nil,
			want:   nil,
		},
		{
			name:   "config only",
			args:   nil,
			config: fromConfig,
			want:   fromConfig,
		},
		{
			name:   "flag without config",
			args:   []string{"--user-auth-oidc-https-proxy=http://flag:3128"},
			config: nil,
			want:   &serverconfig.AuthProxy{HTTPSProxy: "http://flag:3128"},
		},
		{
			name:   "explicit empty flag without config",
			args:   []string{"--user-auth-oidc-http-proxy="},
			config: nil,
			want:   &serverconfig.AuthProxy{},
		},
		{
			name:   "explicit empty no-proxy without config",
			args:   []string{"--user-auth-oidc-no-proxy="},
			config: nil,
			want:   &serverconfig.AuthProxy{},
		},
		{
			name: "flags override per field",
			args: []string{
				"--user-auth-oidc-http-proxy=http://flag:3128",
				"--user-auth-oidc-no-proxy=.a, .b",
				"--user-auth-oidc-proxy-ca-file=/flag/ca.pem",
			},
			config: fromConfig,
			want: &serverconfig.AuthProxy{
				HTTPProxy:         "http://flag:3128",
				HTTPSProxy:        "http://config-https:3128",
				NoProxy:           []string{".a", ".b"},
				TrustedCAFilePath: "/flag/ca.pem",
			},
		},
		{
			name:   "explicit empty flag overrides config",
			args:   []string{"--user-auth-oidc-https-proxy="},
			config: fromConfig,
			want: &serverconfig.AuthProxy{
				HTTPProxy:         "http://config-http:3128",
				NoProxy:           []string{".config"},
				TrustedCAFilePath: "/config/ca.pem",
			},
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			options := applyConfigWithFlags(t, tt.args, flagvalues.AuthTypeOIDC, tt.config)
			require.Equal(t, tt.want, options.Proxy)
		})
	}

	t.Run("flags ignored for non-OIDC", func(t *testing.T) {
		options := applyConfigWithFlags(t,
			[]string{"--user-auth-oidc-http-proxy=http://flag:3128"},
			flagvalues.AuthTypeOpenShift,
			nil,
		)
		require.Nil(t, options.Proxy)
	})
}

// An absent auth.proxy allows environment fallback, while a present but empty one
// disables it. Drive this from YAML through option resolution to the proxy function.
func TestProxyAbsentVsEmptyEndToEnd(t *testing.T) {
	t.Setenv("HTTPS_PROXY", "http://env-proxy.example.com:3128")
	t.Setenv("https_proxy", "")
	t.Setenv("NO_PROXY", "")
	t.Setenv("no_proxy", "")
	req, err := http.NewRequest(http.MethodGet, "https://idp.example.com", nil)
	require.NoError(t, err)

	for _, tt := range []struct {
		name   string
		yaml   string
		args   []string
		absent bool
	}{
		{
			name:   "missing key",
			yaml:   "authType: oidc\n",
			absent: true,
		},
		{
			name:   "null block",
			yaml:   "authType: oidc\nproxy:\n",
			absent: true,
		},
		{
			name:   "empty mapping",
			yaml:   "authType: oidc\nproxy: {}\n",
			absent: false,
		},
		{
			name:   "empty values",
			yaml:   "authType: oidc\nproxy:\n  httpProxy: \"\"\n  httpsProxy: \"\"\n",
			absent: false,
		},
		{
			name:   "explicit empty flag",
			yaml:   "authType: oidc\n",
			args:   []string{"--user-auth-oidc-https-proxy="},
			absent: false,
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			var config serverconfig.Auth
			require.NoError(t, yaml.Unmarshal([]byte(tt.yaml), &config))
			options := applyConfigWithFlags(t, tt.args, flagvalues.AuthType(config.AuthType), config.Proxy)
			effective := effectiveProxy(options.AuthType, options.Proxy)

			if tt.absent {
				// Nil makes ProxyFunc use the environment; that lookup is covered by the CONNECT test.
				require.Nil(t, effective)
				return
			}
			require.NotNil(t, effective)
			got, err := effective.ProxyFunc()(req)
			require.NoError(t, err)
			require.Nil(t, got, "explicitly empty config must override the environment proxy")
		})
	}
}

// applyConfigWithFlags parses args as CLI flags and applies config of the given
// auth type on top, the same way bridge does at startup.
func applyConfigWithFlags(
	t *testing.T,
	args []string,
	authType flagvalues.AuthType,
	proxy *serverconfig.AuthProxy,
) *AuthOptions {
	t.Helper()
	options := NewAuthOptions()
	fs := flag.NewFlagSet("test", flag.ContinueOnError)
	options.AddFlags(fs)
	require.NoError(t, fs.Parse(args))
	options.ApplyConfig(&serverconfig.Auth{AuthType: string(authType), Proxy: proxy})
	return options
}
