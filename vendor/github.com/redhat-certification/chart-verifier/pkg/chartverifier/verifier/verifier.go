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

package verifier

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/redhat-certification/chart-verifier/internal/chartverifier/api"
	"github.com/redhat-certification/chart-verifier/internal/chartverifier/profiles"
	"github.com/redhat-certification/chart-verifier/pkg/chartverifier/checks"
	"github.com/redhat-certification/chart-verifier/pkg/chartverifier/report"
	"github.com/redhat-certification/chart-verifier/pkg/chartverifier/version"

	"github.com/spf13/viper"

	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/cli/values"
	"helm.sh/helm/v3/pkg/getter"
)

// to do: move report structiure, logs structure,  and check names to api directory
// should all logic be in internal sall all run does is pass the Verifier structure to internal.
// update cmd to use new api
// add go test

const (
	JSONReport ReportFormat = "json"
	YAMLReport ReportFormat = "yaml"

	KubeAPIServer    StringKey = "kube-apiserver"
	KubeAsUser       StringKey = "kube-as-user"
	KubeCaFile       StringKey = "kube-ca-file"
	KubeContext      StringKey = "kube-context"
	KubeToken        StringKey = "kube-token"
	KubeConfig       StringKey = "kubeconfig"
	Namespace        StringKey = "namespace"
	OpenshiftVersion StringKey = "openshift-version"
	RegistryConfig   StringKey = "registry-config"
	RepositoryConfig StringKey = "repository-config"
	RepositoryCache  StringKey = "repository-cache"
	Config           StringKey = "config"
	ChartValues      StringKey = "chart-values"
	KubeAsGroups     StringKey = "kube-as-group"
	PGPPublicKey     StringKey = "pgp-public-key"

	ChartSet       ValuesKey = "chart-set"
	ChartSetFile   ValuesKey = "chart-set-file"
	ChartSetString ValuesKey = "chart-set-string"
	CommandSet     ValuesKey = "set"

	WebCatalogOnly   BooleanKey = "web-catalog-only"
	ProviderDelivery BooleanKey = "provider-delivery" // Deprecated in 1.10
	SuppressErrorLog BooleanKey = "suppress-error-log"
	SkipCleanup      BooleanKey = "skip-cleanup"

	Timeout            DurationKey = "timeout"
	HelmInstallTimeout DurationKey = "helm-install-timeout"
)

var setStringKeys = [...]StringKey{
	KubeAPIServer,
	KubeAsUser,
	KubeCaFile,
	KubeConfig,
	KubeContext,
	KubeToken,
	Namespace,
	OpenshiftVersion,
	RegistryConfig,
	RepositoryConfig,
	RepositoryCache,
	Config,
	ChartValues,
	KubeAsGroups,
	PGPPublicKey,
}

var setValuesKeys = [...]ValuesKey{
	CommandSet,
	ChartSet,
	ChartSetFile,
	ChartSetString,
}

var setBooleanKeys = [...]BooleanKey{WebCatalogOnly, SuppressErrorLog, SkipCleanup}

var setDurationKeys = [...]DurationKey{Timeout, HelmInstallTimeout}

type APIVerifier interface {
	SetBoolean(key BooleanKey, value bool) APIVerifier
	SetDuration(key DurationKey, duration time.Duration) APIVerifier
	SetString(key StringKey, value []string) APIVerifier
	SetValues(key ValuesKey, values map[string]interface{}) APIVerifier
	EnableChecks(names []checks.CheckName) APIVerifier
	UnEnableChecks(names []checks.CheckName) APIVerifier
	Run(chartURI string) (APIVerifier, error)
	GetReport() *report.Report
}

func validateBooleanKeys(v Verifier) error {
	var err error
	for key := range v.Inputs.Flags.BooleanFlags {
		foundElement := false
		for _, sliceElement := range setBooleanKeys {
			if sliceElement == key {
				foundElement = true
				continue
			}
		}
		if !foundElement {
			err = fmt.Errorf("invalid boolean key name: %s", key)
		}
	}
	return err
}

/*
 * Set a boolean flag. Overwrites any previous setting.
 */
func (v *Verifier) SetBoolean(key BooleanKey, value bool) APIVerifier {
	v.Inputs.Flags.BooleanFlags[key] = value
	return v
}

/*
 * Set a duration flag. Overwrites any previous setting
 * Default timeout is 30 minutes
 */
func (v *Verifier) SetDuration(key DurationKey, duration time.Duration) APIVerifier {
	v.Inputs.Flags.DurationFlags[key] = duration
	return v
}

func validateDurationKeys(v Verifier) error {
	var err error
	for key := range v.Inputs.Flags.DurationFlags {
		foundElement := false
		for _, sliceElement := range setDurationKeys {
			if sliceElement == key {
				foundElement = true
				break
			}
		}
		if !foundElement {
			err = fmt.Errorf("invalid duration key name: %s", key)
		}
	}
	return err
}

/*
 * Set a string flag. Overwrites any previous setting.
 */
func (v *Verifier) SetString(key StringKey, value []string) APIVerifier {
	v.Inputs.Flags.StringFlags[key] = value
	return v
}

func validateStringKeys(v Verifier) error {
	var err error
	for key := range v.Inputs.Flags.StringFlags {
		foundElement := false
		for _, sliceElement := range setStringKeys {
			if sliceElement == key {
				foundElement = true
				break
			}
		}
		if !foundElement {
			err = fmt.Errorf("invalid string key name: %s", key)
		}
	}
	return err
}

/*
 * Set a map of values flags. Adds/replaces any previous set values for the specified value setting.
 */
func (v *Verifier) SetValues(valuesFlagName ValuesKey, values map[string]interface{}) APIVerifier {
	if _, ok := v.Inputs.Flags.ValuesFlags[valuesFlagName]; ok {
		for key, element := range values {
			v.Inputs.Flags.ValuesFlags[valuesFlagName][strings.ToLower(key)] = element
		}
	} else {
		v.Inputs.Flags.ValuesFlags[valuesFlagName] = values
	}
	return v
}

func validateValuesKeys(v Verifier) error {
	var err error
	for key := range v.Inputs.Flags.ValuesFlags {
		foundElement := false
		for _, sliceElement := range setValuesKeys {
			if sliceElement == key {
				foundElement = true
				break
			}
		}
		if !foundElement {
			err = fmt.Errorf("invalid values key name: %s", key)
		}
	}
	return err
}

/*
 * Enables the set of checks provided and un-enables all others,
 * If no checks are provided all checks are enabled
 */
func (v *Verifier) EnableChecks(checkNames []checks.CheckName) APIVerifier {
	if len(checkNames) > 0 {
		for _, checkName := range checks.GetChecks() {
			v.Inputs.Flags.Checks[checkName] = CheckStatus{false}
		}
		for _, checkName := range checkNames {
			v.Inputs.Flags.Checks[checkName] = CheckStatus{true}
		}
	} else {
		for _, checkName := range checks.GetChecks() {
			v.Inputs.Flags.Checks[checkName] = CheckStatus{true}
		}
	}
	return v
}

/*
 * Un-Enables the set of checks provided and enables all others,
 */
func (v *Verifier) UnEnableChecks(checkNames []checks.CheckName) APIVerifier {
	if len(checkNames) > 0 {
		for _, checkName := range checks.GetChecks() {
			v.Inputs.Flags.Checks[checkName] = CheckStatus{true}
		}
		for _, checkName := range checkNames {
			v.Inputs.Flags.Checks[checkName] = CheckStatus{false}
		}
	}
	return v
}

func validateChecks(v Verifier) error {
	var err error
	for checkName := range v.Inputs.Flags.Checks {
		isValidCheckName := false
		for _, validCheckName := range checks.GetChecks() {
			if checkName == validCheckName {
				isValidCheckName = true
				break
			}
		}
		if !isValidCheckName {
			err = fmt.Errorf("invalid check name : %s", checkName)
			return err
		}
	}
	return err
}

/*
 * Runs the chart verifier for specified chart and based on previously set flags.
 */
func (v *Verifier) Run(chartURI string) (APIVerifier, error) {
	var err error

	if len(chartURI) == 0 {
		err = errors.New("run error: chart_uri is required")
		return v, err
	}

	v.Inputs.ChartURI = chartURI

	err = v.checkInputs()
	if err != nil {
		return v, err
	}

	runOptions := api.RunOptions{}

	runOptions.ChartURI = chartURI

	runOptions.ViperConfig = viper.New()

	opts := &values.Options{}

	settings := cli.New()

	setHelmEnv(settings, v.Inputs.Flags.StringFlags)
	runOptions.Settings = settings

	if valueMap, ok := v.Inputs.Flags.ValuesFlags[ChartSet]; ok {
		opts.Values = mapToStringSlice(valueMap)
	}

	if valueMap, ok := v.Inputs.Flags.ValuesFlags[ChartSetFile]; ok {
		opts.FileValues = mapToStringSlice(valueMap)
	}

	if valueMap, ok := v.Inputs.Flags.ValuesFlags[ChartSetString]; ok {
		opts.StringValues = mapToStringSlice(valueMap)
	}

	if stringValue, ok := v.Inputs.Flags.StringFlags[ChartValues]; ok {
		opts.ValueFiles = stringValue
	}

	vals, mergeErr := opts.MergeValues(getter.All(settings))
	if mergeErr != nil {
		return v, mergeErr
	}

	runOptions.Values = vals
	runOptions.Overrides = v.Inputs.Flags.ValuesFlags[CommandSet]

	for checkName, checkStatus := range v.Inputs.Flags.Checks {
		if checkStatus.Enabled {
			runOptions.ChecksToRun = append(runOptions.ChecksToRun, checkName)
		}
	}

	if stringsValue, ok := v.Inputs.Flags.StringFlags[OpenshiftVersion]; ok {
		runOptions.OpenShiftVersion = stringsValue[0]
	}

	if booleanValue, ok := v.Inputs.Flags.BooleanFlags[WebCatalogOnly]; ok {
		runOptions.WebCatalogOnly = booleanValue
	} else if booleanValue, ok := v.Inputs.Flags.BooleanFlags[ProviderDelivery]; ok {
		runOptions.WebCatalogOnly = booleanValue
	}

	if booleanValue, ok := v.Inputs.Flags.BooleanFlags[SuppressErrorLog]; ok {
		runOptions.SuppressErrorLog = booleanValue
	}

	if booleanValue, ok := v.Inputs.Flags.BooleanFlags[SkipCleanup]; ok {
		runOptions.SkipCleanup = booleanValue
	}

	if durationValue, ok := v.Inputs.Flags.DurationFlags[Timeout]; ok {
		runOptions.ClientTimeout = durationValue
	}

	if stringsValue, ok := v.Inputs.Flags.StringFlags[PGPPublicKey]; ok {
		runOptions.PublicKeys = stringsValue
	}

	if durationValue, ok := v.Inputs.Flags.DurationFlags[HelmInstallTimeout]; ok {
		runOptions.HelmInstallTimeout = durationValue
	}

	runOptions.APIVersion = version.GetVersion()

	report, runErr := api.Run(runOptions)

	if runErr != nil {
		return v, runErr
	}

	report.Init()
	v.Outputs.Report = report

	return v, runErr
}

func (v *Verifier) GetReport() *report.Report {
	return v.Outputs.Report
}

/*
 * Create a new verifier
 */
func NewVerifier() APIVerifier {
	verifier := Verifier{}
	verifier.initialize()
	return &verifier
}

func (v *Verifier) initialize() {
	v.ID = uuid.New().String()

	v.Inputs.Flags.StringFlags = make(map[StringKey][]string)
	v.Inputs.Flags.ValuesFlags = make(map[ValuesKey]map[string]interface{})
	v.Inputs.Flags.BooleanFlags = make(map[BooleanKey]bool)
	v.Inputs.Flags.BooleanFlags[WebCatalogOnly] = false
	v.Inputs.Flags.BooleanFlags[SuppressErrorLog] = false
	v.Inputs.Flags.BooleanFlags[SkipCleanup] = false
	v.Inputs.Flags.DurationFlags = make(map[DurationKey]time.Duration)
	v.Inputs.Flags.Checks = make(map[checks.CheckName]CheckStatus)

	for _, checkName := range checks.GetChecks() {
		v.Inputs.Flags.Checks[checkName] = CheckStatus{true}
	}
	profileDefaults := make(map[string]interface{})
	profileDefaults[profiles.VendorTypeConfigName] = profiles.DefaultProfile
	profileDefaults[profiles.VersionConfigName] = profiles.DefaultProfileVersion
	v.SetValues(CommandSet, profileDefaults)

	v.Outputs.Report = nil
	v.Outputs.ReportSummary = nil
}

func (v Verifier) checkInputs() error {
	err := validateBooleanKeys(v)
	if err == nil {
		err = validateChecks(v)
	}
	if err == nil {
		err = validateDurationKeys(v)
	}
	if err == nil {
		err = validateValuesKeys(v)
	}
	if err == nil {
		err = validateStringKeys(v)
	}
	return err
}

func mapToStringSlice(valuesMap map[string]interface{}) []string {
	var values []string
	for name, value := range valuesMap {
		values = append(values, fmt.Sprintf("%s=%s", name, value))
	}
	return values
}

func setHelmEnv(settings *cli.EnvSettings, stringSettings map[StringKey][]string) {
	for key, value := range stringSettings {
		switch key {
		case KubeAPIServer:
			settings.KubeAPIServer = value[0]
		case KubeAsUser:
			settings.KubeAsUser = value[0]
		case KubeCaFile:
			settings.KubeCaFile = value[0]
		case KubeConfig:
			settings.KubeConfig = value[0]
		case KubeContext:
			settings.KubeContext = value[0]
		case KubeToken:
			settings.KubeToken = value[0]
		case Namespace:
			settings.SetNamespace(value[0])
		case RegistryConfig:
			settings.RegistryConfig = value[0]
		case RepositoryConfig:
			settings.RepositoryConfig = value[0]
		case RepositoryCache:
			settings.RepositoryCache = value[0]
		case KubeAsGroups:
			settings.KubeAsGroups = value
		}
	}
}
