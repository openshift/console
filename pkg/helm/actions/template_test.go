package actions

import (
	"encoding/json"
	"io/ioutil"
	"testing"

	"github.com/stretchr/testify/require"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chartutil"
	kubefake "helm.sh/helm/v3/pkg/kube/fake"
	"helm.sh/helm/v3/pkg/storage"
	"helm.sh/helm/v3/pkg/storage/driver"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	k8sfake "k8s.io/client-go/kubernetes/fake"
)

func TestRenderManifests(t *testing.T) {
	tests := []struct {
		testType      string
		name          string
		chart         string
		values        []byte
		releaseName   string
		templateValue string
		namespace     string
		indexEntry    string
		helmCRS       []*unstructured.Unstructured
	}{
		{
			testType:      "valid chartPath",
			name:          "template-with-default-values",
			chart:         "http://localhost:9181/charts/influxdb-3.0.2.tgz",
			values:        nil,
			releaseName:   "test-influxdb",
			indexEntry:    "influxdb--without-tls",
			templateValue: influxdbTemplateValue,
			helmCRS: []*unstructured.Unstructured{
				{
					Object: map[string]interface{}{
						"apiVersion": "helm.openshift.io/v1beta1",
						"kind":       "HelmChartRepository",
						"metadata": map[string]interface{}{
							"name": "without-tls",
						},
						"spec": map[string]interface{}{
							"connectionConfig": map[string]interface{}{
								"url": "http://localhost:9181",
							},
						},
					},
				},
			},
		},
		{
			testType:      "valid chartPath",
			name:          "template-with-custom-values",
			chart:         "http://localhost:9181/charts/influxdb-3.0.2.tgz",
			values:        []byte("{\"service\": { \"type\": \"NodePort\" }, \"persistence\": {\"size\": \"16Gi\"}}"),
			releaseName:   "test",
			indexEntry:    "influxdb--without-tls",
			templateValue: influxdbCustomValueTemplate,
			helmCRS: []*unstructured.Unstructured{
				{
					Object: map[string]interface{}{
						"apiVersion": "helm.openshift.io/v1beta1",
						"kind":       "HelmChartRepository",
						"metadata": map[string]interface{}{
							"name": "without-tls",
						},
						"spec": map[string]interface{}{
							"connectionConfig": map[string]interface{}{
								"url": "http://localhost:9181",
							},
						},
					},
				},
			},
		},
		{
			testType:      "invalid chartPath",
			name:          "http://localhost:9181/charts/influxdb-3.0.1.tgz",
			chart:         "../testdata/influxdb-3.0.1.tgz",
			values:        []byte("{\"service\": { \"type\": \"NodePort\" }, \"persistence\": {\"size\": \"16Gi\"}}"),
			releaseName:   "test",
			indexEntry:    "influxdb--without-tls",
			templateValue: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			objs := []runtime.Object{}
			store := storage.Init(driver.NewMemory())
			actionConfig := &action.Configuration{
				RESTClientGetter: FakeConfig{},
				Releases:         store,
				KubeClient:       &kubefake.PrintingKubeClient{Out: ioutil.Discard},
				Capabilities:     chartutil.DefaultCapabilities,
				Log:              func(format string, v ...interface{}) {},
			}

			var m map[string]interface{}
			if tt.values != nil {
				err := json.Unmarshal(tt.values, &m)
				if err != nil {
					t.Errorf("Failed to parse values to map[string]interface{}")
				}
				client := K8sDynamicClientFromCRs(tt.helmCRS...)
				clientInterface := k8sfake.NewSimpleClientset(objs...)
				coreClient := clientInterface.CoreV1()
				txt, err := RenderManifests(tt.releaseName, tt.chart, m, actionConfig, client, coreClient, tt.namespace, tt.indexEntry, true)

				if tt.testType == "valid chartPath" {
					require.NoError(t, err)
					require.Equal(t, txt, tt.templateValue)
				} else if tt.testType == "invalid chartPath" {
					require.Error(t, err)
				}
			}
		})
	}
}

func TestRenderManifestsBasicAuth(t *testing.T) {
	tests := []struct {
		testType      string
		name          string
		chart         string
		values        []byte
		releaseName   string
		templateValue string
		namespace     string
		indexEntry    string
		helmCRS       []*unstructured.Unstructured
	}{
		{
			testType:      "valid chartPath",
			name:          "template-with-default-values",
			chart:         "http://localhost:8181/charts/influxdb-3.0.2.tgz",
			values:        nil,
			releaseName:   "test-influxdb",
			templateValue: influxdbTemplateValue,
			helmCRS: []*unstructured.Unstructured{
				{
					Object: map[string]interface{}{
						"apiVersion": "helm.openshift.io/v1beta1",
						"kind":       "HelmChartRepository",
						"metadata": map[string]interface{}{
							"name":      "my-repo",
							"namespace": "test",
						},
						"spec": map[string]interface{}{
							"connectionConfig": map[string]interface{}{
								"url": "http://localhost:8181",
								"basicAuthConfig": map[string]interface{}{
									"name":      "my-repo",
									"namespace": "test",
								},
							},
						},
					},
				},
			},
		},
		{
			testType:      "invalid chartPath",
			name:          "http://localhost:8080/charts/influxdb-3.0.1.tgz",
			chart:         "../testdata/influxdb-3.0.1.tgz",
			values:        []byte("{\"service\": { \"type\": \"NodePort\" }, \"persistence\": {\"size\": \"16Gi\"}}"),
			releaseName:   "test",
			indexEntry:    "influxdb--without-tls",
			templateValue: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			objs := []runtime.Object{}
			store := storage.Init(driver.NewMemory())
			actionConfig := &action.Configuration{
				RESTClientGetter: FakeConfig{},
				Releases:         store,
				KubeClient:       &kubefake.PrintingKubeClient{Out: ioutil.Discard},
				Capabilities:     chartutil.DefaultCapabilities,
				Log:              func(format string, v ...interface{}) {},
			}

			var m map[string]interface{}
			if tt.values != nil {
				err := json.Unmarshal(tt.values, &m)
				if err != nil {
					t.Errorf("Failed to parse values to map[string]interface{}")
				}
				client := K8sDynamicClientFromCRs(tt.helmCRS...)
				clientInterface := k8sfake.NewSimpleClientset(objs...)
				coreClient := clientInterface.CoreV1()
				txt, err := RenderManifests(tt.releaseName, tt.chart, m, actionConfig, client, coreClient, tt.namespace, tt.indexEntry, true)

				if tt.testType == "valid chartPath" {
					require.NoError(t, err)
					require.Equal(t, txt, tt.templateValue)
				} else if tt.testType == "invalid chartPath" {
					require.Error(t, err)
				}
			}
		})
	}
}
