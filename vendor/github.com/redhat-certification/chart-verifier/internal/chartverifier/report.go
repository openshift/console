/*
 * Copyright 2021 Red Hat
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package chartverifier

import (
	"fmt"

	"github.com/redhat-certification/chart-verifier/internal/chartverifier/checks"
	apiChecks "github.com/redhat-certification/chart-verifier/pkg/chartverifier/checks"
	apiReport "github.com/redhat-certification/chart-verifier/pkg/chartverifier/report"
)

var (
	ReportAPIVersion = "v1"
	ReportKind       = "verify-report"
)

type InternalReport struct {
	APIReport apiReport.Report
}

type InternalCheckReport struct {
	APICheckReport apiReport.CheckReport
}

func newReport() InternalReport {
	report := InternalReport{}
	report.APIReport = apiReport.Report{Apiversion: ReportAPIVersion, Kind: ReportKind}
	report.APIReport.Metadata = apiReport.ReportMetadata{}
	report.APIReport.Metadata.ToolMetadata = apiReport.ToolMetadata{}

	return report
}

func (ir *InternalReport) AddCheck(check checks.Check) *InternalCheckReport {
	newCheck := InternalCheckReport{}
	newCheck.APICheckReport = apiReport.CheckReport{}
	newCheck.APICheckReport.Check = apiChecks.CheckName(fmt.Sprintf("%s/%s", check.CheckID.Version, check.CheckID.Name))
	newCheck.APICheckReport.Type = check.Type
	newCheck.APICheckReport.Outcome = apiReport.UnknownOutcomeType
	ir.APIReport.Results = append(ir.APIReport.Results, &newCheck.APICheckReport)
	return &newCheck
}

func (cr *InternalCheckReport) SetResult(outcome bool, skipped bool, reason string) {
	if skipped {
		cr.APICheckReport.Outcome = apiReport.SkippedOutcomeType
	} else if outcome {
		cr.APICheckReport.Outcome = apiReport.PassOutcomeType
	} else {
		cr.APICheckReport.Outcome = apiReport.FailOutcomeType
	}
	cr.APICheckReport.Reason = reason
}

func (ir *InternalReport) GetAPIReport() *apiReport.Report {
	return &ir.APIReport
}

func (cr *InternalCheckReport) GetAPICheckReport() *apiReport.CheckReport {
	return &cr.APICheckReport
}

func (ir *InternalReport) SetReportDigest() {
	var err error
	ir.APIReport.Metadata.ToolMetadata.ReportDigest, err = ir.APIReport.GetReportDigest()
	if err != nil {
		ir.APIReport.Metadata.ToolMetadata.ReportDigest = err.Error()
	}
}
