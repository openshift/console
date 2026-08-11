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

func TestIsPrivateOrReservedAddr_nonIP(t *testing.T) {
	assert.False(t, IsPrivateOrReservedAddr("example.com"))
	assert.False(t, IsPrivateOrReservedAddr(""))
	assert.False(t, IsPrivateOrReservedIP(nil))
}
