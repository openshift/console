package webhooks

import (
	"net"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestIsPrivateIP(t *testing.T) {
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
		{"zero network", "0.0.0.1", true},
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
			assert.Equal(t, tt.expected, isPrivateIP(ip))
		})
	}
}

func TestIsInternalHostname(t *testing.T) {
	tests := []struct {
		name     string
		hostname string
		expected bool
	}{
		{"kubernetes", "kubernetes", true},
		{"kubernetes.default", "kubernetes.default", true},
		{"localhost", "localhost", true},
		{"svc suffix", "my-service.my-ns.svc", true},
		{"svc.cluster.local suffix", "my-service.my-ns.svc.cluster.local", true},
		{"pod.cluster.local suffix", "10-0-0-1.my-ns.pod.cluster.local", true},
		{"case insensitive", "Kubernetes", true},
		{"github.com", "github.com", false},
		{"gitlab.com", "gitlab.com", false},
		{"custom host", "git.example.com", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.expected, isInternalHostname(tt.hostname))
		})
	}
}

func TestValidateHostURL(t *testing.T) {
	// Override DNS resolution for testing
	originalResolveIP := resolveIP
	defer func() { resolveIP = originalResolveIP }()

	publicIP := []net.IP{net.ParseIP("203.0.113.1")}
	privateIP := []net.IP{net.ParseIP("10.0.0.1")}

	tests := []struct {
		name      string
		rawURL    string
		mockIPs   []net.IP
		mockErr   error
		wantErr   bool
		errSubstr string
	}{
		{
			name:    "valid HTTPS URL",
			rawURL:  "https://github.com",
			mockIPs: publicIP,
			wantErr: false,
		},
		{
			name:    "valid HTTPS URL with path",
			rawURL:  "https://github.example.com/api",
			mockIPs: publicIP,
			wantErr: false,
		},
		{
			name:      "HTTP not allowed",
			rawURL:    "http://github.com",
			mockIPs:   publicIP,
			wantErr:   true,
			errSubstr: "only https",
		},
		{
			name:      "empty scheme",
			rawURL:    "github.com",
			mockIPs:   publicIP,
			wantErr:   true,
			errSubstr: "only https",
		},
		{
			name:      "query string rejected",
			rawURL:    "https://github.com?foo=bar",
			mockIPs:   publicIP,
			wantErr:   true,
			errSubstr: "query or fragment",
		},
		{
			name:      "fragment rejected",
			rawURL:    "https://github.com#section",
			mockIPs:   publicIP,
			wantErr:   true,
			errSubstr: "query or fragment",
		},
		{
			name:      "userinfo rejected",
			rawURL:    "https://user:pass@github.com",
			mockIPs:   publicIP,
			wantErr:   true,
			errSubstr: "user info",
		},
		{
			name:      "kubernetes internal hostname",
			rawURL:    "https://kubernetes.default",
			wantErr:   true,
			errSubstr: "cluster-internal",
		},
		{
			name:      "svc internal hostname",
			rawURL:    "https://my-service.my-ns.svc",
			wantErr:   true,
			errSubstr: "cluster-internal",
		},
		{
			name:      "svc.cluster.local hostname",
			rawURL:    "https://my-service.my-ns.svc.cluster.local",
			wantErr:   true,
			errSubstr: "cluster-internal",
		},
		{
			name:      "localhost",
			rawURL:    "https://localhost",
			wantErr:   true,
			errSubstr: "cluster-internal",
		},
		{
			name:      "resolves to private IP",
			rawURL:    "https://internal.example.com",
			mockIPs:   privateIP,
			wantErr:   true,
			errSubstr: "private IP",
		},
		{
			name:      "DNS resolution fails",
			rawURL:    "https://nonexistent.invalid",
			mockErr:   &net.DNSError{Err: "no such host", Name: "nonexistent.invalid"},
			wantErr:   true,
			errSubstr: "failed to resolve",
		},
		{
			name:    "trailing slash stripped",
			rawURL:  "https://github.com/",
			mockIPs: publicIP,
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resolveIP = func(host string) ([]net.IP, error) {
				if tt.mockErr != nil {
					return nil, tt.mockErr
				}
				return tt.mockIPs, nil
			}

			result, err := validateHostURL(tt.rawURL)
			if tt.wantErr {
				assert.Error(t, err)
				if tt.errSubstr != "" {
					assert.Contains(t, err.Error(), tt.errSubstr)
				}
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
				assert.Equal(t, "https", result.Scheme)
			}
		})
	}
}
