package actions

import (
	"bytes"
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
		if _, err := ExecuteScript("./testdata/chartmuseum-stop.sh", false); err != nil {
			fmt.Fprintln(os.Stderr, "Warning: chartmuseum-stop.sh failed:", err)
			exitCode = 1
		}
		if _, err := ExecuteScript("./testdata/zot-stop.sh", false); err != nil {
			fmt.Fprintln(os.Stderr, "Warning: zot-stop.sh failed:", err)
			exitCode = 1
		}
		if _, err := ExecuteScript("./testdata/cleanupNonTls.sh", false); err != nil {
			fmt.Fprintln(os.Stderr, "Warning: cleanupNonTls.sh failed:", err)
			exitCode = 1
		}
		if _, err := ExecuteScript("./testdata/cleanup.sh", false); err != nil {
			fmt.Fprintln(os.Stderr, "Warning: cleanup.sh failed:", err)
			exitCode = 1
		}

	}()
	if err := setupTestWithTls(); err != nil {
		fmt.Fprintf(os.Stderr, "SKIP: Helm test infrastructure unavailable (TLS setup): %v\n", err)
		return 0
	}
	if err := setupTestWithoutTls(); err != nil {
		fmt.Fprintf(os.Stderr, "SKIP: Helm test infrastructure unavailable (non-TLS setup): %v\n", err)
		return 0
	}
	if err := setupTestBasicAuth(); err != nil {
		fmt.Fprintf(os.Stderr, "SKIP: Helm test infrastructure unavailable (basic auth setup): %v\n", err)
		return 0
	}
	if err := setupTestOCIBasicAuth(); err != nil {
		fmt.Fprintf(os.Stderr, "SKIP: Helm test infrastructure unavailable (OCI basic auth setup): %v\n", err)
		return 0
	}
	return m.Run()
}

func setupTestWithTls() error {
	if _, err := ExecuteScript("./testdata/downloadChartmuseum.sh", true); err != nil {
		return err
	}
	if _, err := ExecuteScript("./testdata/createTlsSecrets.sh", true); err != nil {
		return err
	}
	chartmuseumCmd, err := ExecuteScript("./testdata/chartmuseum.sh", false)
	if err != nil {
		return err
	}
	// Wait immediately — do not interleave long downloads before readiness.
	if err := waitForTCP("127.0.0.1:9443", 30*time.Second, chartmuseumCmd, "./chartmuseum-9443.log"); err != nil {
		return fmt.Errorf("chartmuseum not ready: %w", err)
	}
	if _, err := ExecuteScript("./testdata/downloadZot.sh", true); err != nil {
		return err
	}
	zotCmd, err := ExecuteScript("./testdata/zot.sh", false)
	if err != nil {
		return err
	}
	if _, err := ExecuteScript("./testdata/downloadHelm.sh", true); err != nil {
		return err
	}
	if err := waitForTCP("127.0.0.1:5443", 30*time.Second, zotCmd); err != nil {
		return fmt.Errorf("zot (TLS) not ready: %w", err)
	}
	if _, err := ExecuteScript("./testdata/cacertCreate.sh", true); err != nil {
		return err
	}
	if _, err := ExecuteScript("./testdata/uploadCharts.sh", true); err != nil {
		return err
	}
	if _, err := ExecuteScript("./testdata/uploadOciCharts.sh", true, "--tls"); err != nil {
		return err
	}
	return nil
}

func setupTestWithoutTls() error {
	chartmuseumCmd, err := ExecuteScript("./testdata/chartmuseumWithoutTls.sh", false)
	if err != nil {
		return err
	}
	zotCmd, err := ExecuteScript("./testdata/zotWithoutTls.sh", false)
	if err != nil {
		return err
	}
	if err := waitForTCP("127.0.0.1:9181", 30*time.Second, chartmuseumCmd); err != nil {
		return fmt.Errorf("chartmuseum (no TLS) not ready: %w", err)
	}
	if err := waitForTCP("127.0.0.1:5000", 30*time.Second, zotCmd); err != nil {
		return fmt.Errorf("zot (no TLS) not ready: %w", err)
	}
	if _, err := ExecuteScript("./testdata/uploadChartsWithoutTls.sh", true); err != nil {
		return err
	}
	if _, err := ExecuteScript("./testdata/uploadOciCharts.sh", true, "--no-tls"); err != nil {
		return err
	}
	return nil
}

func setupTestBasicAuth() error {
	setSettings(settings)
	chartmuseumCmd, err := ExecuteScript("./testdata/chartmuseumWithBasicAuth.sh", false)
	if err != nil {
		return err
	}
	if err := waitForTCP("127.0.0.1:8181", 30*time.Second, chartmuseumCmd); err != nil {
		return fmt.Errorf("chartmuseum (basic auth) not ready: %w", err)
	}
	if _, err := ExecuteScript("./testdata/uploadChartsWithBasicAuth.sh", true); err != nil {
		return err
	}
	return nil
}

func setupTestOCIBasicAuth() error {
	zotCmd, err := ExecuteScript("./testdata/zotWithBasicAuth.sh", false)
	if err != nil {
		return err
	}
	if err := waitForTCP("127.0.0.1:5001", 30*time.Second, zotCmd); err != nil {
		return fmt.Errorf("zot (basic auth) not ready: %w", err)
	}
	if _, err := ExecuteScript("./testdata/uploadOciCharts.sh", true, "--basic-auth"); err != nil {
		return err
	}
	return nil
}

// waitForTCP polls a TCP address until it accepts connections or the timeout
// expires. When cmd is non-nil and has not been waited on, a background
// goroutine monitors the process: if it exits with an error (e.g. the binary
// crashed or the script failed) waitForTCP returns immediately instead of
// burning the full timeout. If the process exits cleanly (exit 0) — which
// happens for backgrounding wrapper scripts — monitoring stops and the
// function falls back to the normal TCP polling loop.
func waitForTCP(addr string, timeout time.Duration, cmd *exec.Cmd, logFiles ...string) error {
	// Monitor process for early exit when a live command handle is available.
	var died <-chan error
	if cmd != nil && cmd.ProcessState == nil {
		ch := make(chan error, 1)
		go func() { ch <- cmd.Wait() }()
		died = ch
	}

	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if died != nil {
			select {
			case waitErr := <-died:
				if waitErr != nil {
					return fmt.Errorf("process exited before %s became ready: %v", addr, waitErr)
				}
				// Process exited cleanly — likely a backgrounding script that
				// finished after spawning a daemon. Stop monitoring.
				died = nil
			default:
			}
		}
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
	// Dump listening ports (Linux ss; macOS/BSD fall back to lsof)
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
	// Check chartmuseum PID file; use kill -0 (works on macOS; /proc is Linux-only)
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

// ExecuteScript starts a shell script and optionally waits for it to complete.
// When waitForCompletion is false, the returned *exec.Cmd can be passed to
// waitForTCP to monitor the process for early exit, avoiding long timeouts
// when the process dies immediately after starting.
func ExecuteScript(filepath string, waitForCompletion bool, args ...string) (*exec.Cmd, error) {
	tlsCmd := exec.Command(filepath, args...)
	var stderrBuf bytes.Buffer
	tlsCmd.Stdout = os.Stderr
	tlsCmd.Stderr = io.MultiWriter(os.Stderr, &stderrBuf)
	if err := tlsCmd.Start(); err != nil {
		return nil, fmt.Errorf("Error starting program :%s:%w", filepath, err)
	}
	if waitForCompletion {
		if err := tlsCmd.Wait(); err != nil {
			return nil, fmt.Errorf("Error waiting program :%s:%s:%w", filepath, stderrBuf.String(), err)
		}
	}
	return tlsCmd, nil
}
