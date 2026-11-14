package utils

import (
	"errors"
	"net"
	"strings"
)

// thisNetworkIPv4 is 0.0.0.0/8, "this" network. It is not a chart-hosting range.
var thisNetworkIPv4 = mustCIDR("0.0.0.0/8")

// cloudMetadataIPv4 is the instance metadata address used by AWS, Azure, GCP,
// and similar platforms. Chart files are not hosted there.
var cloudMetadataIPv4 = net.IPv4(169, 254, 169, 254).To4()

// cloudMetadataIPv6 is the AWS instance metadata address. Other addresses in
// fd00::/8 are not this address.
var cloudMetadataIPv6 = net.ParseIP("fd00:ec2::254")

func mustCIDR(cidr string) *net.IPNet {
	_, block, err := net.ParseCIDR(cidr)
	if err != nil {
		panic(err)
	}
	return block
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
	if ip.Equal(cloudMetadataIPv6) {
		return true
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
