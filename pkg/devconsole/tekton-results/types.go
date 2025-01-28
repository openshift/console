package tektonresults

type TektonResultsRequest struct {
	AllowInsecure   bool   `json:"allowInsecure,omitempty"`
	AllowAuthHeader bool   `json:"allowAuthHeader,omitempty"`
	SearchNamespace string `json:"searchNamespace"`
	SearchParams    string `json:"searchParams"`
}

type SummaryRequest struct {
	AllowInsecure   bool   `json:"allowInsecure,omitempty"`
	AllowAuthHeader bool   `json:"allowAuthHeader,omitempty"`
	SearchNamespace string `json:"searchNamespace"`
	SearchParams    string `json:"searchParams"`
}

type TaskRunLogRequest struct {
	AllowInsecure   bool   `json:"allowInsecure,omitempty"`
	AllowAuthHeader bool   `json:"allowAuthHeader,omitempty"`
	TaskRunPath     string `json:"taskRunPath"`
}
