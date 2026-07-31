package reportsummary

import (
	"encoding/json"
	"errors"
	"fmt"
	"maps"
	"strings"

	"golang.org/x/mod/semver"
	"gopkg.in/yaml.v3"

	"github.com/redhat-certification/chart-verifier/internal/chartverifier/profiles"
	"github.com/redhat-certification/chart-verifier/pkg/chartverifier/checks"
	"github.com/redhat-certification/chart-verifier/pkg/chartverifier/report"
)

const (
	AnnotationsPrefixConfigName string = "annotations.prefix"
	DefaultAnnotationsPrefix    string = "charts.openshift.io"

	DigestsAnnotationName                string = "digest"
	LastCertifiedTimestampAnnotationName string = "lastCertifiedTimestamp"
	CertifiedOCPVersionsAnnotationName   string = "certifiedOpenShiftVersions"
	TestedOCPVersionAnnotationName       string = "testedOpenShiftVersion"
	SupportedOCPVersionsAnnotationName   string = "supportedOpenShiftVersions"

	MetadataSummary    SummaryType = "metadata"
	DigestsSummary     SummaryType = "digests"
	ResultsSummary     SummaryType = "results"
	AnnotationsSummary SummaryType = "annotations"
	AllSummary         SummaryType = "all"

	JSONReport SummaryFormat = "json"
	YAMLReport SummaryFormat = "yaml"

	// SkipDigestCheck: Use for testing purpose only
	SkipDigestCheck BooleanKey = "skipDigestCheck"
)

//nolint:unused // Note(komish) need to ensure this isn't used, and research
var setBooleanKeys = [...]BooleanKey{SkipDigestCheck}

type APIReportSummary interface {
	SetBoolean(key BooleanKey, value bool) APIReportSummary
	SetReport(report *report.Report) APIReportSummary
	GetContent(SummaryType, SummaryFormat) (string, error)
	SetValues(values map[string]interface{}) APIReportSummary
}

func NewReportSummary() APIReportSummary {
	r := &ReportSummary{}
	r.options = &reportOptions{}
	r.options.values = make(map[string]interface{})
	r.options.booleanFlags = make(map[BooleanKey]bool)
	r.options.booleanFlags[SkipDigestCheck] = false
	return r
}

func (r *ReportSummary) SetReport(report *report.Report) APIReportSummary {
	r.options.report = report
	r.AnnotationsReport = nil
	r.DigestsReport = nil
	r.MetadataReport = nil
	r.ResultsReport = nil
	return r
}

func (r *ReportSummary) SetValues(values map[string]interface{}) APIReportSummary {
	maps.Copy(r.options.values, values)
	return r
}

/*
 * Set a boolean flag. Overwrites any previous setting.
 */
func (r *ReportSummary) SetBoolean(key BooleanKey, value bool) APIReportSummary {
	r.options.booleanFlags[key] = value
	return r
}

func (r *ReportSummary) GetContent(summary SummaryType, format SummaryFormat) (string, error) {
	generateSummary := (r.MetadataReport == nil) || (r.ResultsReport == nil) || (r.AnnotationsReport == nil) || (r.DigestsReport == nil)

	if generateSummary {
		if r.options.report == nil {
			return "", errors.New("no report set from which to create a summary")
		}
		r.addAll()
	}

	outputSummary := ReportSummary{}

	_, err := r.options.report.Load()
	if err != nil {
		return "", err
	}

	if !r.options.booleanFlags[SkipDigestCheck] {
		err = r.checkReportDigest()
		if err != nil {
			return "", err
		}
	}

	switch summary {
	case MetadataSummary:
		outputSummary.MetadataReport = r.MetadataReport
	case DigestsSummary:
		outputSummary.DigestsReport = r.DigestsReport
	case ResultsSummary:
		outputSummary.ResultsReport = r.ResultsReport
	case AnnotationsSummary:
		outputSummary.AnnotationsReport = r.AnnotationsReport
	default:
		outputSummary = *r
	}

	reportContent := ""
	if format == JSONReport {
		b, err := json.Marshal(outputSummary)
		if err == nil {
			reportContent = string(b)
		} else {
			return "", err
		}
	} else {
		b, err := yaml.Marshal(outputSummary)
		if err == nil {
			reportContent = string(b)
		} else {
			return "", err
		}
	}

	return reportContent, nil
}

func (r *ReportSummary) addAll() {
	r.addAnnotations()
	r.addDigests()
	r.addResults()
	r.addMetadata()
}

func (r *ReportSummary) addAnnotations() {
	anotationsPrefix := DefaultAnnotationsPrefix

	if configAnnotationsPrefix, ok := r.options.values[AnnotationsPrefixConfigName]; ok {
		anotationsPrefix = fmt.Sprintf("%v", configAnnotationsPrefix)
	}

	name := fmt.Sprintf("%s/%s", anotationsPrefix, DigestsAnnotationName)
	value := r.options.report.Metadata.ToolMetadata.Digests.Chart
	if len(value) > 0 {
		annotation := Annotation{}
		annotation.Name = name
		annotation.Value = value
		r.AnnotationsReport = append(r.AnnotationsReport, annotation)
	}

	name = fmt.Sprintf("%s/%s", anotationsPrefix, LastCertifiedTimestampAnnotationName)
	value = r.options.report.Metadata.ToolMetadata.LastCertifiedTimestamp
	if len(value) > 0 {
		annotation := Annotation{}
		annotation.Name = name
		annotation.Value = value
		r.AnnotationsReport = append(r.AnnotationsReport, annotation)
	}

	name = fmt.Sprintf("%s/%s", anotationsPrefix, CertifiedOCPVersionsAnnotationName)
	value = r.options.report.Metadata.ToolMetadata.CertifiedOpenShiftVersions
	if len(value) > 0 {
		annotation := Annotation{}
		annotation.Name = name
		annotation.Value = value
		r.AnnotationsReport = append(r.AnnotationsReport, annotation)
	}

	name = fmt.Sprintf("%s/%s", anotationsPrefix, TestedOCPVersionAnnotationName)
	value = r.options.report.Metadata.ToolMetadata.TestedOpenShiftVersion
	if len(value) > 0 {
		annotation := Annotation{}
		annotation.Name = name
		annotation.Value = value
		r.AnnotationsReport = append(r.AnnotationsReport, annotation)
	}

	name = fmt.Sprintf("%s/%s", anotationsPrefix, SupportedOCPVersionsAnnotationName)
	value = r.options.report.Metadata.ToolMetadata.SupportedOpenShiftVersions
	if len(value) > 0 {
		annotation := Annotation{}
		annotation.Name = name
		annotation.Value = value
		r.AnnotationsReport = append(r.AnnotationsReport, annotation)
	}
}

func (r *ReportSummary) addDigests() {
	r.DigestsReport = &DigestReport{}
	r.DigestsReport.ChartDigest = r.options.report.Metadata.ToolMetadata.Digests.Chart
	r.DigestsReport.PackageDigest = r.options.report.Metadata.ToolMetadata.Digests.Package
	if len(r.options.report.Metadata.ToolMetadata.Digests.PublicKey) > 0 {
		r.DigestsReport.PublicKeyDigest = r.options.report.Metadata.ToolMetadata.Digests.PublicKey
	}
}

func (r *ReportSummary) addMetadata() {
	r.MetadataReport = &MetadataReport{}
	r.MetadataReport.ProfileVendorType = profiles.VendorType(r.options.report.Metadata.ToolMetadata.Profile.VendorType)
	r.MetadataReport.ProfileVersion = r.options.report.Metadata.ToolMetadata.Profile.Version
	r.MetadataReport.ChartUri = r.options.report.Metadata.ToolMetadata.ChartUri
	r.MetadataReport.Chart = r.options.report.Metadata.ChartData
	r.MetadataReport.WebCatalogOnly = r.options.report.Metadata.ToolMetadata.ProviderDelivery || r.options.report.Metadata.ToolMetadata.WebCatalogOnly
}

func (r *ReportSummary) addResults() {
	profileVendorType := r.options.report.Metadata.ToolMetadata.Profile.VendorType
	profileVersion := r.options.report.Metadata.ToolMetadata.Profile.Version

	if configVendorType, ok := r.options.values[profiles.VendorTypeConfigName]; ok {
		useVendorType := profiles.VendorType(fmt.Sprintf("%v", configVendorType))
		if len(useVendorType) > 0 {
			profileVendorType = string(useVendorType)
		}
	}
	if configProfileVersion, ok := r.options.values[profiles.VersionConfigName]; ok {
		useProfileVersion := fmt.Sprintf("%v", configProfileVersion)
		if len(useProfileVersion) > 0 {
			profileVersion = useProfileVersion
		}
	}

	values := make(map[string]interface{})
	values[profiles.VendorTypeConfigName] = profileVendorType
	values[profiles.VersionConfigName] = profileVersion

	profile := profiles.New(values)

	passed := 0
	failed := 0
	var messages []string

	for _, profileCheck := range profile.Checks {
		if profileCheck.Type == checks.MandatoryCheckType {
			found := false
			for _, reportCheck := range r.options.report.Results {
				if profileCheck.Name == string(reportCheck.Check) {
					found = true
					if reportCheck.Outcome == report.PassOutcomeType || reportCheck.Outcome == report.SkippedOutcomeType {
						passed++
					} else {
						failed++
						// Change multiple line reasons to a single line
						reason := strings.ReplaceAll(strings.TrimRight(reportCheck.Reason, "\n"), "\n", ", ")
						messages = append(messages, reason)
					}
					break
				}
			}
			if !found {
				failed++
				messages = append(messages, fmt.Sprintf("Missing mandatory check : %s", profileCheck.Name))
			}
		}
	}

	r.ResultsReport = &ResultsReport{}

	r.ResultsReport.Passed = fmt.Sprintf("%d", passed)
	r.ResultsReport.Failed = fmt.Sprintf("%d", failed)
	r.ResultsReport.Messages = messages
}

func (r *ReportSummary) checkReportDigest() error {
	toolMetadata := r.options.report.Metadata.ToolMetadata
	reportVersion := fmt.Sprintf("v%s", toolMetadata.Version)
	if semver.Compare(reportVersion, report.ReportShaVersion) >= 0 {
		digestFromReport := toolMetadata.ReportDigest
		if digestFromReport == "" {
			return errors.New("report does not contain expected report digest")
		}

		calculatedDigest, err := r.options.report.GetReportDigest()
		if err != nil {
			return fmt.Errorf("error calculating report digest: %v", err)
		}
		if calculatedDigest != digestFromReport {
			return errors.New("digest in report did not match report content")
		}
	}
	return nil
}
