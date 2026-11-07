package chartverifier

import (
	"encoding/json"
	"fmt"
	"strings"

	reportSummary "github.com/redhat-certification/chart-verifier/pkg/chartverifier/reportsummary"
	"github.com/redhat-certification/chart-verifier/pkg/chartverifier/verifier"
	"helm.sh/helm/v4/pkg/action"

	"github.com/openshift/console/pkg/helm/fetcherr"
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
		return "", fetcherr.SanitizeChartError(verifierErr)
	}
	report := verifier.GetReport()
	reportSummaryObj := reportSummary.NewReportSummary()
	reportSummary, summaryErr := reportSummaryObj.SetValues(commandSet).SetReport(report).GetContent(reportSummary.ResultsSummary, reportSummary.JSONReport)
	if summaryErr != nil {
		return "", summaryErr
	}
	return sanitizeVerifierSummary(reportSummary)
}

// verifierResults is the results summary returned to the client.
type verifierResults struct {
	Results struct {
		Passed   string   `json:"passed"`
		Failed   string   `json:"failed"`
		Messages []string `json:"message"`
	} `json:"results"`
}

// sanitizeVerifierSummary removes the raw provenance-file fetch error and HTTP
// status from signature check messages. The verifier copies those into the report.
func sanitizeVerifierSummary(summary string) (string, error) {
	var parsed verifierResults
	if err := json.Unmarshal([]byte(summary), &parsed); err != nil {
		return "", fmt.Errorf("failed to read verifier summary: %w", err)
	}
	for i, msg := range parsed.Results.Messages {
		parsed.Results.Messages[i] = sanitizeProvReason(msg)
	}
	out, err := json.Marshal(parsed)
	if err != nil {
		return "", fmt.Errorf("failed to write verifier summary: %w", err)
	}
	return string(out), nil
}

func sanitizeProvReason(reason string) string {
	lower := strings.ToLower(reason)
	for _, marker := range []string{"get error was", "get prov file response code was", "error downloading"} {
		index := strings.Index(lower, marker)
		if index < 0 {
			continue
		}
		trimmed := strings.TrimRight(reason[:index], " :.")
		if trimmed == "" {
			return "Signature verification failed"
		}
		return trimmed
	}
	return reason
}
