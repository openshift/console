package report

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	hashstructure "github.com/mitchellh/hashstructure/v2"
	"golang.org/x/mod/semver"
	"gopkg.in/yaml.v3"
)

const (
	FailOutcomeType    OutcomeType = "FAIL"
	PassOutcomeType    OutcomeType = "PASS"
	SkippedOutcomeType OutcomeType = "SKIPPED"
	UnknownOutcomeType OutcomeType = "UNKNOWN"

	JSONReport ReportFormat = "json"
	YamlReport ReportFormat = "yaml"

	ReportShaVersion string = "v1.9.0"
)

type APIReport interface {
	GetContent(ReportFormat) (string, error)
	SetContent(string) APIReport
	SetURL(url *url.URL) APIReport
	Load() (*Report, error)
	GetReportDigest() (string, error)
}

func NewReport() APIReport {
	r := &Report{}
	r.Init()
	return r
}

func (r *Report) Init() APIReport {
	r.options = &reportOptions{}
	return r
}

func (r *Report) GetContent(format ReportFormat) (string, error) {
	reportContent := ""

	report, loadErr := r.Load()
	if loadErr != nil {
		return "", loadErr
	}

	if format == JSONReport {
		b, marshalErr := json.Marshal(report)
		if marshalErr != nil {
			return "", fmt.Errorf("report json marshal failed : %v", marshalErr)
		}
		reportContent = string(b)
	} else {
		b, marshalErr := yaml.Marshal(report)
		if marshalErr != nil {
			return "", fmt.Errorf("report yaml marshal failed : %v", marshalErr)
		}
		reportContent = string(b)
	}
	return reportContent, nil
}

func (r *Report) SetContent(report string) APIReport {
	r.options.reportString = report
	r.options.reportUrl = nil
	return r
}

func (r *Report) SetURL(url *url.URL) APIReport {
	r.options.reportString = ""
	r.options.reportUrl = url
	return r
}

func (r *Report) Load() (*Report, error) {
	if len(r.options.reportString) > 0 || r.options.reportUrl != nil {
		return r, r.loadReport()
	} else if r.Results == nil {
		return r, errors.New("no report available to load")
	}
	return r, nil
}

func (r *Report) loadReport() error {
	reportString := r.options.reportString
	if len(reportString) == 0 {
		if r.options.reportUrl != nil {
			if r.options.reportUrl.Scheme == "http" || r.options.reportUrl.Scheme == "https" {
				var err error
				reportString, err = loadReportFromRemote(r.options.reportUrl)
				if err != nil {
					return err
				}
			} else {
				return fmt.Errorf("report uri %s: scheme %q not supported", r.options.reportUrl.String(), r.options.reportUrl.Scheme)
			}
		} else {
			return errors.New("no report available to load")
		}
	}

	if strings.HasPrefix(strings.TrimSpace(reportString), "{\"apiversion\":\"v1\"") {
		unMarshalErr := json.Unmarshal([]byte(reportString), r)
		if unMarshalErr != nil {
			return fmt.Errorf("report json ummarshal failed : %v", unMarshalErr)
		}
	} else {
		unMarshalErr := yaml.Unmarshal([]byte(reportString), r)
		if unMarshalErr != nil {
			return fmt.Errorf("report yaml ummarshal failed : %v", unMarshalErr)
		}
	}

	return nil
}

func loadReportFromRemote(url *url.URL) (string, error) {
	if url.Scheme != "http" && url.Scheme != "https" {
		return "", fmt.Errorf("report uri %s: only 'http' and 'https' schemes are supported, but got %s", url, url.Scheme)
	}

	resp, getErr := http.Get(url.String())
	if getErr != nil {
		return "", fmt.Errorf("report uri %s: error reading from url  %v", url, getErr)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return "", fmt.Errorf("report uri %s: bad response reading from url  %d", url, resp.StatusCode)
	}

	reportBytes, readErr := io.ReadAll(resp.Body)
	if readErr != nil {
		return "", fmt.Errorf("report uri %s: error reading response body  %v", url, readErr)
	}

	return string(reportBytes), nil
}

func (r *Report) GetReportDigest() (string, error) {
	savedDigest := r.Metadata.ToolMetadata.ReportDigest
	r.Metadata.ToolMetadata.ReportDigest = ""

	hash, err := hashstructure.Hash(r, hashstructure.FormatV2, nil)
	if err != nil {
		return "", fmt.Errorf("error calculating report digest: %v", err)
	}

	r.Metadata.ToolMetadata.ReportDigest = savedDigest

	return fmt.Sprintf("uint64:%d", hash), nil
}

//nolint:unused
func (r *Report) checkReportDigest() error {
	reportVersion := fmt.Sprintf("v%s", r.Metadata.ToolMetadata.Version)

	if semver.Compare(reportVersion, ReportShaVersion) >= 0 {
		digestFromReport := r.Metadata.ToolMetadata.ReportDigest
		if digestFromReport == "" {
			return errors.New("report does not contain expected report digest")
		}

		calculatedDigest, err := r.GetReportDigest()
		if err != nil {
			return fmt.Errorf("error calculating report digest: %v", err)
		}
		if calculatedDigest != digestFromReport {
			return errors.New("digest in report did not match report content")
		}
	}
	return nil
}
