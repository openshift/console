package checks

import (
	"context"
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"path"

	"github.com/Masterminds/semver"
	"github.com/helm/chart-testing/v3/pkg/chart"
	"github.com/helm/chart-testing/v3/pkg/config"
	"github.com/helm/chart-testing/v3/pkg/util"
	"github.com/imdario/mergo"
	"github.com/redhat-certification/chart-verifier/internal/chartverifier/utils"
	"github.com/redhat-certification/chart-verifier/internal/tool"
	"gopkg.in/yaml.v3"
	"helm.sh/helm/v3/pkg/cli"
	helmcli "helm.sh/helm/v3/pkg/cli"
)

const (
	ReleaseConfigString string = "release"
)

// Versioner provides OpenShift version
type Versioner func(envSettings *cli.EnvSettings) (string, error)

func getVersion(envSettings *cli.EnvSettings) (string, error) {
	kubeConfig := tool.GetClientConfig(envSettings)
	kubectl, err := tool.NewKubectl(kubeConfig)
	if err != nil {
		return "", err
	}

	serverVersion, err := kubectl.GetServerVersion()
	if err != nil {
		return "", err
	}

	// Relying on Kubernetes version can be replaced after fixing this issue:
	// https://bugzilla.redhat.com/show_bug.cgi?id=1850656
	kubeVersion := fmt.Sprintf("%s.%s", serverVersion.Major, serverVersion.Minor)
	osVersion, ok := tool.GetKubeOpenShiftVersionMap()[kubeVersion]
	if !ok {
		return "", fmt.Errorf("internal error: %q not found in Kubernetes-OpenShift version map", kubeVersion)
	}

	return osVersion, nil
}

type OpenShiftVersionErr string

func (e OpenShiftVersionErr) Error() string {
	return "Missing OpenShift version. " + string(e) + ". And the 'openshift-version' flag has not set."
}

type OpenShiftSemVerErr string

func (e OpenShiftSemVerErr) Error() string {
	return "OpenShift version is not following SemVer spec. " + string(e)
}

// buildChartTestingConfiguration computes the chart testing related
// configuration from the given check options.
func buildChartTestingConfiguration(opts *CheckOptions) config.Configuration {

	// cfg will be populated with options gathered from the input
	// check options.
	cfg := config.Configuration{
		BuildId:           opts.ViperConfig.GetString("buildId"),
		Upgrade:           opts.ViperConfig.GetBool("upgrade"),
		SkipMissingValues: opts.ViperConfig.GetBool("skipMissingValues"),
		ReleaseLabel:      opts.ViperConfig.GetString("releaseLabel"),
		Namespace:         opts.ViperConfig.GetString("namespace"),
		HelmExtraArgs:     opts.ViperConfig.GetString("helmExtraArgs"),
	}

	if len(cfg.BuildId) == 0 {
		cfg.BuildId = "build-" + util.RandomString(6)
	}

	if len(cfg.ReleaseLabel) == 0 {
		cfg.ReleaseLabel = "app.kubernetes.io/instance"
	}

	if len(cfg.Namespace) == 0 {
		// Namespace() returns "default" unless has been overriden
		// through environment variables.
		cfg.Namespace = opts.HelmEnvSettings.Namespace()
	}

	return cfg
}

// ChartTesting partially integrates the chart-testing project in chart-verifier.
//
// Unfortunately it wasn't easy as initially expect to integrate
// chart-testing as a lib in the project, including the main
// orchestration logic. The ChartTesting function is the
// interpretation the main logic chart-testing carries, and other
// functions used in this context were also ported from
// chart-verifier.
func ChartTesting(opts *CheckOptions) (Result, error) {

	utils.LogInfo("Start chart install and test check")

	ctx, cancel := context.WithTimeout(context.Background(), opts.Timeout)
	defer cancel()

	cfg := buildChartTestingConfiguration(opts)
	helm, err := tool.NewHelm(opts.HelmEnvSettings, opts.Values)
	if err != nil {
		utils.LogError("End chart install and test check with NewHelm error")
		return NewResult(false, err.Error()), nil
	}

	kubeConfig := tool.GetClientConfig(opts.HelmEnvSettings)
	kubectl, err := tool.NewKubectl(kubeConfig)
	if err != nil {
		utils.LogError("End chart install and test check with NewKubectl error")
		return NewResult(false, err.Error()), nil
	}

	_, path, err := LoadChartFromURI(opts)
	if err != nil {
		utils.LogError("End chart install and test check with LoadChartFromURI error")
		return NewResult(false, err.Error()), nil
	}

	chrt, err := chart.NewChart(path)
	if err != nil {
		utils.LogError("End chart install and test check with NewChart error")
		return NewResult(false, err.Error()), nil
	}

	configRelease := opts.ViperConfig.GetString(ReleaseConfigString)
	if len(configRelease) > 0 {
		utils.LogInfo(fmt.Sprintf("User specifed release: %s", configRelease))
	}

	if cfg.Upgrade {
		oldChrt, err := getChartPreviousVersion(chrt)
		if err != nil {
			utils.LogError("End chart install and test check with getChartPreviousVersion error")
			return NewResult(
					false,
					fmt.Sprintf("skipping upgrade test of '%s' because no previous chart is available", chrt.Yaml().Name)),
				nil
		}
		breakingChangeAllowed, err := util.BreakingChangeAllowed(oldChrt.Yaml().Version, chrt.Yaml().Version)
		if !breakingChangeAllowed {
			utils.LogError("End chart install and test check with BreakingChangeAllowed not allowed")
			return NewResult(
					false,
					fmt.Sprintf("Skipping upgrade test of '%s' because breaking changes are not allowed for chart", chrt)),
				nil
		} else if err != nil {
			utils.LogError(fmt.Sprintf("End chart install and test check with BreakingChangeAllowed error: %v", err))
			return NewResult(false, err.Error()), nil
		}
		result := upgradeAndTestChart(ctx, cfg, oldChrt, chrt, helm, kubectl, configRelease)

		if result.Error != nil {
			utils.LogError(fmt.Sprintf("End chart install and test check with upgradeAndTestChart error: %v", result.Error))
			return NewResult(false, result.Error.Error()), nil
		}
	} else {
		result := installAndTestChartRelease(ctx, cfg, chrt, helm, kubectl, opts.Values, configRelease)
		if result.Error != nil {
			utils.LogError(fmt.Sprintf("End chart install and test check with installAndTestChartRelease error: %v", result.Error))
			return NewResult(false, result.Error.Error()), nil
		}
	}

	if versionError := setOCVersion(opts.AnnotationHolder, opts.HelmEnvSettings, getVersion); versionError != nil {
		if versionError != nil {
			utils.LogWarning(fmt.Sprintf("End chart install and test check with version error: %v", versionError))
		}
		return NewResult(false, versionError.Error()), nil
	}

	utils.LogInfo("End chart install and test check")
	return NewResult(true, ChartTestingSuccess), nil
}

// generateInstallConfig extracts required information to install a
// release and builds a clenup function to be used after tests are
// executed.
func generateInstallConfig(
	cfg config.Configuration,
	chrt *chart.Chart,
	helm *tool.Helm,
	kubectl *tool.Kubectl,
	configRelease string,
) (namespace, release, releaseSelector string, cleanup func()) {
	release = configRelease
	if cfg.Namespace != "" {
		namespace = cfg.Namespace
		if len(release) == 0 {
			release, _ = chrt.CreateInstallParams(cfg.BuildId)
		}
		releaseSelector = fmt.Sprintf("%s=%s", cfg.ReleaseLabel, release)
		cleanup = func() {
			helm.Uninstall(namespace, release)
		}
	} else {
		if len(release) == 0 {
			release, namespace = chrt.CreateInstallParams(cfg.BuildId)
		} else {
			_, namespace = chrt.CreateInstallParams(cfg.BuildId)
		}
		cleanup = func() {
			helm.Uninstall(namespace, release)
			kubectl.DeleteNamespace(context.TODO(), namespace)
		}
	}
	return
}

// testRelease tests a release.
func testRelease(
	ctx context.Context,
	helm *tool.Helm,
	kubectl *tool.Kubectl,
	release, namespace, releaseSelector string,
	cleanupHelmTests bool,
) error {
	if err := kubectl.WaitForDeployments(ctx, namespace, releaseSelector); err != nil {
		return err
	}
	if err := helm.Test(ctx, namespace, release); err != nil {
		return err
	}
	return nil
}

// getChartPreviousVersion attemtps to retrieve the previous version
// of the given chart.
func getChartPreviousVersion(chrt *chart.Chart) (*chart.Chart, error) {
	// TODO: decide which sources do we consider when searching for a
	//       previous version's candidate
	return chrt, nil
}

// upgradeAndTestChart performs the installation of the given oldChrt,
// and attempts to perform an upgrade from that state.
func upgradeAndTestChart(
	ctx context.Context,
	cfg config.Configuration,
	oldChrt, chrt *chart.Chart,
	helm *tool.Helm,
	kubectl *tool.Kubectl,
	configRelease string,
) chart.TestResult {

	// result contains the test result; please notice that each values
	// file in the chart's 'ci' folder will be installed and tested
	// and the first failure makes the test fail.
	result := chart.TestResult{Chart: chrt}

	valuesFiles := oldChrt.ValuesFilePathsForCI()
	if len(valuesFiles) == 0 {
		valuesFiles = append(valuesFiles, "")
	}
	for _, valuesFile := range valuesFiles {
		if valuesFile != "" {
			if cfg.SkipMissingValues && !chrt.HasCIValuesFile(valuesFile) {
				// TODO: do not assume STDOUT here; instead a writer
				//       should be given to be written to.
				utils.LogWarning(fmt.Sprintf("Upgrade testing for values file '%s' skipped because a corresponding values file was not found in %s/ci", valuesFile, chrt.Path()))
				continue
			}
		}

		// Use anonymous function. Otherwise deferred calls would pile up
		// and be executed in reverse order after the loop.
		fun := func() error {
			namespace, release, releaseSelector, cleanup := generateInstallConfig(cfg, oldChrt, helm, kubectl, configRelease)
			defer cleanup()

			// Install previous version of chart. If installation fails, ignore this release.
			if err := helm.Install(ctx, namespace, oldChrt.Path(), release, valuesFile); err != nil {
				return fmt.Errorf("Upgrade testing for release '%s' skipped because of previous revision installation error: %w", release, err)
			}
			if err := testRelease(ctx, helm, kubectl, release, namespace, releaseSelector, true); err != nil {
				return fmt.Errorf("Upgrade testing for release '%s' skipped because of previous revision testing error", release)
			}

			if err := helm.Upgrade(ctx, namespace, oldChrt.Path(), release); err != nil {
				return err
			}

			return testRelease(ctx, helm, kubectl, release, namespace, releaseSelector, false)
		}

		if err := fun(); err != nil {
			result.Error = err
			break
		}

	}

	return result
}

// readObjectFromYamlFile unmarshals the given filename and returns an object with its contents.
func readObjectFromYamlFile(filename string) (map[string]interface{}, error) {
	objBytes, err := ioutil.ReadFile(filename)
	if err != nil {
		return nil, fmt.Errorf("reading values file: %w", err)
	}

	var obj map[string]interface{}
	err = yaml.Unmarshal(objBytes, &obj)
	if err != nil {
		return nil, fmt.Errorf("unmarshalling values file contents: %w", err)
	}

	return obj, nil
}

// writeObjectToTempYamlFile writes the given obj into a temporary file and returns its location,
//
// It is responsibility of the caller to discard the file when finished using it.
func writeObjectToTempYamlFile(obj map[string]interface{}) (filename string, cleanupFunc func(), err error) {
	objBytes, err := yaml.Marshal(obj)
	if err != nil {
		return "", nil, fmt.Errorf("marshalling values file new contents: %w", err)
	}

	tempDir, err := ioutil.TempDir(os.TempDir(), "chart-testing-*")
	if err != nil {
		return "", nil, fmt.Errorf("creating temporary directory: %w", err)
	}

	filename = path.Join(tempDir, "values.yaml")

	err = ioutil.WriteFile(filename, objBytes, 0644)
	if err != nil {
		return "", nil, fmt.Errorf("writing values file new contents: %w", err)
	}

	cleanupFunc = func() {
		os.RemoveAll(tempDir)
	}

	return filename, cleanupFunc, nil
}

// newTempValuesFileWithOverrides applies the extra values provided into the given filename (a YAML file) and materializes its
// contents in the file returned by the function.
//
// In the case the given filename is an empty string, it indicates that only the valueOverrides contents will be
// materialized into the temporary file to be merged by `helm` when processing the chart.
func newTempValuesFileWithOverrides(filename string, valuesOverrides map[string]interface{}) (string, func(), error) {

	var obj map[string]interface{}

	if filename != "" {
		// in the case a filename is provided, read its contents and merge any available values override.
		obj, err := readObjectFromYamlFile(filename)
		if err != nil {
			return "", nil, fmt.Errorf("reading values file: %w", err)
		}

		err = mergo.MergeWithOverwrite(obj, valuesOverrides)
		if err != nil {
			return "", nil, fmt.Errorf("merging extra values: %w", err)
		}

	} else {
		obj = valuesOverrides
	}

	newValuesFile, clean, err := writeObjectToTempYamlFile(obj)
	if err != nil {
		return "", nil, fmt.Errorf("writing object to temporary location: %w", err)
	}

	return newValuesFile, clean, nil
}

// installAndTestChartRelease installs and tests a chart release.
func installAndTestChartRelease(
	ctx context.Context,
	cfg config.Configuration,
	chrt *chart.Chart,
	helm *tool.Helm,
	kubectl *tool.Kubectl,
	valuesOverrides map[string]interface{},
	configRelease string,
) chart.TestResult {

	// valuesFiles contains all the configurations that should be
	// executed; in other words, it performs a test matrix between
	// values files and tests.
	valuesFiles := chrt.ValuesFilePathsForCI()

	// Test with defaults if no values files are specified.
	if len(valuesFiles) == 0 {
		valuesFiles = append(valuesFiles, "")
	}

	result := chart.TestResult{Chart: chrt}

	for _, valuesFile := range valuesFiles {

		// Use anonymous function. Otherwise deferred calls would pile up
		// and be executed in reverse order after the loop.
		fun := func() error {

			tmpValuesFile, tmpValuesFileCleanup, err := newTempValuesFileWithOverrides(valuesFile, valuesOverrides)
			if err != nil {
				// it is required this operation to succeed, otherwise there are no guarantees the values informed using
				// `--chart-set` are propagated to the installation process, so the process breaks here.
				return fmt.Errorf("creating temporary values file: %w", err)
			}
			defer tmpValuesFileCleanup()

			namespace, release, releaseSelector, releaseCleanup := generateInstallConfig(cfg, chrt, helm, kubectl, configRelease)
			defer releaseCleanup()

			if err := helm.Install(ctx, namespace, chrt.Path(), release, tmpValuesFile); err != nil {
				return errors.New(fmt.Sprintf("Chart Install failure: %v", err))
			}
			if err = testRelease(ctx, helm, kubectl, release, namespace, releaseSelector, false); err != nil {
				return errors.New(fmt.Sprintf("Chart test failure: %v", err))
			}
			return nil
		}

		if err := fun(); err != nil {
			// fail fast approach; could be changed to best effort.
			result.Error = err
			break
		}
	}

	return result
}

func setOCVersion(holder AnnotationHolder, envSettings *helmcli.EnvSettings, versioner Versioner) error {
	// kubectl.GetVersion() returns an error both in case the kubectl command can't be executed and
	// the value for the OpenShift version key not present.
	osVersion, getVersionErr := versioner(envSettings)

	// From this point on, an error is set and osVersion is empty.
	if getVersionErr != nil && holder.GetCertifiedOpenShiftVersionFlag() != "" {
		osVersion = holder.GetCertifiedOpenShiftVersionFlag()
	}

	// osVersion is empty only if an error happened and a default value
	// informed by the user hasn't been informed.
	if osVersion == "" {
		holder.SetCertifiedOpenShiftVersion("N/A")
		return OpenShiftVersionErr(getVersionErr.Error())
	}

	// osVersion is guaranteed to have a value, not yet validated as a
	// semver value.
	if _, err := semver.NewVersion(osVersion); err != nil {
		holder.SetCertifiedOpenShiftVersion("N/A")
		return OpenShiftSemVerErr(err.Error())
	}

	holder.SetCertifiedOpenShiftVersion(osVersion)

	return nil
}
