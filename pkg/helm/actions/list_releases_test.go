package actions

import (
	"io/ioutil"
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

func TestListReleases(t *testing.T) {
	tests := []struct {
		name    string
		release release.Release
	}{
		{
			name: "list valid releases",
			release: release.Release{
				Name:      "test",
				Namespace: "test-namespace",
				Info: &release.Info{
					FirstDeployed: time.Time{},
					Status:        "deployed",
				},
				Chart: &chart.Chart{
					Metadata: &chart.Metadata{
						Name:    "influxdb",
						Version: "3.0.2",
					},
				},
			},
		},
	}
	for _, tt := range tests {
		store := storage.Init(driver.NewMemory())
		t.Run(tt.name, func(t *testing.T) {
			// create fake release
			err := store.Create(&tt.release)
			actionConfig := &action.Configuration{
				Releases:     store,
				KubeClient:   &kubefake.PrintingKubeClient{Out: ioutil.Discard},
				Capabilities: chartutil.DefaultCapabilities,
				Log:          func(format string, v ...interface{}) {},
			}
			rels, err := ListReleases(actionConfig)
			if err != nil {
				t.Error("Error occurred while installing chartPath")
			}
			if len(rels) <= 0 {
				t.Error("Release list should contain 1 release")
			}
			if rels[0].Name != "test" {
				t.Error("Release release name isn't matching")
			}
			if rels[0].Namespace != "test-namespace" {
				t.Error("Namespace isn't matching")
			}
			if rels[0].Info.Status != release.StatusDeployed {
				t.Error("Chart status should be deployed")
			}
			if rels[0].Chart.Metadata.Name != "influxdb" {
				t.Error("Chart name mismatch")
			}
			if rels[0].Chart.Metadata.Version != "3.0.2" {
				t.Error("Chart version mismatch")
			}
		})
	}
}
