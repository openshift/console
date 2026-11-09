package serverconfig

import (
	"os"
	"testing"

	"github.com/stretchr/testify/require"
	"gopkg.in/yaml.v2"
)

func TestAuthProxyConfig(t *testing.T) {
	data, err := os.ReadFile("test/auth-proxy-config.yaml")
	require.NoError(t, err)
	var config Config
	require.NoError(t, yaml.Unmarshal(data, &config))
	// Keep this contract aligned with Console Operator's rendered auth block.
	require.Equal(t, Auth{
		AuthType:            "oidc",
		OIDCIssuer:          "https://idp.example.com",
		OAuthEndpointCAFile: "/var/auth-server-ca/ca-bundle.crt",
		Proxy: &AuthProxy{
			HTTPProxy:         "http://proxy.example.com:3128",
			HTTPSProxy:        "http://proxy.example.com:3128",
			NoProxy:           []string{".cluster.local", ".cluster.local.", ".svc", ".svc.", "127.0.0.1", "idp.internal.example.com", "localhost", "localhost."},
			TrustedCAFilePath: "/var/auth-proxy-ca/ca-bundle.crt",
		},
	}, config.Auth)
}
