package chartverifier

import (
	"fmt"
	"io/ioutil"
	"testing"

	"github.com/stretchr/testify/require"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chartutil"
	kubefake "helm.sh/helm/v3/pkg/kube/fake"
	"helm.sh/helm/v3/pkg/storage"
	"helm.sh/helm/v3/pkg/storage/driver"
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
		KubeClient:       &kubefake.PrintingKubeClient{Out: ioutil.Discard},
		Capabilities:     chartutil.DefaultCapabilities,
		Log:              func(format string, v ...interface{}) {},
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
		KubeClient:       &kubefake.PrintingKubeClient{Out: ioutil.Discard},
		Capabilities:     chartutil.DefaultCapabilities,
		Log:              func(format string, v ...interface{}) {},
	}
	values := map[string]interface{}{
		"provider": "developer-console",
	}
	_, runErr := ChartVerifier("", values, actionConfig)
	require.Error(t, runErr)
	require.Contains(t, fmt.Sprint(runErr), "Chart path is invalid")
}
