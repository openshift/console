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
	"github.com/redhat-certification/chart-verifier/internal/chartverifier/checks"
	apiReport "github.com/redhat-certification/chart-verifier/pkg/chartverifier/report"
	"github.com/spf13/viper"
	"helm.sh/helm/v3/pkg/cli"
	"time"
)

type VerifierBuilder interface {
	SetRegistry(registry checks.Registry) VerifierBuilder
	SetValues(vals map[string]interface{}) VerifierBuilder
	SetChecks(checks FilteredRegistry) VerifierBuilder
	SetConfig(config *viper.Viper) VerifierBuilder
	GetConfig() *viper.Viper
	SetOverrides(map[string]interface{}) VerifierBuilder
	SetToolVersion(string) VerifierBuilder
	SetOpenShiftVersion(string) VerifierBuilder
	SetProviderDelivery(bool) VerifierBuilder
	SetTimeout(time.Duration) VerifierBuilder
	SetSettings(settings *cli.EnvSettings) VerifierBuilder
	Build() (Verifier, error)
}

type Verifier interface {
	Verify(uri string) (*apiReport.Report, error)
}
