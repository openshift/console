package verifier

import (
	apichecks "github.com/redhat-certification/chart-verifier/pkg/chartverifier/checks"
	apireport "github.com/redhat-certification/chart-verifier/pkg/chartverifier/report"
	apireportsummary "github.com/redhat-certification/chart-verifier/pkg/chartverifier/reportsummary"
	"time"
)

type ReportFormat string
type StringKey string
type ValuesKey string
type BooleanKey string
type DurationKey string

type Verifier struct {
	Id      string  `json:"UUID" yaml:"UUID"`
	Inputs  Inputs  `json:"inputs" yaml:"inputs"`
	Outputs Outputs `json:"outputs" yaml:"outputs"`
}

type Inputs struct {
	ChartUri  string `json:"chart-uri" yaml:"chart-uri"`
	ReportUri string `json:"report-uri" yaml:"report_uri"`
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
