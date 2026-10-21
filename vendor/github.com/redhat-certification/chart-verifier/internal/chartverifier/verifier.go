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
	"strings"
	"time"

	"github.com/spf13/viper"
	helmcli "helm.sh/helm/v3/pkg/cli"

	"github.com/redhat-certification/chart-verifier/internal/chartverifier/checks"
	"github.com/redhat-certification/chart-verifier/internal/chartverifier/profiles"
	"github.com/redhat-certification/chart-verifier/internal/tool"
	apiChecks "github.com/redhat-certification/chart-verifier/pkg/chartverifier/checks"
	apiReport "github.com/redhat-certification/chart-verifier/pkg/chartverifier/report"
)

type CheckNotFoundErr string

func (e CheckNotFoundErr) Error() string {
	return "check not found: " + string(e)
}

type CheckErr string

func (e CheckErr) Error() string {
	return "check error: " + string(e)
}

func NewCheckErr(err error) error {
	return CheckErr(err.Error())
}

type AnnotationHolder struct {
	Holder                        ReportBuilder
	CertifiedOpenShiftVersionFlag string
}

func (holder *AnnotationHolder) SetCertifiedOpenShiftVersion(version string) {
	holder.Holder.SetTestedOpenShiftVersion(version)
}

func (holder *AnnotationHolder) GetCertifiedOpenShiftVersionFlag() string {
	return holder.CertifiedOpenShiftVersionFlag
}

func (holder *AnnotationHolder) SetSupportedOpenShiftVersions(versions string) {
	holder.Holder.SetSupportedOpenShiftVersions(versions)
}

type verifier struct {
	config             *viper.Viper
	registry           checks.Registry
	requiredChecks     []checks.Check
	settings           *helmcli.EnvSettings
	toolVersion        string
	profile            *profiles.Profile
	openshiftVersion   string
	webCatalogOnly     bool
	skipCleanup        bool
	timeout            time.Duration
	helmInstallTimeout time.Duration
	publicKeys         []string
	values             map[string]interface{}
}

func (c *verifier) subConfig(name string) *viper.Viper {
	if sub := c.config.Sub(name); sub == nil {
		return viper.New()
	} else {
		return sub
	}
}

func (c *verifier) Verify(uri string) (*apiReport.Report, error) {
	if c.webCatalogOnly {
		if len(GetPackageDigest(uri)) == 0 {
			return nil, CheckErr("Provider delivery control requires chart input which is a tarball.")
		}
	}

	chrt, _, err := checks.LoadChartFromURI(&checks.CheckOptions{HelmEnvSettings: c.settings, URI: uri})
	if err != nil {
		return nil, err
	}

	result := NewReportBuilder().
		SetToolVersion(c.toolVersion).
		SetChartURI(uri).
		SetChart(chrt).
		SetProfile(c.profile.Vendor, c.profile.Version).
		SetWebCatalogOnly(c.webCatalogOnly)

	for _, check := range c.requiredChecks {
		if check.Func == nil {
			return nil, CheckNotFoundErr(check.CheckID.Name)
		}
		holder := AnnotationHolder{
			Holder:                        result,
			CertifiedOpenShiftVersionFlag: c.openshiftVersion,
		}

		r, checkErr := check.Func(&checks.CheckOptions{
			HelmEnvSettings:    c.settings,
			URI:                uri,
			Values:             c.values,
			ViperConfig:        c.subConfig(string(check.CheckID.Name)),
			AnnotationHolder:   &holder,
			Timeout:            c.timeout,
			HelmInstallTimeout: c.helmInstallTimeout,
			SkipCleanup:        c.skipCleanup,
			PublicKeys:         c.publicKeys,
		})

		if checkErr != nil {
			return nil, NewCheckErr(checkErr)
		}
		_ = result.AddCheck(check, r)

		if check.CheckID.Name == apiChecks.SignatureIsValid {
			if len(c.publicKeys) == 1 && strings.Contains(r.Reason, checks.ChartSigned) {
				publicKeyDigest, digestErr := tool.GetPublicKeyDigest(c.publicKeys[0])
				if digestErr != nil {
					return nil, err
				}
				result.SetPublicKeyDigest(publicKeyDigest)
			}
		}
	}

	return result.Build()
}
