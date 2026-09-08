package actions

import (
	"fmt"
	"io/ioutil"
	"net"
	"os"
	"os/exec"
	"strings"
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
	if err := waitForTCP("127.0.0.1:9443", 30*time.Second, "./chartmuseum-9443.log"); err != nil {
		return fmt.Errorf("chartmuseum not ready: %w", err)
	}
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
	if err := waitForTCP("127.0.0.1:9181", 30*time.Second); err != nil {
		return fmt.Errorf("chartmuseum (no TLS) not ready: %w", err)
	}
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
	if err := waitForTCP("127.0.0.1:8181", 30*time.Second); err != nil {
		return fmt.Errorf("chartmuseum (basic auth) not ready: %w", err)
	}
	if err := ExecuteScript("./testdata/uploadChartsWithBasicAuth.sh", true); err != nil {
		return err
	}
	return nil
}

func waitForTCP(addr string, timeout time.Duration, logFiles ...string) error {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		conn, err := net.DialTimeout("tcp", addr, time.Second)
		if err == nil {
			conn.Close()
			return nil
		}
		time.Sleep(time.Second)
	}
	for _, f := range logFiles {
		if data, err := os.ReadFile(f); err == nil && len(data) > 0 {
			fmt.Fprintf(os.Stderr, "=== %s ===\n%s\n", f, string(data))
		}
	}
	if ssCmd := exec.Command("ss", "-tlnp"); ssCmd != nil {
		if out, err := ssCmd.CombinedOutput(); err == nil {
			fmt.Fprintf(os.Stderr, "=== ss -tlnp ===\n%s\n", string(out))
		}
	}
	if lsofCmd := exec.Command("lsof", "-nP", "-iTCP", "-sTCP:LISTEN"); lsofCmd != nil {
		if out, err := lsofCmd.CombinedOutput(); err == nil {
			fmt.Fprintf(os.Stderr, "=== lsof -nP -iTCP -sTCP:LISTEN ===\n%s\n", string(out))
		}
	}
	for _, pidFile := range []string{"./chartmuseum-tls.pid"} {
		if data, err := os.ReadFile(pidFile); err == nil {
			pidStr := strings.TrimSpace(string(data))
			fmt.Fprintf(os.Stderr, "=== %s: %s ===\n", pidFile, pidStr)
			if checkCmd := exec.Command("kill", "-0", pidStr); checkCmd != nil {
				if out, err := checkCmd.CombinedOutput(); err == nil {
					fmt.Fprintf(os.Stderr, "PID %s: alive\n", pidStr)
				} else {
					fmt.Fprintf(os.Stderr, "PID %s: not running (%v) %s\n", pidStr, err, string(out))
				}
			}
		}
	}
	return fmt.Errorf("timed out waiting for %s after %s", addr, timeout)
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
