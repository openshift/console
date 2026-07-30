package actions

import (
	"fmt"
	"io"
	"net"
	"os"
	"os/exec"
	"regexp"
	"runtime/debug"
	"strings"
	"testing"
	"time"

	"helm.sh/helm/v4/pkg/cli"
)

const helmModulePath = "helm.sh/helm/v4"

func setSettings(settings *cli.EnvSettings) {
	settings.RepositoryCache = os.TempDir()
	settings.RegistryConfig = os.TempDir()
	settings.RepositoryConfig = "/RepositoryConfig"
}

// helmVersionFromGoMod reads go.mod to find the Helm Go package version.
// Test binaries often have no build info (see https://go.dev/issue/33976), so we parse go.mod instead.
func helmVersionFromGoMod() string {
	for _, path := range []string{"go.mod", "../go.mod", "../../go.mod", "../../../go.mod"} {
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}
		// Match a require line like "helm.sh/helm/v4 v4.1.4" or "helm.sh/helm/v4 v4.1.4 // indirect".
		re := regexp.MustCompile(`(?m)^\s*` + regexp.QuoteMeta(helmModulePath) + `\s+(\S+)`)
		if m := re.FindSubmatch(data); len(m) >= 2 {
			return strings.TrimSpace(string(m[1]))
		}
	}
	return ""
}

// setHelmVersionFromBuildInfo sets HELM_VERSION from the Go module's helm.sh/helm/v4
// dependency. Prefers debug.ReadBuildInfo(); when that is empty for test binaries (Go #33976),
// falls back to parsing go.mod.
func setHelmVersionFromBuildInfo() error {
	var version string
	if info, ok := debug.ReadBuildInfo(); ok {
		for _, dep := range info.Deps {
			if dep.Path == helmModulePath && dep.Version != "" {
				version = dep.Version
				break
			}
		}
	}
	if version == "" {
		version = helmVersionFromGoMod()
	}
	if version != "" {
		err := os.Setenv("HELM_VERSION", version)
		if err != nil {
			return fmt.Errorf("Error setting HELM_VERSION: %w", err)
		}
	}
	return nil
}

func TestMain(m *testing.M) {
	setSettings(settings)
	time.Sleep(10 * time.Second)
	if err := setHelmVersionFromBuildInfo(); err != nil {
		panic(err)
	}
	retCode := startTests(m)
	os.Exit(retCode)
}

func startTests(m *testing.M) (exitCode int) {
	defer func() {
		// Cleanup: log errors but don't fail — best-effort teardown
		if err := ExecuteScript("./testdata/chartmuseum-stop.sh", false); err != nil {
			fmt.Println("Warning: chartmuseum-stop.sh failed:", err)
			exitCode = 1
		}
		if err := ExecuteScript("./testdata/zot-stop.sh", false); err != nil {
			fmt.Println("Warning: zot-stop.sh failed:", err)
			exitCode = 1
		}
		if err := ExecuteScript("./testdata/cleanupNonTls.sh", false); err != nil {
			fmt.Println("Warning: cleanupNonTls.sh failed:", err)
			exitCode = 1
		}
		if err := ExecuteScript("./testdata/cleanup.sh", false); err != nil {
			fmt.Println("Warning: cleanup.sh failed:", err)
			exitCode = 1
		}

	}()
	if err := setupTestWithTls(); err != nil {
		panic(err)
	}
	if err := setupTestWithoutTls(); err != nil {
		panic(err)
	}
	if err := setupTestBasicAuth(); err != nil {
		panic(err)
	}
	if err := setupTestOCIBasicAuth(); err != nil {
		panic(err)
	}
	return m.Run()
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
	if err := ExecuteScript("./testdata/downloadZot.sh", true); err != nil {
		return err
	}
	if err := ExecuteScript("./testdata/zot.sh", false); err != nil {
		return err
	}
	if err := ExecuteScript("./testdata/downloadHelm.sh", true); err != nil {
		return err
	}
	if err := waitForTCP("localhost:9443", 30*time.Second, "./chartmuseum-9443.log"); err != nil {
		return fmt.Errorf("chartmuseum not ready: %w", err)
	}
	if err := waitForTCP("localhost:5443", 30*time.Second); err != nil {
		return fmt.Errorf("zot (TLS) not ready: %w", err)
	}
	if err := ExecuteScript("./testdata/cacertCreate.sh", true); err != nil {
		return err
	}
	if err := ExecuteScript("./testdata/uploadCharts.sh", true); err != nil {
		return err
	}
	if err := ExecuteScript("./testdata/uploadOciCharts.sh", true, "--tls"); err != nil {
		return err
	}
	return nil
}

func setupTestWithoutTls() error {
	if err := ExecuteScript("./testdata/chartmuseumWithoutTls.sh", false); err != nil {
		return err
	}
	if err := ExecuteScript("./testdata/zotWithoutTls.sh", false); err != nil {
		return err
	}
	if err := waitForTCP("localhost:9181", 30*time.Second); err != nil {
		return fmt.Errorf("chartmuseum (no TLS) not ready: %w", err)
	}
	if err := waitForTCP("localhost:5000", 30*time.Second); err != nil {
		return fmt.Errorf("zot (no TLS) not ready: %w", err)
	}
	if err := ExecuteScript("./testdata/uploadChartsWithoutTls.sh", true); err != nil {
		return err
	}
	if err := ExecuteScript("./testdata/uploadOciCharts.sh", true, "--no-tls"); err != nil {
		return err
	}
	return nil
}

func setupTestBasicAuth() error {
	setSettings(settings)
	if err := ExecuteScript("./testdata/chartmuseumWithBasicAuth.sh", false); err != nil {
		return err
	}
	if err := waitForTCP("localhost:8181", 30*time.Second); err != nil {
		return fmt.Errorf("chartmuseum (basic auth) not ready: %w", err)
	}
	if err := ExecuteScript("./testdata/uploadChartsWithBasicAuth.sh", true); err != nil {
		return err
	}
	return nil
}

func setupTestOCIBasicAuth() error {
	if err := ExecuteScript("./testdata/zotWithBasicAuth.sh", false); err != nil {
		return err
	}
	if err := waitForTCP("localhost:5001", 30*time.Second); err != nil {
		return fmt.Errorf("zot (basic auth) not ready: %w", err)
	}
	if err := ExecuteScript("./testdata/uploadOciCharts.sh", true, "--basic-auth"); err != nil {
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
	// Dump listening ports and process state for debugging
	if ssCmd := exec.Command("ss", "-tlnp"); ssCmd != nil {
		if out, err := ssCmd.CombinedOutput(); err == nil {
			fmt.Fprintf(os.Stderr, "=== ss -tlnp ===\n%s\n", string(out))
		}
	}
	// Check if any chartmuseum PID files exist and if processes are alive
	for _, pidFile := range []string{"./chartmuseum-tls.pid"} {
		if data, err := os.ReadFile(pidFile); err == nil {
			fmt.Fprintf(os.Stderr, "=== %s: %s ===\n", pidFile, strings.TrimSpace(string(data)))
			pidStr := strings.TrimSpace(string(data))
			if checkCmd := exec.Command("ls", "-la", fmt.Sprintf("/proc/%s/exe", pidStr)); checkCmd != nil {
				if out, err := checkCmd.CombinedOutput(); err == nil {
					fmt.Fprintf(os.Stderr, "/proc/%s/exe -> %s\n", pidStr, string(out))
				} else {
					fmt.Fprintf(os.Stderr, "/proc/%s: process dead (%v)\n", pidStr, err)
				}
			}
		}
	}
	return fmt.Errorf("timed out waiting for %s after %s", addr, timeout)
}

func ExecuteScript(filepath string, waitForCompletion bool, args ...string) error {
	tlsCmd := exec.Command(filepath, args...)
	tlsCmd.Stdout = os.Stdout
	tlsCmd.Stderr = os.Stderr
	err := tlsCmd.Start()
	if err != nil {
		bytes, _ := io.ReadAll(os.Stderr)
		return fmt.Errorf("Error starting program :%s:%s:%w", filepath, string(bytes), err)
	}
	if waitForCompletion {
		err = tlsCmd.Wait()
		if err != nil {
			bytes, _ := io.ReadAll(os.Stderr)
			return fmt.Errorf("Error waiting program :%s:%s:%w", filepath, string(bytes), err)
		}
	}
	return nil
}
