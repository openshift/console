package verifier

import (
	"time"

	apichecks "github.com/redhat-certification/chart-verifier/pkg/chartverifier/checks"
	apireport "github.com/redhat-certification/chart-verifier/pkg/chartverifier/report"
	apireportsummary "github.com/redhat-certification/chart-verifier/pkg/chartverifier/reportsummary"
)

type (
	ReportFormat string
	StringKey    string
	ValuesKey    string
	BooleanKey   string
	DurationKey  string
)

type Verifier struct {
	ID      string  `json:"UUID" yaml:"UUID"`
	Inputs  Inputs  `json:"inputs" yaml:"inputs"`
	Outputs Outputs `json:"outputs" yaml:"outputs"`
}

type Inputs struct {
	ChartURI  string `json:"chart-uri" yaml:"chart-uri"`
	ReportURI string `json:"report-uri" yaml:"report_uri"`
	Flags     Flags  `json:"flags" yaml:"flags"`
}

type Outputs struct {
	Report        *apireport.Report               `json:"report" yaml:"report"`
	ReportSummary *apireportsummary.ReportSummary `json:"report-summary" yaml:"report-summary"`
}

type Flags struct {
	// Checks, checks with indication of enabled or disabled
	Checks map[apichecks.CheckName]CheckStatus `json:"checks" yaml:"checks"`
	// string settings
	StringFlags map[StringKey][]string `json:"string-flags" yaml:"string-flags"`
	// values
	ValuesFlags map[ValuesKey]map[string]interface{} `json:"values-flags" yaml:"values-flags"`
	// boolean settings
	BooleanFlags map[BooleanKey]bool
	// timeout settings
	DurationFlags map[DurationKey]time.Duration
}

type CheckStatus struct {
	Enabled bool `json:"enabled" yaml:"enabled"`
}
