package reportsummary

import (
	helmchart "helm.sh/helm/v3/pkg/chart"

	"github.com/redhat-certification/chart-verifier/internal/chartverifier/profiles"
	apireport "github.com/redhat-certification/chart-verifier/pkg/chartverifier/report"
)

type (
	SummaryType   string
	SummaryFormat string
	BooleanKey    string
)

type ReportSummary struct {
	options           *reportOptions
	AnnotationsReport []Annotation    `json:"annotations,omitempty" yaml:"annotations,omitempty"`
	DigestsReport     *DigestReport   `json:"digests,omitempty" yaml:"digests,omitempty"`
	MetadataReport    *MetadataReport `json:"metadata,omitempty" yaml:"metadata,omitempty"`
	ResultsReport     *ResultsReport  `json:"results,omitempty" yaml:"results,omitempty"`
}

type Annotation struct {
	Name  string `json:"name" yaml:"name"`
	Value string `json:"value" yaml:"value"`
}

type DigestReport struct {
	ChartDigest     string `json:"chart" yaml:"chart"`
	PackageDigest   string `json:"package" yaml:"package"`
	PublicKeyDigest string `json:"publicKey,omitempty" yaml:"publicKey,omitempty"`
}

type MetadataReport struct {
	ProfileVendorType profiles.VendorType `json:"vendorType" yaml:"vendorType"`
	ProfileVersion    string              `json:"profileVersion" yaml:"profileVersion"`
	WebCatalogOnly    bool                `json:"webCatalogOnly" yaml:"webCatalogOnly,omitempty"`
	//nolint:stylecheck // complains Uri should be URI - leaving as is for now
	//because this produces an outputted file.
	ChartUri string              `json:"chart-uri" yaml:"chart-uri"`
	Chart    *helmchart.Metadata `json:"chart" yaml:"chart"`
}

type ResultsReport struct {
	Passed   string   `json:"passed" yaml:"passed"`
	Failed   string   `json:"failed" yaml:"failed"`
	Messages []string `json:"message" yaml:"message"`
}

type reportOptions struct {
	report       *apireport.Report
	values       map[string]interface{}
	booleanFlags map[BooleanKey]bool
}
