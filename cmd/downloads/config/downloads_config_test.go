package config

import (
	"os"
	"path/filepath"
	"testing"
)

func writeTestSpecsFile(t *testing.T, binaryPath string) string {
	t.Helper()
	specContent := []byte("defaultArtifactsConfig:\n  - arch: amd64\n    operatingSystem: linux\n    path: " + binaryPath + "\n")
	specFile := filepath.Join(t.TempDir(), "config.yaml")
	if err := os.WriteFile(specFile, specContent, 0644); err != nil {
		t.Fatalf("failed to write spec file: %v", err)
	}
	return specFile
}

func TestNewDownloadsServerConfig_CreatesDirectory(t *testing.T) {
	os.RemoveAll(defaultArtifactsDir)
	t.Cleanup(func() { os.RemoveAll(defaultArtifactsDir) })

	srcDir := t.TempDir()
	binaryPath := filepath.Join(srcDir, "oc")
	if err := os.WriteFile(binaryPath, []byte("fake-binary"), 0755); err != nil {
		t.Fatalf("failed to write fake binary: %v", err)
	}

	cfg, err := NewDownloadsServerConfig(0, writeTestSpecsFile(t, binaryPath))
	if err != nil {
		t.Fatalf("NewDownloadsServerConfig() error: %v", err)
	}

	if cfg.TempDir != defaultArtifactsDir {
		t.Errorf("TempDir = %q, want %q", cfg.TempDir, defaultArtifactsDir)
	}
	if _, err := os.Stat(defaultArtifactsDir); err != nil {
		t.Errorf("artifacts directory does not exist: %v", err)
	}
	if _, err := os.Stat(filepath.Join(defaultArtifactsDir, indexFileName)); err != nil {
		t.Errorf("index.html not created: %v", err)
	}
}

func TestNewDownloadsServerConfig_CleansStaleData(t *testing.T) {
	os.RemoveAll(defaultArtifactsDir)
	t.Cleanup(func() { os.RemoveAll(defaultArtifactsDir) })

	if err := os.MkdirAll(defaultArtifactsDir, 0755); err != nil {
		t.Fatalf("failed to create stale dir: %v", err)
	}
	staleFile := filepath.Join(defaultArtifactsDir, "stale-file.txt")
	if err := os.WriteFile(staleFile, []byte("stale"), 0644); err != nil {
		t.Fatalf("failed to write stale file: %v", err)
	}

	srcDir := t.TempDir()
	binaryPath := filepath.Join(srcDir, "oc")
	if err := os.WriteFile(binaryPath, []byte("fake-binary"), 0755); err != nil {
		t.Fatalf("failed to write fake binary: %v", err)
	}

	_, err := NewDownloadsServerConfig(0, writeTestSpecsFile(t, binaryPath))
	if err != nil {
		t.Fatalf("NewDownloadsServerConfig() error: %v", err)
	}

	if _, err := os.Stat(staleFile); !os.IsNotExist(err) {
		t.Errorf("stale file should have been cleaned up, but still exists")
	}
}

func TestNewDownloadsServerConfig_CleansOldRandomTempDirs(t *testing.T) {
	os.RemoveAll(defaultArtifactsDir)
	t.Cleanup(func() {
		os.RemoveAll(defaultArtifactsDir)
		matches, _ := filepath.Glob("/tmp/artifacts*test*")
		for _, m := range matches {
			os.RemoveAll(m)
		}
	})

	oldDirs := []string{
		"/tmp/artifacts1234test",
		"/tmp/artifacts5678test",
	}
	for _, d := range oldDirs {
		if err := os.MkdirAll(d, 0755); err != nil {
			t.Fatalf("failed to create old temp dir %s: %v", d, err)
		}
		os.WriteFile(filepath.Join(d, "leftover"), []byte("data"), 0644)
	}

	srcDir := t.TempDir()
	binaryPath := filepath.Join(srcDir, "oc")
	if err := os.WriteFile(binaryPath, []byte("fake-binary"), 0755); err != nil {
		t.Fatalf("failed to write fake binary: %v", err)
	}

	_, err := NewDownloadsServerConfig(0, writeTestSpecsFile(t, binaryPath))
	if err != nil {
		t.Fatalf("NewDownloadsServerConfig() error: %v", err)
	}

	for _, d := range oldDirs {
		if _, err := os.Stat(d); !os.IsNotExist(err) {
			t.Errorf("old temp dir %s should have been cleaned up, but still exists", d)
		}
	}
}
