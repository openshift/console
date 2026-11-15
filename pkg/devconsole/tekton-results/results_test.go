package tektonresults

import (
	"context"
	"testing"
)

func TestConfigure(t *testing.T) {
	defer Configure("", DefaultCAFile)

	Configure("", "")
	if tlsCertPath != DefaultCAFile {
		t.Errorf("empty CA file: got %q, want default %q", tlsCertPath, DefaultCAFile)
	}

	Configure("tekton-results-api-service.tekton-pipelines.svc.cluster.local:8080", "/var/tekton-results-ca/ca.crt")
	if tlsCertPath != "/var/tekton-results-ca/ca.crt" {
		t.Errorf("CA file: got %q", tlsCertPath)
	}
	// With a host set, no TektonResult or Route lookup happens (nil client).
	for _, mode := range []string{"in-cluster", "off-cluster"} {
		host, err := getTRHost(context.Background(), nil, mode)
		if err != nil || host != "tekton-results-api-service.tekton-pipelines.svc.cluster.local:8080" {
			t.Errorf("%s: got %q, %v", mode, host, err)
		}
	}
}
