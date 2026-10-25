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
	"io"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/redhat-certification/chart-verifier/internal/chartverifier/checks"
	"github.com/redhat-certification/chart-verifier/internal/chartverifier/profiles"
	"github.com/redhat-certification/chart-verifier/internal/chartverifier/utils"
	apiReport "github.com/redhat-certification/chart-verifier/pkg/chartverifier/report"

	chartcommon "helm.sh/helm/v4/pkg/chart/common"
	helmchart "helm.sh/helm/v4/pkg/chart/v2"
)

type ReportBuilder interface {
	SetToolVersion(name string) ReportBuilder
	SetProfile(vendorType profiles.VendorType, version string) ReportBuilder
	SetChartURI(name string) ReportBuilder
	AddCheck(check checks.Check, result checks.Result) ReportBuilder
	SetChart(chart *helmchart.Chart) ReportBuilder
	SetTestedOpenShiftVersion(version string) ReportBuilder
	SetSupportedOpenShiftVersions(versions string) ReportBuilder
	SetWebCatalogOnly(webCatalogOnly bool) ReportBuilder
	SetPublicKeyDigest(digest string) ReportBuilder
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
	PublicKey            string
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
	r.Report.GetAPIReport().Metadata.ToolMetadata.Version = version
	return r
}

func (r *reportBuilder) SetProfile(vendorType profiles.VendorType, version string) ReportBuilder {
	r.Report.GetAPIReport().Metadata.ToolMetadata.Profile.VendorType = string(vendorType)
	r.Report.GetAPIReport().Metadata.ToolMetadata.Profile.Version = version
	return r
}

func (r *reportBuilder) SetChartURI(uri string) ReportBuilder {
	r.Report.GetAPIReport().Metadata.ToolMetadata.ChartUri = uri
	return r
}

func (r *reportBuilder) SetChart(chart *helmchart.Chart) ReportBuilder {
	r.Chart = chart
	r.Report.GetAPIReport().Metadata.ChartData = chart.Metadata
	return r
}

func (r *reportBuilder) SetWebCatalogOnly(webCatalogOnly bool) ReportBuilder {
	r.Report.GetAPIReport().Metadata.ToolMetadata.WebCatalogOnly = webCatalogOnly
	return r
}

func (r *reportBuilder) SetPublicKeyDigest(digest string) ReportBuilder {
	r.Report.GetAPIReport().Metadata.ToolMetadata.Digests.PublicKey = digest
	return r
}

func (r *reportBuilder) AddCheck(check checks.Check, result checks.Result) ReportBuilder {
	checkReport := r.Report.AddCheck(check)
	checkReport.SetResult(result.Ok, result.Skipped, result.Reason)
	utils.LogInfo(fmt.Sprintf("Check: %s:%s result : %t", check.CheckID.Name, check.CheckID.Version, result.Ok))
	if !result.Ok {
		utils.LogInfo(fmt.Sprintf("Check: %s:%s reason : %s", check.CheckID.Name, check.CheckID.Version, result.Reason))
	}
	return r
}

func (r *reportBuilder) Build() (*apiReport.Report, error) {
	apiReport := r.Report.GetAPIReport()

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

	if apiReport.Metadata.ToolMetadata.WebCatalogOnly {
		r.SetChartURI(("N/A"))
	}

	r.Report.SetReportDigest()

	return apiReport, nil
}

type By func(p1, p2 *chartcommon.File) bool

type fileSorter struct {
	files []*chartcommon.File
	by    func(p1, p2 *chartcommon.File) bool // Closure used in the Less method.
}

// If chart-verifier is run from within the helm chart directory
// the output will be sent to the OutputDirectory and affect the digest.
// This removes any verifier output files from the calculated digest
func filterOutputDirectory(files []*chartcommon.File) []*chartcommon.File {
	n := 0
	for _, file := range files {
		if !strings.Contains(file.Name, utils.OutputDirectory) {
			files[n] = file
			n++
		}
	}
	return files[:n]
}

func (by By) sort(files []*chartcommon.File) {
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

func GenerateSha(rawFiles []*chartcommon.File) string {
	name := func(f1, f2 *chartcommon.File) bool {
		return f1.Name < f2.Name
	}

	chartSha := sha256.New()
	sortedFiles := rawFiles
	By(name).sort(sortedFiles)
	sortedFiles = filterOutputDirectory(sortedFiles)

	for _, chartFile := range sortedFiles {
		chartSha.Write(chartFile.Data)
	}

	return fmt.Sprintf("sha256:%x", chartSha.Sum(nil))
}

// openChartPackage opens the chart package byte stream at u as an [io.ReadCloser].
func openChartPackage(u *url.URL) (io.ReadCloser, error) {
	switch u.Scheme {
	case "http", "https":
		resp, err := http.Get(u.String())
		if err != nil {
			return nil, err
		}
		return resp.Body, nil
	case "file", "":
		if !strings.HasSuffix(u.Path, ".tgz") {
			return nil, nil
		}
		return os.Open(u.Path)
	default:
		return nil, fmt.Errorf("scheme %q not supported", u.Scheme)
	}
}

// GetPackageDigest returns a hex-encoded SHA256 hash of the chart package bytes at uri.
func GetPackageDigest(uri string) string {
	u, err := url.Parse(uri)
	if err != nil {
		return ""
	}
	rc, err := openChartPackage(u)
	if err != nil {
		return ""
	}
	if rc == nil {
		return ""
	}
	defer rc.Close()
	return getDigest(rc)
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
