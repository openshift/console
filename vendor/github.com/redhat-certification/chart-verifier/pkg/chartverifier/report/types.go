package report

import (
	"net/url"

	helmchart "helm.sh/helm/v3/pkg/chart"

	apichecks "github.com/redhat-certification/chart-verifier/pkg/chartverifier/checks"
)

type (
	ReportFormat = string
	OutcomeType  = string
)

type ShaValue struct{}

type Report struct {
	options    *reportOptions
	Apiversion string         `json:"apiversion" yaml:"apiversion"`
	Kind       string         `json:"kind" yaml:"kind"`
	Metadata   ReportMetadata `json:"metadata" yaml:"metadata"`
	Results    []*CheckReport `json:"results" yaml:"results"`
}

type ReportMetadata struct {
	ToolMetadata ToolMetadata        `json:"tool" yaml:"tool"`
	ChartData    *helmchart.Metadata `json:"chart" yaml:"chart"`
	Overrides    string              `json:"chart-overrides" yaml:"chart-overrides"`
}

type ToolMetadata struct {
	Version      string  `json:"verifier-version" yaml:"verifier-version"`
	Profile      Profile `json:"profile" yaml:"profile"`
	ReportDigest string  `json:"reportDigest" yaml:"reportDigest"`
	//nolint:stylecheck // complaining Uri should be URI
	ChartUri                   string  `json:"chart-uri" yaml:"chart-uri"`
	Digests                    Digests `json:"digests" yaml:"digests"`
	LastCertifiedTimestamp     string  `json:"lastCertifiedTimestamp,omitempty" yaml:"lastCertifiedTimestamp,omitempty"`
	CertifiedOpenShiftVersions string  `json:"certifiedOpenShiftVersions,omitempty" yaml:"certifiedOpenShiftVersions,omitempty"`
	TestedOpenShiftVersion     string  `json:"testedOpenShiftVersion,omitempty" yaml:"testedOpenShiftVersion,omitempty"`
	SupportedOpenShiftVersions string  `json:"supportedOpenShiftVersions,omitempty" yaml:"supportedOpenShiftVersions,omitempty"`
	ProviderDelivery           bool    `json:"providerControlledDelivery,omitempty" yaml:"providerControlledDelivery,omitempty"`
	WebCatalogOnly             bool    `json:"webCatalogOnly" yaml:"webCatalogOnly" hash:"ignore"`
}

type Digests struct {
	Chart     string `json:"chart" yaml:"chart"`
	Package   string `json:"package,omitempty" yaml:"package,omitempty"`
	PublicKey string `hash:"ignore" json:"publicKey,omitempty" yaml:"publicKey,omitempty"`
}

type Profile struct {
	VendorType string `json:"vendorType" yaml:"VendorType"`
	Version    string `json:"version" yaml:"version"`
}

type CheckReport struct {
	Check   apichecks.CheckName `json:"check" yaml:"check"`
	Type    apichecks.CheckType `json:"type" yaml:"type"`
	Outcome OutcomeType         `json:"outcome" yaml:"outcome"`
	Reason  string              `json:"reason" yaml:"reason"`
}

type reportOptions struct {
	reportString string
	//nolint: stylecheck // complains Url should be URL
	reportUrl *url.URL
}
