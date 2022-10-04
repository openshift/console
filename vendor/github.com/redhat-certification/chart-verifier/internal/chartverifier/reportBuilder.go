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
	"crypto"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"github.com/pkg/errors"
	"github.com/redhat-certification/chart-verifier/internal/chartverifier/checks"
	"github.com/redhat-certification/chart-verifier/internal/chartverifier/profiles"
	"github.com/redhat-certification/chart-verifier/internal/chartverifier/utils"
	apiReport "github.com/redhat-certification/chart-verifier/pkg/chartverifier/report"
	"io"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strings"
	"time"

	helmchart "helm.sh/helm/v3/pkg/chart"
)

type ReportBuilder interface {
	SetToolVersion(name string) ReportBuilder
	SetProfile(vendorType profiles.VendorType, version string) ReportBuilder
	SetChartUri(name string) ReportBuilder
	AddCheck(check checks.Check, result checks.Result) ReportBuilder
	SetChart(chart *helmchart.Chart) ReportBuilder
	SetTestedOpenShiftVersion(version string) ReportBuilder
	SetSupportedOpenShiftVersions(versions string) ReportBuilder
	SetProviderDelivery(providerDelivery bool) ReportBuilder
	Build() (*apiReport.Report, error)
}

type CheckResult struct {
	checks.Result
	Name string
}

type reportBuilder struct {
	Chart                *helmchart.Chart
	Report               InternalReport
	OCPVersion           string
	SupportedOCPVersions string
}

func NewReportBuilder() ReportBuilder {
	b := reportBuilder{}
	b.Report = newReport()
	return &b
}

func (r *reportBuilder) SetTestedOpenShiftVersion(version string) ReportBuilder {
	r.OCPVersion = version
	return r
}

func (r *reportBuilder) SetSupportedOpenShiftVersions(versions string) ReportBuilder {
	r.SupportedOCPVersions = versions
	return r
}

func (r *reportBuilder) SetToolVersion(version string) ReportBuilder {
	r.Report.GetApiReport().Metadata.ToolMetadata.Version = version
	return r
}

func (r *reportBuilder) SetProfile(vendorType profiles.VendorType, version string) ReportBuilder {
	r.Report.GetApiReport().Metadata.ToolMetadata.Profile.VendorType = string(vendorType)
	r.Report.GetApiReport().Metadata.ToolMetadata.Profile.Version = version
	return r
}

func (r *reportBuilder) SetChartUri(uri string) ReportBuilder {
	r.Report.GetApiReport().Metadata.ToolMetadata.ChartUri = uri
	return r
}

func (r *reportBuilder) SetChart(chart *helmchart.Chart) ReportBuilder {
	r.Chart = chart
	r.Report.GetApiReport().Metadata.ChartData = chart.Metadata
	return r
}

func (r *reportBuilder) SetProviderDelivery(providerDelivery bool) ReportBuilder {
	r.Report.GetApiReport().Metadata.ToolMetadata.ProviderDelivery = providerDelivery
	return r
}

func (r *reportBuilder) AddCheck(check checks.Check, result checks.Result) ReportBuilder {
	checkReport := r.Report.AddCheck(check)
	checkReport.SetResult(result.Ok, result.Reason)
	utils.LogInfo(fmt.Sprintf("Check: %s:%s result : %t", check.CheckId.Name, check.CheckId.Version, result.Ok))
	if !result.Ok {
		utils.LogInfo(fmt.Sprintf("Check: %s:%s reason : %s", check.CheckId.Name, check.CheckId.Version, result.Reason))
	}
	return r
}

func (r *reportBuilder) Build() (*apiReport.Report, error) {

	apiReport := r.Report.GetApiReport()

	for _, annotation := range profiles.Get().Annotations {
		switch annotation {
		case profiles.DigestAnnotation:
			apiReport.Metadata.ToolMetadata.Digests.Chart = GenerateSha(r.Chart.Raw)
		case profiles.LastCertifiedTimestampAnnotation:
			apiReport.Metadata.ToolMetadata.LastCertifiedTimestamp = time.Now().Format("2006-01-02T15:04:05.999999-07:00")
		case profiles.OCPVersionAnnotation:
			if len(r.OCPVersion) == 0 {
				apiReport.Metadata.ToolMetadata.CertifiedOpenShiftVersions = "N/A"
			} else {
				apiReport.Metadata.ToolMetadata.CertifiedOpenShiftVersions = r.OCPVersion
			}
		case profiles.TestedOCPVersionAnnotation:
			if len(r.OCPVersion) == 0 {
				apiReport.Metadata.ToolMetadata.TestedOpenShiftVersion = "N/A"
			} else {
				apiReport.Metadata.ToolMetadata.TestedOpenShiftVersion = r.OCPVersion
			}
		case profiles.SupportedOCPVersionsAnnotation:
			if len(r.SupportedOCPVersions) == 0 {
				apiReport.Metadata.ToolMetadata.SupportedOpenShiftVersions = "N/A"
			} else {
				apiReport.Metadata.ToolMetadata.SupportedOpenShiftVersions = r.SupportedOCPVersions
			}
		}
	}

	apiReport.Metadata.ToolMetadata.Digests.Package = GetPackageDigest(apiReport.Metadata.ToolMetadata.ChartUri)

	if apiReport.Metadata.ToolMetadata.ProviderDelivery {
		r.SetChartUri(("N/A"))
	}

	r.Report.SetReportDigest()

	return apiReport, nil
}

type By func(p1, p2 *helmchart.File) bool

type fileSorter struct {
	files []*helmchart.File
	by    func(p1, p2 *helmchart.File) bool // Closure used in the Less method.
}

func (by By) sort(files []*helmchart.File) {
	fs := &fileSorter{
		files: files,
		by:    by, // The Sort method's receiver is the function (closure) that defines the sort order.
	}
	sort.Sort(fs)
}

// Len is part of sort.Interface.
func (fs *fileSorter) Len() int {
	return len(fs.files)
}

// Swap is part of sort.Interface.
func (fs *fileSorter) Swap(i, j int) {
	fs.files[i], fs.files[j] = fs.files[j], fs.files[i]
}

// Less is part of sort.Interface. It is implemented by calling the "by" closure in the sorter.
func (fs *fileSorter) Less(i, j int) bool {
	return fs.by(fs.files[i], fs.files[j])
}

func GenerateSha(rawFiles []*helmchart.File) string {

	name := func(f1, f2 *helmchart.File) bool {
		return f1.Name < f2.Name
	}

	chartSha := sha256.New()
	sortedFiles := rawFiles
	By(name).sort(sortedFiles)
	for _, chartFile := range sortedFiles {
		chartSha.Write(chartFile.Data)
	}

	return fmt.Sprintf("sha256:%x", chartSha.Sum(nil))
}

func GetPackageDigest(uri string) string {

	url, err := url.Parse(uri)
	if err != nil {
		return ""
	}
	var chartReader io.Reader
	switch url.Scheme {
	case "http", "https":
		var chartGetResponse *http.Response
		chartGetResponse, err = http.Get(url.String())
		if err == nil {
			chartReader = chartGetResponse.Body
		}
	case "file", "":
		if strings.HasSuffix(url.Path, ".tgz") {
			chartReader, _ = os.Open(url.Path)
		}
	default:
		err = errors.Errorf("scheme %q not supported", url.Scheme)
	}
	if err != nil || chartReader == nil {
		return ""
	}
	return getDigest(chartReader)
}

// Digest hashes a reader and returns a SHA256 digest.
func getDigest(in io.Reader) string {
	if in == nil {
		return ""
	}

	hash := crypto.SHA256.New()
	if _, err := io.Copy(hash, in); err != nil {
		return ""
	}
	return hex.EncodeToString(hash.Sum(nil))
}
