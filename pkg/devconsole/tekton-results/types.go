package tektonresults

import "github.com/openshift/console/pkg/devconsole/common"

type TektonResultsRequest struct {
	SearchNamespace string `json:"searchNamespace"`
	SearchParams    string `json:"searchParams"`
	common.DevConsoleCommonRequest
}

type SummaryRequest struct {
	SearchNamespace string `json:"searchNamespace"`
	SearchParams    string `json:"searchParams"`
	common.DevConsoleCommonRequest
}

type TaskRunLogRequest struct {
	TaskRunPath string `json:"taskRunPath"`
	common.DevConsoleCommonRequest
}
