package handlers

type HelmRequest struct {
	Name         string                 `json:"name"`
	Namespace    string                 `json:"namespace"`
	ChartUrl     string                 `json:"chart_url"`
	ChartVersion string                 `json:"chart_version"` // optional; for OCI/direct URL install, used when chart_url has no tag
	Values       map[string]interface{} `json:"values"`
	Version      int                    `json:"version"`
	IndexEntry   string                 `json:"indexEntry"`
	NoRepo       bool                   `json:"noRepo"`
	// BasicAuthSecretName is optional; names a Secret in Namespace with keys username and password for OCI/HTTP chart pull when NoRepo is true.
	BasicAuthSecretName string `json:"basic_auth_secret_name"`
}

type HelmVerifierRequest struct {
	ChartUrl string                 `json:"chart_url"`
	Values   map[string]interface{} `json:"values"`
}
