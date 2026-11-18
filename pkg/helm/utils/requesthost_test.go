package utils

import (
	"context"
	"errors"
	"net"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestRequestHostDisallowed(t *testing.T) {
	prev := LoopbackDialAllowed()
	SetAllowLoopbackDialForTest(false)
	t.Cleanup(func() { SetAllowLoopbackDialForTest(prev) })

	require.False(t, RequestHostDisallowed(nil))

	loop, err := http.NewRequest(http.MethodGet, "https://127.0.0.1/v2/", nil)
	require.NoError(t, err)
	require.True(t, RequestHostDisallowed(loop))

	private, err := http.NewRequest(http.MethodGet, "https://10.1.2.3/v2/", nil)
	require.NoError(t, err)
	require.False(t, RequestHostDisallowed(private))

	SetAllowLoopbackDialForTest(true)
	require.False(t, RequestHostDisallowed(loop))
}

func TestLookupRequestHostHasOwnDeadline(t *testing.T) {
	deadlines := make(chan time.Duration, 1)
	resolver := &net.Resolver{
		PreferGo: true,
		Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
			if deadline, ok := ctx.Deadline(); ok {
				select {
				case deadlines <- time.Until(deadline):
				default:
				}
			}
			return nil, errors.New("stopped")
		},
	}
	_, err := lookupRequestHostWithResolver(context.Background(), resolver, "charts.example.com")
	require.Error(t, err)
	select {
	case got := <-deadlines:
		require.Greater(t, got, time.Duration(0))
		require.LessOrEqual(t, got, requestHostLookupTimeout)
	default:
		t.Fatal("lookup had no deadline")
	}
}
