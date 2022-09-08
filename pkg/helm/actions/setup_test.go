package actions

import (
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"testing"
	"time"

	"helm.sh/helm/v3/pkg/cli"
)

func setSettings(settings *cli.EnvSettings) {
	settings.RepositoryCache = os.TempDir()
	settings.RegistryConfig = os.TempDir()
	settings.RepositoryConfig = "/RepositoryConfig"
}

func TestMain(m *testing.M) {
	setSettings(settings)
	time.Sleep(10 * time.Second)
	if err := setupTestWithTls(); err != nil {
		panic(err)
	}
	if err := setupTestWithoutTls(); err != nil {
		panic(err)
	}
	if err := setupTestBasicAuth(); err != nil {
		panic(err)
	}
	retCode := m.Run()
	if err := ExecuteScript("./testdata/chartmuseum-stop.sh", false); err != nil {
		panic(err)
	}
	if err := ExecuteScript("./testdata/cleanupNonTls.sh", false); err != nil {
		panic(err)
	}
	if err := ExecuteScript("./testdata/cleanup.sh", false); err != nil {
		panic(err)
	}
	os.Exit(retCode)
}

func setupTestWithTls() error {
	if err := ExecuteScript("./testdata/downloadChartmuseum.sh", true); err != nil {
		return err
	}
	if err := ExecuteScript("./testdata/createTlsSecrets.sh", true); err != nil {
		return err
	}
	if err := ExecuteScript("./testdata/chartmuseum.sh", false); err != nil {
		return err
	}
	time.Sleep(5 * time.Second)
	if err := ExecuteScript("./testdata/cacertCreate.sh", true); err != nil {
		return err
	}
	if err := ExecuteScript("./testdata/uploadCharts.sh", true); err != nil {
		return err
	}
	return nil
}

func setupTestWithoutTls() error {
	if err := ExecuteScript("./testdata/chartmuseumWithoutTls.sh", false); err != nil {
		return err
	}
	time.Sleep(5 * time.Second)
	if err := ExecuteScript("./testdata/uploadChartsWithoutTls.sh", true); err != nil {
		return err
	}
	return nil
}

func setupTestBasicAuth() error {
	setSettings(settings)
	if err := ExecuteScript("./testdata/chartmuseumWithBasicAuth.sh", false); err != nil {
		return err
	}
	time.Sleep(5 * time.Second)
	if err := ExecuteScript("./testdata/uploadChartsWithBasicAuth.sh", true); err != nil {
		return err
	}
	return nil
}

func ExecuteScript(filepath string, waitForCompletion bool) error {
	tlsCmd := exec.Command(filepath)
	tlsCmd.Stdout = os.Stdout
	tlsCmd.Stderr = os.Stderr
	err := tlsCmd.Start()
	if err != nil {
		bytes, _ := ioutil.ReadAll(os.Stderr)
		return fmt.Errorf("Error starting program :%s:%s:%w", filepath, string(bytes), err)
	}
	if waitForCompletion {
		err = tlsCmd.Wait()
		if err != nil {
			bytes, _ := ioutil.ReadAll(os.Stderr)
			return fmt.Errorf("Error waiting program :%s:%s:%w", filepath, string(bytes), err)
		}
	}
	return nil
}
