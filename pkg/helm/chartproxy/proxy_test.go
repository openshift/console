package chartproxy

import (
	"golang.org/x/net/context"
	"helm.sh/helm/v3/pkg/repo"
	"io/ioutil"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"reflect"
	"testing"

	"k8s.io/client-go/rest"

	"github.com/openshift/console/pkg/helm/actions/fake"
)

func TestProxy_IndexFile(t *testing.T) {
	tests := []struct {
		name       string
		indexFiles []string
		mergedFile string
		helmCRS    []*unstructured.Unstructured
	}{
		{
			name:       "returned index file for configured helm repo",
			indexFiles: []string{"testdata/azureRepoIndex.yaml"},
			mergedFile: "testdata/azureRepoIndex.yaml",
		},
		{
			name:       "returned merged index file for configured helm repos",
			indexFiles: []string{"testdata/azureRepoIndex.yaml", "testdata/sampleRepoIndex.yaml"},
			mergedFile: "testdata/mergedRepoIndex.yaml",
		},
		{
			name:       "return empty index file when no repositories declared in cluster",
			indexFiles: []string{},
			mergedFile: "",
		},
		{
			name:       "returned merged index file for all accessible helm repos",
			indexFiles: []string{"testdata/azureRepoIndex.yaml"},
			mergedFile: "testdata/azureRepoIndex.yaml",
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
						},
					},
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var indexFileContents []string
			for _, f := range tt.indexFiles {
				content, err := ioutil.ReadFile(f)
				if err != nil {
					t.Error(err)
				}
				indexFileContents = append(indexFileContents, string(content))
			}
			dynamicClient := fake.K8sDynamicClient(indexFileContents...)
			for _, helmcr := range tt.helmCRS {
				_, err := dynamicClient.Resource(helmChartRepositoryGVK).Create(context.TODO(), helmcr, v1.CreateOptions{})
				if err != nil {
					t.Error(err)
				}
			}
			fakeProxyOption := func(p *proxy) error {
				p.dynamicClient = dynamicClient
				return nil
			}
			p, err := New(func() (r *rest.Config, err error) {
				return &rest.Config{}, nil
			}, fakeProxyOption)
			if err != nil {
				t.Error(err)
			}

			indexFile, err := p.IndexFile()
			if err != nil {
				t.Error(err)
			}
			if tt.mergedFile != "" {
				expectedIndexFile, err := repo.LoadIndexFile(tt.mergedFile)
				if err != nil {
					t.Error(err)
				}
				if reflect.DeepEqual(indexFile, expectedIndexFile) {
					t.Errorf("Expected index content \n%v but got \n%v", expectedIndexFile, indexFile)
				}
			} else {
				if len(indexFile.Entries) > 0 {
					t.Errorf("Expected empty index file, but got %v", indexFile)
				}
				if indexFile.APIVersion == "" {
					t.Error("apiversion in index file should be set")
				}
			}
		})
	}
}
