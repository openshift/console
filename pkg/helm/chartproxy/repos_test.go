package chartproxy

import (
	"testing"

	"github.com/openshift/console/pkg/helm/actions/fake"
)

func TestHelmRepoGetter_List(t *testing.T) {
	tests := []struct {
		name             string
		ReposNum         int
		expectedRepoName []string
	}{
		{
			name:             "return 2 repos found in cluster",
			ReposNum:         2,
			expectedRepoName: []string{"sample-repo-1", "sample-repo-2"},
		},
		{
			name:             "return 1 repos found in cluster",
			ReposNum:         1,
			expectedRepoName: []string{"sample-repo-1"},
		},
		{
			name:             "return default repo when none are declared in cluster",
			ReposNum:         0,
			expectedRepoName: []string{"redhat-helm-charts"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var indexFileContennts []string
			for i := 0; i < tt.ReposNum; i++ {
				indexFileContennts = append(indexFileContennts, "")
			}
			client := fake.K8sDynamicClient(indexFileContennts...)
			cfg := config{repoUrl: "https://default-url.com"}
			cfg.Configure()
			repoGetter := NewRepoGetter(client, nil)
			repos, err := repoGetter.List()
			if err != nil {
				t.Error(err)
			}

			if len(repos) != len(tt.expectedRepoName) {
				t.Errorf("expected num of repos: %d received %d", len(tt.expectedRepoName), len(repos))
			}
			for i, repo := range repos {
				if repo.Name != tt.expectedRepoName[i] {
					t.Errorf("Repo name mismatch expected is %s received %s", tt.expectedRepoName[i], repo.Name)
				}
			}
		})
	}
}
