package actions

import (
	"fmt"
	"io"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"helm.sh/helm/v4/pkg/action"
	"helm.sh/helm/v4/pkg/chart/common"
	chart "helm.sh/helm/v4/pkg/chart/v2"
	kubefake "helm.sh/helm/v4/pkg/kube/fake"
	rcommon "helm.sh/helm/v4/pkg/release/common"
	releaseV1 "helm.sh/helm/v4/pkg/release/v1"
	"helm.sh/helm/v4/pkg/storage"
	"helm.sh/helm/v4/pkg/storage/driver"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	k8sfake "k8s.io/client-go/kubernetes/fake"
	helmTime "time"
)

func TestUpgradeReleaseWithoutDependencies(t *testing.T) {
	tests := []struct {
		chartName       string
		chartPath       string
		chartUrl        string
		chartVersion    string
		createNamespace bool
		createSecret    bool
		helmCRS         []*unstructured.Unstructured
		indexEntry      string
		namespace       string
		requireErr      bool
		testName        string
	}{
		{
			testName:     "upgrade valid release should return successful response",
			chartPath:    "http://localhost:9181/charts/influxdb-3.0.2.tgz",
			chartName:    "influxdb",
			chartVersion: "3.0.2",
			indexEntry:   "influxdb--without-tls",
			namespace:    "test",
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
			testName:     "upgrade invalid chart upgrade should fail",
			chartPath:    "../testdata/influxdb-3.0.1.tgz",
			chartName:    "influxdb",
			chartVersion: "3.0.2",
			indexEntry:   "influxdb--without-tls",
			requireErr:   true,
			namespace:    "test",
		},
		{
			testName:     "upgrade release with no chart_url without dependencies should upgrade successfully",
			chartPath:    "",
			chartName:    "influxdb",
			chartVersion: "3.0.2",
			indexEntry:   "influxdb--without-tls",
			namespace:    "test",
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
		t.Run(tt.testName, func(t *testing.T) {
			objs := []runtime.Object{}

			store := storage.Init(driver.NewMemory())
			actionConfig := &action.Configuration{
				RESTClientGetter: FakeConfig{},
				Releases:         store,
				KubeClient:       &kubefake.PrintingKubeClient{Out: io.Discard},
				Capabilities:     common.DefaultCapabilities,
			}

			if tt.createNamespace && tt.namespace != configNamespace {
				nsSpec := &v1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: tt.namespace}}
				objs = append(objs, nsSpec)
			}

			r := releaseV1.Release{
				Name:      "test",
				Namespace: tt.namespace,
				Info: &releaseV1.Info{
					FirstDeployed: helmTime.Time{},
					Status:        "deployed",
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
			store.Create(&r)

			if tt.createSecret {
				certificate, errCert := os.ReadFile("./server.crt")
				require.NoError(t, errCert)
				key, errKey := os.ReadFile("./server.key")
				require.NoError(t, errKey)
				data := map[string][]byte{
					tlsSecretKey:     key,
					tlsSecretCertKey: certificate,
					username:         []byte("AzureDiamond"),
					password:         []byte("hunter2"),
				}
				if tt.namespace == "" {
					tt.namespace = configNamespace
				}
				secretSpec := &v1.Secret{Data: data, ObjectMeta: metav1.ObjectMeta{Name: "with-basic-auth", Namespace: tt.namespace}}
				objs = append(objs, secretSpec)
			}

			client := K8sDynamicClientFromCRs(tt.helmCRS...)
			clientInterface := k8sfake.NewSimpleClientset(objs...)
			coreClient := clientInterface.CoreV1()
			rel, err := UpgradeRelease(tt.namespace, "test", tt.chartPath, nil, actionConfig, client, coreClient, false, tt.indexEntry)
			if tt.requireErr {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
				require.Equal(t, r.Name, rel.Name)
				require.Equal(t, r.Namespace, rel.Namespace)
				require.Equal(t, rcommon.StatusDeployed, rel.Info.Status)
				require.Equal(t, tt.chartVersion, rel.Chart.Metadata.Version)
				require.Equal(t, 2, rel.Version)
				require.Equal(t, r.Chart.Metadata.Annotations["chart_url"], rel.Chart.Metadata.Annotations["chart_url"])
			}
		})
	}
}

func TestUpgradeReleaseWithDependencies(t *testing.T) {
	tests := []struct {
		testName     string
		chartPath    string
		chartName    string
		chartVersion string
		requireErr   bool
		indexEntry   string
		values       map[string]interface{}
		helmCRS      []*unstructured.Unstructured
	}{
		{
			testName:     "upgrade release with no chart_url with dependencies should upgrade successfully",
			chartPath:    "",
			chartName:    "wildfly",
			chartVersion: "1.0.0",
			indexEntry:   "wildfly--without-tls",
			values:       map[string]interface{}{"build": map[string]interface{}{"uri": "https://github.com/wildfly/quickstart.git"}},
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
		t.Run(tt.testName, func(t *testing.T) {
			store := storage.Init(driver.NewMemory())
			actionConfig := &action.Configuration{
				RESTClientGetter: FakeConfig{},
				Releases:         store,
				KubeClient:       &kubefake.PrintingKubeClient{Out: io.Discard},
				Capabilities:     common.DefaultCapabilities,
			}
			client := K8sDynamicClientFromCRs(tt.helmCRS...)
			clientInterface := k8sfake.NewSimpleClientset()
			coreClient := clientInterface.CoreV1()
			r := releaseV1.Release{
				Name:      "test",
				Namespace: "test-namespace",
				Info: &releaseV1.Info{
					FirstDeployed: helmTime.Time{},
					Status:        "deployed",
				},
				Version: 1,
				Chart: &chart.Chart{
					Metadata: &chart.Metadata{
						Name:        "wildfly",
						Version:     "1.0.0",
						Annotations: map[string]string{"chart_url": "http://localhost:9181/charts/wildfly-1.0.0.tgz"},
					},
				},
			}

			store.Create(&r)

			rel, err := UpgradeRelease("test-namespace", "test", tt.chartPath, tt.values, actionConfig, client, coreClient, true, tt.indexEntry)
			if tt.requireErr {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
				require.Equal(t, r.Name, rel.Name)
				require.Equal(t, r.Namespace, rel.Namespace)
				require.Equal(t, rcommon.StatusDeployed, rel.Info.Status)
				require.Equal(t, tt.chartVersion, rel.Chart.Metadata.Version)
				require.Equal(t, 2, rel.Version)
				require.Equal(t, r.Chart.Metadata.Annotations["chart_url"], rel.Chart.Metadata.Annotations["chart_url"])
				require.Contains(t, rel.Manifest, `uri: https://github.com/wildfly/quickstart.git`)
				assertValues(t, tt.values, rel.Config)
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
		indexEntry   string
		err          error
	}{
		{
			testName:     "upgrade non exist release should return no release found",
			chartPath:    "",
			chartName:    "influxdb",
			chartVersion: "3.0.2",
			indexEntry:   "influxdb--without-tls",
			err:          ErrReleaseNotFound,
		},
	}
	for _, tt := range tests {
		t.Run(tt.testName, func(t *testing.T) {
			store := storage.Init(driver.NewMemory())
			actionConfig := &action.Configuration{
				RESTClientGetter: FakeConfig{},
				Releases:         store,
				KubeClient:       &kubefake.PrintingKubeClient{Out: io.Discard},
				Capabilities:     common.DefaultCapabilities,
			}
			client := K8sDynamicClientFromCRs()
			clientInterface := k8sfake.NewSimpleClientset()
			coreClient := clientInterface.CoreV1()
			_, err := UpgradeRelease("test-namespace", "test", tt.chartPath, nil, actionConfig, client, coreClient, true, tt.indexEntry)
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
		requireErr   bool
		indexEntry   string
		helmCRS      []*unstructured.Unstructured
	}{
		{
			testName:     "upgrade valid release with custom values should return successful response",
			chartPath:    "http://localhost:9181/charts/influxdb-3.0.2.tgz",
			chartName:    "influxdb",
			chartVersion: "3.0.2",
			indexEntry:   "influxdb--without-tls",
			values: map[string]interface{}{
				"service": map[string]interface{}{"type": "NodePort"},
			},
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
		t.Run(tt.testName, func(t *testing.T) {
			store := storage.Init(driver.NewMemory())
			actionConfig := &action.Configuration{
				RESTClientGetter: FakeConfig{},
				Releases:         store,
				KubeClient:       &kubefake.PrintingKubeClient{Out: io.Discard},
				Capabilities:     common.DefaultCapabilities,
			}
			client := K8sDynamicClientFromCRs(tt.helmCRS...)
			clientInterface := k8sfake.NewSimpleClientset()
			coreClient := clientInterface.CoreV1()
			r := releaseV1.Release{
				Name:      "test",
				Namespace: "test-namespace",
				Info: &releaseV1.Info{
					FirstDeployed: helmTime.Time{},
					Status:        "deployed",
				},
				Version: 1,
				Chart: &chart.Chart{
					Metadata: &chart.Metadata{
						Name:        "influxdb",
						Version:     "3.0.2",
						Annotations: map[string]string{"chart_url": "http://localhost:9181/charts/influxdb-3.0.2.tgz"},
					},
				},
			}

			store.Create(&r)

			rel, err := UpgradeRelease("test-namespace", "test", tt.chartPath, tt.values, actionConfig, client, coreClient, true, tt.indexEntry)
			if tt.requireErr {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
				require.Equal(t, r.Name, rel.Name)
				require.Equal(t, r.Namespace, rel.Namespace)
				require.Equal(t, rcommon.StatusDeployed, rel.Info.Status)
				require.Equal(t, tt.chartVersion, rel.Chart.Metadata.Version)
				require.Equal(t, 2, rel.Version)
				require.Equal(t, r.Chart.Metadata.Annotations["chart_url"], rel.Chart.Metadata.Annotations["chart_url"])
				require.Contains(t, rel.Manifest, `type: NodePort`)
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

func TestUpgradeReleaseWithoutDependenciesAsync(t *testing.T) {
	tests := []struct {
		chartName       string
		chartPath       string
		chartUrl        string
		chartVersion    string
		createNamespace bool
		createSecret    bool
		helmCRS         []*unstructured.Unstructured
		indexEntry      string
		namespace       string
		requireErr      bool
		testName        string
		releaseName     string
	}{
		{
			testName:     "upgrade valid release should return successful response",
			chartPath:    "http://localhost:9181/charts/influxdb-3.0.2.tgz",
			chartName:    "influxdb",
			chartVersion: "3.0.2",
			indexEntry:   "influxdb--without-tls",
			namespace:    "test",
			releaseName:  "test",
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
		t.Run(tt.testName, func(t *testing.T) {
			objs := []runtime.Object{}

			store := storage.Init(driver.NewMemory())
			actionConfig := &action.Configuration{
				RESTClientGetter: FakeConfig{},
				Releases:         store,
				KubeClient:       &kubefake.PrintingKubeClient{Out: io.Discard},
				Capabilities:     common.DefaultCapabilities,
			}

			if tt.createNamespace && tt.namespace != configNamespace {
				nsSpec := &v1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: tt.namespace}}
				objs = append(objs, nsSpec)
			}

			r := releaseV1.Release{
				Name:      tt.releaseName,
				Namespace: tt.namespace,
				Info: &releaseV1.Info{
					FirstDeployed: helmTime.Time{},
					Status:        "deployed",
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
			store.Create(&r)

			if tt.createSecret {
				certificate, errCert := os.ReadFile("./server.crt")
				require.NoError(t, errCert)
				key, errKey := os.ReadFile("./server.key")
				require.NoError(t, errKey)
				data := map[string][]byte{
					tlsSecretKey:     key,
					tlsSecretCertKey: certificate,
					username:         []byte("AzureDiamond"),
					password:         []byte("hunter2"),
				}
				if tt.namespace == "" {
					tt.namespace = configNamespace
				}
				secretSpec := &v1.Secret{Data: data, ObjectMeta: metav1.ObjectMeta{Name: "with-basic-auth", Namespace: tt.namespace}}
				objs = append(objs, secretSpec)
			}

			client := K8sDynamicClientFromCRs(tt.helmCRS...)
			clientInterface := k8sfake.NewSimpleClientset(objs...)
			coreClient := clientInterface.CoreV1()
			secretsDriver := driver.NewSecrets(coreClient.Secrets(tt.namespace))
			var rel *v1.Secret
			var err error
			go func() {
				rel, err = UpgradeReleaseAsync(tt.namespace, tt.releaseName, tt.chartPath, nil, actionConfig, client, coreClient, false, tt.indexEntry)
				if tt.requireErr {
					fmt.Println("Error", err)
					require.Error(t, err)
				} else {
					require.NoError(t, err)
					require.Equal(t, fmt.Sprintf("sh.helm.release.v1.%v.v2", tt.releaseName), rel.ObjectMeta.Name)
				}
			}()
			time.Sleep(10 * time.Second)
			if tt.requireErr == false {
				r.Version = 2
				err = secretsDriver.Create(fmt.Sprintf("sh.helm.release.v1.%v.v2", tt.releaseName), &r)
				require.NoError(t, err)
			}

		})
	}
}

func TestUpgradeReleaseWithDependenciesAsync(t *testing.T) {
	tests := []struct {
		testName         string
		chartPath        string
		chartName        string
		chartVersion     string
		requireErr       bool
		indexEntry       string
		values           map[string]interface{}
		helmCRS          []*unstructured.Unstructured
		releaseName      string
		releaseNamespace string
	}{
		{
			testName:         "upgrade release with no chart_url with dependencies should upgrade successfully",
			chartPath:        "",
			chartName:        "wildfly",
			chartVersion:     "1.0.0",
			indexEntry:       "wildfly--without-tls",
			releaseName:      "test",
			releaseNamespace: "test-namespace",
			values:           map[string]interface{}{"build": map[string]interface{}{"uri": "https://github.com/wildfly/quickstart.git"}},
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
		t.Run(tt.testName, func(t *testing.T) {
			store := storage.Init(driver.NewMemory())
			actionConfig := &action.Configuration{
				RESTClientGetter: FakeConfig{},
				Releases:         store,
				KubeClient:       &kubefake.PrintingKubeClient{Out: io.Discard},
				Capabilities:     common.DefaultCapabilities,
			}
			client := K8sDynamicClientFromCRs(tt.helmCRS...)
			clientInterface := k8sfake.NewSimpleClientset()
			coreClient := clientInterface.CoreV1()
			secretsDriver := driver.NewSecrets(coreClient.Secrets(tt.releaseNamespace))
			var rel *v1.Secret
			var err error
			r := releaseV1.Release{
				Name:      tt.releaseName,
				Namespace: tt.releaseNamespace,
				Info: &releaseV1.Info{
					FirstDeployed: helmTime.Time{},
					Status:        "deployed",
				},
				Version: 1,
				Chart: &chart.Chart{
					Metadata: &chart.Metadata{
						Name:        tt.chartName,
						Version:     tt.chartVersion,
						Annotations: map[string]string{"chart_url": "http://localhost:9181/charts/wildfly-1.0.0.tgz"},
					},
				},
			}

			store.Create(&r)

			go func() {
				rel, err = UpgradeReleaseAsync(tt.releaseNamespace, tt.releaseName, tt.chartPath, tt.values, actionConfig, client, coreClient, true, tt.indexEntry)
				require.NoError(t, err)
				require.Equal(t, fmt.Sprintf("sh.helm.release.v1.%v.v2", tt.releaseName), rel.ObjectMeta.Name)
			}()
			time.Sleep(10 * time.Second)
			r.Version = 2
			err = secretsDriver.Create(fmt.Sprintf("sh.helm.release.v1.%v.v2", tt.releaseName), &r)
			require.NoError(t, err)
		})
	}
}

func TestUpgradeReleaseWithCustomValuesAsync(t *testing.T) {
	tests := []struct {
		testName         string
		chartPath        string
		chartName        string
		chartVersion     string
		values           map[string]interface{}
		requireErr       bool
		indexEntry       string
		createSecret     bool
		releaseName      string
		releaseNamespace string
		helmCRS          []*unstructured.Unstructured
	}{
		{
			testName:         "upgrade valid release with custom values should return successful response",
			chartPath:        "http://localhost:9181/charts/influxdb-3.0.2.tgz",
			chartName:        "influxdb",
			chartVersion:     "3.0.2",
			indexEntry:       "influxdb--without-tls",
			createSecret:     true,
			releaseName:      "test",
			releaseNamespace: "test-namespace",
			values: map[string]interface{}{
				"service": map[string]interface{}{"type": "NodePort"},
			},
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
		t.Run(tt.testName, func(t *testing.T) {
			store := storage.Init(driver.NewMemory())
			actionConfig := &action.Configuration{
				RESTClientGetter: FakeConfig{},
				Releases:         store,
				KubeClient:       &kubefake.PrintingKubeClient{Out: io.Discard},
				Capabilities:     common.DefaultCapabilities,
			}

			r := releaseV1.Release{
				Name:      tt.releaseName,
				Namespace: tt.releaseNamespace,
				Info: &releaseV1.Info{
					FirstDeployed: helmTime.Time{},
					Status:        "deployed",
				},
				Version: 1,
				Chart: &chart.Chart{
					Metadata: &chart.Metadata{
						Name:        "influxdb",
						Version:     "3.0.2",
						Annotations: map[string]string{"chart_url": "http://localhost:9181/charts/influxdb-3.0.2.tgz"},
					},
				},
			}

			store.Create(&r)
			client := K8sDynamicClientFromCRs(tt.helmCRS...)
			clientInterface := k8sfake.NewSimpleClientset()
			coreClient := clientInterface.CoreV1()
			secretsDriver := driver.NewSecrets(coreClient.Secrets(tt.releaseNamespace))
			var rel *v1.Secret
			var err error
			go func() {
				rel, err = UpgradeReleaseAsync(tt.releaseNamespace, tt.releaseName, tt.chartPath, tt.values, actionConfig, client, coreClient, true, tt.indexEntry)
				require.NoError(t, err)
				require.Equal(t, fmt.Sprintf("sh.helm.release.v1.%v.v2", tt.releaseName), rel.ObjectMeta.Name)
			}()
			time.Sleep(10 * time.Second)
			r.Version = 2
			err = secretsDriver.Create(fmt.Sprintf("sh.helm.release.v1.%v.v2", tt.releaseName), &r)
			require.NoError(t, err)
		})
	}
}

func TestUpgradeAfterURLInstallWithSecrets(t *testing.T) {
	tests := []struct {
		testName         string
		chartPath        string
		chartName        string
		chartVersion     string
		releaseName      string
		releaseNamespace string
		secretName       string
		secretData       map[string][]byte
	}{
		{
			testName:         "upgrade valid release with custom values should return successful response",
			chartPath:        "http://localhost:8181/charts/mychart-0.1.0.tgz",
			chartName:        "mychart",
			chartVersion:     "0.1.0",
			releaseName:      "auth-persist-test",
			releaseNamespace: "test-namespace",
			secretName:       "test-secret",
			secretData:       map[string][]byte{username: []byte("AzureDiamond"), password: []byte("hunter2")},
		},
	}
	for _, tt := range tests {
		t.Run(tt.testName, func(t *testing.T) {
			store := storage.Init(driver.NewMemory())
			actionConfig := &action.Configuration{
				RESTClientGetter: FakeConfig{},
				Releases:         store,
				KubeClient:       &kubefake.PrintingKubeClient{Out: io.Discard},
				Capabilities:     common.DefaultCapabilities,
			}
			authSecret := &v1.Secret{
				ObjectMeta: metav1.ObjectMeta{
					Name:      tt.secretName,
					Namespace: tt.releaseNamespace,
				},
				Data: tt.secretData,
			}
			clientInterface := k8sfake.NewSimpleClientset(authSecret)
			coreClient := clientInterface.CoreV1()
			registryClient, err := GetDefaultOCIRegistry()
			require.NoError(t, err)
			actionConfig.RegistryClient = registryClient
			dynamicClient := K8sDynamicClientFromCRs()

			// Simulate a URL install by creating the release with auth annotation
			installRelease := releaseV1.Release{
				Name:      tt.releaseName,
				Namespace: tt.releaseNamespace,
				Info: &releaseV1.Info{
					FirstDeployed: helmTime.Time{},
					Status:        "deployed",
				},
				Version: 1,
				Chart: &chart.Chart{
					Metadata: &chart.Metadata{
						Name:    tt.chartName,
						Version: tt.chartVersion,
						Annotations: map[string]string{
							"chart_url":              tt.chartPath,
							helmAuthSecretAnnotation: tt.secretName,
						},
					},
				},
			}
			store.Create(&installRelease)

			// Verify the installed release has the auth annotation
			rel, err := GetRelease(tt.releaseName, actionConfig)
			require.NoError(t, err)
			require.Equal(t, tt.secretName, rel.Chart.Metadata.Annotations[helmAuthSecretAnnotation])

			// Upgrade — chartUrl is recovered from the annotation, auth credentials are applied
			secretsDriver := driver.NewSecrets(coreClient.Secrets(tt.releaseNamespace))
			go func() {
				upgradeResult, upgradeErr := UpgradeReleaseAsync(tt.releaseNamespace, tt.releaseName, "", nil, actionConfig, dynamicClient, coreClient, true, "")
				require.NoError(t, upgradeErr)
				require.Equal(t, fmt.Sprintf("sh.helm.release.v1.%v.v2", tt.releaseName), upgradeResult.ObjectMeta.Name)
			}()
			time.Sleep(10 * time.Second)
			installRelease.Version = 2
			err = secretsDriver.Create(fmt.Sprintf("sh.helm.release.v1.%v.v2", tt.releaseName), &installRelease)
			require.NoError(t, err)

			// Verify the upgraded release preserved the auth annotation
			rel, err = GetRelease(tt.releaseName, actionConfig)
			require.NoError(t, err)
			require.Equal(t, tt.secretName, rel.Chart.Metadata.Annotations[helmAuthSecretAnnotation])
		})
	}
}
