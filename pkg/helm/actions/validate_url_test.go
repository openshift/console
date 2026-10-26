package actions

import (
	"net"
	"strings"
	"testing"
)

func TestValidateChartURL(t *testing.T) {
	tests := []struct {
		name    string
		url     string
		wantErr bool
		errHint string
	}{
		{name: "valid https tgz", url: "https://charts.example.com/mychart-1.0.0.tgz", wantErr: false},
		{name: "valid oci", url: "oci://registry.example.com/charts/mychart", wantErr: false},
		{name: "private ipv4 tgz", url: "https://10.1.2.3/x.tgz", wantErr: false},
		{name: "rfc1918 172.16 tgz", url: "https://172.24.5.6/x.tgz", wantErr: false},
		{name: "rfc1918 192.168 tgz", url: "https://192.168.1.1/x.tgz", wantErr: false},
		{name: "name resolving to private ip", url: "https://private.example.com/x.tgz", wantErr: false},
		{name: "loopback tgz", url: "http://127.0.0.1/x.tgz", wantErr: true, errHint: "loopback"},
		{name: "loopback range tgz", url: "http://127.0.0.2/x.tgz", wantErr: true, errHint: "loopback"},
		{name: "link-local metadata tgz", url: "http://169.254.169.254/latest/meta-data/x.tgz", wantErr: false},
		{name: "localhost tgz", url: "http://localhost/x.tgz", wantErr: true, errHint: "loopback"},
		{name: "localhost oci", url: "oci://localhost:5000/charts/chart", wantErr: true, errHint: "loopback"},
		{name: "name resolving to loopback", url: "https://loopback.example.com/x.tgz", wantErr: true, errHint: "loopback"},
		{name: "cluster service tgz", url: "https://thanos-querier.openshift-monitoring.svc/x.tgz", wantErr: false},
		{name: "kubernetes service tgz", url: "https://kubernetes.default.svc/x.tgz", wantErr: false},
		{name: "unresolvable host tgz", url: "https://does-not-exist.example.com/x.tgz", wantErr: false},
		{name: "ipv6 loopback tgz", url: "http://[::1]/x.tgz", wantErr: true, errHint: "loopback"},
		{name: "empty", url: "", wantErr: true, errHint: "required"},
		{name: "unsupported scheme file", url: "file:///etc/passwd", wantErr: true, errHint: "invalid chart URL"},
		{name: "unsupported scheme gopher", url: "gopher://charts.example.com/x.tgz", wantErr: true, errHint: "invalid chart URL"},
		{name: "missing archive suffix", url: "https://charts.example.com/index.yaml", wantErr: true, errHint: "invalid chart URL"},
		{name: "internal address without suffix", url: "http://172.28.1.76:8849/nacos", wantErr: true, errHint: "invalid chart URL"},
	}

	prevLookup := lookupChartHost
	lookupChartHost = func(host string) ([]net.IP, error) {
		switch host {
		case "loopback.example.com":
			return []net.IP{net.ParseIP("127.0.0.1")}, nil
		case "private.example.com":
			return []net.IP{net.ParseIP("10.1.2.3")}, nil
		default:
			return nil, &net.DNSError{Err: "no such host", Name: host, IsNotFound: true}
		}
	}
	t.Cleanup(func() { lookupChartHost = prevLookup })

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
