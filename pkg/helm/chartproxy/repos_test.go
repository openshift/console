package chartproxy

import (
	"errors"
	"io/ioutil"
	"net/http"
	"os"
	"reflect"
	"testing"

	helmrepo "helm.sh/helm/v3/pkg/repo"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	fakeclient "k8s.io/client-go/dynamic/fake"
	k8sfake "k8s.io/client-go/kubernetes/fake"
	fakeclienttest "k8s.io/client-go/testing"

	"github.com/openshift/console/pkg/helm/actions/fake"
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
		name                      string
		HelmChartRepoCRSInCluster int
		expectedRepoName          []string
		apiErrors                 []apiError
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
			var indexFileContennts []string
			for i := 0; i < tt.HelmChartRepoCRSInCluster; i++ {
				indexFileContennts = append(indexFileContennts, "")
			}
			client := fake.K8sDynamicClient(indexFileContennts...)
			for _, apiError := range tt.apiErrors {
				client.(*fakeclient.FakeDynamicClient).PrependReactor(apiError.verb, apiError.resource, func(action fakeclienttest.Action) (handled bool, ret runtime.Object, err error) {
					return true, nil, errors.New(apiError.msg)
				})
			}
			repoGetter := NewRepoGetter(client, nil)
			repos, err := repoGetter.List()
			if err != nil {
				t.Error(err)
			}

			if len(repos) != len(tt.expectedRepoName) {
				t.Errorf("expected num of repos: %d received %d", len(tt.expectedRepoName), len(repos))
			}
			for i, expectedName := range tt.expectedRepoName {
				if repos[i].Name != expectedName {
					t.Errorf("Repo name mismatch expected is %s received %s", expectedName, repos[i].Name)
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
			repos, err := repoGetter.List()
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
				Client: fake.K8sDynamicClient(),
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
			repo, err := repoGetter.unmarshallConfig(repoCR)
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
				var expectedIndex *helmrepo.IndexFile
				if tt.expectedIndexFile != "" {
					expectedIndex, err = helmrepo.LoadIndexFile(tt.expectedIndexFile)
				} else {
					expectedIndex, err = helmrepo.LoadIndexFile(tt.indexFile)
				}
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
			repos, err := repoGetter.List()
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
