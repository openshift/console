package utils

import (
	"net"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestIsPrivateOrReservedIP(t *testing.T) {
	tests := []struct {
		name     string
		ip       string
		expected bool
	}{
		{"loopback v4", "127.0.0.1", true},
		{"loopback v6", "::1", true},
		{"class A private", "10.0.0.1", true},
		{"class A private high", "10.255.255.255", true},
		{"class B private", "172.16.0.1", true},
		{"class B private high", "172.31.255.255", true},
		{"class C private", "192.168.1.1", true},
		{"link-local", "169.254.1.1", true},
		{"cloud metadata", "169.254.169.254", true},
		{"zero network", "0.0.0.1", true},
		{"unspecified v4", "0.0.0.0", true},
		{"unspecified v6", "::", true},
		{"ULA v6", "fd00::1", true},
		{"link-local v6", "fe80::1", true},
		{"CGNAT", "100.64.0.1", true},
		{"CGNAT high", "100.127.255.255", true},
		{"not CGNAT", "100.128.0.1", false},
		{"public IP", "8.8.8.8", false},
		{"public IP 2", "1.1.1.1", false},
		{"public v6", "2001:4860:4860::8888", false},
		{"not private class B", "172.32.0.1", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ip := net.ParseIP(tt.ip)
			assert.NotNil(t, ip, "failed to parse IP %s", tt.ip)
			assert.Equal(t, tt.expected, IsPrivateOrReservedIP(ip))
			assert.Equal(t, tt.expected, IsPrivateOrReservedAddr(tt.ip))
		})
	}
}

func TestHostDisallowed(t *testing.T) {
	lookup := func(host string) ([]net.IP, error) {
		switch host {
		case "loopback.example.com":
			return []net.IP{net.ParseIP("127.0.0.1")}, nil
		case "unspecified.example.com":
			return []net.IP{net.ParseIP("0.0.0.0")}, nil
		case "private.example.com":
			return []net.IP{net.ParseIP("10.1.2.3")}, nil
		default:
			return nil, &net.DNSError{Err: "no such host", Name: host, IsNotFound: true}
		}
	}
	tests := []struct {
		name string
		host string
		want bool
	}{
		{"unspecified v4", "0.0.0.0", true},
		{"this network low", "0.0.0.1", true},
		{"this network high", "0.255.255.255", true},
		{"unspecified v6", "::", true},
		{"ipv4 compatible this network", "::2", true},
		{"ipv4 mapped this network", "::ffff:0.0.0.1", true},
		{"name resolving to unspecified", "unspecified.example.com", true},
		{"localhost", "localhost", true},
		{"localhost with trailing dot", "LOCALHOST.", true},
		{"localhost localdomain", "localhost.localdomain", true},
		{"kubernetes", "kubernetes", true},
		{"kubernetes.default mixed case", "Kubernetes.Default.", true},
		{"kubernetes API service", "kubernetes.default.svc", true},
		{"kubernetes API service fqdn", "kubernetes.default.svc.cluster.local", true},
		{"other namespace kubernetes service", "kubernetes.openshift-console.svc", false},
		{"other cluster service", "myrepo.default.svc.cluster.local", false},
		{"pod dns name", "mypod.default.pod.cluster.local", false},
		{"ipv4 loopback", "127.0.0.1", true},
		{"loopback range", "127.255.255.254", true},
		{"ipv6 loopback", "::1", true},
		{"rfc1918 10", "10.1.2.3", false},
		{"rfc1918 172.16", "172.24.5.6", false},
		{"rfc1918 192.168", "192.168.1.1", false},
		{"link-local", "169.254.1.1", false},
		{"cloud metadata", "169.254.169.254", true},
		{"aws ipv6 metadata", "fd00:ec2::254", true},
		{"other ula", "fd00::1", false},
		{"ipv6 link-local", "fe80::1", false},
		{"cgnat", "100.64.0.1", false},
		{"public address", "8.8.8.8", false},
		{"name resolving to loopback", "loopback.example.com", true},
		{"name resolving to private", "private.example.com", false},
		{"missing name", "missing.example.com", false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, HostDisallowed(tt.host, lookup))
		})
	}
}

func TestIsPrivateOrReservedAddr_nonIP(t *testing.T) {
	assert.False(t, IsPrivateOrReservedAddr("example.com"))
	assert.False(t, IsPrivateOrReservedAddr(""))
	assert.False(t, IsPrivateOrReservedIP(nil))
}
