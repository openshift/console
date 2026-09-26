package config

import (
	"archive/tar"
	"archive/zip"
	"compress/gzip"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"text/template"
	"time"
)

func TestDisplayName(t *testing.T) {
	tests := []struct {
		arch, os, basename, expected string
	}{
		{"amd64", "linux", "oc", "amd64 linux"},
		{"amd64", "linux", "oc.rhel8", "amd64 linux - RHEL 8"},
		{"amd64", "linux", "oc.rhel9", "amd64 linux - RHEL 9"},
		{"arm64", "linux", "oc.rhel8", "arm64 linux - RHEL 8"},
		{"ppc64le", "linux", "oc.rhel9", "ppc64le linux - RHEL 9"},
		{"amd64", "mac", "oc", "amd64 mac"},
		{"amd64", "windows", "oc.exe", "amd64 windows"},
	}

	for _, tt := range tests {
		got := displayName(tt.arch, tt.os, tt.basename)
		if got != tt.expected {
			t.Errorf("displayName(%q, %q, %q) = %q, want %q", tt.arch, tt.os, tt.basename, got, tt.expected)
		}
	}
}

func TestConfigureArchivePath(t *testing.T) {
	tests := []struct {
		input, expected string
	}{
		{"/tmp/amd64/linux/oc", "/tmp/amd64/linux/oc"},
		{"/tmp/amd64/linux/oc.rhel8", "/tmp/amd64/linux/oc.rhel8"},
		{"/tmp/amd64/linux/oc.rhel9", "/tmp/amd64/linux/oc.rhel9"},
		{"/tmp/amd64/windows/oc.exe", "/tmp/amd64/windows/oc"},
	}

	for _, tt := range tests {
		got := configureArchivePath(tt.input)
		if got != tt.expected {
			t.Errorf("configureArchivePath(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func newTestConfig(t *testing.T, specs []ArtifactSpec) *DownloadsServerConfig {
	t.Helper()
	tempDir := t.TempDir()

	tmpl, err := template.New("artifacts").Parse(templateStringHTML)
	if err != nil {
		t.Fatalf("failed to parse template: %v", err)
	}

	for _, spec := range specs {
		if err := os.MkdirAll(filepath.Dir(spec.Path), 0755); err != nil {
			t.Fatalf("failed to create source dir: %v", err)
		}
		if err := os.WriteFile(spec.Path, []byte("fake-binary"), 0755); err != nil {
			t.Fatalf("failed to write fake binary: %v", err)
		}
	}

	return &DownloadsServerConfig{
		Spec:         specs,
		TempDir:      tempDir,
		TemplateHTML: tmpl,
	}
}

func TestGenerateDirFileContents_RelativeURLs(t *testing.T) {
	srcDir := t.TempDir()
	specs := []ArtifactSpec{
		{Arch: "amd64", OperatingSystem: "linux", Path: filepath.Join(srcDir, "oc")},
		{Arch: "amd64", OperatingSystem: "windows", Path: filepath.Join(srcDir, "oc.exe")},
	}
	cfg := newTestConfig(t, specs)

	content, err := cfg.generateDirFileContents()
	if err != nil {
		t.Fatalf("generateDirFileContents() error: %v", err)
	}

	for _, item := range content {
		if item.Type == License {
			continue
		}
		for _, u := range []string{item.URL, item.TarURL, item.ZipURL} {
			if strings.Contains(u, cfg.TempDir) {
				t.Errorf("URL %q contains TempDir %q; expected relative path", u, cfg.TempDir)
			}
			if filepath.IsAbs(u) {
				t.Errorf("URL %q is an absolute path; expected relative", u)
			}
		}
	}

	linux := content[1]
	if linux.URL != "amd64/linux/oc" {
		t.Errorf("expected URL %q, got %q", "amd64/linux/oc", linux.URL)
	}
	if linux.TarURL != "amd64/linux/oc.tar.gz" {
		t.Errorf("expected TarURL %q, got %q", "amd64/linux/oc.tar.gz", linux.TarURL)
	}

	win := content[2]
	if win.URL != "amd64/windows/oc.exe" {
		t.Errorf("expected URL %q, got %q", "amd64/windows/oc.exe", win.URL)
	}
	if win.TarURL != "amd64/windows/oc.tar.gz" {
		t.Errorf("expected TarURL %q, got %q", "amd64/windows/oc.tar.gz", win.TarURL)
	}
	if win.ZipURL != "amd64/windows/oc.zip" {
		t.Errorf("expected ZipURL %q, got %q", "amd64/windows/oc.zip", win.ZipURL)
	}
}

func TestCreateArchivesInBackground(t *testing.T) {
	srcDir := t.TempDir()
	specs := []ArtifactSpec{
		{Arch: "amd64", OperatingSystem: "linux", Path: filepath.Join(srcDir, "oc")},
		{Arch: "arm64", OperatingSystem: "mac", Path: filepath.Join(srcDir, "oc-mac")},
	}
	cfg := newTestConfig(t, specs)

	if _, err := cfg.generateDirFileContents(); err != nil {
		t.Fatalf("generateDirFileContents() error: %v", err)
	}

	cfg.CreateArchivesInBackground()

	select {
	case <-cfg.archivesReady:
	case <-time.After(10 * time.Second):
		t.Fatal("timed out waiting for archives to complete")
	}

	for _, spec := range specs {
		basename := filepath.Base(spec.Path)
		base := filepath.Join(cfg.TempDir, spec.Arch, spec.OperatingSystem, basename)

		checkTarFile(t, base, basename)

		zipPath := base + ".zip"
		if _, err := os.Stat(zipPath); err != nil {
			t.Errorf("zip archive not found at %s: %v", zipPath, err)
			continue
		}
		zr, err := zip.OpenReader(zipPath)
		if err != nil {
			t.Errorf("failed to open zip %s: %v", zipPath, err)
		} else {
			if len(zr.File) != 1 || zr.File[0].Name != basename {
				t.Errorf("zip entry name = %q, want %q", zr.File[0].Name, basename)
			}
			zr.Close()
		}
	}
}

func checkTarFile(t *testing.T, base, basename string) {
	tarPath := base + ".tar.gz"
	if _, err := os.Stat(tarPath); err != nil {
		t.Errorf("tar archive not found at %s: %v", tarPath, err)
		return
	}
	f, err := os.Open(tarPath)
	if err != nil {
		t.Fatalf("failed to open archive at %s: %v", tarPath, err)
	}
	defer f.Close()

	gzw, err := gzip.NewReader(f)
	if err != nil {
		t.Fatalf("failed to open archive at %s: %v", tarPath, err)
	}
	defer gzw.Close()

	tr := tar.NewReader(gzw)
	hdr, err := tr.Next()
	if err != nil {
		t.Errorf("failed to read tar %s: %v", tarPath, err)
	} else if hdr.Name != basename {
		t.Errorf("tar entry name = %q, want %q", hdr.Name, basename)
	}

}

func TestHandler_BlocksUntilArchivesReady(t *testing.T) {
	tmpDir := t.TempDir()
	if err := os.WriteFile(filepath.Join(tmpDir, "index.html"), []byte("<html>ok</html>"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(tmpDir, "amd64", "linux"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(tmpDir, "amd64", "linux", "oc.tar.gz"), []byte("archive"), 0644); err != nil {
		t.Fatal(err)
	}

	cfg := &DownloadsServerConfig{
		TempDir:       tmpDir,
		archivesReady: make(chan struct{}),
	}

	handler := cfg.Handler()

	t.Run("non-archive requests are served immediately", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Errorf("expected 200 for /, got %d", rec.Code)
		}
	})

	t.Run("archive request blocks then succeeds", func(t *testing.T) {
		done := make(chan int, 1)
		go func() {
			req := httptest.NewRequest(http.MethodGet, "/amd64/linux/oc.tar.gz", nil)
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)
			done <- rec.Code
		}()

		select {
		case <-done:
			t.Fatal("archive request returned before archivesReady was closed")
		case <-time.After(100 * time.Millisecond):
		}

		close(cfg.archivesReady)

		select {
		case code := <-done:
			if code != http.StatusOK {
				t.Errorf("expected 200 for oc.tar after ready, got %d", code)
			}
		case <-time.After(5 * time.Second):
			t.Fatal("archive request did not complete after archivesReady was closed")
		}
	})
}

func writeTestSpecsFile(t *testing.T, binaryPath string) []byte {
	t.Helper()
	return fmt.Appendf(nil, `defaultArtifactsConfig:
- arch: amd64
  operatingSystem: linux
  path: %s
`,
		binaryPath)
}

func TestNewDownloadsServerConfig_CreatesDirectory(t *testing.T) {
	os.RemoveAll(defaultArtifactsDir)
	t.Cleanup(func() { os.RemoveAll(defaultArtifactsDir) })

	srcDir := t.TempDir()
	binaryPath := filepath.Join(srcDir, "oc")
	if err := os.WriteFile(binaryPath, []byte("fake-binary"), 0755); err != nil {
		t.Fatalf("failed to write fake binary: %v", err)
	}

	cfg, err := NewDownloadsServerConfig(writeTestSpecsFile(t, binaryPath))
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

	_, err := NewDownloadsServerConfig(writeTestSpecsFile(t, binaryPath))
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

	_, err := NewDownloadsServerConfig(writeTestSpecsFile(t, binaryPath))
	if err != nil {
		t.Fatalf("NewDownloadsServerConfig() error: %v", err)
	}

	for _, d := range oldDirs {
		if _, err := os.Stat(d); !os.IsNotExist(err) {
			t.Errorf("old temp dir %s should have been cleaned up, but still exists", d)
		}
	}
}

func TestHandler_ServesArchiveImmediatelyWhenReady(t *testing.T) {
	for _, tc := range []struct {
		name              string
		fileName          string
		requestedFileName string
	}{
		{
			name:              "check download tar.gz",
			fileName:          "oc.tar.gz",
			requestedFileName: "oc.tar.gz",
		},
		{
			name:              "check download tar, get tar.gz",
			fileName:          "oc.tar.gz",
			requestedFileName: "oc.tar",
		},
		{
			name:              "check download tar.zip",
			fileName:          "oc.zip",
			requestedFileName: "oc.zip",
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			tmpDir := t.TempDir()
			dir := filepath.Join(tmpDir, "amd64", "linux")
			if err := os.MkdirAll(dir, 0755); err != nil {
				t.Fatal(err)
			}
			defer os.RemoveAll(dir)

			archiveContent := []byte("archive-data")
			if err := os.WriteFile(filepath.Join(dir, tc.fileName), archiveContent, 0644); err != nil {
				t.Fatal(err)
			}

			ready := make(chan struct{})
			close(ready)
			cfg := &DownloadsServerConfig{
				TempDir:       tmpDir,
				archivesReady: ready,
			}

			req := httptest.NewRequest(http.MethodGet, "/amd64/linux/"+tc.requestedFileName, nil)
			rec := httptest.NewRecorder()
			cfg.Handler().ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Errorf("expected 200, got %d", rec.Code)
			}
			body, _ := io.ReadAll(rec.Result().Body)
			if string(body) != string(archiveContent) {
				t.Errorf("expected body %q, got %q", archiveContent, body)
			}
		})
	}
}

func TestHandler_ServesArchiveTimeout(t *testing.T) {
	tmpDir := t.TempDir()
	dir := filepath.Join(tmpDir, "amd64", "linux")
	if err := os.MkdirAll(dir, 0755); err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)

	archiveContent := []byte("archive-data")
	if err := os.WriteFile(filepath.Join(dir, "oc.tar.gz"), archiveContent, 0644); err != nil {
		t.Fatal(err)
	}

	ready := make(chan struct{})
	once := &sync.Once{}
	closeFunc := func() {
		once.Do(func() {
			close(ready)
		})
	}
	defer closeFunc() // for error case

	cfg := &DownloadsServerConfig{
		TempDir:       tmpDir,
		archivesReady: ready,
	}

	ctxBefore, cancelBefore := context.WithTimeout(t.Context(), time.Millisecond*100)
	defer cancelBefore()

	req := httptest.NewRequestWithContext(ctxBefore, http.MethodGet, "/amd64/linux/oc.tar.gz", nil)
	rec := httptest.NewRecorder()
	cfg.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", rec.Code)
	}

	closeFunc() // make the server ready

	ctxAfter, cancelAfter := context.WithTimeout(t.Context(), time.Millisecond*100)
	defer cancelAfter()

	req = httptest.NewRequestWithContext(ctxAfter, http.MethodGet, "/amd64/linux/oc.tar.gz", nil)
	rec = httptest.NewRecorder()
	cfg.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}
