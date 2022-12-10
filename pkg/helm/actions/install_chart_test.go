package actions

import (
	"fmt"
	"io/ioutil"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chartutil"
	kubefake "helm.sh/helm/v3/pkg/kube/fake"
	"helm.sh/helm/v3/pkg/release"
	"helm.sh/helm/v3/pkg/storage"
	"helm.sh/helm/v3/pkg/storage/driver"
	helmTime "helm.sh/helm/v3/pkg/time"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	k8sfake "k8s.io/client-go/kubernetes/fake"
	"k8s.io/client-go/rest"
)

type FakeConfig struct {
	action.RESTClientGetter
}

func (f FakeConfig) ToRESTConfig() (config *rest.Config, err error) {
	return &rest.Config{}, nil
}

func TestInstallChart(t *testing.T) {
	tests := []struct {
		releaseName  string
		chartPath    string
		chartName    string
		chartVersion string
		indexEntry   string
		mamespace    string
		helmCRS      []*unstructured.Unstructured
	}{
		{
			releaseName:  "myrelease",
			chartPath:    "http://localhost:9181/charts/influxdb-3.0.2.tgz",
			chartName:    "influxdb",
			chartVersion: "3.0.2",
			indexEntry:   "influxdb--without-tls",
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
			releaseName:  "invalid chart path",
			chartPath:    "http://localhost:9181/charts/influxdb-3.0.1.tgz",
			chartName:    "influxdb",
			chartVersion: "3.0.1",
			indexEntry:   "influxdb--without-tls",
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
	}
	for _, tt := range tests {
		t.Run(tt.releaseName, func(t *testing.T) {
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
			rel, err := InstallChart("test", tt.releaseName, tt.chartPath, nil, actionConfig, client, coreClient, true, tt.indexEntry)
			if tt.releaseName == "valid chart path" {
				require.NoError(t, err)
				require.Equal(t, "test", rel.Name)
				require.Equal(t, "test-namespace", rel.Namespace)
				require.Equal(t, release.StatusDeployed, rel.Info.Status)
				require.Equal(t, tt.chartName, rel.Chart.Metadata.Name)
				require.Equal(t, tt.chartVersion, rel.Chart.Metadata.Version)
				require.Equal(t, tt.chartPath, rel.Chart.Metadata.Annotations["chart_url"])
			} else if tt.releaseName == "invalid chart path" {
				require.Error(t, err)
			}
		})
	}
}

func TestInstallChartWithTlsData(t *testing.T) {
	//create the server.key and server.crt
	tests := []struct {
		releaseName     string
		chartPath       string
		chartName       string
		chartVersion    string
		createSecret    bool
		createNamespace bool
		createConfigMap bool
		namespace       string
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
				secretSpec := &v1.ConfigMap{Data: data, ObjectMeta: metav1.ObjectMeta{Name: "my-repo", Namespace: tt.namespace}}
				objs = append(objs, secretSpec)
			}
			client := K8sDynamicClientFromCRs(tt.helmCRS...)
			clientInterface := k8sfake.NewSimpleClientset(objs...)
			coreClient := clientInterface.CoreV1()
			rel, err := InstallChart(tt.namespace, tt.releaseName, tt.chartPath, nil, actionConfig, client, coreClient, false, "")
			require.NoError(t, err)
			require.Equal(t, tt.releaseName, rel.Name)
			require.Equal(t, tt.chartVersion, rel.Chart.Metadata.Version)
			require.Equal(t, tt.chartPath, rel.Chart.Metadata.Annotations["chart_url"])
		})
	}
}
func TestInstallChartBasicAuth(t *testing.T) {
	//create the server.key and server.crt
	tests := []struct {
		releaseName     string
		chartPath       string
		chartName       string
		chartVersion    string
		createSecret    bool
		createNamespace bool
		createConfigMap bool
		namespace       string
		helmCRS         []*unstructured.Unstructured
		indexEntry      string
	}{
		{
			releaseName:     "my-release",
			chartPath:       "http://localhost:8181/charts/mychart-0.1.0.tgz",
			chartName:       "mychart",
			indexEntry:      "mychart--my-repo",
			chartVersion:    "0.1.0",
			createSecret:    true,
			createNamespace: true,
			createConfigMap: true,
			namespace:       "test",
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
				data := map[string][]byte{
					username: []byte("AzureDiamond"),
					password: []byte("hunter2"),
				}
				if tt.namespace == "" {
					tt.namespace = configNamespace
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
				secretSpec := &v1.ConfigMap{Data: data, ObjectMeta: metav1.ObjectMeta{Name: "my-repo", Namespace: configNamespace}}
				objs = append(objs, secretSpec)
			}
			client := K8sDynamicClientFromCRs(tt.helmCRS...)
			clientInterface := k8sfake.NewSimpleClientset(objs...)
			coreClient := clientInterface.CoreV1()
			rel, err := InstallChart(tt.namespace, tt.releaseName, tt.chartPath, nil, actionConfig, client, coreClient, false, tt.indexEntry)
			require.NoError(t, err)
			require.Equal(t, tt.releaseName, rel.Name)
			require.Equal(t, tt.chartVersion, rel.Chart.Metadata.Version)
			require.Equal(t, tt.chartPath, rel.Chart.Metadata.Annotations["chart_url"])
		})
	}
}

func TestInstallChartAsync(t *testing.T) {
	tests := []struct {
		releaseName  string
		chartPath    string
		createSecret bool
		chartName    string
		chartVersion string
		indexEntry   string
		namespace    string
		requireError bool
		helmCRS      []*unstructured.Unstructured
	}{
		{
			releaseName:  "myrelease",
			chartPath:    "http://localhost:9181/charts/influxdb-3.0.2.tgz",
			chartName:    "influxdb",
			chartVersion: "3.0.2",
			createSecret: true,
			namespace:    "test",
			indexEntry:   "influxdb--without-tls",
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
	}
	for _, tt := range tests {
		t.Run(tt.releaseName, func(t *testing.T) {
			store := storage.Init(driver.NewMemory())
			actionConfig := &action.Configuration{
				RESTClientGetter: FakeConfig{},
				Releases:         store,
				KubeClient:       &kubefake.PrintingKubeClient{Out: ioutil.Discard},
				Capabilities:     chartutil.DefaultCapabilities,
				Log:              func(format string, v ...interface{}) {},
			}
			objs := []runtime.Object{}
			client := K8sDynamicClientFromCRs(tt.helmCRS...)
			clientInterface := k8sfake.NewSimpleClientset(objs...)
			coreClient := clientInterface.CoreV1()
			var rel *Secret
			var err error
			go func() {
				rel, err = InstallChartAsync(tt.namespace, tt.releaseName, tt.chartPath, nil, actionConfig, client, coreClient, false, tt.indexEntry)
				fmt.Println(rel, err)
				if tt.releaseName == "myrelease" {
					require.NoError(t, err)
					require.Equal(t, fmt.Sprintf("sh.helm.release.v1.%v.v1", tt.releaseName), rel.SecretName)
				} else if tt.releaseName == "invalid chart path" {
					require.Error(t, err)
				}
			}()
			if tt.requireError == false {
				secretsDriver := driver.NewSecrets(coreClient.Secrets(tt.namespace))
				r := release.Release{
					Name:      tt.releaseName,
					Namespace: tt.namespace,
					Info: &release.Info{
						FirstDeployed: helmTime.Time{},
						Status:        "pending-install",
					},
					Version: 1,
					Chart: &chart.Chart{
						Metadata: &chart.Metadata{
							Name:        "influxdb",
							Version:     "3.0.2",
							Annotations: map[string]string{"chart_url": tt.chartPath},
						},
					},
				}
				time.Sleep(10 * time.Second)
				err = secretsDriver.Create(fmt.Sprintf("sh.helm.release.v1.%v.v1", tt.releaseName), &r)
				require.NoError(t, err)
			}

		})
	}
}
