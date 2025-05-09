package tool

import (
	"context"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/redhat-certification/chart-verifier/internal/chartverifier/utils"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart/loader"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/cli/values"
	"helm.sh/helm/v3/pkg/getter"
	"helm.sh/helm/v3/pkg/strvals"
)

type Helm struct {
	config      *action.Configuration
	envSettings *cli.EnvSettings
	timeout     time.Duration
	args        map[string]interface{}
}

func NewHelm(envSettings *cli.EnvSettings, args map[string]interface{}, timeout time.Duration) (*Helm, error) {
	helm := &Helm{envSettings: envSettings, args: args, timeout: timeout}
	if timeout < 5*time.Minute {
		helm.timeout = 5 * time.Minute
	}
	config := new(action.Configuration)
	if err := config.Init(envSettings.RESTClientGetter(), envSettings.Namespace(), os.Getenv("HELM_DRIVER"), func(format string, v ...interface{}) {
		utils.LogInfo(fmt.Sprintf(format, v))
	}); err != nil {
		return nil, err
	}
	helm.config = config
	return helm, nil
}

func (h Helm) Install(ctx context.Context, namespace, chart, release, valuesFile string) error {
	utils.LogInfo(fmt.Sprintf("Execute helm install. namespace: %s, release: %s chart: %s", namespace, release, chart))
	client := action.NewInstall(h.config)
	client.Namespace = namespace
	client.ReleaseName = release
	client.Wait = true
	// default timeout duration
	// ref: https://helm.sh/docs/helm/helm_install
	client.Timeout = h.timeout

	cp, err := client.ChartPathOptions.LocateChart(chart, h.envSettings)
	if err != nil {
		utils.LogError(fmt.Sprintf("Error LocateChart: %v", err))
		return err
	}

	p := getter.All(h.envSettings)
	valueOpts := &values.Options{}
	if valuesFile != "" {
		valueOpts.ValueFiles = append(valueOpts.ValueFiles, valuesFile)
	}
	vals, err := valueOpts.MergeValues(p)
	if err != nil {
		utils.LogError(fmt.Sprintf("Error MergeValues: %v", err))
		return err
	}

	if val, ok := h.args["set"]; ok {
		if err := strvals.ParseInto(fmt.Sprintf("%v", val), vals); err != nil {
			utils.LogError(fmt.Sprintf("Error parsing --set values: %v", err))
			return err
		}
	}

	if val, ok := h.args["set-file"]; ok {
		if err := strvals.ParseInto(fmt.Sprintf("%v", val), vals); err != nil {
			utils.LogError(fmt.Sprintf("Error parsing --set-file values: %v", err))
			return err
		}
	}

	if val, ok := h.args["set-string"]; ok {
		if err := strvals.ParseInto(fmt.Sprintf("%v", val), vals); err != nil {
			utils.LogError(fmt.Sprintf("Error parsing --set-string values: %v", err))
			return err
		}
	}

	c, err := loader.Load(cp)
	if err != nil {
		utils.LogError(fmt.Sprintf("Error loading chart path: %v", err))
		return err
	}

	utils.LogInfo(fmt.Sprintf("Start install with timeout %s", client.Timeout.String()))

	// TODO: support other options if required
	_, err = client.RunWithContext(ctx, c, vals)
	if err != nil {
		utils.LogError(fmt.Sprintf("Error running chart install: %v", err))
		return err
	}

	utils.LogInfo("Helm install complete")
	return nil
}

func (h Helm) Test(ctx context.Context, namespace, release string) error {
	utils.LogInfo(fmt.Sprintf("Execute helm test. namespace: %s, release: %s, args: %+v", namespace, release, h.args))
	deadline, _ := ctx.Deadline()
	client := action.NewReleaseTesting(h.config)
	client.Namespace = namespace
	client.Timeout = time.Until(deadline)

	if client.Timeout <= 0 {
		return errors.New("Helm test error : timeout has expired, please consider increasing the timeout using the chart-verifier timeout flag")
	}
	// TODO: support filter
	_, err := client.Run(release)
	if err != nil {
		utils.LogError(fmt.Sprintf("Execute helm test. error %v", err))
		return err
	}

	utils.LogInfo("Helm test complete")
	return nil
}

func (h Helm) Uninstall(namespace, release string) error {
	utils.LogInfo(fmt.Sprintf("Execute helm uninstall. namespace: %s, release: %s", namespace, release))
	client := action.NewUninstall(h.config)
	// TODO: support other options if required
	_, err := client.Run(release)
	if err != nil {
		utils.LogError(fmt.Sprintf("Error from helm uninstall : %v", err))
		return err
	}

	utils.LogInfo("Delete release complete")
	return nil
}

func (h Helm) Upgrade(ctx context.Context, namespace, chart, release string) error {
	utils.LogInfo(fmt.Sprintf("Execute helm upgrade. namespace: %s, release: %s chart: %s", namespace, release, chart))
	client := action.NewUpgrade(h.config)
	client.Namespace = namespace
	client.ReuseValues = true
	client.Wait = true

	cp, err := client.ChartPathOptions.LocateChart(chart, h.envSettings)
	if err != nil {
		utils.LogError(fmt.Sprintf("Error LocateChart: %v", err))
		return err
	}

	p := getter.All(h.envSettings)
	valueOpts := &values.Options{}
	vals, err := valueOpts.MergeValues(p)
	if err != nil {
		utils.LogError(fmt.Sprintf("Error MergeValues: %v", err))
		return err
	}

	c, err := loader.Load(cp)
	if err != nil {
		utils.LogError(fmt.Sprintf("Error loading chart path: %v", err))
		return err
	}

	// TODO: support other options if required
	_, err = client.RunWithContext(ctx, release, c, vals)
	if err != nil {
		utils.LogError(fmt.Sprintf("Error running chart upgrade: %v", err))
		return err
	}

	utils.LogInfo("Helm upgrade complete")
	return nil
}
