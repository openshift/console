package chartproxy

import (
	"testing"

	"github.com/openshift/console/pkg/helm/actions/fake"
)

func TestHelmRepoGetter_List(t *testing.T) {
	tests := []struct {
		name                      string
		HelmChartRepoCRSInCluster int
		expectedRepoName          []string
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
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var indexFileContennts []string
			for i := 0; i < tt.HelmChartRepoCRSInCluster; i++ {
				indexFileContennts = append(indexFileContennts, "")
			}
			client := fake.K8sDynamicClient(indexFileContennts...)
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
