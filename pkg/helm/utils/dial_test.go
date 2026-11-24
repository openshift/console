package utils

import (
	"context"
	"errors"
	"net"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestResolvePinnedAddrs(t *testing.T) {
	prev := lookupIPAddr
	lookupIPAddr = func(ctx context.Context, host string) ([]net.IPAddr, error) {
		switch host {
		case "charts.example.com":
			return []net.IPAddr{{IP: net.ParseIP("203.0.113.5")}}, nil
		case "dual.example.com":
			return []net.IPAddr{
				{IP: net.ParseIP("203.0.113.5")},
				{IP: net.ParseIP("2001:db8::5")},
			}, nil
		case "rebind.example.com":
			return []net.IPAddr{
				{IP: net.ParseIP("203.0.113.5")},
				{IP: net.ParseIP("127.0.0.1")},
			}, nil
		case "unspecified.example.com":
			return []net.IPAddr{{IP: net.ParseIP("0.0.0.0")}}, nil
		case "private.example.com":
			return []net.IPAddr{{IP: net.ParseIP("10.1.2.3")}}, nil
		case "v6only.example.com":
			return []net.IPAddr{{IP: net.ParseIP("2001:db8::5")}}, nil
		default:
			return nil, &net.DNSError{Err: "no such host", Name: host, IsNotFound: true}
		}
	}
	t.Cleanup(func() { lookupIPAddr = prev })

	ctx := context.Background()
	tests := []struct {
		name    string
		network string
		addr    string
		want    []string
		wantErr error
	}{
		{name: "literal private", network: "tcp", addr: "10.1.2.3:443", want: []string{"10.1.2.3:443"}},
		{name: "resolved public", network: "tcp", addr: "charts.example.com:443", want: []string{"203.0.113.5:443"}},
		{name: "resolved private", network: "tcp", addr: "private.example.com:8443", want: []string{"10.1.2.3:8443"}},
		{name: "both families", network: "tcp", addr: "dual.example.com:443", want: []string{"203.0.113.5:443", "[2001:db8::5]:443"}},
		{name: "tcp4 skips ipv6", network: "tcp4", addr: "dual.example.com:443", want: []string{"203.0.113.5:443"}},
		{name: "literal loopback", network: "tcp", addr: "127.0.0.1:80", wantErr: ErrDisallowedHost},
		{name: "literal unspecified", network: "tcp", addr: "0.0.0.0:80", wantErr: ErrDisallowedHost},
		{name: "this network", network: "tcp", addr: "0.1.2.3:80", wantErr: ErrDisallowedHost},
		{name: "cloud metadata", network: "tcp", addr: "169.254.169.254:80", wantErr: ErrDisallowedHost},
		{name: "kubernetes hostname", network: "tcp", addr: "kubernetes.default:443", wantErr: ErrDisallowedHost},
		{name: "kubernetes service", network: "tcp", addr: "kubernetes.default.svc:443", wantErr: ErrDisallowedHost},
		{name: "literal ipv6 loopback", network: "tcp", addr: "[::1]:443", wantErr: ErrDisallowedHost},
		{name: "literal ipv6 unspecified", network: "tcp", addr: "[::]:443", wantErr: ErrDisallowedHost},
		{name: "localhost", network: "tcp", addr: "localhost:5000", wantErr: ErrDisallowedHost},
		{name: "rebinding answer", network: "tcp", addr: "rebind.example.com:443", wantErr: ErrDisallowedHost},
		{name: "resolved unspecified", network: "tcp", addr: "unspecified.example.com:80", wantErr: ErrDisallowedHost},
		{name: "no address for network", network: "tcp4", addr: "v6only.example.com:443", wantErr: errors.New("lookup v6only.example.com: no such host")},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := resolvePinnedAddrs(ctx, tt.network, tt.addr)
			if tt.wantErr != nil {
				require.Error(t, err)
				if errors.Is(tt.wantErr, ErrDisallowedHost) {
					require.ErrorIs(t, err, ErrDisallowedHost)
				} else {
					require.EqualError(t, err, tt.wantErr.Error())
				}
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestDialPinnedContextRejectsLoopbackBeforeConnect(t *testing.T) {
	_, err := DialPinnedContext(context.Background(), &net.Dialer{}, "tcp", "127.0.0.1:1")
	require.ErrorIs(t, err, ErrDisallowedHost)
}

func TestDialPinnedContextAllowsLoopbackWhenEnabledForTest(t *testing.T) {
	SetAllowLoopbackDialForTest(true)
	t.Cleanup(func() { SetAllowLoopbackDialForTest(false) })

	_, err := DialPinnedContext(context.Background(), &net.Dialer{}, "tcp", "127.0.0.1:1")
	require.Error(t, err)
	require.NotErrorIs(t, err, ErrDisallowedHost)
}
