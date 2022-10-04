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
	"time"

	"github.com/redhat-certification/chart-verifier/internal/chartverifier/checks"
	"github.com/redhat-certification/chart-verifier/internal/chartverifier/profiles"
	apiReport "github.com/redhat-certification/chart-verifier/pkg/chartverifier/report"
	"github.com/spf13/viper"
	helmcli "helm.sh/helm/v3/pkg/cli"
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
	config           *viper.Viper
	registry         checks.Registry
	requiredChecks   []checks.Check
	settings         *helmcli.EnvSettings
	toolVersion      string
	profile          *profiles.Profile
	openshiftVersion string
	providerDelivery bool
	timeout          time.Duration
	values           map[string]interface{}
}

func (c *verifier) subConfig(name string) *viper.Viper {
	if sub := c.config.Sub(name); sub == nil {
		return viper.New()
	} else {
		return sub
	}
}

func (c *verifier) Verify(uri string) (*apiReport.Report, error) {

	if c.providerDelivery {
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
		SetChartUri(uri).
		SetChart(chrt).
		SetProfile(c.profile.Vendor, c.profile.Version).
		SetProviderDelivery(c.providerDelivery)

	for _, check := range c.requiredChecks {

		if check.Func == nil {
			return nil, CheckNotFoundErr(check.CheckId.Name)
		}
		holder := AnnotationHolder{Holder: result,
			CertifiedOpenShiftVersionFlag: c.openshiftVersion}

		r, checkErr := check.Func(&checks.CheckOptions{
			HelmEnvSettings:  c.settings,
			URI:              uri,
			Values:           c.values,
			ViperConfig:      c.subConfig(string(check.CheckId.Name)),
			AnnotationHolder: &holder,
			Timeout:          c.timeout,
		})

		if checkErr != nil {
			return nil, NewCheckErr(checkErr)
		}
		_ = result.AddCheck(check, r)

	}

	return result.Build()
}
