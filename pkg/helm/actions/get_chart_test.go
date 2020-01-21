package actions

import (
	"io/ioutil"
	"testing"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chartutil"
	kubefake "helm.sh/helm/v3/pkg/kube/fake"
	"helm.sh/helm/v3/pkg/storage"
	"helm.sh/helm/v3/pkg/storage/driver"
)

func Test(t *testing.T) {
	tests := []struct {
		name      string
		chartPath string
		chartName string
		errorMsg  string
	}{
		{
			name:      "Valid chart url",
			chartPath: "../testdata/mariadb-7.3.5.tgz",
			chartName: "mariadb",
		},
		{
			name:      "Invalid chart url",
			chartPath: "../testdata/invalid.tgz",
			errorMsg:  `path "../testdata/invalid.tgz" not found`,
		},
	}
	store := storage.Init(driver.NewMemory())
	actionConfig := &action.Configuration{
		Releases:     store,
		KubeClient:   &kubefake.PrintingKubeClient{Out: ioutil.Discard},
		Capabilities: chartutil.DefaultCapabilities,
		Log:          func(format string, v ...interface{}) {},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			chart, err := GetChart(test.chartPath, actionConfig)
			if err != nil && err.Error() != test.errorMsg {
				t.Errorf("Expected error %s but got %s", test.errorMsg, err.Error())
			}
			if err == nil && chart.Metadata.Name != test.chartName {
				t.Errorf("Expected chart name %s but got %s", test.chartName, chart.Metadata.Name)
			}
		})
	}
}
