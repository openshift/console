package webhooks

import (
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
	"syscall"
	"time"
)

var privateRanges []*net.IPNet

func init() {
	for _, cidr := range []string{
		"10.0.0.0/8",
		"172.16.0.0/12",
		"192.168.0.0/16",
		"127.0.0.0/8",
		"169.254.0.0/16",
		"0.0.0.0/8",
		"100.64.0.0/10",
		"::1/128",
		"fc00::/7",
		"fe80::/10",
	} {
		_, block, err := net.ParseCIDR(cidr)
		if err != nil {
			panic(fmt.Sprintf("invalid CIDR %q: %v", cidr, err))
		}
		privateRanges = append(privateRanges, block)
	}
}

func isPrivateIP(ip net.IP) bool {
	for _, block := range privateRanges {
		if block.Contains(ip) {
			return true
		}
	}
	return false
}

var internalHostSuffixes = []string{
	".svc",
	".svc.cluster.local",
	".pod.cluster.local",
}

var internalHostExact = []string{
	"kubernetes",
	"kubernetes.default",
	"localhost",
}

func isInternalHostname(hostname string) bool {
	h := strings.ToLower(hostname)
	for _, exact := range internalHostExact {
		if h == exact {
			return true
		}
	}
	for _, suffix := range internalHostSuffixes {
		if strings.HasSuffix(h, suffix) {
			return true
		}
	}
	return false
}

// resolveIP is a package-level variable so tests can override DNS resolution.
var resolveIP = net.LookupIP

func validateHostURL(rawURL string) (*url.URL, error) {
	parsed, err := url.Parse(rawURL)
	if err != nil {
		return nil, fmt.Errorf("invalid URL: %v", err)
	}

	if parsed.Scheme != "https" {
		return nil, fmt.Errorf("only https URLs are allowed, got %q", parsed.Scheme)
	}

	if parsed.Hostname() == "" {
		return nil, fmt.Errorf("URL must have a hostname")
	}

	if parsed.RawQuery != "" || parsed.Fragment != "" {
		return nil, fmt.Errorf("URL must not contain query or fragment")
	}

	if parsed.User != nil {
		return nil, fmt.Errorf("URL must not contain user info")
	}

	if isInternalHostname(parsed.Hostname()) {
		return nil, fmt.Errorf("URL must not target cluster-internal services")
	}

	ips, err := resolveIP(parsed.Hostname())
	if err != nil {
		return nil, fmt.Errorf("failed to resolve hostname %q: %v", parsed.Hostname(), err)
	}
	for _, ip := range ips {
		if isPrivateIP(ip) {
			return nil, fmt.Errorf("URL must not resolve to a private IP address")
		}
	}

	parsed.Path = strings.TrimRight(parsed.Path, "/")

	return parsed, nil
}

func ssrfDialControl(network, address string, c syscall.RawConn) error {
	host, _, err := net.SplitHostPort(address)
	if err != nil {
		return fmt.Errorf("invalid address: %v", err)
	}
	ip := net.ParseIP(host)
	if ip != nil && isPrivateIP(ip) {
		return fmt.Errorf("connections to private IP addresses are not allowed")
	}
	return nil
}

func newSafeHTTPClient() *http.Client {
	return &http.Client{
		Timeout: 30 * time.Second,
		Transport: &http.Transport{
			Proxy: http.ProxyFromEnvironment,
			DialContext: (&net.Dialer{
				Timeout: 10 * time.Second,
				Control: ssrfDialControl,
			}).DialContext,
		},
	}
}
