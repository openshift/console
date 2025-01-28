package artifacthub

type ArtifactHubRepository struct {
	Name                    string `json:"name"`
	Kind                    int    `json:"kind"`
	URL                     string `json:"url"`
	DisplayName             string `json:"display_name"`
	RepositoryID            string `json:"repository_id"`
	OrganizationName        string `json:"organization_name"`
	OrganizationDisplayName string `json:"organization_display_name"`
}

type ArtifactHubTask struct {
	PackageID   string                `json:"package_id"`
	Name        string                `json:"name"`
	Description string                `json:"description"`
	Version     string                `json:"version"`
	DisplayName string                `json:"display_name"`
	Repository  ArtifactHubRepository `json:"repository"`
}

type SearchRequest struct {
	AllowInsecure   bool   `json:"allowInsecure,omitempty"`
	AllowAuthHeader bool   `json:"allowAuthHeader,omitempty"`
	SearchQuery     string `json:"searchQuery"`
}

type TaskYAMLRequest struct {
	AllowInsecure   bool   `json:"allowInsecure,omitempty"`
	AllowAuthHeader bool   `json:"allowAuthHeader,omitempty"`
	YamlPath        string `json:"yamlPath"`
}

type TaskDetailsRequest struct {
	AllowInsecure   bool   `json:"allowInsecure,omitempty"`
	AllowAuthHeader bool   `json:"allowAuthHeader,omitempty"`
	RepoName        string `json:"repoName"`
	Name            string `json:"name"`
	Version         string `json:"version"`
}
