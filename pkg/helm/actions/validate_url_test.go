package actions

import (
	"net"
	"strings"
	"testing"
)

func TestValidateChartURL(t *testing.T) {
	// Stub DNS so tests are deterministic and offline. Hosts map to the IPs
	// returned by resolveChartHost.
	resolved := map[string][]net.IP{
		"charts.example.com":   {net.ParseIP("93.184.216.34")},   // public
		"evil.example.com":     {net.ParseIP("169.254.169.254")}, // rebinds to metadata
		"mixed.example.com":    {net.ParseIP("93.184.216.34"), net.ParseIP("10.0.0.5")},
		"registry.example.com": {net.ParseIP("93.184.216.34")},
	}
	orig := resolveChartHost
	resolveChartHost = func(host string) ([]net.IP, error) {
		if ips, ok := resolved[host]; ok {
			return ips, nil
		}
		return nil, &net.DNSError{Err: "no such host", Name: host, IsNotFound: true}
	}
	t.Cleanup(func() { resolveChartHost = orig })

	tests := []struct {
		name    string
		url     string
		wantErr bool
		errHint string
	}{
		{name: "valid https tgz", url: "https://charts.example.com/mychart-1.0.0.tgz", wantErr: false},
		{name: "valid oci", url: "oci://registry.example.com/charts/mychart", wantErr: false},
		{name: "empty", url: "", wantErr: true, errHint: "required"},
		{name: "unsupported scheme file", url: "file:///etc/passwd", wantErr: true, errHint: "scheme"},
		{name: "unsupported scheme gopher", url: "gopher://charts.example.com/x", wantErr: true, errHint: "scheme"},
		{name: "internal svc host", url: "https://thanos-querier.openshift-monitoring.svc/x.tgz", wantErr: true, errHint: "cluster-internal"},
		{name: "kubernetes host", url: "https://kubernetes.default.svc/x.tgz", wantErr: true, errHint: "cluster-internal"},
		{name: "localhost", url: "http://localhost/x.tgz", wantErr: true, errHint: "cluster-internal"},
		{name: "literal metadata IP", url: "http://169.254.169.254/latest/meta-data/x.tgz", wantErr: true, errHint: "private or reserved"},
		{name: "literal loopback IP", url: "http://127.0.0.1/x.tgz", wantErr: true, errHint: "private or reserved"},
		{name: "literal rfc1918 IP", url: "https://10.1.2.3/x.tgz", wantErr: true, errHint: "private or reserved"},
		{name: "dns rebind to metadata", url: "https://evil.example.com/x.tgz", wantErr: true, errHint: "private or reserved"},
		{name: "one resolved IP private", url: "https://mixed.example.com/x.tgz", wantErr: true, errHint: "private or reserved"},
		{name: "unresolvable host", url: "https://does-not-exist.example.com/x.tgz", wantErr: true, errHint: "resolve"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateChartURLStrict(tt.url)
			if tt.wantErr && err == nil {
				t.Fatalf("expected error for %q, got nil", tt.url)
			}
			if !tt.wantErr && err != nil {
				t.Fatalf("expected no error for %q, got %v", tt.url, err)
			}
			if tt.wantErr && tt.errHint != "" && !strings.Contains(err.Error(), tt.errHint) {
				t.Errorf("error %q does not contain hint %q", err.Error(), tt.errHint)
			}
		})
	}
}
