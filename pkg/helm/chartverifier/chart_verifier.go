package chartverifier

import (
	"fmt"

	reportSummary "github.com/redhat-certification/chart-verifier/pkg/chartverifier/reportsummary"
	"github.com/redhat-certification/chart-verifier/pkg/chartverifier/verifier"
	"helm.sh/helm/v3/pkg/action"
)

func ChartVerifier(charturl string, values map[string]interface{}, conf *action.Configuration) (string, error) {
	// Get and print the report from the verify command
	if charturl == "" {
		return "", fmt.Errorf("Chart path is invalid")
	}
	commandSet := make(map[string]interface{})
	commandSet["profile.vendortype"] = values["provider"]
	apiVerifier := verifier.NewVerifier()
	apiVerifier.SetValues(verifier.CommandSet, commandSet)
	repositoryCacheList := []string{"/tmp"}
	apiVerifier.SetString(verifier.RepositoryCache, repositoryCacheList)
	verifier, verifierErr := apiVerifier.Run(charturl)
	if verifierErr != nil {
		return "", verifierErr
	}
	report := verifier.GetReport()
	reportSummaryObj := reportSummary.NewReportSummary()
	reportSummary, summaryErr := reportSummaryObj.SetValues(commandSet).SetReport(report).GetContent(reportSummary.ResultsSummary, reportSummary.JsonReport)
	if summaryErr != nil {
		return "", summaryErr
	}
	return reportSummary, nil
}
