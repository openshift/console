package proxy

import (
	"fmt"
	"net"
	"net/url"
	"strings"
	"time"
)

// List of allowed URLs for SSRF protection
var allowedURLs = []string{
	// ArtifactHub Public API
	"https://artifacthub.io/api/v1",

	// Tekton Results installed in the cluster
	"http://tekton-results-api-service",
	"https://tekton-results-api-service",
}

func isAllowedURL(requestURL string) bool {
	for _, allowedURL := range allowedURLs {
		if strings.HasPrefix(requestURL, allowedURL) {
			return true
		}
	}
	return false
}

// Helper function to check if an IP is private
func isPrivateIP(ip net.IP) bool {
	privateIPBlocks := []*net.IPNet{
		// IPv4 private ranges (RFC 1918)
		{IP: net.IPv4(10, 0, 0, 0), Mask: net.CIDRMask(8, 32)},
		{IP: net.IPv4(172, 16, 0, 0), Mask: net.CIDRMask(12, 32)},
		{IP: net.IPv4(192, 168, 0, 0), Mask: net.CIDRMask(16, 32)},
		// IPv4 link-local addresses (169.254.0.0/16)
		{IP: net.IPv4(169, 254, 0, 0), Mask: net.CIDRMask(16, 32)},
		// IPv6 link-local addresses (fe80::/10)
		{IP: net.ParseIP("fe80::"), Mask: net.CIDRMask(10, 128)},
		// IPv6 private range (fc00::/7)
		{IP: net.ParseIP("fc00::"), Mask: net.CIDRMask(7, 128)},
		// IPv6 loopback address (::1)
		{IP: net.ParseIP("::1"), Mask: net.CIDRMask(128, 128)},
	}

	for _, block := range privateIPBlocks {
		if block.Contains(ip) {
			return true
		}
	}
	return false
}

// Whitelist-based check to only allow public IP addresses (e.g., from the internet)
func isPublicIP(ip net.IP) bool {
	if ip.IsLoopback() || ip.IsLinkLocalUnicast() || ip.IsPrivate() || isPrivateIP(ip) {
		return false
	}
	return true
}

// Helper function to resolve the DNS hostname and check consistency
func resolveHostname(hostname string) ([]net.IP, error) {
	ips, err := net.LookupIP(hostname)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve hostname: %v", err)
	}

	// Introduce DNS rebinding protection: re-check the IPs after a small delay to prevent DNS rebinding
	time.Sleep(2 * time.Second)
	ips2, err := net.LookupIP(hostname)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve hostname after delay: %v", err)
	}

	// Ensure IP consistency between the two resolutions
	for i := range ips {
		if !ips[i].Equal(ips2[i]) {
			return nil, fmt.Errorf("potential DNS rebinding detected")
		}
	}

	return ips, nil
}

// Validate URL for SSRF protection
func validateRequestURL(requestUrl string) error {

	// Check if the URL is whitelisted
	if isAllowedURL(requestUrl) {
		return nil
	}

	// Parse the provided URL
	parsedUrl, err := url.Parse(requestUrl)
	if err != nil {
		return fmt.Errorf("failed to parse URL: %v", err)
	}

	// Check if scheme is missing, and prepend "https://"
	if parsedUrl.Scheme == "" {
		parsedUrl.Scheme = "https"
	}

	// Allow only http or https schemes
	if parsedUrl.Scheme != "http" && parsedUrl.Scheme != "https" {
		return fmt.Errorf("only http or https schemes are allowed")
	}

	// Disallow certain schemes via URL encoding tricks or unexpected cases
	normalizedScheme := strings.ToLower(parsedUrl.Scheme)
	if normalizedScheme != "http" && normalizedScheme != "https" {
		return fmt.Errorf("invalid scheme detected: %s", parsedUrl.Scheme)
	}

	// Resolve the hostname to IP addresses and check DNS rebinding
	ips, err := resolveHostname(parsedUrl.Hostname())
	if err != nil {
		return fmt.Errorf("failed to resolve IPs for hostname: %v", err)
	}

	// Check if any resolved IP is private, loopback, or link-local (i.e., non-public)
	for _, ip := range ips {
		if !isPublicIP(ip) {
			return fmt.Errorf("access to private or internal IP detected")
		}
	}

	// Disallow internal or local network hostnames (e.g., localhost, cluster.local)
	if parsedUrl.Hostname() == "localhost" ||
		strings.HasSuffix(parsedUrl.Hostname(), ".cluster.local") {
		return fmt.Errorf("access to internal or local hostnames is not allowed")
	}

	// Ensure the request URL does not contain any suspicious characters or invalid formats
	if strings.Contains(parsedUrl.String(), "..") || strings.Contains(parsedUrl.String(), "\\") {
		return fmt.Errorf("potential path traversal or malformed URL detected")
	}

	return nil
}
