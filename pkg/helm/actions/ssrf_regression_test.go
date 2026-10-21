package actions

import (
	"io"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chartutil"
	kubefake "helm.sh/helm/v3/pkg/kube/fake"
	"helm.sh/helm/v3/pkg/storage"
	"helm.sh/helm/v3/pkg/storage/driver"
	k8sfake "k8s.io/client-go/kubernetes/fake"
)

// withStrictChartURLValidation restores the production SSRF guard for the
// duration of a test. TestMain relaxes validateChartURL so the localhost chart
// registries used by the rest of the suite remain reachable; these regression
// tests need the real guard in place.
func withStrictChartURLValidation(t *testing.T) {
	t.Helper()
	prev := validateChartURL
	validateChartURL = validateChartURLStrict
	t.Cleanup(func() { validateChartURL = prev })
}

// TestChartURLSSRFIsRejected proves the SSRF guard fires on a real action code
// path (GetChart's repositoryNamespace=="" short-circuit) before Helm's
// LocateChart is ever asked to fetch the URL. A regression here would re-open
// the confused-deputy SSRF where an authenticated user makes the console pod
// fetch cloud metadata endpoints or in-cluster services.
func TestChartURLSSRFIsRejected(t *testing.T) {
	withStrictChartURLValidation(t)

	store := storage.Init(driver.NewMemory())
	actionConfig := &action.Configuration{
		RESTClientGetter: FakeConfig{},
		Releases:         store,
		KubeClient:       &kubefake.PrintingKubeClient{Out: io.Discard},
		Capabilities:     chartutil.DefaultCapabilities,
	}

	blocked := []struct {
		name string
		url  string
	}{
		{"cloud metadata IP", "http://169.254.169.254/latest/meta-data/x.tgz"},
		{"loopback", "http://127.0.0.1/x.tgz"},
		{"rfc1918", "https://10.1.2.3/x.tgz"},
		{"cluster service", "https://thanos-querier.openshift-monitoring.svc/x.tgz"},
		{"kubernetes api", "https://kubernetes.default.svc/x.tgz"},
		{"unsupported scheme", "file:///etc/passwd"},
	}

	for _, tc := range blocked {
		t.Run(tc.name, func(t *testing.T) {
			client := K8sDynamicClientFromCRs()
			coreClient := k8sfake.NewSimpleClientset().CoreV1()
			// repositoryNamespace == "" takes the raw-URL short-circuit that
			// validateChartURL guards.
			_, err := GetChart(tc.url, actionConfig, "", client, coreClient, true, "")
			require.Error(t, err, "expected %q to be rejected by the SSRF guard", tc.url)
			require.NotContains(t, strings.ToLower(err.Error()), "locating chart",
				"URL reached LocateChart instead of being blocked by the SSRF guard")
		})
	}
}
