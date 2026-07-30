package actions

import (
	"io"
	"testing"

	"helm.sh/helm/v4/pkg/action"
	"helm.sh/helm/v4/pkg/chart/common"
	chart "helm.sh/helm/v4/pkg/chart/v2"
	kubefake "helm.sh/helm/v4/pkg/kube/fake"
	releasecommon "helm.sh/helm/v4/pkg/release/common"
	releasev1 "helm.sh/helm/v4/pkg/release/v1"
	"helm.sh/helm/v4/pkg/storage"
	"helm.sh/helm/v4/pkg/storage/driver"
	"time"
)

func TestListReleases(t *testing.T) {
	tests := []struct {
		name    string
		release releasev1.Release
	}{
		{
			name: "list valid releases",
			release: releasev1.Release{
				Name:      "test",
				Namespace: "test-namespace",
				Info: &releasev1.Info{
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
				KubeClient:   &kubefake.PrintingKubeClient{Out: io.Discard},
				Capabilities: common.DefaultCapabilities,
			}
			rels, err := ListReleases(actionConfig, true)
			if err != nil {
				t.Error("Error occurred while installing chartPath")
			}
			if len(rels) <= 0 {
				t.Error("Release list should contain 1 release")
			}
			if rels[0].Name != "test" {
				t.Error("Release name isn't matching")
			}
			if rels[0].Namespace != "test-namespace" {
				t.Error("Namespace isn't matching")
			}
			if rels[0].Info.Status != releasecommon.StatusDeployed {
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
