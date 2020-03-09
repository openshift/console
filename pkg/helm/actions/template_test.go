package actions

import (
	"encoding/json"
	"io/ioutil"
	"testing"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chartutil"
	kubefake "helm.sh/helm/v3/pkg/kube/fake"
)

func TestRenderManifests(t *testing.T) {
	tests := []struct {
		testType      string
		name          string
		chart         string
		values        []byte
		releaseName   string
		templateValue string
	}{
		{
			testType:      "valid chartPath",
			name:          "template-with-default-values",
			chart:         "../testdata/influxdb-3.0.2.tgz",
			values:        nil,
			releaseName:   "test-influxdb",
			templateValue: influxdbTemplateValue,
		},
		{
			testType:      "valid chartPath",
			name:          "template-with-custom-values",
			chart:         "../testdata/influxdb-3.0.2.tgz",
			values:        []byte("{\"service\": { \"type\": \"NodePort\" }, \"persistence\": {\"size\": \"16Gi\"}}"),
			releaseName:   "test",
			templateValue: influxdbCustomValueTemplate,
		},
		{
			testType:      "invalid chartPath",
			name:          "template-with-invalid-chart-path",
			chart:         "../testdata/influxdb-3.0.1.tgz",
			values:        []byte("{\"service\": { \"type\": \"NodePort\" }, \"persistence\": {\"size\": \"16Gi\"}}"),
			releaseName:   "test",
			templateValue: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			actionConfig := &action.Configuration{
				Releases:     nil,
				KubeClient:   &kubefake.PrintingKubeClient{Out: ioutil.Discard},
				Capabilities: chartutil.DefaultCapabilities,
				Log:          func(format string, v ...interface{}) {},
			}

			var m map[string]interface{}
			if tt.values != nil {
				err := json.Unmarshal(tt.values, &m)
				if err != nil {
					t.Errorf("Failed to parse values to map[string]interface{}")
				}

				txt, err := RenderManifests(tt.releaseName, tt.chart, m, actionConfig)

				if tt.testType == "valid chartPath" {
					if err != nil {
						t.Error("Should not throw error for valid chart path")
					}
					if tt.templateValue != txt {
						t.Error("Template text isn't matching")
					}
				} else if tt.testType == "invalid chartPath" {
					if err == nil {
						t.Error("Should throw an error while locating invalid chart")
					}
				}
			}
		})
	}
}
