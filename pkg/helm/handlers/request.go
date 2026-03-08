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
}

type HelmVerifierRequest struct {
	ChartUrl string                 `json:"chart_url"`
	Values   map[string]interface{} `json:"values"`
}
