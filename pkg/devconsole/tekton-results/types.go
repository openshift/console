package tektonresults

type TektonResultsRequest struct {
	SearchNamespace string `json:"searchNamespace"`
	SearchParams    string `json:"searchParams"`
}

type SummaryRequest struct {
	SearchNamespace string `json:"searchNamespace"`
	SearchParams    string `json:"searchParams"`
}

type TaskRunLogRequest struct {
	TaskRunPath string `json:"taskRunPath"`
}
