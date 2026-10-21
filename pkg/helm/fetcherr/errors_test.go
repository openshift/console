package fetcherr

import (
	"errors"
	"testing"
)

func TestSanitizeChartErrorCollapsesHostProbes(t *testing.T) {
	cases := []string{
		`Get "https://missing.example/charts/a.tgz": dial tcp: lookup missing.example: no such host`,
		`Get "https://10.0.0.1:8443/charts/a.tgz": dial tcp 10.0.0.1:8443: connect: connection refused`,
		`Get "https://10.0.0.1:8443/charts/a.tgz": context deadline exceeded (Client.Timeout exceeded while awaiting headers)`,
		`Get "https://192.168.1.9/charts/a.tgz": tls: failed to verify certificate: x509: certificate signed by unknown authority`,
		`failed to fetch https://10.1.2.3:9443/charts/a.tgz : 404 Not Found`,
		`failed to fetch https://10.1.2.3:9443/charts/a.tgz : 500 Internal Server Error`,
		`chart not found: http://172.16.0.4/charts/a.tgz`,
		`stopped after 10 redirects`,
		`manifest unknown`,
	}
	for _, msg := range cases {
		t.Run(msg, func(t *testing.T) {
			err := SanitizeChartError(errors.New(msg))
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
