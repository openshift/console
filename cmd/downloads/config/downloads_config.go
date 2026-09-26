package config

import (
	"archive/tar"
	"archive/zip"
	"compress/gzip"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"text/template"

	"gopkg.in/yaml.v3"
	"k8s.io/klog/v2"
)

// HtmlPageData holds data passed to the HTML template
type HtmlPageData struct {
	SubdirectoriesPathToRoot string
	Items                    []ListItemLink
}

type LinkType string

const (
	Binary  LinkType = "binary"
	License LinkType = "license"
)

// ListItemLink holds the data for a link in the HTML page
type ListItemLink struct {
	// Type can be "link" or "license" to differentiate between links to artifacts and the license
	Type   LinkType
	URL    string
	Name   string
	TarURL string
	ZipURL string
}

// ArtifactsConfig holds the the contents of an artifacts configuration file
type ArtifactsConfig struct {
	Artifacts []ArtifactSpec `yaml:"defaultArtifactsConfig"`
}

// ArtifactSpec holds the specification for an artifact
type ArtifactSpec struct {
	Arch            string `yaml:"arch"`
	OperatingSystem string `yaml:"operatingSystem"`
	Path            string `yaml:"path"`
}

// ArtifactsConfig holds the configuration for the artifacts server
type DownloadsServerConfig struct {
	Spec         []ArtifactSpec
	TempDir      string
	TemplateHTML *template.Template
	// archivesReady is closed once all background archive creation goroutines complete.
	archivesReady chan struct{}
}

const indexFileName = "index.html"
const pathToOCLicense = "/usr/share/openshift/LICENSE"
const ocLicenseFile = "oc-license"
const defaultArtifactsDir = "/tmp/artifacts"

// template used to generate the HTML file with links to artifacts
const templateStringHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
	{{ if .SubdirectoriesPathToRoot }} <p>Directory listings are disabled. See <a href="/private/{{ .SubdirectoriesPathToRoot }}">here</a> for available content.</p> {{ end }}
	{{ if .Items }}
	<ul>
		{{ range .Items }}
            {{ if eq .Type "binary" }}
                <li><a href="{{ .URL }}">oc ({{ .Name }})</a> (<a href="{{ .TarURL }}">tar.gz</a> <a href="{{ .ZipURL }}">zip</a>)</li>
            {{ else if eq .Type "license" }}
                <li><a href="{{ .URL }}">license</a></li>
            {{ end }}
        {{ end }}
	</ul>
	{{ end }}
</body>
</html>`

// load artifacts to be served from given path
func loadArtifactsSpec(dlConfigBytes []byte) ([]ArtifactSpec, error) {
	specs := ArtifactsConfig{}

	// unmarshal the YAML file into the ArtifactsConfig object
	err := yaml.Unmarshal(dlConfigBytes, &specs)
	if err != nil {
		return nil, err
	}

	// check if the specs are empty
	if len(specs.Artifacts) == 0 {
		return nil, fmt.Errorf("there are no artifacts to serve")
	}

	return specs.Artifacts, nil
}

// NewDownloadsServerConfig creates a new ArtifactsConfig object
func NewDownloadsServerConfig(dlConfigBytes []byte) (*DownloadsServerConfig, error) {
	tempDir := defaultArtifactsDir
	matches, _ := filepath.Glob("/tmp/artifacts*")
	for _, match := range matches {
		os.RemoveAll(match)
	}
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create artifacts directory: %w", err)
	}
	klog.Info("Created artifacts directory (cleaned up any stale data from previous runs)")
	specs, err := loadArtifactsSpec(dlConfigBytes)
	if err != nil {
		return nil, err
	}
	klog.Info("Loaded artifacts configuration file")

	templateHTML, err := template.New("artifacts").Parse(templateStringHTML)
	if err != nil {
		return nil, err
	}

	artifactsConfig := DownloadsServerConfig{
		Spec:         specs,
		TempDir:      tempDir,
		TemplateHTML: templateHTML,
	}
	err = artifactsConfig.setupArtifactsDirectory()
	if err != nil {
		return nil, err
	}
	klog.Infof("Downloads server configuration initialized, serving from %s", tempDir)

	return &artifactsConfig, nil
}

func addFileToTar(tw *tar.Writer, file io.Reader, info fs.FileInfo) error {
	// Create a tar Header from the FileInfo data
	header, err := tar.FileInfoHeader(info, info.Name())
	if err != nil {
		return err
	}

	// Write file header to the tar archive
	err = tw.WriteHeader(header)
	if err != nil {
		return err
	}

	// Copy file content to tar archive
	_, err = io.Copy(tw, file)
	if err != nil {
		return err
	}

	return nil
}

func addFileToZip(zw *zip.Writer, file io.Reader, fileInfo fs.FileInfo) error {
	// Create a zip header based on the file's information
	header, err := zip.FileInfoHeader(fileInfo)
	if err != nil {
		return err
	}

	header.Method = zip.Deflate

	// Create a new writer for the file in the zip archive
	writer, err := zw.CreateHeader(header)
	if err != nil {
		return err
	}

	// Copy the file content to the zip writer
	_, err = io.Copy(writer, file)
	if err != nil {
		return err
	}

	return nil
}

// displayName returns a human-readable label like "amd64 linux" or "amd64 linux - RHEL 8".
func displayName(arch, os, basename string) string {
	name := fmt.Sprintf("%s %s", arch, os)
	base := strings.TrimSuffix(basename, ".exe")
	if strings.HasSuffix(base, ".rhel8") {
		name += " - RHEL 8"
	} else if strings.HasSuffix(base, ".rhel9") {
		name += " - RHEL 9"
	}
	return name
}

func configureArchivePath(pathToTargetFile string) string {
	if filepath.Ext(pathToTargetFile) == ".exe" {
		// Remove the .exe extension from the path
		return pathToTargetFile[:len(pathToTargetFile)-4]
	}
	return pathToTargetFile
}

// create archive for the target binary
func createArchive(pathToTargetFile string, format string) error {
	targetFileInfo, err := os.Stat(pathToTargetFile)
	if err != nil {
		return err
	}

	targetFile, err := os.Open(pathToTargetFile)
	if err != nil {
		return err
	}
	defer targetFile.Close()

	// create archive in the same directory as the target binary
	pathToArchive := configureArchivePath(pathToTargetFile) + format

	file, err := os.Create(pathToArchive)
	if err != nil {
		return err
	}

	defer file.Close()
	if format == ".tar.gz" {
		compressWriter := gzip.NewWriter(file)
		defer compressWriter.Close()
		archiveWriter := tar.NewWriter(compressWriter)
		defer archiveWriter.Close()

		err = addFileToTar(archiveWriter, targetFile, targetFileInfo)
		if err != nil {
			return fmt.Errorf("could not create archive for %s: %w", pathToTargetFile, err)
		}
	} else if format == ".zip" {
		archiveWriter := zip.NewWriter(file)
		defer archiveWriter.Close()
		err = addFileToZip(archiveWriter, targetFile, targetFileInfo)

		if err != nil {
			return fmt.Errorf("could not create archive for %s: %w", pathToTargetFile, err)
		}
	} else {
		return fmt.Errorf("unsupported archive type")
	}

	return nil
}

// createHTMLFile applies HTML template with the given data to create an HTML file at the given path
func (artifactsConfig *DownloadsServerConfig) createHTMLFile(path string, data HtmlPageData) error {
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	// generate HTML file from the data based on the template
	err = artifactsConfig.TemplateHTML.Execute(file, data)
	if err != nil {
		return err
	}

	return nil
}

func createDir(dir string) error {
	_, err := os.Stat(dir)
	if os.IsNotExist(err) {
		err := os.Mkdir(dir, 0755)
		if err != nil {
			return err
		}
	}
	return nil
}

func (downloadsConfig *DownloadsServerConfig) handleDirCreation(dirPath string) error {
	err := createDir(dirPath)
	if err != nil {
		return err
	}
	err = downloadsConfig.createHTMLFile(
		filepath.Join(dirPath, indexFileName),
		HtmlPageData{
			SubdirectoriesPathToRoot: downloadsConfig.TempDir,
			Items:                    []ListItemLink{},
		},
	)
	if err != nil {
		return err
	}

	return nil
}

// generateDirFileContents generates the content of the root HTML file and creates directories, files and archives for artifacts
func (downloadsConfig *DownloadsServerConfig) generateDirFileContents() ([]ListItemLink, error) {
	content := []ListItemLink{
		{
			Type: License,
			URL:  ocLicenseFile,
		},
	}

	// create subdirectories for the artifacts
	for _, spec := range downloadsConfig.Spec {
		basename := filepath.Base(spec.Path)
		artifactPath := filepath.Join(downloadsConfig.TempDir, spec.Arch, spec.OperatingSystem, basename)
		archDir := filepath.Join(downloadsConfig.TempDir, spec.Arch)
		osDir := filepath.Join(downloadsConfig.TempDir, spec.Arch, spec.OperatingSystem)

		// create subdirectory for the architecture
		err := downloadsConfig.handleDirCreation(archDir)
		if err != nil {
			return nil, err
		}
		// create subdirectory for the operating system
		err = downloadsConfig.handleDirCreation(osDir)
		if err != nil {
			return nil, err
		}

		err = os.Symlink(spec.Path, artifactPath)
		if err != nil {
			return nil, err
		}

		relPath := filepath.Join(spec.Arch, spec.OperatingSystem, basename)
		relArchivePath := configureArchivePath(relPath)
		content = append(content, ListItemLink{
			Type:   Binary,
			URL:    relPath,
			Name:   displayName(spec.Arch, spec.OperatingSystem, basename),
			TarURL: fmt.Sprintf("%s.tar.gz", relArchivePath),
			ZipURL: fmt.Sprintf("%s.zip", relArchivePath),
		})
	}

	return content, nil
}

// CreateArchivesInBackground spawns goroutines to create tar and zip archives
// for every artifact concurrently. It closes archivesReady when all archives
// have been written so that Handler() can unblock waiting requests.
func (c *DownloadsServerConfig) CreateArchivesInBackground() {
	c.archivesReady = make(chan struct{})
	var wg sync.WaitGroup

	for _, spec := range c.Spec {
		basename := filepath.Base(spec.Path)
		artifactPath := filepath.Join(c.TempDir, spec.Arch, spec.OperatingSystem, basename)

		wg.Add(2)
		go func(p string) {
			defer wg.Done()
			if err := createArchive(p, ".tar.gz"); err != nil {
				klog.Errorf("Failed to create tar archive for %s: %v", p, err)
			}
		}(artifactPath)
		go func(p string) {
			defer wg.Done()
			if err := createArchive(p, ".zip"); err != nil {
				klog.Errorf("Failed to create zip archive for %s: %v", p, err)
			}
		}(artifactPath)
	}

	go func() {
		wg.Wait()
		close(c.archivesReady)
		klog.Info("All archives created successfully")
	}()
}

// Handler returns an http.Handler that serves files from TempDir. Requests for
// .tar or .zip archives block until background archive creation is complete.
func (c *DownloadsServerConfig) Handler() http.Handler {
	fs := http.FileServer(http.Dir(c.TempDir))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// temporary workaround for the CLI download configuration done in the console operator.
		// can be dropped when the CLI download configuration is fixed to use "tar.gz" rather than
		// "tar"
		if strings.HasSuffix(r.URL.Path, ".tar") {
			r.URL.Path += ".gz"
		}

		if strings.HasSuffix(r.URL.Path, ".zip") || strings.HasSuffix(r.URL.Path, ".tar.gz") {
			select {
			case <-r.Context().Done():
				w.Header().Set("Retry-After", "3")
				http.Error(w, http.StatusText(http.StatusServiceUnavailable), http.StatusServiceUnavailable)
				return
			case <-c.archivesReady:
			}
		}
		fs.ServeHTTP(w, r)
	})
}

// setupArtifactsDirectory creates the root HTML file and directories, files and archives for artifacts
func (artifactsConfig *DownloadsServerConfig) setupArtifactsDirectory() error {
	// symlink file in the temporary directory that points to the openshift license
	err := os.Symlink(pathToOCLicense, filepath.Join(artifactsConfig.TempDir, ocLicenseFile))
	if err != nil {
		klog.Errorf("can't create symlink to the LICENSE file in %s: %v", artifactsConfig.TempDir, err)
	}

	// generates content of the root html file and creates directories, files and archives for artifacts
	content, err := artifactsConfig.generateDirFileContents()
	if err != nil {
		return err
	}

	// create the root html file
	err = artifactsConfig.createHTMLFile(filepath.Join(artifactsConfig.TempDir, indexFileName), HtmlPageData{
		SubdirectoriesPathToRoot: "",
		Items:                    content,
	})
	if err != nil {
		return err
	}

	return nil
}
