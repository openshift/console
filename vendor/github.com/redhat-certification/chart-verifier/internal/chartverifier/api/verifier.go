package api

import (
	"time"

	"github.com/spf13/viper"
	"helm.sh/helm/v3/pkg/cli"

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
	APIVersion         string
	Values             map[string]interface{}
	ViperConfig        *viper.Viper
	Overrides          map[string]interface{}
	ChecksToRun        []apichecks.CheckName
	OpenShiftVersion   string
	WebCatalogOnly     bool
	SuppressErrorLog   bool
	SkipCleanup        bool
	ClientTimeout      time.Duration
	HelmInstallTimeout time.Duration
	ChartURI           string
	Settings           *cli.EnvSettings
	PublicKeys         []string
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
		for checkID, check := range profileChecks {
			if checkID == checkName {
				checkRegistry[checkID] = check
			}
		}
	}

	verifier, err := verifierBuilder.
		SetChecks(checkRegistry).
		SetToolVersion(options.APIVersion).
		SetOpenShiftVersion(options.OpenShiftVersion).
		SetWebCatalogOnly(options.WebCatalogOnly).
		SetSkipCleanup(options.SkipCleanup).
		SetTimeout(options.ClientTimeout).
		SetHelmInstallTimeout(options.HelmInstallTimeout).
		SetSettings(options.Settings).
		SetPublicKeys(options.PublicKeys).
		Build()
	if err != nil {
		return verifyReport, err
	}

	verifyReport, err = verifier.Verify(options.ChartURI)
	if err != nil {
		return verifyReport, err
	}

	return verifyReport, nil
}
