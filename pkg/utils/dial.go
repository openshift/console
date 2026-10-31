package utils

import (
	"context"
	"fmt"
	"net"
)

// allowLoopbackDial skips the pinned dial for tests whose fixtures listen on
// localhost. Production leaves it false.
var allowLoopbackDial bool

// lookupIPAddr resolves a host once. Tests may replace it.
var lookupIPAddr = func(ctx context.Context, host string) ([]net.IPAddr, error) {
	return net.DefaultResolver.LookupIPAddr(ctx, host)
}

// SetAllowLoopbackDialForTest allows the pinned dialer to connect to localhost
// and loopback addresses. Production code must not call it.
func SetAllowLoopbackDialForTest(allow bool) {
	allowLoopbackDial = allow
}

// DialPinnedContext resolves addr once, refuses disallowed chart targets, and
// connects to one of those resolved addresses. A later DNS answer cannot move
// the connection onto a different address; however, note that pinning does
// not defend against accesses via a malicious proxy.
func DialPinnedContext(ctx context.Context, dialer *net.Dialer, network, addr string) (net.Conn, error) {
	if dialer == nil {
		dialer = &net.Dialer{}
	}
	if allowLoopbackDial {
		return dialer.DialContext(ctx, network, addr)
	}
	targets, err := resolvePinnedAddrs(ctx, network, addr)
	if err != nil {
		return nil, err
	}
	var last error
	for _, target := range targets {
		conn, err := dialer.DialContext(ctx, network, target)
		if err == nil {
			return conn, nil
		}
		last = err
	}
	return nil, last
}

// resolvePinnedAddrs returns host:port values for the addresses looked up for
// addr. Any disallowed answer rejects the whole set.
func resolvePinnedAddrs(ctx context.Context, network, addr string) ([]string, error) {
	host, port, err := net.SplitHostPort(addr)
	if err != nil {
		return nil, err
	}
	if HostDisallowed(host, nil) {
		return nil, ErrDisallowedHost
	}
	if ip := net.ParseIP(host); ip != nil {
		if !addrMatchesNetwork(network, ip) {
			return nil, fmt.Errorf("lookup %s: no such host", host)
		}
		return []string{net.JoinHostPort(ip.String(), port)}, nil
	}

	ips, err := lookupIPAddr(ctx, host)
	if err != nil {
		return nil, err
	}
	var targets []string
	for _, ip := range ips {
		if ip.IP == nil {
			continue
		}
		if isDisallowedHostIP(ip.IP) {
			return nil, ErrDisallowedHost
		}
		if !addrMatchesNetwork(network, ip.IP) {
			continue
		}
		targets = append(targets, net.JoinHostPort(ip.IP.String(), port))
	}
	if len(targets) == 0 {
		return nil, fmt.Errorf("lookup %s: no such host", host)
	}
	return targets, nil
}

func addrMatchesNetwork(network string, ip net.IP) bool {
	switch network {
	case "tcp4", "udp4", "ip4":
		return ip.To4() != nil
	case "tcp6", "udp6", "ip6":
		return ip.To4() == nil && ip.To16() != nil
	default:
		return true
	}
}
