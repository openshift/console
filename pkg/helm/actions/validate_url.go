package actions

import (
	"fmt"
	"net"
	"net/url"
	"slices"
	"strings"

	"github.com/openshift/console/pkg/utils"
)

// resolveChartHost is a package-level indirection so tests can stub DNS resolution.
var resolveChartHost = net.LookupIP

// internalChartHostSuffixes and internalChartHostExact block cluster-internal
// hostnames that do not resolve through public DNS to a routable address but are
// nonetheless reachable from the console pod (e.g. the in-cluster API server and
// services). Mirrors the protection applied to Helm repository URLs in the
// chartproxy package.
var (
	internalChartHostSuffixes = []string{
		".svc",
		".svc.cluster.local",
		".pod.cluster.local",
	}
	internalChartHostExact = []string{
		"kubernetes",
		"kubernetes.default",
		"localhost",
	}
)

func isInternalChartHost(hostname string) bool {
	h := strings.ToLower(hostname)
	if slices.Contains(internalChartHostExact, h) {
		return true
	}
	return slices.ContainsFunc(internalChartHostSuffixes, func(suffix string) bool {
		return strings.HasSuffix(h, suffix)
	})
}

// validateChartURL guards against server-side request forgery before a
// user-supplied chart reference is handed to Helm's LocateChart, which will
// fetch it from the console pod. Helm applies no such restriction, so every
// call site that passes an untrusted URL must validate it first.
//
// It is a package-level variable so tests, whose chart registries run on
// localhost, can relax it; production code must not reassign it.
var validateChartURL = validateChartURLStrict

// ValidateChartURL exposes the SSRF guard to callers outside this package (e.g.
// the chart-verifier handler) that fetch a user-supplied chart URL without going
// through LocateChart. It delegates to the same validateChartURL seam so tests
// relax it uniformly.
func ValidateChartURL(raw string) error {
	return validateChartURL(raw)
}

// validateChartURLStrict accepts only oci://, http:// and https:// references
// (the schemes Helm can download) and rejects any reference whose host is a
// cluster-internal name or resolves to a private or reserved IP address. This
// closes the confused-deputy SSRF where an authenticated user could make the
// console fetch cloud metadata endpoints, kubelets, or other in-cluster
// services.
func validateChartURLStrict(raw string) error {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return fmt.Errorf("chart URL is required")
	}

	parsed, err := url.Parse(raw)
	if err != nil {
		return fmt.Errorf("invalid chart URL: %v", err)
	}

	switch strings.ToLower(parsed.Scheme) {
	case "oci", "http", "https":
	default:
		return fmt.Errorf("unsupported chart URL scheme %q: only oci, http and https are allowed", parsed.Scheme)
	}

	host := parsed.Hostname()
	if host == "" {
		return fmt.Errorf("chart URL must have a hostname")
	}

	if isInternalChartHost(host) {
		return fmt.Errorf("chart URL must not target cluster-internal services")
	}

	// If the host is a literal IP, check it directly; otherwise resolve it and
	// reject if any resolved address is private or reserved.
	if ip := net.ParseIP(host); ip != nil {
		if utils.IsPrivateOrReservedIP(ip) {
			return fmt.Errorf("chart URL must not resolve to a private or reserved IP address")
		}
		return nil
	}

	ips, err := resolveChartHost(host)
	if err != nil {
		return fmt.Errorf("failed to resolve chart URL host %q: %v", host, err)
	}
	for _, ip := range ips {
		if utils.IsPrivateOrReservedIP(ip) {
			return fmt.Errorf("chart URL must not resolve to a private or reserved IP address")
		}
	}

	return nil
}
