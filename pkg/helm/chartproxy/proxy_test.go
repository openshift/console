package chartproxy

import (
	"io/ioutil"
	"reflect"
	"testing"

	"golang.org/x/net/context"
	"helm.sh/helm/v3/pkg/repo"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/client-go/rest"

	"github.com/openshift/console/pkg/helm/actions/fake"
)

type MockKubeVersion struct {
	fakeVersion string
}

func (v MockKubeVersion) GetKubeVersion() string {
	return v.fakeVersion
}

func TestProxy_IndexFile(t *testing.T) {
	tests := []struct {
		name           string
		indexFiles     []string
		mergedFile     string
		kubeVersion    string
		helmCRS        []*unstructured.Unstructured
		onlyCompatible bool
	}{
		{
			name:       "returned index file for configured helm repo",
			indexFiles: []string{"testdata/sampleRepoIndex.yaml"},
			mergedFile: "testdata/mergedSampleRepoIndex2.yaml",
		},
		{
			name:           "returned index file for configured helm repo contains only charts compatible for given cluster v1.16.0",
			indexFiles:     []string{"testdata/sampleRepoIndex3.yaml"},
			mergedFile:     "testdata/sampleRepoIndex3FilteredKube1-16-0.yaml",
			kubeVersion:    "v1.16.0",
			onlyCompatible: true,
		},
		{
			name:           "returned index file for configured helm repo contains only charts compatible for given cluster v1.15.0",
			indexFiles:     []string{"testdata/sampleRepoIndex3.yaml"},
			mergedFile:     "testdata/sampleRepoIndexFilteredKube1-15-0.yaml",
			kubeVersion:    "v1.15.0",
			onlyCompatible: true,
		},
		{
			name:           "returned index file for configured helm repo contains only charts compatible for given cluster v1.14.0",
			indexFiles:     []string{"testdata/sampleRepoIndex3.yaml"},
			mergedFile:     "testdata/sampleRepoIndexFilteredKube1-14-0.yaml",
			kubeVersion:    "v1.14.0",
			onlyCompatible: true,
		},
		{
			name:           "return empty index file if not charts are compatible with given cluster",
			indexFiles:     []string{"testdata/incompatibleRepoIndex.yaml"},
			mergedFile:     "",
			kubeVersion:    "v1.15.0",
			onlyCompatible: true,
		},
		{
			name:           "returned index file for configured helm repo contains only charts compatible for given pre-release cluster v1.20.0-beta2",
			indexFiles:     []string{"testdata/RepoIndexPreRelease.yaml"},
			mergedFile:     "testdata/mergedRepoIndexPreReleaseV1-20-0-beta2.yaml",
			kubeVersion:    "v1.20.0-beta.2",
			onlyCompatible: true,
		},
		{
			name:           "returned index file for configured helm repo contains only charts compatible for given pre-release cluster v1.20.0-alpha2",
			indexFiles:     []string{"testdata/RepoIndexPreRelease.yaml"},
			mergedFile:     "testdata/mergedRepoIndexPreReleaseV1-20-0-alpha2.yaml",
			kubeVersion:    "v1.20.0-alpha.2",
			onlyCompatible: true,
		},
		{
			name:           "returned index file for configured helm repo contains only charts compatible for given pre-release cluster v1.20.0-beta.2",
			indexFiles:     []string{"testdata/sampleRepoIndex3.yaml"},
			mergedFile:     "testdata/mergedRepoIndexPreReleaseV1-20-0-0.yaml",
			kubeVersion:    "v1.20.0-beta.2",
			onlyCompatible: true,
		},
		{
			name:       "returned merged index file for configured helm repos",
			indexFiles: []string{"testdata/azureRepoIndex.yaml", "testdata/sampleRepoIndex.yaml"},
			mergedFile: "testdata/mergedRepoIndex.yaml",
		},
		{
			name:       "returned merged index file without library chart entries",
			indexFiles: []string{"testdata/sampleRepoLibrary.yaml"},
			mergedFile: "testdata/mergedRepoLibrary.yaml",
		},
		{
			name:       "returned merged index contains all entries from source repos - helm names are appended with repo names to avoid duplicate removal",
			indexFiles: []string{"testdata/sampleRepoIndex2.yaml", "testdata/sampleRepoIndex2.yaml"},
			mergedFile: "testdata/mergedRepoIndexWithDuplicates.yaml",
		},
		{
			name:       "return empty index file when no repositories declared in cluster",
			indexFiles: []string{},
			mergedFile: "",
		},
		{
			name:       "returned merged index file for all accessible helm repos",
			indexFiles: []string{"testdata/azureRepoIndex.yaml"},
			mergedFile: "testdata/mergedAzureRepoIndex.yaml",
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
			}, MockKubeVersion{fakeVersion: tt.kubeVersion}, fakeProxyOption)
			if err != nil {
				t.Error(err)
			}

			indexFile, err := p.IndexFile(tt.onlyCompatible)
			if err != nil {
				t.Error(err)
			}
			if tt.mergedFile != "" {
				expectedIndexFile, err := repo.LoadIndexFile(tt.mergedFile)
				if err != nil {
					t.Error(err)
				}
				if !reflect.DeepEqual(indexFile.Entries, expectedIndexFile.Entries) {
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
