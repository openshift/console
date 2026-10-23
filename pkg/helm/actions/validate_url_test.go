package actions

import (
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
		{name: "loopback tgz", url: "http://127.0.0.1/x.tgz", wantErr: false},
		{name: "link-local metadata tgz", url: "http://169.254.169.254/latest/meta-data/x.tgz", wantErr: false},
		{name: "localhost tgz", url: "http://localhost/x.tgz", wantErr: false},
		{name: "cluster service tgz", url: "https://thanos-querier.openshift-monitoring.svc/x.tgz", wantErr: false},
		{name: "kubernetes service tgz", url: "https://kubernetes.default.svc/x.tgz", wantErr: false},
		{name: "unresolvable host tgz", url: "https://does-not-exist.example.com/x.tgz", wantErr: false},
		{name: "ipv6 loopback tgz", url: "http://[::1]/x.tgz", wantErr: false},
		{name: "empty", url: "", wantErr: true, errHint: "required"},
		{name: "unsupported scheme file", url: "file:///etc/passwd", wantErr: true, errHint: "invalid chart URL"},
		{name: "unsupported scheme gopher", url: "gopher://charts.example.com/x.tgz", wantErr: true, errHint: "invalid chart URL"},
		{name: "missing archive suffix", url: "https://charts.example.com/index.yaml", wantErr: true, errHint: "invalid chart URL"},
		{name: "internal address without suffix", url: "http://172.28.1.76:8849/nacos", wantErr: true, errHint: "invalid chart URL"},
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
