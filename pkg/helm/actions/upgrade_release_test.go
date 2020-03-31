package actions

import (
	"errors"
	"io/ioutil"
	"strings"
	"testing"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chartutil"
	kubefake "helm.sh/helm/v3/pkg/kube/fake"
	"helm.sh/helm/v3/pkg/release"
	"helm.sh/helm/v3/pkg/storage"
	"helm.sh/helm/v3/pkg/storage/driver"
	"helm.sh/helm/v3/pkg/time"
)

func TestUpgradeRelease(t *testing.T) {
	tests := []struct {
		testName     string
		chartPath    string
		chartName    string
		chartVersion string
		err          error
	}{
		{
			testName:     "upgrade valid release should return successful response",
			chartPath:    "../testdata/influxdb-3.0.2.tgz",
			chartName:    "influxdb",
			chartVersion: "3.0.2",
			err:          nil,
		},
		{
			testName:     "upgrade invalid chart upgrade should fail",
			chartPath:    "../testdata/influxdb-3.0.1.tgz",
			chartName:    "influxdb",
			chartVersion: "3.0.2",
			err:          errors.New(`path "../testdata/influxdb-3.0.1.tgz" not found`),
		},
		{
			testName:     "upgrade release with no chart_url should upgrade successfully",
			chartPath:    "",
			chartName:    "influxdb",
			chartVersion: "3.0.2",
			err:          nil,
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

			r := release.Release{
				Name:      "test",
				Namespace: "test-namespace",
				Info: &release.Info{
					FirstDeployed: time.Time{},
					Status:        "deployed",
				},
				Version: 1,
				Chart: &chart.Chart{
					Metadata: &chart.Metadata{
						Name:    "influxdb",
						Version: "3.0.2",
					},
				},
			}

			store.Create(&r)

			rel, err := UpgradeRelease("test-namespace", "test", tt.chartPath, nil, actionConfig)
			if err == nil && tt.err != nil {
				t.Error(err)
			}
			if err != nil && err.Error() != tt.err.Error() {
				t.Error("Error occurred while installing chartPath")
			}
			if rel != nil {
				if rel.Name != r.Name {
					t.Error("Release testName isn't matching")
				}
				if rel.Namespace != r.Namespace {
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
				if rel.Version != 2 {
					t.Error("Upgrade should increase the version count")
				}
			}
		})
	}
}

func TestUpgradeNonExistRelease(t *testing.T) {
	tests := []struct {
		testName     string
		chartPath    string
		chartName    string
		chartVersion string
		err          error
	}{
		{
			testName:     "upgrade non exist release should return no revision found",
			chartPath:    "",
			chartName:    "influxdb",
			chartVersion: "3.0.2",
			err:          ErrReleaseRevisionNotFound,
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

			_, err := UpgradeRelease("test-namespace", "test", tt.chartPath, nil, actionConfig)
			if err == nil && tt.err != nil {
				t.Error(err)
			}
			if err != nil && err.Error() != tt.err.Error() {
				t.Error("Error occurred while installing chartPath")
			}
		})
	}
}

func TestUpgradeReleaseWithCustomValues(t *testing.T) {
	tests := []struct {
		testName     string
		chartPath    string
		chartName    string
		chartVersion string
		values       map[string]interface{}
		err          error
	}{
		{
			testName:     "upgrade valid release with custom values should return successful response",
			chartPath:    "../testdata/influxdb-3.0.2.tgz",
			chartName:    "influxdb",
			chartVersion: "3.0.2",
			values: map[string]interface{}{
				"service": map[string]interface{}{"type": "NodePort"},
			},
			err: nil,
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

			r := release.Release{
				Name:      "test",
				Namespace: "test-namespace",
				Info: &release.Info{
					FirstDeployed: time.Time{},
					Status:        "deployed",
				},
				Version: 1,
				Chart: &chart.Chart{
					Metadata: &chart.Metadata{
						Name:    "influxdb",
						Version: "3.0.2",
					},
				},
			}

			store.Create(&r)

			rel, err := UpgradeRelease("test-namespace", "test", tt.chartPath, tt.values, actionConfig)
			if err == nil && tt.err != nil {
				t.Error(err)
			}
			if err != nil && err.Error() != tt.err.Error() {
				t.Error("Error occurred while installing chartPath")
			}
			if rel != nil {
				if rel.Name != r.Name {
					t.Error("Release testName isn't matching")
				}
				if rel.Namespace != r.Namespace {
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
				if rel.Version != 2 {
					t.Error("Upgrade should increase the version count")
				}

				// check if service type set to NodePort.
				if !strings.Contains(rel.Manifest, `type: NodePort`) {
					t.Error("custom value mismatch")
				}

				// assert if chart values are being set as expected
				assertValues(t, tt.values, rel.Config)
			}
		})
	}
}

func assertValues(t *testing.T, expected map[string]interface{}, received map[string]interface{}) {
	for k, v := range expected {
		if val, ok := received[k]; ok {
			switch val.(type) {
			case string:
				if strings.Compare(val.(string), v.(string)) != 0 {
					t.Errorf("Value mismatch expected is %s and received is %s", val.(string), v.(string))
				}
			case int:
				if val.(int) != v.(int) {
					t.Errorf("Value mismatch expected is %d and received is %d", val.(int), v.(int))
				}
			case map[string]interface{}:
				assertValues(t, v.(map[string]interface{}), val.(map[string]interface{}))
			}
		}
	}
}
