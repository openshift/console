package actions

import (
	"io"
	"net"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
	"helm.sh/helm/v4/pkg/action"
	"helm.sh/helm/v4/pkg/chart/common"
	kubefake "helm.sh/helm/v4/pkg/kube/fake"
	"helm.sh/helm/v4/pkg/storage"
	"helm.sh/helm/v4/pkg/storage/driver"
	k8sfake "k8s.io/client-go/kubernetes/fake"
)

// withStrictChartURLValidation restores production URL validation for the
// duration of a test. TestMain skips it so fixture registries stay easy to use.
func withStrictChartURLValidation(t *testing.T) {
	t.Helper()
	prev := validateChartURL
	validateChartURL = validateChartURLStrict
	t.Cleanup(func() { validateChartURL = prev })
}

func TestPrivateChartURLsPassFormatValidation(t *testing.T) {
	prevLookup := lookupChartHost
	lookupChartHost = func(host string) ([]net.IP, error) {
		return nil, &net.DNSError{Err: "no such host", Name: host, IsNotFound: true}
	}
	t.Cleanup(func() { lookupChartHost = prevLookup })

	allowed := []string{
		"https://172.24.5.6/x.tgz",
		"https://192.168.1.1/x.tgz",
		"http://169.254.169.254/latest/meta-data/x.tgz",
		"https://10.1.2.3/x.tgz",
		"https://thanos-querier.openshift-monitoring.svc/x.tgz",
		"https://kubernetes.default.svc/x.tgz",
	}
	for _, raw := range allowed {
		t.Run(raw, func(t *testing.T) {
			require.NoError(t, validateChartURLStrict(raw))
		})
	}
}

func TestLoopbackChartURLsRejected(t *testing.T) {
	rejected := []string{
		"http://127.0.0.1/x.tgz",
		"http://127.0.0.2/x.tgz",
		"http://localhost/x.tgz",
		"oci://localhost:5000/charts/chart",
		"http://[::1]/chart.tgz",
	}
	for _, raw := range rejected {
		t.Run(raw, func(t *testing.T) {
			err := validateChartURLStrict(raw)
			require.Error(t, err)
			require.ErrorContains(t, err, "loopback")
		})
	}
}

// TestMalformedChartURLRejectedBeforeFetch proves a chart reference with the
// wrong scheme is rejected before Helm is asked to fetch it.
func TestMalformedChartURLRejectedBeforeFetch(t *testing.T) {
	withStrictChartURLValidation(t)

	store := storage.Init(driver.NewMemory())
	actionConfig := &action.Configuration{
		RESTClientGetter: FakeConfig{},
		Releases:         store,
		KubeClient:       &kubefake.PrintingKubeClient{Out: io.Discard},
		Capabilities:     common.DefaultCapabilities,
	}

	client := K8sDynamicClientFromCRs()
	coreClient := k8sfake.NewSimpleClientset().CoreV1()
	_, err := GetChart("file:///etc/passwd", actionConfig, "", client, coreClient, true, "")
	require.Error(t, err)
	require.NotContains(t, strings.ToLower(err.Error()), "locating chart")
	require.NotContains(t, err.Error(), "passwd")
}
