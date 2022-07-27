package handlers

type HelmRequest struct {
	Name       string                 `json:"name"`
	Namespace  string                 `json:"namespace"`
	ChartUrl   string                 `json:"chart_url"`
	Values     map[string]interface{} `json:"values"`
	Version    int                    `json:"version"`
	IndexEntry string                 `json:"indexEntry"`
}

type HelmVerifierRequest struct {
	ChartUrl string                 `json:"chart_url"`
	Values   map[string]interface{} `json:"values"`
}
