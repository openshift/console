package fetcherr

import (
	"errors"
	"testing"
)

func TestSanitizeChartErrorCollapsesHostProbes(t *testing.T) {
	cases := []struct {
		name string
		msg  string
	}{
		{"dns lookup failure", `Get "https://missing.example/charts/a.tgz": dial tcp: lookup missing.example: no such host`},
		{"connection refused", `Get "https://10.0.0.1:8443/charts/a.tgz": dial tcp 10.0.0.1:8443: connect: connection refused`},
		{"client timeout", `Get "https://10.0.0.1:8443/charts/a.tgz": context deadline exceeded (Client.Timeout exceeded while awaiting headers)`},
		{"tls certificate error", `Get "https://192.168.1.9/charts/a.tgz": tls: failed to verify certificate: x509: certificate signed by unknown authority`},
		{"http not found", `failed to fetch https://10.1.2.3:9443/charts/a.tgz : 404 Not Found`},
		{"http server error", `failed to fetch https://10.1.2.3:9443/charts/a.tgz : 500 Internal Server Error`},
		{"chart not found message", `chart not found: http://172.16.0.4/charts/a.tgz`},
		{"redirect limit", `stopped after 10 redirects`},
		{"manifest unknown", `manifest unknown`},
	}
	for _, tt := range cases {
		t.Run(tt.name, func(t *testing.T) {
			err := SanitizeChartError(errors.New(tt.msg))
			if err == nil || err.Error() != ErrChartFileNotFound.Error() {
				t.Fatalf("got %v, want %q", err, ErrChartFileNotFound.Error())
			}
		})
	}
}

func TestSanitizeChartErrorAuthenticationOmitsUpstream(t *testing.T) {
	msg := `failed to fetch https://registry.internal/charts/a.tgz : 401 Unauthorized body=SECRET_PAYLOAD`
	err := SanitizeChartError(errors.New(msg))
	if err == nil || err.Error() != ErrChartAuthentication.Error() {
		t.Fatalf("got %v, want %q", err, ErrChartAuthentication.Error())
	}
}

func TestSanitizeChartErrorDoesNotRelayNonChartPayload(t *testing.T) {
	msg := "cannot load Chart.yaml: yaml: unmarshal errors:\n  line 1: cannot unmarshal !!str `SECRET_PAYLOAD` into chart.Metadata"
	err := SanitizeChartError(errors.New(msg))
	if err == nil || err.Error() != ErrNotHelmChart.Error() {
		t.Fatalf("got %v, want %q", err, ErrNotHelmChart.Error())
	}
}

func TestSanitizeChartLoadErrorKeepsStructuralDetail(t *testing.T) {
	msg := "Chart.yaml file is missing"
	err := SanitizeChartLoadError(errors.New(msg))
	if err == nil || err.Error() != msg {
		t.Fatalf("got %v, want %q", err, msg)
	}

	leaky := errors.New("file '/tmp/x.tgz' does not appear to be a gzipped archive; got 'text/html' SECRET_PAYLOAD")
	err = SanitizeChartLoadError(leaky)
	if err == nil || err.Error() != ErrNotHelmChart.Error() {
		t.Fatalf("got %v, want %q", err, ErrNotHelmChart.Error())
	}
}

func TestSanitizeChartErrorPreservesPostFetchFailures(t *testing.T) {
	msg := "check error: chart Install failure: dial tcp 10.0.0.1:6443: connect: connection refused"
	err := SanitizeChartError(errors.New(msg))
	if err.Error() != msg {
		t.Fatalf("got %q, want %q", err.Error(), msg)
	}

	version := errors.New(`chart "mychart" matching 1.2.401 not found in redhat-helm-repo index. (try 'helm repo update')`)
	if got := SanitizeChartError(version); got.Error() != version.Error() {
		t.Fatalf("got %q, want %q", got.Error(), version.Error())
	}
}

func TestSanitizeChartErrorFetchQueryDoesNotExposeDetails(t *testing.T) {
	dial := `Get "https://10.1.2.3/charts/a.tgz?x=install failure": dial tcp 10.1.2.3:443: connect: connection refused`
	err := SanitizeChartError(errors.New(dial))
	if err == nil || err.Error() != ErrChartFileNotFound.Error() {
		t.Fatalf("got %v, want %q", err, ErrChartFileNotFound.Error())
	}

	fetched := `failed to fetch https://10.1.2.3/charts/a.tgz?x=not found in repo index : 500 Internal Server Error body=SECRET_PAYLOAD`
	err = SanitizeChartError(errors.New(fetched))
	if err == nil || err.Error() != ErrChartFileNotFound.Error() {
		t.Fatalf("got %v, want %q", err, ErrChartFileNotFound.Error())
	}
}

func TestSanitizeChartErrorOmitsUnrecognizedPayload(t *testing.T) {
	msg := "server replied: SECRET_PAYLOAD"
	err := SanitizeChartError(errors.New(msg))
	if err == nil || err.Error() != ErrNotHelmChart.Error() {
		t.Fatalf("got %v, want %q", err, ErrNotHelmChart.Error())
	}
}

func TestSanitizeChartErrorPreservesBodyFreeLocateFailures(t *testing.T) {
	cases := []struct {
		name string
		msg  string
	}{
		{"missing registry client", `unable to lookup chart "oci://example.com/charts/a", missing registry client`},
		{"path not found", `path "/charts/a.tgz" not found`},
		{"tls config creation", `can't create TLS config for client: open ca.crt: no such file or directory`},
		{"content cache unset", `content cache must be set`},
	}
	for _, tt := range cases {
		t.Run(tt.name, func(t *testing.T) {
			err := SanitizeChartError(errors.New(tt.msg))
			if err == nil || err.Error() != tt.msg {
				t.Fatalf("got %v, want %q", err, tt.msg)
			}
		})
	}
}
