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

func TestGetRelease(t *testing.T) {
	tests := []struct {
		testName      string
		chartPath     string
		releaseName   string
		manifestValue string
	}{
		{
			testName:      "valid chart path",
			chartPath:     "../testdata/influxdb-3.0.2.tgz",
			releaseName:   "influxdb",
			manifestValue: influxdbTemplateValue,
		},
		{
			testName:      "invalid chart path",
			chartPath:     "../testdata/influxdb-3.0.1.tgz",
			releaseName:   "influxdb-2",
			manifestValue: "",
		},
		{
			testName:      "invalid release name",
			chartPath:     "non-exist-path",
			releaseName:   "influxdb-non-exist",
			manifestValue: "",
		},
	}
	for _, tt := range tests {
		t.Run(tt.testName, func(t *testing.T) {
			store := storage.Init(driver.NewMemory())
			actionConfig := &action.Configuration{
				Releases:     store,
				KubeClient:   &kubefake.PrintingKubeClient{Out: ioutil.Discard},
				Capabilities: chartutil.DefaultCapabilities,
				Log:          func(format string, v ...interface{}) {},
			}
			_, err := InstallChart("test-namespace", tt.releaseName, tt.chartPath, nil, actionConfig)
			if tt.testName == "valid chart path" {
				if err != nil {
					t.Error("Error occurred while installing chartPath")
				}
				rel, err := GetRelease(tt.releaseName, actionConfig)
				if err != nil {
					t.Error("Failed to get Release", rel)
				}
				if rel.Name != tt.releaseName {
					t.Error("Release name aren't matching")
				}
				if rel.Info.Status != release.StatusDeployed {
					t.Error("Chart isn't deployed")
				}
				if tt.manifestValue != rel.Manifest {
					t.Error("Manifest values aren't matching")
				}
			} else if tt.testName == "invalid chart path" {
				if err == nil {
					t.Error("Should fail to parse while locating invalid chart")
				}
			} else if tt.testName == "invalid release name" {
				rel, err := GetRelease(tt.releaseName, actionConfig)
				if rel != nil {
					t.Errorf("Release should be null %+v", rel)
				}
				if err == nil {
					t.Error("Error should be thrown in case no release found")
				}
			}
		})
	}
}
