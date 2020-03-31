package actions

import (
	"io/ioutil"
	"testing"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chartutil"
	kubefake "helm.sh/helm/v3/pkg/kube/fake"
	"helm.sh/helm/v3/pkg/release"
	"helm.sh/helm/v3/pkg/storage"
	"helm.sh/helm/v3/pkg/storage/driver"
)

func TestInstallChart(t *testing.T) {
	tests := []struct {
		releaseName  string
		chartPath    string
		chartName    string
		chartVersion string
	}{
		{
			releaseName:  "valid chart path",
			chartPath:    "../testdata/influxdb-3.0.2.tgz",
			chartName:    "influxdb",
			chartVersion: "3.0.2",
		},
		{
			releaseName:  "invalid chart path",
			chartPath:    "../testdata/influxdb-3.0.1.tgz",
			chartName:    "influxdb",
			chartVersion: "3.0.2",
		},
	}
	for _, tt := range tests {
		t.Run(tt.releaseName, func(t *testing.T) {
			store := storage.Init(driver.NewMemory())
			actionConfig := &action.Configuration{
				Releases:     store,
				KubeClient:   &kubefake.PrintingKubeClient{Out: ioutil.Discard},
				Capabilities: chartutil.DefaultCapabilities,
				Log:          func(format string, v ...interface{}) {},
			}
			rel, err := InstallChart("test-namespace", "test", tt.chartPath, nil, actionConfig)
			if tt.releaseName == "valid chart path" {
				if err != nil {
					t.Error("Error occurred while installing chartPath")
				}
				if rel.Name != "test" {
					t.Error("Release testName isn't matching")
				}
				if rel.Namespace != "test-namespace" {
					t.Error("Namespace testName isn't matching")
				}
				if rel.Info.Status != release.StatusDeployed {
					t.Error("Chart status should be deployed")
				}
				if rel.Chart.Metadata.Name != tt.chartName {
					t.Error("Chart name mismatch")
				}
				if rel.Chart.Metadata.Version != tt.chartVersion {
					t.Error("Chart version mismatch")
				}
			} else if tt.releaseName == "invalid chart path" {
				if err == nil {
					t.Error("Should fail to parse while locating invalid chart")
				}
			}
		})
	}
}
