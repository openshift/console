package proxy

import (
	"testing"
)

func TestValidateRequestURL(t *testing.T) {
	// Table-driven test cases
	tests := []struct {
		name        string
		requestURL  string
		expectError bool
	}{
		// Valid URLs (public internet)
		{"Valid http URL", "http://example.com", false},
		{"Valid https URL", "https://www.google.com", false},
		{"Valid https with subdomain", "https://artifacthub.io/api/v1/packages/helm/tekton/tekton-pipeline", false},

		// Invalid URLs (private IPs)
		{"Private IP - 192.168.x.x", "http://192.168.1.1", true},
		{"Private IP - 10.x.x.x", "http://10.0.0.1", true},
		{"Private IP - 172.16.x.x", "http://172.16.0.1", true},
		{"IPv6 Link-local Address", "http://[fe80::1]", true},
		{"IPv6 Unique Local Address", "http://[fc00::1]", true},

		// Invalid URLs (loopback and localhost)
		{"Loopback IP", "http://127.0.0.1", true},
		{"IPv6 Loopback", "http://[::1]", true},
		{"Localhost", "http://localhost", true},

		// Invalid URL Schemes
		{"Unsupported Scheme - ftp", "ftp://example.com", true},
		{"Unsupported Scheme - file", "file://example.com", true},

		// DNS Rebinding and Hostname Checks
		{"Cluster Local Hostname", "http://internal.cluster.local", true},
		{"Invalid Path Traversal", "http://example.com/../admin", true},

		// Edge Cases
		{"Empty URL", "", true},
		{"Mixed case scheme", "HtTP://example.com", false}, // Case-insensitive scheme
	}

	// Run through each test case
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateRequestURL(tt.requestURL)

			if (err != nil) != tt.expectError {
				t.Errorf("validateRequestURL() for URL %s: expected error = %v, got = %v, err = %v",
					tt.requestURL, tt.expectError, (err != nil), err)
			}
		})
	}
}
