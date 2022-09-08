package actions

import (
	"io/ioutil"
	"testing"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"

	"github.com/stretchr/testify/require"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chartutil"
	kubefake "helm.sh/helm/v3/pkg/kube/fake"
	"helm.sh/helm/v3/pkg/storage"
	"helm.sh/helm/v3/pkg/storage/driver"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/dynamic"
	fk "k8s.io/client-go/dynamic/fake"
	k8sfake "k8s.io/client-go/kubernetes/fake"
)

func TestGetChartWithoutTls(t *testing.T) {
	tests := []struct {
		name         string
		chartPath    string
		chartName    string
		errorMsg     string
		indexEntry   string
		requireError bool
		namespace    string
		helmCRS      []*unstructured.Unstructured
	}{
		{
			name:       "Valid chart url",
			chartPath:  "http://localhost:9181/charts/mariadb-7.3.5.tgz",
			chartName:  "mariadb",
			namespace:  "",
			indexEntry: "mariadb--without-tls",
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
			name:         "Invalid chart url",
			chartPath:    "../testdata/invalid.tgz",
			requireError: true,
		},
		{
			name:         "Not Valid chart url",
			chartPath:    "http://localhost:9181/charts/mariadb-7.3.6.tgz",
			chartName:    "mariadb",
			namespace:    "",
			indexEntry:   "mariadb--without-tls",
			requireError: true,
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
	store := storage.Init(driver.NewMemory())
	actionConfig := &action.Configuration{
		RESTClientGetter: FakeConfig{},
		Releases:         store,
		KubeClient:       &kubefake.PrintingKubeClient{Out: ioutil.Discard},
		Capabilities:     chartutil.DefaultCapabilities,
		Log:              func(format string, v ...interface{}) {},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			client := K8sDynamicClientFromCRs(test.helmCRS...)
			clientInterface := k8sfake.NewSimpleClientset()
			coreClient := clientInterface.CoreV1()
			chart, err := GetChart(test.chartPath, actionConfig, test.namespace, client, coreClient, true, test.indexEntry)
			if test.requireError {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
				require.Equal(t, test.chartName, chart.Metadata.Name)
			}
		})
	}
}

func TestGetChartWithTlsData(t *testing.T) {
	tests := []struct {
		name                string
		chartPath           string
		chartName           string
		indexEntry          string
		repositoryNamespace string
		createSecret        bool
		createNamespace     bool
		createHelmRepo      bool
		namespace           string
		createConfigMap     bool
		requireError        bool
		helmCRS             []*unstructured.Unstructured
	}{
		{
			name:            "mychart",
			chartPath:       "https://localhost:9443/charts/mychart-0.1.0.tgz",
			chartName:       "mychart",
			createSecret:    true,
			createNamespace: true,
			createConfigMap: true,
			namespace:       "test",
			indexEntry:      "mychart--my-repo",
			createHelmRepo:  true,
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
		{
			name:            "mariadb",
			chartPath:       "https://localhost:9443/charts/mariadb-7.3.5.tgz",
			chartName:       "mariadb",
			indexEntry:      "mariadb--my-repo",
			createHelmRepo:  true,
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
							"name":      "my-repo",
							"namespace": "test",
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
		{
			name:         "Invalid chart url",
			chartPath:    "../testdata/invalid.tgz",
			requireError: true,
		},
	}
	store := storage.Init(driver.NewMemory())
	actionConfig := &action.Configuration{
		RESTClientGetter: FakeConfig{},
		Releases:         store,
		KubeClient:       &kubefake.PrintingKubeClient{Out: ioutil.Discard},
		Capabilities:     chartutil.DefaultCapabilities,
		Log:              func(format string, v ...interface{}) {},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			objs := []runtime.Object{}
			// create a namespace if it is not same as openshift-config
			if test.createNamespace && test.namespace != configNamespace {
				nsSpec := &v1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: test.namespace}}
				objs = append(objs, nsSpec)
			}
			// create a secret in required namespace
			if test.createSecret {
				certificate, errCert := ioutil.ReadFile("./server.crt")
				require.NoError(t, errCert)
				key, errKey := ioutil.ReadFile("./server.key")
				require.NoError(t, errKey)
				data := map[string][]byte{
					tlsSecretKey:     key,
					tlsSecretCertKey: certificate,
				}
				secretSpec := &v1.Secret{Data: data, ObjectMeta: metav1.ObjectMeta{Name: "my-repo", Namespace: test.namespace}}
				objs = append(objs, secretSpec)
			}
			//create a configMap in openshift-config namespace
			if test.createConfigMap {
				caCert, err := ioutil.ReadFile("./cacert.pem")
				require.NoError(t, err)
				data := map[string]string{
					caBundleKey: string(caCert),
				}
				configMapSpec := &v1.ConfigMap{Data: data, ObjectMeta: metav1.ObjectMeta{Name: "my-repo", Namespace: test.namespace}}
				objs = append(objs, configMapSpec)
			}

			client := K8sDynamicClientFromCRs(test.helmCRS...)
			clientInterface := k8sfake.NewSimpleClientset(objs...)
			coreClient := clientInterface.CoreV1()
			chart, err := GetChart(test.chartPath, actionConfig, test.namespace, client, coreClient, false, test.indexEntry)
			if test.requireError {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
				require.NotNil(t, chart.Metadata)
				require.Equal(t, chart.Metadata.Name, test.chartName)
			}
		})
	}
}

func TestGetChartBasicAuth(t *testing.T) {
	tests := []struct {
		name                string
		chartPath           string
		chartName           string
		indexEntry          string
		repositoryNamespace string
		createSecret        bool
		createNamespace     bool
		namespace           string
		requireError        bool
		helmCRS             []*unstructured.Unstructured
	}{
		{
			name:            "mychart",
			chartPath:       "http://localhost:8181/charts/mychart-0.1.0.tgz",
			chartName:       "mychart",
			createSecret:    true,
			createNamespace: true,
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
								"url": "http://localhost:8181",
								"basicAuthConfig": map[string]interface{}{
									"name": "my-repo",
								},
							},
						},
					},
				},
			},
		},
		{
			name:            "Invalid chart url",
			chartPath:       "http://localhost:8181/charts/mychart-0.2.0.tgz",
			chartName:       "mychart",
			createSecret:    true,
			createNamespace: true,
			namespace:       "test",
			indexEntry:      "mychart--my-repo",
			requireError:    true,
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
									"name": "my-repo",
								},
							},
						},
					},
				},
			},
		},
		{
			name:         "Invalid chart url",
			chartPath:    "../testdata/invalid.tgz",
			requireError: true,
		},
	}
	store := storage.Init(driver.NewMemory())
	actionConfig := &action.Configuration{
		RESTClientGetter: FakeConfig{},
		Releases:         store,
		KubeClient:       &kubefake.PrintingKubeClient{Out: ioutil.Discard},
		Capabilities:     chartutil.DefaultCapabilities,
		Log:              func(format string, v ...interface{}) {},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			objs := []runtime.Object{}
			// create a namespace if it is not same as openshift-config
			if test.createNamespace {
				nsSpec := &v1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: test.namespace}}
				objs = append(objs, nsSpec)
			}
			// create a secret in required namespace
			if test.createSecret {
				data := map[string][]byte{
					username: []byte("AzureDiamond"),
					password: []byte("hunter2"),
				}
				secretSpec := &v1.Secret{Data: data, ObjectMeta: metav1.ObjectMeta{Name: "my-repo", Namespace: test.namespace}}
				objs = append(objs, secretSpec)
			}

			client := K8sDynamicClientFromCRs(test.helmCRS...)
			clientInterface := k8sfake.NewSimpleClientset(objs...)
			coreClient := clientInterface.CoreV1()
			chart, err := GetChart(test.chartPath, actionConfig, test.namespace, client, coreClient, false, test.indexEntry)
			if test.requireError {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
				require.NotNil(t, chart.Metadata)
				require.Equal(t, chart.Metadata.Name, test.chartName)
			}
		})
	}
}

func K8sDynamicClientFromCRs(crs ...*unstructured.Unstructured) dynamic.Interface {
	var objs []runtime.Object

	for _, cr := range crs {
		objs = append(objs, cr)
	}
	scheme := runtime.NewScheme()
	scheme.AddKnownTypeWithName(schema.GroupVersionKind{Group: "helm.openshift.io", Version: "v1beta1", Kind: "HelmChartRepositoryList"}, &unstructured.UnstructuredList{})
	scheme.AddKnownTypeWithName(schema.GroupVersionKind{Group: "helm.openshift.io", Version: "v1beta1", Kind: "ProjectHelmChartRepositoryList"}, &unstructured.UnstructuredList{})
	scheme.AddKnownTypeWithName(schema.GroupVersionKind{Group: "helm.openshift.io", Version: "v1beta1", Kind: "HelmChartRepository"}, &unstructured.Unstructured{})
	scheme.AddKnownTypeWithName(schema.GroupVersionKind{Group: "helm.openshift.io", Version: "v1beta1", Kind: "ProjectHelmChartRepository"}, &unstructured.Unstructured{})
	return fk.NewSimpleDynamicClient(scheme, objs...)
}
