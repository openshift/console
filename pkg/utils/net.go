package utils

import (
	"fmt"
	"net"
)

// privateOrReservedCIDRs are address ranges blocked for SSRF protection.
// They cover RFC 1918 private IPv4, loopback, link-local, "this" network,
// CGNAT (RFC 6598), and the IPv6 equivalents (unspecified, loopback, ULA,
// link-local).
var privateOrReservedCIDRs = []string{
	"10.0.0.0/8",     // RFC 1918 private
	"172.16.0.0/12",  // RFC 1918 private
	"192.168.0.0/16", // RFC 1918 private
	"127.0.0.0/8",    // IPv4 loopback
	"169.254.0.0/16", // IPv4 link-local
	"0.0.0.0/8",      // "this" network
	"100.64.0.0/10",  // CGNAT (RFC 6598)
	"::/128",         // IPv6 unspecified
	"::1/128",        // IPv6 loopback
	"fc00::/7",       // IPv6 unique local (ULA)
	"fe80::/10",      // IPv6 link-local
}

var privateOrReservedRanges []*net.IPNet

func init() {
	for _, cidr := range privateOrReservedCIDRs {
		_, block, err := net.ParseCIDR(cidr)
		if err != nil {
			panic(fmt.Sprintf("invalid CIDR %q: %v", cidr, err))
		}
		privateOrReservedRanges = append(privateOrReservedRanges, block)
	}
}

// IsPrivateOrReservedIP reports whether ip is unsuitable as an outbound
// target under SSRF protections (private, loopback, link-local, unspecified,
// CGNAT, or link-local multicast).
func IsPrivateOrReservedIP(ip net.IP) bool {
	if ip == nil {
		return false
	}
	if ip.IsLinkLocalMulticast() {
		return true
	}
	for _, block := range privateOrReservedRanges {
		if block.Contains(ip) {
			return true
		}
	}
	return false
}

// IsPrivateOrReservedAddr reports whether s parses as an IP address that is
// private or reserved. Strings that are not IP addresses return false.
func IsPrivateOrReservedAddr(s string) bool {
	return IsPrivateOrReservedIP(net.ParseIP(s))
}
