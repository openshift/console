package actions

import (
	"fmt"
	"io/ioutil"
	"testing"

	"github.com/stretchr/testify/require"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chartutil"
	kubefake "helm.sh/helm/v3/pkg/kube/fake"
	"helm.sh/helm/v3/pkg/release"
	"helm.sh/helm/v3/pkg/storage"
	"helm.sh/helm/v3/pkg/storage/driver"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	k8sfake "k8s.io/client-go/kubernetes/fake"
)

func TestGetRelease(t *testing.T) {
	tests := []struct {
		testName       string
		chartPath      string
		releaseName    string
		manifestValue  string
		repositoryName string
		helmCRS        []*unstructured.Unstructured
	}{
		{
			testName:       "valid chart path",
			chartPath:      "http://localhost:9181/charts/influxdb-3.0.2.tgz",
			releaseName:    "influxdb",
			manifestValue:  influxdbTemplateValue,
			repositoryName: "without-tls",
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
			testName:      "invalid chart path",
			chartPath:     "http://localhost:9181/influxdb-3.0.1.tgz",
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
				RESTClientGetter: FakeConfig{},
				Releases:         store,
				KubeClient:       &kubefake.PrintingKubeClient{Out: ioutil.Discard},
				Capabilities:     chartutil.DefaultCapabilities,
				Log:              func(format string, v ...interface{}) {},
			}
			client := K8sDynamicClientFromCRs(tt.helmCRS...)
			clientInterface := k8sfake.NewSimpleClientset()
			coreClient := clientInterface.CoreV1()
			_, err := InstallChart("test-namespace", tt.releaseName, tt.chartPath, nil, actionConfig, client, coreClient, true, "")
			fmt.Println(err)
			if tt.testName == "valid chart path" {
				require.NoError(t, err)
				rel, err := GetRelease(tt.releaseName, actionConfig)
				require.NoError(t, err)
				require.Equal(t, tt.releaseName, rel.Name)
				require.Equal(t, release.StatusDeployed, rel.Info.Status)
				require.Equal(t, tt.manifestValue, rel.Manifest)
			} else if tt.testName == "invalid chart path" {
				require.Error(t, err)
			} else if tt.testName == "invalid release name" {
				rel, err := GetRelease(tt.releaseName, actionConfig)
				require.Nil(t, rel)
				require.Error(t, err)
			}
		})
	}
}

func TestGetReleaseWithTlsData(t *testing.T) {
	tests := []struct {
		releaseName     string
		chartPath       string
		chartName       string
		chartVersion    string
		createSecret    bool
		createNamespace bool
		createConfigMap bool
		namespace       string
		repoName        string
		indexEntry      string
		helmCRS         []*unstructured.Unstructured
	}{
		{
			releaseName:     "my-release",
			chartPath:       "https://localhost:9443/charts/mychart-0.1.0.tgz",
			chartName:       "mychart",
			chartVersion:    "0.1.0",
			createSecret:    true,
			createNamespace: true,
			createConfigMap: true,
			namespace:       "test",
			repoName:        "my-repo",
			indexEntry:      "mychart--my-repo",
			helmCRS: []*unstructured.Unstructured{
				{
					Object: map[string]interface{}{
						"apiVersion": "helm.openshift.io/v1beta1",
						"kind":       "ProjectHelmChartRepository",
						"metadata": map[string]interface{}{
							"namespace": "test",
							"name":      "my-repo",
						},
						"spec": map[string]interface{}{
							"connectionConfig": map[string]interface{}{
								"url": "https://localhost:9443",
								"tlsClientConfig": map[string]interface{}{
									"name": "my-repo",
								},
								"ca": map[string]interface{}{
									"name": "my-repo",
								},
							},
						},
					},
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.releaseName, func(t *testing.T) {
			objs := []runtime.Object{}
			store := storage.Init(driver.NewMemory())
			actionConfig := &action.Configuration{
				RESTClientGetter: FakeConfig{},
				Releases:         store,
				KubeClient:       &kubefake.PrintingKubeClient{Out: ioutil.Discard},
				Capabilities:     chartutil.DefaultCapabilities,
				Log:              func(format string, v ...interface{}) {},
			}
			// create a namespace if it is not same as openshift-config
			if tt.createNamespace && tt.namespace != configNamespace {
				nsSpec := &v1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: tt.namespace}}
				objs = append(objs, nsSpec)
			}
			// create a secret in required namespace
			if tt.createSecret {
				certificate, errCert := ioutil.ReadFile("./server.crt")
				require.NoError(t, errCert)
				key, errKey := ioutil.ReadFile("./server.key")
				require.NoError(t, errKey)
				data := map[string][]byte{
					tlsSecretKey:     key,
					tlsSecretCertKey: certificate,
				}
				secretSpec := &v1.Secret{Data: data, ObjectMeta: metav1.ObjectMeta{Name: "my-repo", Namespace: tt.namespace}}
				objs = append(objs, secretSpec)
			}
			//create a configMap in openshift-config namespace
			if tt.createConfigMap {
				caCert, err := ioutil.ReadFile("./cacert.pem")
				require.NoError(t, err)
				data := map[string]string{
					caBundleKey: string(caCert),
				}
				configMapSpec := &v1.ConfigMap{Data: data, ObjectMeta: metav1.ObjectMeta{Name: "my-repo", Namespace: tt.namespace}}
				objs = append(objs, configMapSpec)
			}
			client := K8sDynamicClientFromCRs(tt.helmCRS...)
			clientInterface := k8sfake.NewSimpleClientset(objs...)
			coreClient := clientInterface.CoreV1()
			_, err := InstallChart("test", tt.releaseName, tt.chartPath, nil, actionConfig, client, coreClient, false, tt.indexEntry)
			require.NoError(t, err)
			rel, err := GetRelease(tt.releaseName, actionConfig)
			require.NoError(t, err)
			require.Equal(t, tt.releaseName, rel.Name)
		})
	}
}
