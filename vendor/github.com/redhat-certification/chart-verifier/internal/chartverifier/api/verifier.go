package api

import (
	"github.com/spf13/viper"
	"helm.sh/helm/v3/pkg/cli"

	"time"

	"github.com/redhat-certification/chart-verifier/internal/chartverifier"
	"github.com/redhat-certification/chart-verifier/internal/chartverifier/checks"
	"github.com/redhat-certification/chart-verifier/internal/chartverifier/profiles"
	apichecks "github.com/redhat-certification/chart-verifier/pkg/chartverifier/checks"
	apireport "github.com/redhat-certification/chart-verifier/pkg/chartverifier/report"
)

var allChecks checks.DefaultRegistry

func init() {
	allChecks = chartverifier.DefaultRegistry().AllChecks()
}

type RunOptions struct {
	APIVersion       string
	Values           map[string]interface{}
	ViperConfig      *viper.Viper
	Overrides        map[string]interface{}
	ChecksToRun      []apichecks.CheckName
	OpenShiftVersion string
	ProviderDelivery bool
	SuppressErrorLog bool
	ClientTimeout    time.Duration
	ChartUri         string
	Settings         *cli.EnvSettings
}

func Run(options RunOptions) (*apireport.Report, error) {

	var verifyReport *apireport.Report

	verifierBuilder := chartverifier.NewVerifierBuilder()

	verifierBuilder.SetValues(options.Values).
		SetConfig(options.ViperConfig).
		SetOverrides(options.Overrides).
		SetSettings(options.Settings)

	profileChecks := profiles.New(options.Overrides).FilterChecks(allChecks)

	checkRegistry := make(chartverifier.FilteredRegistry)

	for _, checkName := range options.ChecksToRun {
		for checkId, check := range profileChecks {
			if checkId == checkName {
				checkRegistry[checkId] = check
			}
		}
	}

	verifier, err := verifierBuilder.
		SetChecks(checkRegistry).
		SetToolVersion(options.APIVersion).
		SetOpenShiftVersion(options.OpenShiftVersion).
		SetProviderDelivery(options.ProviderDelivery).
		SetTimeout(options.ClientTimeout).
		SetSettings(options.Settings).
		Build()

	if err != nil {
		return verifyReport, err
	}

	verifyReport, err = verifier.Verify(options.ChartUri)

	if err != nil {
		return verifyReport, err
	}

	return verifyReport, nil

}
