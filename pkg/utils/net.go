package utils

import (
	"errors"
	"fmt"
	"net"
	"strings"
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

// thisNetworkIPv4 is 0.0.0.0/8, "this" network. It is not a chart-hosting range.
var thisNetworkIPv4 *net.IPNet

// cloudMetadataIPv4 is the instance metadata address used by AWS, Azure, GCP,
// and similar platforms. Chart files are not hosted there.
var cloudMetadataIPv4 = net.IPv4(169, 254, 169, 254).To4()

func init() {
	for _, cidr := range privateOrReservedCIDRs {
		_, block, err := net.ParseCIDR(cidr)
		if err != nil {
			panic(fmt.Sprintf("invalid CIDR %q: %v", cidr, err))
		}
		privateOrReservedRanges = append(privateOrReservedRanges, block)
	}
	var err error
	_, thisNetworkIPv4, err = net.ParseCIDR("0.0.0.0/8")
	if err != nil {
		panic(err)
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

// ErrDisallowedHost is returned when a chart or repository URL names a
// disallowed host.
var ErrDisallowedHost = errors.New("URL must not target localhost, a loopback address, an unspecified address, the 0.0.0.0/8 network, the cloud metadata address, or the Kubernetes API hostname")

// HostDisallowed reports whether host is disallowed for a chart or
// repository fetch. Literal addresses are checked directly. Other names are
// passed to lookup; a lookup failure is not treated as disallowed, and a nil
// lookup skips resolution.
func HostDisallowed(host string, lookup func(string) ([]net.IP, error)) bool {
	host = strings.TrimRight(strings.ToLower(strings.TrimSpace(host)), ".")
	switch host {
	case "localhost", "localhost.localdomain":
		return true
	}
	if isKubernetesAPIHost(host) {
		return true
	}
	if host == "" {
		return false
	}
	if ip := net.ParseIP(host); ip != nil {
		return isDisallowedHostIP(ip)
	}
	if lookup == nil {
		return false
	}
	ips, err := lookup(host)
	if err != nil {
		return false
	}
	for _, ip := range ips {
		if isDisallowedHostIP(ip) {
			return true
		}
	}
	return false
}

// isKubernetesAPIHost reports whether host names the in-cluster Kubernetes
// API Service. That Service is published as kubernetes, kubernetes.default,
// kubernetes.default.svc, and kubernetes.default.svc.<cluster-domain>.
// Other Service names, including a Service named kubernetes in another
// namespace, are not this host.
func isKubernetesAPIHost(host string) bool {
	switch host {
	case "kubernetes", "kubernetes.default", "kubernetes.default.svc":
		return true
	}
	return strings.HasPrefix(host, "kubernetes.default.svc.")
}

func isDisallowedHostIP(ip net.IP) bool {
	if ip == nil {
		return false
	}
	if ip.IsLoopback() || ip.IsUnspecified() {
		return true
	}
	if v4 := ip.To4(); v4 != nil {
		return thisNetworkIPv4.Contains(v4) || v4.Equal(cloudMetadataIPv4)
	}
	// Deprecated IPv4-compatible form (::a.b.c.d): 96 zero bits, then an IPv4
	// address. Block that form when the embedded address is in 0.0.0.0/8.
	ip16 := ip.To16()
	if ip16 == nil || !allZero(ip16[:12]) {
		return false
	}
	embedded := net.IPv4(ip16[12], ip16[13], ip16[14], ip16[15]).To4()
	return thisNetworkIPv4.Contains(embedded)
}

func allZero(b []byte) bool {
	for _, c := range b {
		if c != 0 {
			return false
		}
	}
	return true
}
