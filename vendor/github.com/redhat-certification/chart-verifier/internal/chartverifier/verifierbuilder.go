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
	"errors"
	"time"

	"github.com/redhat-certification/chart-verifier/internal/chartverifier/profiles"

	"helm.sh/helm/v3/pkg/cli"

	"github.com/spf13/viper"

	"github.com/redhat-certification/chart-verifier/internal/chartverifier/checks"
	apiChecks "github.com/redhat-certification/chart-verifier/pkg/chartverifier/checks"
)

var defaultRegistry checks.Registry

func init() {
	defaultRegistry = checks.NewRegistry()

	defaultRegistry.Add(apiChecks.HasReadme, "v1.0", checks.HasReadme)
	defaultRegistry.Add(apiChecks.IsHelmV3, "v1.0", checks.IsHelmV3)
	defaultRegistry.Add(apiChecks.ContainsTest, "v1.0", checks.ContainsTest)
	defaultRegistry.Add(apiChecks.ContainsValues, "v1.0", checks.ContainsValues)
	defaultRegistry.Add(apiChecks.ContainsValuesSchema, "v1.0", checks.ContainsValuesSchema)
	defaultRegistry.Add(apiChecks.HasKubeVersion, "v1.0", checks.HasKubeVersion)
	defaultRegistry.Add(apiChecks.HasKubeVersion, "v1.1", checks.HasKubeVersion_V1_1)
	defaultRegistry.Add(apiChecks.NotContainsCRDs, "v1.0", checks.NotContainCRDs)
	defaultRegistry.Add(apiChecks.HelmLint, "v1.0", checks.HelmLint)
	defaultRegistry.Add(apiChecks.NotContainCsiObjects, "v1.0", checks.NotContainCSIObjects)
	defaultRegistry.Add(apiChecks.ImagesAreCertified, "v1.0", checks.ImagesAreCertified)
	defaultRegistry.Add(apiChecks.ChartTesting, "v1.0", checks.ChartTesting)
	defaultRegistry.Add(apiChecks.RequiredAnnotationsPresent, "v1.0", checks.RequiredAnnotationsPresent)
}

func DefaultRegistry() checks.Registry {
	return defaultRegistry
}

type FilteredRegistry map[apiChecks.CheckName]checks.Check

type verifierBuilder struct {
	checks                      FilteredRegistry
	config                      *viper.Viper
	registry                    checks.Registry
	toolVersion                 string
	openshiftVersion            string
	suppportedOpenshiftVersions string
	providerDelivery            bool
	timeout                     time.Duration
	values                      map[string]interface{}
	settings                    *cli.EnvSettings
}

func (b *verifierBuilder) SetSettings(settings *cli.EnvSettings) VerifierBuilder {
	b.settings = settings
	return b
}

func (b *verifierBuilder) SetValues(vals map[string]interface{}) VerifierBuilder {
	b.values = vals
	return b
}

func (b *verifierBuilder) SetRegistry(registry checks.Registry) VerifierBuilder {
	b.registry = registry
	return b
}

func (b *verifierBuilder) SetChecks(checks FilteredRegistry) VerifierBuilder {
	b.checks = checks
	return b
}

func (b *verifierBuilder) SetConfig(config *viper.Viper) VerifierBuilder {
	b.config = config
	return b
}

func (b *verifierBuilder) SetOverrides(overrides map[string]interface{}) VerifierBuilder {

	// naively override values from the configuration
	for key, val := range overrides {
		b.config.Set(key, val)
	}
	return b
}

func (b *verifierBuilder) SetToolVersion(version string) VerifierBuilder {
	b.toolVersion = version
	return b
}

func (b *verifierBuilder) SetOpenShiftVersion(version string) VerifierBuilder {
	b.openshiftVersion = version
	return b
}

func (b *verifierBuilder) SetProviderDelivery(providerDelivery bool) VerifierBuilder {
	b.providerDelivery = providerDelivery
	return b
}

func (b *verifierBuilder) SetTimeout(timeout time.Duration) VerifierBuilder {
	b.timeout = timeout
	return b
}

func (b *verifierBuilder) GetConfig() *viper.Viper {
	return b.config
}

func (b *verifierBuilder) Build() (Verifier, error) {
	if len(b.checks) == 0 {
		return nil, errors.New("no checks have been required")
	}

	if b.registry == nil {
		b.registry = defaultRegistry
	}

	if b.config == nil {
		b.config = viper.New()
	}

	if b.settings == nil {
		b.settings = cli.New()
	}

	var requiredChecks []checks.Check

	for _, check := range b.checks {
		requiredChecks = append(requiredChecks, check)
	}

	profile := profiles.Get()

	return &verifier{
		config:           b.config,
		registry:         b.registry,
		requiredChecks:   requiredChecks,
		settings:         b.settings,
		toolVersion:      b.toolVersion,
		profile:          profile,
		openshiftVersion: b.openshiftVersion,
		providerDelivery: b.providerDelivery,
		timeout:          b.timeout,
		values:           b.values,
	}, nil
}

func NewVerifierBuilder() VerifierBuilder {
	return &verifierBuilder{}
}
