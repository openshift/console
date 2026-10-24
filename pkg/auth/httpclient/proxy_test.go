package httpclient

import (
	"net/http"
	"os"
	"os/exec"
	"testing"

	"github.com/stretchr/testify/require"
)

// TestProxyMatching checks NoProxy bypass matching against the operator's
// exact rendered bypass list: service/cluster suffixes with and without a
// trailing dot, bare-host-matches-subdomain, CIDR, IP, host:port, wildcard,
// and the loopback/localhost short-circuit that golang.org/x/net/http/httpproxy
// applies unconditionally regardless of NoProxy.
func TestProxyMatching(t *testing.T) {
	// Exact sorted bypass list rendered by Console Operator for the example config.
	defaults := []string{".cluster.local", ".cluster.local.", ".svc", ".svc.", "127.0.0.1", "idp.internal.example.com", "localhost", "localhost."}
	for _, tt := range []struct {
		name, target string
		noProxy      []string
		bypass       bool
	}{
		{"service", "https://idp.ns.svc", defaults, true},
		{"absolute service", "https://idp.ns.svc.", defaults, true},
		{"cluster", "https://idp.ns.svc.cluster.local", defaults, true},
		{"absolute cluster", "https://idp.ns.svc.cluster.local.", defaults, true},
		{"short name", "https://idp", defaults, false},
		{"explicit host", "https://idp.internal.example.com", defaults, true},
		{"bare host matches subdomain", "https://sub.idp.internal.example.com", defaults, true},
		{"leading dot excludes root", "https://svc", defaults, false},
		{"relative suffix excludes absolute name", "https://idp.ns.svc.", []string{".svc"}, false},
		{"absolute suffix excludes relative name", "https://idp.ns.svc", []string{".svc."}, false},
		{"external", "https://idp.example.com", defaults, false},
		// Actually no loopback address is ever proxied.
		{"loopback", "https://127.0.0.2", nil, true},
		{"localhost", "http://localhost", nil, true},
		{"IPv6 loopback", "https://[::1]", nil, true},
		{"IP", "https://10.0.0.1", []string{"10.0.0.1"}, true},
		{"IPv6", "https://[fd02::1]", []string{"fd02::1"}, true},
		{"CIDR", "https://10.1.2.3", []string{"10.0.0.0/8"}, true},
		{"outside CIDR", "https://11.1.2.3", []string{"10.0.0.0/8"}, false},
		{"port match", "https://idp.example.com:8443", []string{"idp.example.com:8443"}, true},
		{"port mismatch", "https://idp.example.com", []string{"idp.example.com:8443"}, false},
		{"wildcard", "https://idp.example.com", []string{"*"}, true},
	} {
		t.Run(tt.name, func(t *testing.T) {
			config := &ProxyConfig{
				HTTPProxy:  "http://proxy.example.com:3128",
				HTTPSProxy: "http://proxy.example.com:3128",
				NoProxy:    tt.noProxy,
			}

			req, err := http.NewRequest(http.MethodGet, tt.target, nil)
			require.NoError(t, err)

			proxy, err := config.ProxyFunc()(req)
			require.NoError(t, err)
			if tt.bypass {
				require.Nil(t, proxy)
			} else {
				require.Equal(t, "http://proxy.example.com:3128", proxy.String())
			}
		})
	}
}

// TestProxyIgnoresEnvironment asserts that once auth.proxy is present, its
// fields are used exactly as configured with no per-field inheritance from
// HTTP_PROXY/HTTPS_PROXY/NO_PROXY: an empty HTTPProxy or HTTPSProxy means
// direct for that scheme, even though the environment variables are set and
// would otherwise cover it.
func TestProxyIgnoresEnvironment(t *testing.T) {
	t.Setenv("HTTP_PROXY", "http://environment.example.com:3128")
	t.Setenv("HTTPS_PROXY", "http://environment.example.com:3128")
	t.Setenv("NO_PROXY", "*")
	for _, tt := range []struct {
		config *ProxyConfig
		target string
		want   string
	}{
		{&ProxyConfig{}, "https://idp.example.com", ""},
		{&ProxyConfig{}, "http://idp.example.com", ""},
		{&ProxyConfig{HTTPProxy: "proxy.example.com:3128"}, "https://idp.example.com", ""},
		{&ProxyConfig{HTTPProxy: "proxy.example.com:3128"}, "http://idp.example.com", "http://proxy.example.com:3128"},
		{&ProxyConfig{HTTPSProxy: "http://proxy.example.com:3128"}, "https://idp.example.com", "http://proxy.example.com:3128"},
	} {
		req, err := http.NewRequest(http.MethodGet, tt.target, nil)
		require.NoError(t, err)

		proxy, err := tt.config.ProxyFunc()(req)
		require.NoError(t, err)
		if tt.want == "" {
			require.Nil(t, proxy)
		} else {
			require.Equal(t, tt.want, proxy.String())
		}
	}
}

// TestProxyEnvironmentFallback asserts the complementary case to
// TestProxyIgnoresEnvironment: when auth.proxy is absent (a nil *ProxyConfig),
// ProxyFunc falls back to the standard HTTPS_PROXY/NO_PROXY environment
// behavior unchanged.
func TestProxyEnvironmentFallback(t *testing.T) {
	// net/http caches environment settings process-wide, so use a fresh process.
	if os.Getenv("CONSOLE_PROXY_TEST_CHILD") == "1" {
		var config *ProxyConfig

		req, err := http.NewRequest(http.MethodGet, "https://idp.example.com", nil)
		require.NoError(t, err)

		proxy, err := config.ProxyFunc()(req)
		require.NoError(t, err)
		require.NotNil(t, proxy)
		require.Equal(t, "http://environment.example.com:3128", proxy.String())
		return
	}

	t.Setenv("CONSOLE_PROXY_TEST_CHILD", "1")
	t.Setenv("HTTPS_PROXY", "http://environment.example.com:3128")
	t.Setenv("NO_PROXY", "")
	t.Setenv("no_proxy", "")

	output, err := exec.Command(os.Args[0], "-test.run=^TestProxyEnvironmentFallback$").CombinedOutput()
	require.NoError(t, err, "%s", output)
}

// TestProxyValidationAndRedaction checks that Validate accepts every proxy
// URL form httpproxy itself accepts (including a bare host:port) and rejects
// unparseable ones without leaking credentials in the error, and that String
// strips userinfo from both valid and malformed values while still showing
// the host.
func TestProxyValidationAndRedaction(t *testing.T) {
	for _, value := range []string{"", "proxy.example.com:3128", "http://proxy.example.com:3128", "https://user:password@proxy.example.com:3128", "socks5://proxy.example.com:1080"} {
		require.NoError(t, (&ProxyConfig{HTTPProxy: value, HTTPSProxy: value}).Validate())
	}

	for _, value := range []string{"http://", "://", "http://user:secret@proxy%zz:3128", "http://[broken"} {
		for _, config := range []*ProxyConfig{{HTTPProxy: value}, {HTTPSProxy: value}} {
			err := config.Validate()
			require.ErrorContains(t, err, "auth.proxy.")
			require.NotContains(t, err.Error(), "secret")
		}
	}

	config := &ProxyConfig{
		HTTPProxy:  "http://user:password@proxy.example.com:3128",
		HTTPSProxy: "user:password@proxy.example.com:3128",
	}
	require.NotContains(t, config.String(), "user")
	require.NotContains(t, config.String(), "password")
	require.Contains(t, config.String(), "proxy.example.com:3128")
	require.NotContains(t, (&ProxyConfig{HTTPSProxy: "http://user:secret@proxy%zz:3128"}).String(), "secret")
}
