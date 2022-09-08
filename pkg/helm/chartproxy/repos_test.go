package chartproxy

import (
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"reflect"
	"testing"
	"time"

	helmrepo "helm.sh/helm/v3/pkg/repo"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/dynamic"
	fakeclient "k8s.io/client-go/dynamic/fake"
	k8sfake "k8s.io/client-go/kubernetes/fake"
	fakeclienttest "k8s.io/client-go/testing"
	"sigs.k8s.io/yaml"

	"github.com/openshift/console/pkg/helm/actions/fake"
	"github.com/stretchr/testify/require"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type apiError struct {
	verb     string
	resource string
	msg      string
}

type RoundTripFunc func(req *http.Request) *http.Response

func (f RoundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	return f(req), nil
}

func onlyResult(obj interface{}, err error) interface{} {
	return obj
}

func TestHelmRepoGetter_List(t *testing.T) {
	tests := []struct {
		name                        string
		HelmChartRepoCRSInCluster   int
		expectedRepoName            []string
		namespace                   string
		HelmChartRepoCRSInNamespace int
		expectedRepoNameInNamespace []string
		apiErrors                   []apiError
	}{
		{
			name:                      "return 2 repos found in cluster",
			HelmChartRepoCRSInCluster: 2,
			expectedRepoName:          []string{"sample-repo-1", "sample-repo-2"},
		},
		{
			name:                      "return 1 repo found in cluster",
			HelmChartRepoCRSInCluster: 1,
			expectedRepoName:          []string{"sample-repo-1"},
		},
		{
			name:                        "return 1 repos found in cluster and 1 in namespace",
			HelmChartRepoCRSInCluster:   1,
			expectedRepoName:            []string{"sample-cluster-repo-1"},
			HelmChartRepoCRSInNamespace: 1,
			expectedRepoNameInNamespace: []string{"sample-namespace-repo-1"},
			namespace:                   "test-namespace",
		},
		{
			name:                      "return no repos when none are declared in cluster",
			HelmChartRepoCRSInCluster: 0,
			expectedRepoName:          []string{},
		},
		{
			name:                      "return no repos in case of k8s list error",
			HelmChartRepoCRSInCluster: 2,
			expectedRepoName:          []string{},
			apiErrors: []apiError{
				{
					verb:     "list",
					resource: "helmchartrepositories",
					msg:      "foo",
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var indexFileContentsCluster []string
			for i := 0; i < tt.HelmChartRepoCRSInCluster; i++ {
				indexFileContentsCluster = append(indexFileContentsCluster, "")
			}
			var indexFileContenntsNamespace []string
			for i := 0; i < tt.HelmChartRepoCRSInNamespace; i++ {
				indexFileContenntsNamespace = append(indexFileContenntsNamespace, "")
			}
			var client dynamic.Interface
			if len(indexFileContenntsNamespace) > 0 {
				client = fake.K8sDynamicClientMultipleNamespace(tt.namespace, indexFileContentsCluster, indexFileContenntsNamespace)
			} else {
				client = fake.K8sDynamicClient("helm.openshift.io/v1beta1", "HelmChartRepository", "", indexFileContentsCluster...)
			}
			for _, apiError := range tt.apiErrors {
				client.(*fakeclient.FakeDynamicClient).PrependReactor(apiError.verb, apiError.resource, func(action fakeclienttest.Action) (handled bool, ret runtime.Object, err error) {
					return true, nil, errors.New(apiError.msg)
				})
			}
			repoGetter := NewRepoGetter(client, nil)
			repos, err := repoGetter.List(tt.namespace)
			if err != nil {
				t.Error(err)
			}

			if len(repos) != len(tt.expectedRepoName)+len(tt.expectedRepoNameInNamespace) {
				t.Errorf("expected num of repos: %d received %d", len(tt.expectedRepoName), len(repos))
			}
			for i, expectedName := range tt.expectedRepoName {
				if repos[i].Name != expectedName {
					t.Errorf("Repo name mismatch expected is %s received %s", expectedName, repos[i].Name)
				}
			}
			for i, expectedName := range tt.expectedRepoNameInNamespace {
				index := len(tt.expectedRepoName) + i
				if repos[index].Name != expectedName {
					t.Errorf("Repo name mismatch expected is %s received %s", expectedName, repos[index].Name)
				}
			}
		})
	}
}

func TestHelmRepoGetter_ListErrors(t *testing.T) {
	tests := []struct {
		name             string
		helmCRS          []*unstructured.Unstructured
		expectedRepoName []string
		apiErrors        []apiError
		namespace        string
	}{
		{
			name: "skip repo that refer non-existent config map",
			helmCRS: []*unstructured.Unstructured{
				{
					Object: map[string]interface{}{
						"apiVersion": "helm.openshift.io/v1beta1",
						"kind":       "HelmChartRepository",
						"metadata": map[string]interface{}{
							"namespace": "",
							"name":      "repo1",
						},
						"spec": map[string]interface{}{
							"connectionConfig": map[string]interface{}{
								"url": "http://foo.com/bar",
								"ca": map[string]interface{}{
									"name": "fooConfigMap",
								},
							},
						},
					},
				},
				{
					Object: map[string]interface{}{
						"apiVersion": "helm.openshift.io/v1beta1",
						"kind":       "HelmChartRepository",
						"metadata": map[string]interface{}{
							"namespace": "",
							"name":      "repo2",
						},
						"spec": map[string]interface{}{
							"connectionConfig": map[string]interface{}{
								"url": "http://foo2.com/bar",
							},
						},
					},
				},
			},
			expectedRepoName: []string{"repo2"},
		},
		{
			name: "skip repo that refer config map that cannot be accessed",
			helmCRS: []*unstructured.Unstructured{
				{
					Object: map[string]interface{}{
						"apiVersion": "helm.openshift.io/v1beta1",
						"kind":       "HelmChartRepository",
						"metadata": map[string]interface{}{
							"namespace": "",
							"name":      "repo1",
						},
						"spec": map[string]interface{}{
							"connectionConfig": map[string]interface{}{
								"url": "http://foo.com/bar",
								"ca": map[string]interface{}{
									"name": "fooConfigMap",
								},
							},
						},
					},
				},
				{
					Object: map[string]interface{}{
						"apiVersion": "helm.openshift.io/v1beta1",
						"kind":       "HelmChartRepository",
						"metadata": map[string]interface{}{
							"namespace": "",
							"name":      "repo2",
						},
						"spec": map[string]interface{}{
							"connectionConfig": map[string]interface{}{
								"url": "http://foo2.com/bar",
							},
						},
					},
				},
			},
			apiErrors: []apiError{
				{
					verb:     "get",
					resource: "configmaps",
					msg:      "foo",
				},
			},
			expectedRepoName: []string{"repo2"},
		},
		{
			name: "skip repo that refer secret that cannot be accessed",
			helmCRS: []*unstructured.Unstructured{
				{
					Object: map[string]interface{}{
						"apiVersion": "helm.openshift.io/v1beta1",
						"kind":       "HelmChartRepository",
						"metadata": map[string]interface{}{
							"namespace": "",
							"name":      "repo1",
						},
						"spec": map[string]interface{}{
							"connectionConfig": map[string]interface{}{
								"url": "http://foo.com/bar",
								"tlsClientConfig": map[string]interface{}{
									"name": "fooSecret",
								},
							},
						},
					},
				},
				{
					Object: map[string]interface{}{
						"apiVersion": "helm.openshift.io/v1beta1",
						"kind":       "HelmChartRepository",
						"metadata": map[string]interface{}{
							"namespace": "",
							"name":      "repo2",
						},
						"spec": map[string]interface{}{
							"connectionConfig": map[string]interface{}{
								"url": "http://foo2.com/bar",
							},
						},
					},
				},
			},
			apiErrors: []apiError{
				{
					verb:     "get",
					resource: "secrets",
					msg:      "foo",
				},
			},
			expectedRepoName: []string{"repo2"},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client := fake.K8sDynamicClientFromCRs(tt.helmCRS...)
			coreClient := k8sfake.NewSimpleClientset()
			for _, apiError := range tt.apiErrors {
				coreClient.PrependReactor(apiError.verb, apiError.resource, func(action fakeclienttest.Action) (handled bool, ret runtime.Object, err error) {
					return true, nil, errors.New(apiError.msg)
				})
			}
			repoGetter := NewRepoGetter(client, coreClient.CoreV1())
			repos, err := repoGetter.List(tt.namespace)
			if err != nil {
				t.Error(err)
			}
			if len(repos) != len(tt.expectedRepoName) {
				t.Errorf("Expected %v repos, but got %v", len(tt.expectedRepoName), len(repos))
			}
			for i, repoName := range tt.expectedRepoName {
				if repoName != repos[i].Name {
					t.Errorf("Expected %v but got %v", repoName, repos[i].Name)
				}
			}
		})
	}
}

func TestHelmRepo_IndexFile(t *testing.T) {
	tests := []struct {
		name              string
		url               string
		httpCode          int
		indexFile         string
		expectedIndexFile string
		err               bool
	}{
		{
			name:      "return index file",
			indexFile: "testdata/sampleRepoIndex.yaml",
			httpCode:  200,
		},
		{
			name: "return error when host not exists",
			url:  "http://foo.com",
			err:  true,
		},
		{
			name:      "return error when index not found",
			indexFile: "testdata/sampleRepoIndex.yaml",
			httpCode:  404,
			err:       true,
		},
		{
			name:              "return resolved index file",
			indexFile:         "testdata/sampleRepoIndexWithRelativeURLs.yaml",
			expectedIndexFile: "testdata/sampleRepoIndex.yaml",
			httpCode:          200,
			err:               false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			repoGetter := &helmRepoGetter{
				Client: fake.K8sDynamicClient("helm.openshift.io/v1beta1", "HelmChartRepository", ""),
			}
			url := tt.url

			if url == "" {
				url = "https://redhat-developer.github.com/redhat-helm-charts/charts/"
			}
			repoCR := unstructured.Unstructured{
				Object: map[string]interface{}{
					"apiVersion": "helm.openshift.io/v1beta1",
					"kind":       "HelmChartRepository",
					"metadata": map[string]interface{}{
						"namespace": "",
						"name":      "repo1",
					},
					"spec": map[string]interface{}{
						"connectionConfig": map[string]interface{}{
							"url": url,
						},
					},
				},
			}
			repo, err := repoGetter.unmarshallConfig(repoCR, "", true)
			if err != nil {
				t.Error(err)
			}
			if tt.url == "" {
				repo.httpClient = func() (*http.Client, error) {
					return &http.Client{
						Transport: RoundTripFunc(func(req *http.Request) *http.Response {
							resp := &http.Response{
								StatusCode: tt.httpCode,
							}
							if tt.indexFile != "" {
								r, err := os.Open(tt.indexFile)
								if err != nil {
									t.Error(err)
								}
								resp.Body = ioutil.NopCloser(r)
							}
							return resp
						}),
					}, nil
				}
			}
			index, err := repo.IndexFile()
			if tt.err && err == nil {
				t.Errorf("Expected error %v but got %v", tt.err, err)
			}

			if err == nil && tt.indexFile != "" {
				expectedIndexPath := tt.indexFile
				if tt.expectedIndexFile != "" {
					expectedIndexPath = tt.expectedIndexFile
				}
				data, err := ioutil.ReadFile(expectedIndexPath)
				if err != nil {
					t.Error(err)
				}
				expectedIndex := &helmrepo.IndexFile{}
				err = yaml.UnmarshalStrict(data, expectedIndex)
				if err != nil {
					t.Error(err)
				}

				if !reflect.DeepEqual(expectedIndex.Entries, index.Entries) {
					t.Errorf("Expected index %v but got %v", expectedIndex, index)
				}
			}
		})
	}
}

func TestHelmRepoGetter_SkipDisabled(t *testing.T) {
	tests := []struct {
		name          string
		helmCRS       []*unstructured.Unstructured
		expectedRepos map[string]bool
		apiErrors     []apiError
		namespace     string
	}{
		{
			name: "return only enabled helm repos",
			helmCRS: []*unstructured.Unstructured{
				{
					Object: map[string]interface{}{
						"apiVersion": "helm.openshift.io/v1beta1",
						"kind":       "HelmChartRepository",
						"metadata": map[string]interface{}{
							"namespace": "",
							"name":      "repo1",
						},
						"spec": map[string]interface{}{
							"connectionConfig": map[string]interface{}{
								"url": "http://foo.com/bar",
							},
							"disabled": true,
						},
					},
				},
				{
					Object: map[string]interface{}{
						"apiVersion": "helm.openshift.io/v1beta1",
						"kind":       "HelmChartRepository",
						"metadata": map[string]interface{}{
							"namespace": "",
							"name":      "repo2",
						},
						"spec": map[string]interface{}{
							"connectionConfig": map[string]interface{}{
								"url": "http://foo2.com/bar",
							},
						},
					},
				},
			},
			expectedRepos: map[string]bool{"repo1": true, "repo2": false},
		},
		{
			name: "return empty list if no helm repos are enabled",
			helmCRS: []*unstructured.Unstructured{
				{
					Object: map[string]interface{}{
						"apiVersion": "helm.openshift.io/v1beta1",
						"kind":       "HelmChartRepository",
						"metadata": map[string]interface{}{
							"namespace": "",
							"name":      "repo1",
						},
						"spec": map[string]interface{}{
							"connectionConfig": map[string]interface{}{
								"url": "http://foo.com/bar",
							},
							"disabled": true,
						},
					},
				},
				{
					Object: map[string]interface{}{
						"apiVersion": "helm.openshift.io/v1beta1",
						"kind":       "HelmChartRepository",
						"metadata": map[string]interface{}{
							"namespace": "",
							"name":      "repo2",
						},
						"spec": map[string]interface{}{
							"connectionConfig": map[string]interface{}{
								"url": "http://foo2.com/bar",
							},
							"disabled": true,
						},
					},
				},
			},
			expectedRepos: map[string]bool{"repo1": true, "repo2": true},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client := fake.K8sDynamicClientFromCRs(tt.helmCRS...)
			coreClient := k8sfake.NewSimpleClientset()
			repoGetter := NewRepoGetter(client, coreClient.CoreV1())
			repos, err := repoGetter.List(tt.namespace)
			if err != nil {
				t.Error(err)
			}
			if len(repos) != len(tt.expectedRepos) {
				t.Errorf("Expected %v repos, but got %v", len(tt.expectedRepos), len(repos))
			}
			for _, helmRepo := range repos {
				disabled, exist := tt.expectedRepos[helmRepo.Name]
				if !exist {
					t.Errorf("Specified repo should not exist in the response: %s", helmRepo.Name)
				}
				if disabled != helmRepo.Disabled {
					t.Errorf("Expected %v but got %v", disabled, helmRepo.Disabled)
				}
			}
		})
	}
}

func TestHelmRepoGetter_unmarshallConfig(t *testing.T) {
	if err := setupTestWithTls(); err != nil {
		panic(err)
	}
	tests := []struct {
		name            string
		helmCRS         *unstructured.Unstructured
		repoName        string
		wantsErr        bool
		createSecret    bool
		namespace       string
		createNamespace bool
	}{
		{
			name: "Namespace present",
			helmCRS: &unstructured.Unstructured{
				Object: map[string]interface{}{
					"apiVersion": "helm.openshift.io/v1beta1",
					"kind":       "ProjectHelmChartRepository",
					"metadata": map[string]interface{}{
						"namespace": "",
						"name":      "repo4",
					},
					"spec": map[string]interface{}{
						"connectionConfig": map[string]interface{}{
							"url": "https://localhost:9553",
							"tlsClientConfig": map[string]interface{}{
								"name":      "fooSecret",
								"namespace": "testing",
							},
						},
					},
				},
			},
			repoName:        "repo4",
			wantsErr:        false,
			createSecret:    true,
			namespace:       "testing",
			createNamespace: true,
		},
		{
			name: "Namespace not present",
			helmCRS: &unstructured.Unstructured{
				Object: map[string]interface{}{
					"apiVersion": "helm.openshift.io/v1beta1",
					"kind":       "ProjectHelmChartRepository",
					"metadata": map[string]interface{}{
						"namespace": "",
						"name":      "repo5",
					},
					"spec": map[string]interface{}{
						"connectionConfig": map[string]interface{}{
							"url": "https://localhost:9553",
							"tlsClientConfig": map[string]interface{}{
								"name": "fooSecret",
							},
						},
					},
				},
			},
			repoName:        "repo5",
			wantsErr:        false,
			createSecret:    true,
			createNamespace: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			objs := []runtime.Object{}
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
					"tls.key": key,
					"tls.crt": certificate,
				}
				secretSpec := &v1.Secret{Data: data, ObjectMeta: metav1.ObjectMeta{Name: "fooSecret", Namespace: tt.namespace}}
				objs = append(objs, secretSpec)
			}
			repoGetter := &helmRepoGetter{
				Client:     fake.K8sDynamicClient("helm.openshift.io/v1beta1", "HelmChartRepository", ""),
				CoreClient: k8sfake.NewSimpleClientset(objs...).CoreV1(),
			}
			_, err := repoGetter.unmarshallConfig(*tt.helmCRS, tt.namespace, false)
			if tt.wantsErr {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
			}
		})
	}
	err := ExecuteScript("./testdata/chartmuseum-stop.sh", false)
	require.NoError(t, err)
	err = ExecuteScript("./testdata/cleanup.sh", false)
	require.NoError(t, err)
}

func ExecuteScript(filepath string, waitForCompletion bool) error {
	tlsCmd := exec.Command(filepath)
	tlsCmd.Stdout = os.Stdout
	tlsCmd.Stderr = os.Stderr
	err := tlsCmd.Start()
	if err != nil {
		bytes, _ := ioutil.ReadAll(os.Stderr)
		return fmt.Errorf("Error starting command :%s:%s:%w", filepath, string(bytes), err)
	}
	if waitForCompletion {
		err = tlsCmd.Wait()
		if err != nil {
			bytes, _ := ioutil.ReadAll(os.Stderr)
			return fmt.Errorf("Error waiting command :%s:%s:%w", filepath, string(bytes), err)
		}
	}
	return nil
}

func setupTestWithTls() error {
	if err := ExecuteScript("./testdata/downloadChartmuseum.sh", true); err != nil {
		return err
	}
	if err := ExecuteScript("./testdata/createTlsSecrets.sh", true); err != nil {
		return err
	}
	if err := ExecuteScript("./testdata/chartmuseum.sh", false); err != nil {
		return err
	}
	time.Sleep(5 * time.Second)
	if err := ExecuteScript("./testdata/cacertCreate.sh", true); err != nil {
		return err
	}
	if err := ExecuteScript("./testdata/uploadCharts.sh", true); err != nil {
		return err
	}
	return nil
}
