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

	allowed := []struct {
		name string
		raw  string
	}{
		{"rfc1918 172.16", "https://172.24.5.6/x.tgz"},
		{"rfc1918 192.168", "https://192.168.1.1/x.tgz"},
		{"link-local", "http://169.254.1.1/x.tgz"},
		{"ipv6 link-local", "http://[fe80::1]/x.tgz"},
		{"cgnat", "https://100.64.0.1/x.tgz"},
		{"rfc1918 10", "https://10.1.2.3/x.tgz"},
		{"cluster service", "https://thanos-querier.openshift-monitoring.svc/x.tgz"},
		{"other namespace kubernetes service", "https://kubernetes.openshift-console.svc/x.tgz"},
		{"pod dns name", "https://mypod.default.pod.cluster.local/x.tgz"},
	}
	for _, tt := range allowed {
		t.Run(tt.name, func(t *testing.T) {
			require.NoError(t, validateChartURLStrict(tt.raw))
		})
	}
}

func TestLoopbackChartURLsRejected(t *testing.T) {
	rejected := []struct {
		name string
		raw  string
	}{
		{"ipv4 loopback", "http://127.0.0.1/x.tgz"},
		{"loopback range", "http://127.0.0.2/x.tgz"},
		{"localhost", "http://localhost/x.tgz"},
		{"localhost oci", "oci://localhost:5000/charts/chart"},
		{"ipv6 loopback", "http://[::1]/chart.tgz"},
		{"unspecified ipv4", "http://0.0.0.0/x.tgz"},
		{"this network", "http://0.1.2.3/x.tgz"},
		{"unspecified ipv6", "http://[::]/chart.tgz"},
		{"cloud metadata", "http://169.254.169.254/latest/meta-data/x.tgz"},
		{"kubernetes hostname", "https://kubernetes/x.tgz"},
		{"kubernetes.default oci", "oci://kubernetes.default/charts/chart"},
		{"kubernetes API service", "https://kubernetes.default.svc/x.tgz"},
		{"kubernetes API service fqdn", "https://kubernetes.default.svc.cluster.local/x.tgz"},
	}
	for _, tt := range rejected {
		t.Run(tt.name, func(t *testing.T) {
			err := validateChartURLStrict(tt.raw)
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
