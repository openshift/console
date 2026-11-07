package utils

import (
	"context"
	"net"
	"net/http"
	"time"
)

// requestHostLookupTimeout bounds DNS while a chart, repository, or registry
// host is checked. The deadline is independent of the caller's HTTP timeout.
const requestHostLookupTimeout = 5 * time.Second

func defaultLookupRequestHost(ctx context.Context, host string) ([]net.IP, error) {
	return lookupRequestHostWithResolver(ctx, net.DefaultResolver, host)
}

// lookupRequestHost resolves a fetch hostname. Tests may replace it.
var lookupRequestHost = defaultLookupRequestHost

// SetRequestHostLookupForTest replaces the lookup used for fetch host checks.
// A nil lookup restores the default. Production code must not call it.
func SetRequestHostLookupForTest(lookup func(context.Context, string) ([]net.IP, error)) {
	if lookup == nil {
		lookupRequestHost = defaultLookupRequestHost
		return
	}
	lookupRequestHost = lookup
}

func lookupRequestHostWithResolver(ctx context.Context, resolver *net.Resolver, host string) ([]net.IP, error) {
	if ctx == nil {
		ctx = context.Background()
	}
	ctx, cancel := context.WithTimeout(ctx, requestHostLookupTimeout)
	defer cancel()
	return resolver.LookupIP(ctx, "ip", host)
}

// HostDisallowedContext reports whether host is disallowed for a chart,
// repository, or registry fetch. Tests that allow loopback dials skip the
// check. Other names are resolved with a bounded lookup. A lookup failure
// is not disallowed.
func HostDisallowedContext(ctx context.Context, host string) bool {
	if LoopbackDialAllowed() {
		return false
	}
	if ctx == nil {
		ctx = context.Background()
	}
	return HostDisallowed(host, func(name string) ([]net.IP, error) {
		return lookupRequestHost(ctx, name)
	})
}

// RequestHostDisallowed reports whether req names a disallowed host. A nil
// request or URL is not disallowed.
func RequestHostDisallowed(req *http.Request) bool {
	if req == nil || req.URL == nil {
		return false
	}
	return HostDisallowedContext(req.Context(), req.URL.Hostname())
}
