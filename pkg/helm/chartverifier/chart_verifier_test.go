package chartverifier

import (
	"encoding/json"
	"fmt"
	"io"
	"testing"

	"github.com/stretchr/testify/require"
	"helm.sh/helm/v4/pkg/action"
	"helm.sh/helm/v4/pkg/chart/common"
	kubefake "helm.sh/helm/v4/pkg/kube/fake"
	"helm.sh/helm/v4/pkg/storage"
	"helm.sh/helm/v4/pkg/storage/driver"
	"k8s.io/client-go/rest"
)

type FakeConfig struct {
	action.RESTClientGetter
}

func (f FakeConfig) ToRESTConfig() (config *rest.Config, err error) {
	return &rest.Config{}, nil
}
func TestVerifyApi(t *testing.T) {

	chartUri := "../testdata/chart-0.1.0-v3.valid.tgz"
	store := storage.Init(driver.NewMemory())
	actionConfig := &action.Configuration{
		RESTClientGetter: FakeConfig{},
		Releases:         store,
		KubeClient:       &kubefake.PrintingKubeClient{Out: io.Discard},
		Capabilities:     common.DefaultCapabilities,
	}
	values := map[string]interface{}{
		"provider": "developer-console",
	}
	report, err := ChartVerifier(chartUri, values, actionConfig)
	require.NoError(t, err)
	require.NotEmpty(t, report)
}

func TestVerifyApiChartUrlNotPresent(t *testing.T) {
	store := storage.Init(driver.NewMemory())
	actionConfig := &action.Configuration{
		RESTClientGetter: FakeConfig{},
		Releases:         store,
		KubeClient:       &kubefake.PrintingKubeClient{Out: io.Discard},
		Capabilities:     common.DefaultCapabilities,
	}
	values := map[string]interface{}{
		"provider": "developer-console",
	}
	_, runErr := ChartVerifier("", values, actionConfig)
	require.Error(t, runErr)
	require.Contains(t, fmt.Sprint(runErr), "Chart path is invalid")
}

func TestSanitizeVerifierSummaryStripsProvFetchDetail(t *testing.T) {
	summary := `{
		"results": {
			"passed": "1",
			"failed": "4",
			"message": [
				"Signature verification failed : get error was Get \"http://10.0.0.1:9/a.tgz.prov\": dial tcp 10.0.0.1:9: connect: connection refused",
				"Signature verification failed. get prov file response code was 500",
				"Chart is signed : Signature verification not required. error downloading http://10.0.0.1:9/a.tgz.prov: dial tcp 10.0.0.1:9: connect: connection refused",
				"Missing required annotations: [charts.openshift.io/name]"
			]
		}
	}`
	got, err := sanitizeVerifierSummary(summary)
	require.NoError(t, err)
	var parsed verifierResults
	require.NoError(t, json.Unmarshal([]byte(got), &parsed))
	require.Equal(t, []string{
		"Signature verification failed",
		"Signature verification failed",
		"Chart is signed : Signature verification not required",
		"Missing required annotations: [charts.openshift.io/name]",
	}, parsed.Results.Messages)
}
