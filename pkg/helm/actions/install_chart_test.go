package actions

import (
	"errors"
	"fmt"
	"io"
	"os"
	"testing"
	"time"

	helmTime "time"

	"github.com/stretchr/testify/require"
	"helm.sh/helm/v4/pkg/action"
	"helm.sh/helm/v4/pkg/chart/common"
	chart "helm.sh/helm/v4/pkg/chart/v2"
	kubefake "helm.sh/helm/v4/pkg/kube/fake"
	"helm.sh/helm/v4/pkg/registry"
	rcommon "helm.sh/helm/v4/pkg/release/common"
	releaseV1 "helm.sh/helm/v4/pkg/release/v1"
	"helm.sh/helm/v4/pkg/storage"
	"helm.sh/helm/v4/pkg/storage/driver"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	k8sfake "k8s.io/client-go/kubernetes/fake"
	"k8s.io/client-go/rest"
)

type mockRegistryClientSetter struct {
	client *registry.Client
}

func (m *mockRegistryClientSetter) SetRegistryClient(rc *registry.Client) {
	m.client = rc
}

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
				KubeClient:       &kubefake.PrintingKubeClient{Out: io.Discard},
				Capabilities:     common.DefaultCapabilities,
			}
			client := K8sDynamicClientFromCRs(tt.helmCRS...)
			clientInterface := k8sfake.NewSimpleClientset()
			coreClient := clientInterface.CoreV1()
			rel, err := InstallChart("test", tt.releaseName, tt.chartPath, nil, actionConfig, client, coreClient, true, tt.indexEntry)
			if tt.releaseName == "valid chart path" {
				require.NoError(t, err)
				require.Equal(t, "test", rel.Name)
				require.Equal(t, "test-namespace", rel.Namespace)
				require.Equal(t, rcommon.StatusDeployed, rel.Info.Status)
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
				KubeClient:       &kubefake.PrintingKubeClient{Out: io.Discard},
				Capabilities:     common.DefaultCapabilities,
			}
			// create a namespace if it is not same as openshift-config
			if tt.createNamespace && tt.namespace != configNamespace {
				nsSpec := &v1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: tt.namespace}}
				objs = append(objs, nsSpec)
			}
			// create a secret in required namespace
			if tt.createSecret {
				certificate, errCert := os.ReadFile("./server.crt")
				require.NoError(t, errCert)
				key, errKey := os.ReadFile("./server.key")
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
				caCert, err := os.ReadFile("./cacert.pem")
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
				KubeClient:       &kubefake.PrintingKubeClient{Out: io.Discard},
				Capabilities:     common.DefaultCapabilities,
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
				caCert, err := os.ReadFile("./cacert.pem")
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
				KubeClient:       &kubefake.PrintingKubeClient{Out: io.Discard},
				Capabilities:     common.DefaultCapabilities,
			}
			objs := []runtime.Object{}
			client := K8sDynamicClientFromCRs(tt.helmCRS...)
			clientInterface := k8sfake.NewSimpleClientset(objs...)
			coreClient := clientInterface.CoreV1()
			var rel *v1.Secret
			var err error
			go func() {
				rel, err = InstallChartAsync(tt.namespace, tt.releaseName, tt.chartPath, nil, actionConfig, client, coreClient, false, tt.indexEntry)
				if tt.releaseName == "myrelease" {
					require.NoError(t, err)
					require.Equal(t, fmt.Sprintf("sh.helm.release.v1.%v.v1", tt.releaseName), rel.ObjectMeta.Name)
				} else if tt.releaseName == "invalid chart path" {
					require.Error(t, err)
				}
			}()
			if tt.requireError == false {
				secretsDriver := driver.NewSecrets(coreClient.Secrets(tt.namespace))
				r := releaseV1.Release{
					Name:      tt.releaseName,
					Namespace: tt.namespace,
					Info: &releaseV1.Info{
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

func TestInstallChartFromURL(t *testing.T) {
	tests := []struct {
		testName            string
		releaseName         string
		chartPath           string
		chartName           string
		chartVersion        string
		plainHTTP           bool
		skipTLSVerify       bool
		basicAuthSecretName string
		basicAuthUser       string
		basicAuthPass       string
		secretData          map[string][]byte
		expectedErrMsg      string
	}{
		{
			testName:       "valid HTTP chart URL",
			releaseName:    "valid-chart-path",
			chartPath:      "http://localhost:9181/charts/influxdb-3.0.2.tgz",
			chartName:      "influxdb",
			chartVersion:   "3.0.2",
			plainHTTP:      true,
			skipTLSVerify:  true,
			expectedErrMsg: "",
		},
		{
			testName:       "valid OCI chart URL",
			releaseName:    "valid-chart-path",
			chartPath:      "oci://localhost:5000/helm-charts/mychart:0.1.0",
			chartName:      "mychart",
			chartVersion:   "0.1.0",
			plainHTTP:      true,
			skipTLSVerify:  true,
			expectedErrMsg: "",
		},
		{
			testName:       "invalid chart URL rejected synchronously",
			releaseName:    "invalid-chart-path",
			chartPath:      "http://localhost:9181/charts/influxdb/filename",
			chartName:      "influxdb",
			chartVersion:   "3.0.1",
			plainHTTP:      true,
			skipTLSVerify:  true,
			expectedErrMsg: "invalid chart URL",
		},
		{
			testName:            "OCI chart with basic auth",
			releaseName:         "basicauth-oci",
			chartPath:           "oci://localhost:5001/helm-charts/mychart:0.1.0",
			chartName:           "mychart",
			chartVersion:        "0.1.0",
			plainHTTP:           true,
			skipTLSVerify:       true,
			basicAuthSecretName: "oci-auth-secret",
			basicAuthUser:       "AzureDiamond",
			basicAuthPass:       "hunter2",
			expectedErrMsg:      "",
		},
		{
			testName:            "HTTP chart with basic auth",
			releaseName:         "basicauth-http",
			chartPath:           "http://localhost:8181/charts/mychart-0.1.0.tgz",
			chartName:           "mychart",
			chartVersion:        "0.1.0",
			plainHTTP:           true,
			skipTLSVerify:       true,
			basicAuthSecretName: "http-auth-secret",
			basicAuthUser:       "AzureDiamond",
			basicAuthPass:       "hunter2",
			expectedErrMsg:      "",
		},
		{
			testName:            "OCI chart with wrong basic auth credentials",
			releaseName:         "badauth-oci",
			chartPath:           "oci://localhost:5001/helm-charts/mychart:0.1.0",
			chartName:           "mychart",
			chartVersion:        "0.1.0",
			plainHTTP:           true,
			skipTLSVerify:       true,
			basicAuthSecretName: "bad-auth-secret",
			basicAuthUser:       "wrong-user",
			basicAuthPass:       "wrong-pass",
			expectedErrMsg:      "error locating chart",
		},
		{
			testName:            "HTTP chart with wrong basic auth credentials",
			releaseName:         "badauth-http",
			chartPath:           "http://localhost:8181/charts/mychart-0.1.0.tgz",
			chartName:           "mychart",
			chartVersion:        "0.1.0",
			plainHTTP:           true,
			skipTLSVerify:       true,
			basicAuthSecretName: "bad-auth-secret",
			basicAuthUser:       "wrong-user",
			basicAuthPass:       "wrong-pass",
			expectedErrMsg:      "error locating chart",
		},
		{
			testName:            "basic auth secret not found",
			releaseName:         "missing-secret",
			chartPath:           "oci://localhost:5001/helm-charts/mychart:0.1.0",
			chartName:           "mychart",
			chartVersion:        "0.1.0",
			plainHTTP:           true,
			skipTLSVerify:       true,
			basicAuthSecretName: "nonexistent-secret",
			expectedErrMsg:      "failed to get secret",
		},
		{
			testName:            "secret missing username key",
			releaseName:         "malformed-no-user",
			chartPath:           "oci://localhost:5001/helm-charts/mychart:0.1.0",
			chartName:           "mychart",
			chartVersion:        "0.1.0",
			plainHTTP:           true,
			skipTLSVerify:       true,
			basicAuthSecretName: "bad-secret",
			secretData:          map[string][]byte{"password": []byte("hunter2")},
			expectedErrMsg:      "failed to find \"username\" key in secret",
		},
		{
			testName:            "secret missing password key",
			releaseName:         "malformed-no-pass",
			chartPath:           "oci://localhost:5001/helm-charts/mychart:0.1.0",
			chartName:           "mychart",
			chartVersion:        "0.1.0",
			plainHTTP:           true,
			skipTLSVerify:       true,
			basicAuthSecretName: "bad-secret",
			secretData:          map[string][]byte{"username": []byte("AzureDiamond")},
			expectedErrMsg:      "failed to find \"password\" key in secret",
		},
	}

	// In Helm v4, ORAS v2 strictly enforces HTTPS when plainHTTP=false.
	// The production code in applyBasicAuthFromUserCredentials hardcodes
	// plainHTTP=false for security. Override the registry client factory
	// so test registries (which use plain HTTP) work correctly.
	originalNewRegistryClient := newRegistryClient
	defer func() { newRegistryClient = originalNewRegistryClient }()
	newRegistryClient = func(options ...registry.ClientOption) (*registry.Client, error) {
		options = append(options, registry.ClientOptPlainHTTP())
		return originalNewRegistryClient(options...)
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
			registryClient, err := GetOCIRegistry(tt.skipTLSVerify, tt.plainHTTP, nil)
			require.NoError(t, err)
			actionConfig.RegistryClient = registryClient

			objs := []runtime.Object{}
			if tt.secretData != nil {
				objs = append(objs, &v1.Secret{
					ObjectMeta: metav1.ObjectMeta{
						Name:      tt.basicAuthSecretName,
						Namespace: "test-namespace",
					},
					Data: tt.secretData,
				})
			} else if tt.basicAuthSecretName != "" && tt.basicAuthUser != "" {
				objs = append(objs, &v1.Secret{
					ObjectMeta: metav1.ObjectMeta{
						Name:      tt.basicAuthSecretName,
						Namespace: "test-namespace",
					},
					Data: map[string][]byte{
						"username": []byte(tt.basicAuthUser),
						"password": []byte(tt.basicAuthPass),
					},
				})
			}
			clientInterface := k8sfake.NewSimpleClientset(objs...)
			coreClient := clientInterface.CoreV1()

			if tt.expectedErrMsg != "" {
				rel, err := InstallChartFromURL("test-namespace", tt.releaseName, tt.chartPath, nil, actionConfig, coreClient, tt.chartVersion, tt.basicAuthSecretName)
				require.Error(t, err)
				require.ErrorContains(t, err, tt.expectedErrMsg)
				require.Nil(t, rel)
				return
			}

			// For valid URLs: create the release secret in a background goroutine
			// to simulate what Helm's cmd.Run would do, unblocking getSecret's Watch.
			secretName := fmt.Sprintf("sh.helm.release.v1.%v.v1", tt.releaseName)
			go func() {
				time.Sleep(2 * time.Second)
				secretsDriver := driver.NewSecrets(coreClient.Secrets("test-namespace"))
				r := releaseV1.Release{
					Name:      tt.releaseName,
					Namespace: "test-namespace",
					Info: &releaseV1.Info{
						FirstDeployed: helmTime.Time{},
						Status:        "pending-install",
					},
					Version: 1,
					Chart: &chart.Chart{
						Metadata: &chart.Metadata{
							Name:        tt.chartName,
							Version:     tt.chartVersion,
							Annotations: map[string]string{"chart_url": tt.chartPath},
						},
					},
				}
				secretsDriver.Create(secretName, &r)
			}()

			rel, err := InstallChartFromURL("test-namespace", tt.releaseName, tt.chartPath, nil, actionConfig, coreClient, tt.chartVersion, tt.basicAuthSecretName)
			require.NoError(t, err)
			require.NotNil(t, rel)
			require.Equal(t, secretName, rel.ObjectMeta.Name)
		})
	}
}

func TestIsValidChartURL(t *testing.T) {
	tests := []struct {
		name  string
		url   string
		valid bool
	}{
		// Valid multi-label hosts
		{"valid OCI registry", "oci://ghcr.io/charts/mychart:1.0.0", true},
		{"valid OCI with port", "oci://registry.example.com:5000/charts/mychart", true},
		{"valid HTTPS tgz", "https://example.com/charts/mychart-1.0.0.tgz", true},
		{"valid HTTP tgz", "http://example.com/charts/mychart-1.0.0.tgz", true},
		{"valid HTTPS tar.gz", "https://example.com/charts/mychart-1.0.0.tar.gz", true},

		// Valid single-label hosts (localhost, dev registries)
		{"allow OCI localhost", "oci://localhost/charts/mychart", true},
		{"allow OCI localhost with port", "oci://localhost:5000/charts/mychart", true},
		{"allow HTTP localhost tgz", "http://localhost/chart.tgz", true},
		{"allow OCI single-label host", "oci://myregistry/chart", true},
		{"allow HTTP single-label host with port", "http://myregistry:8080/chart.tgz", true},

		// Invalid: missing host or bad scheme/format
		{"block OCI no host", "oci:///chart", false},
		{"block empty string", "", false},
		{"block ftp scheme", "ftp://example.com/chart.tgz", false},
		{"block http without tgz", "http://example.com/charts/mychart", false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := isValidChartURL(tt.url)
			if got != tt.valid {
				t.Errorf("isValidChartURL(%q) = %v, want %v", tt.url, got, tt.valid)
			}
		})
	}
}

func TestAddAuthSecretAnnotation(t *testing.T) {
	t.Run("sets annotation when secretName is non-empty", func(t *testing.T) {
		ch := &chart.Chart{
			Metadata: &chart.Metadata{
				Annotations: make(map[string]string),
			},
		}
		addAuthSecretAnnotation(ch, "my-auth-secret")
		require.Equal(t, "my-auth-secret", ch.Metadata.Annotations[helmAuthSecretAnnotation])
	})

	t.Run("no-op when secretName is empty", func(t *testing.T) {
		ch := &chart.Chart{
			Metadata: &chart.Metadata{
				Annotations: make(map[string]string),
			},
		}
		addAuthSecretAnnotation(ch, "")
		_, exists := ch.Metadata.Annotations[helmAuthSecretAnnotation]
		require.False(t, exists)
	})

	t.Run("preserves existing annotations", func(t *testing.T) {
		ch := &chart.Chart{
			Metadata: &chart.Metadata{
				Annotations: map[string]string{
					"chart_url":    "oci://registry.example.com/charts/mychart:1.0.0",
					"installation": "url_install",
				},
			},
		}
		addAuthSecretAnnotation(ch, "my-auth-secret")
		require.Equal(t, "my-auth-secret", ch.Metadata.Annotations[helmAuthSecretAnnotation])
		require.Equal(t, "oci://registry.example.com/charts/mychart:1.0.0", ch.Metadata.Annotations["chart_url"])
		require.Equal(t, "url_install", ch.Metadata.Annotations["installation"])
	})
}

func TestGetUserCredentials(t *testing.T) {
	t.Run("returns credentials from valid secret", func(t *testing.T) {
		secret := &v1.Secret{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "auth-secret",
				Namespace: "test-ns",
			},
			Data: map[string][]byte{
				"username": []byte("admin"),
				"password": []byte("s3cret"),
			},
		}
		clientset := k8sfake.NewSimpleClientset(secret)
		coreClient := clientset.CoreV1()

		creds, err := GetUserCredentials(coreClient, "test-ns", "auth-secret")
		require.NoError(t, err)
		require.Equal(t, "admin", creds.Username)
		require.Equal(t, "s3cret", creds.Password)
	})

	t.Run("returns error when secret not found", func(t *testing.T) {
		clientset := k8sfake.NewSimpleClientset()
		coreClient := clientset.CoreV1()

		_, err := GetUserCredentials(coreClient, "test-ns", "nonexistent")
		require.Error(t, err)
		require.ErrorContains(t, err, "failed to get secret")
	})

	t.Run("returns error when username key is missing", func(t *testing.T) {
		secret := &v1.Secret{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "bad-secret",
				Namespace: "test-ns",
			},
			Data: map[string][]byte{
				"password": []byte("s3cret"),
			},
		}
		clientset := k8sfake.NewSimpleClientset(secret)
		coreClient := clientset.CoreV1()

		_, err := GetUserCredentials(coreClient, "test-ns", "bad-secret")
		require.Error(t, err)
		require.ErrorContains(t, err, "failed to find \"username\" key in secret")
	})

	t.Run("returns error when password key is missing", func(t *testing.T) {
		secret := &v1.Secret{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "bad-secret",
				Namespace: "test-ns",
			},
			Data: map[string][]byte{
				"username": []byte("admin"),
			},
		}
		clientset := k8sfake.NewSimpleClientset(secret)
		coreClient := clientset.CoreV1()

		_, err := GetUserCredentials(coreClient, "test-ns", "bad-secret")
		require.Error(t, err)
		require.ErrorContains(t, err, "failed to find \"password\" key in secret")
	})
}

func TestApplyBasicAuthFromUserCredentials(t *testing.T) {
	t.Run("sets credentials and registry client", func(t *testing.T) {
		opts := &action.ChartPathOptions{}
		setter := &mockRegistryClientSetter{}
		creds := &UserCredentials{Username: "admin", Password: "s3cret"}

		err := applyBasicAuthFromUserCredentials(opts, setter, creds)
		require.NoError(t, err)
		require.Equal(t, "admin", opts.Username)
		require.Equal(t, "s3cret", opts.Password)
		require.NotNil(t, setter.client)
	})

	t.Run("returns error when registry client creation fails", func(t *testing.T) {
		original := newRegistryClient
		defer func() { newRegistryClient = original }()
		newRegistryClient = func(opts ...registry.ClientOption) (*registry.Client, error) {
			return nil, errors.New("mock registry error")
		}

		opts := &action.ChartPathOptions{}
		setter := &mockRegistryClientSetter{}
		creds := &UserCredentials{Username: "admin", Password: "s3cret"}

		err := applyBasicAuthFromUserCredentials(opts, setter, creds)
		require.Error(t, err)
		require.ErrorContains(t, err, "failed to configure OCI registry client")
		require.Nil(t, setter.client)
	})
}
