package chartproxy

import (
	"helm.sh/helm/v3/pkg/repo"
	"io/ioutil"
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
	}{
		{
			name:       "returned index file for configured helm repo",
			indexFiles: []string{"testdata/sampleRepoIndex.yaml"},
			mergedFile: "testdata/mergedSampleRepoIndex2.yaml",
		},
		{
			name:       "returned merged index file for configured helm repos",
			indexFiles: []string{"testdata/azureRepoIndex.yaml", "testdata/sampleRepoIndex.yaml"},
			mergedFile: "testdata/mergedRepoIndex.yaml",
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
			fakeProxyOption := func(p *proxy) error {
				p.dynamicClient = fake.K8sDynamicClient(indexFileContents...)
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
