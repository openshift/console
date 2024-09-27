package config

import (
	"archive/tar"
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"text/template"

	"gopkg.in/yaml.v3"

	klog "k8s.io/klog/v2"
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
	Port         string
	Spec         []ArtifactSpec
	TempDir      string
	TemplateHTML *template.Template
}

const indexFileName = "index.html"
const pathToOCLicense = "/usr/share/openshift/LICENSE"
const ocLicenseFile = "oc-license"

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
                <li><a href="{{ .URL }}">oc ({{ .Name }})</a> (<a href="{{ .TarURL }}">tar</a> <a href="{{ .ZipURL }}">zip</a>)</li>
            {{ else if eq .Type "license" }}
                <li><a href="{{ .URL }}">license</a></li>
            {{ end }}
        {{ end }}
	</ul>
	{{ end }}
</body>
</html>`

// load artifacts to be served from given path
func loadArtifactsSpec(path string) ([]ArtifactSpec, error) {
	specs := ArtifactsConfig{}
	// open the JSON spec config file
	fileBytes, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	// unmarshal the YAML file into the ArtifactsConfig object
	err = yaml.Unmarshal(fileBytes, &specs)
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
func NewDownloadsServerConfig(port int, specsFilePath string) (*DownloadsServerConfig, error) {
	tempDir, err := os.MkdirTemp("", "artifacts")
	if err != nil {
		return nil, err
	}
	klog.Info("Create temporary directory for artifacts")
	specs, err := loadArtifactsSpec(specsFilePath)
	if err != nil {
		return nil, err
	}
	klog.Info("Loaded artifacts configuration file")

	templateHTML, err := template.New("artifacts").Parse(templateStringHTML)
	if err != nil {
		return nil, err
	}

	artifactsConfig := DownloadsServerConfig{
		Port:         fmt.Sprintf("%d", port),
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

func addFileToTar(tw *tar.Writer, filename string) error {
	// Open the archive
	file, err := os.Open(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	// Get file information
	info, err := file.Stat()
	if err != nil {
		return err
	}

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

func addFileToZip(zw *zip.Writer, filename string) error {
	// Open the archive
	file, err := os.Open(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	// Get file information
	info, err := file.Stat()
	if err != nil {
		return err
	}

	// Create a zip header based on the file's information
	header, err := zip.FileInfoHeader(info)
	if err != nil {
		return err
	}

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

func configureArchivePath(pathToTargetFile string) string {
	if filepath.Ext(pathToTargetFile) == ".exe" {
		// Remove the .exe extension from the path
		return pathToTargetFile[:len(pathToTargetFile)-4]
	}
	return pathToTargetFile
}

// create archive for the target binary
func createArchive(pathToTargetFile string, format string) error {
	// create archive in the same directory as the target binary
	pathToArchive := configureArchivePath(pathToTargetFile) + format

	file, err := os.Create(pathToArchive)
	if err != nil {
		return err
	}

	defer file.Close()
	if format == ".tar" {
		archiveWriter := tar.NewWriter(file)
		addFileToTar(archiveWriter, pathToTargetFile)
		defer archiveWriter.Close()
	} else if format == ".zip" {
		archiveWriter := zip.NewWriter(file)
		addFileToZip(archiveWriter, pathToTargetFile)
		defer archiveWriter.Close()
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

		err = createArchive(artifactPath, ".tar")
		if err != nil {
			return nil, err
		}
		err = createArchive(artifactPath, ".zip")
		if err != nil {
			return nil, err
		}

		pathToArchive := configureArchivePath(artifactPath)
		// append new entry in the list of links to artifacts
		content = append(content, ListItemLink{
			Type:   Binary,
			URL:    artifactPath,
			Name:   fmt.Sprintf("%s %s", spec.Arch, spec.OperatingSystem),
			TarURL: fmt.Sprintf("%s.tar", pathToArchive),
			ZipURL: fmt.Sprintf("%s.zip", pathToArchive),
		})
	}

	return content, nil
}

// setupArtifactsDirectory creates the root HTML file and directories, files and archives for artifacts
func (artifactsConfig *DownloadsServerConfig) setupArtifactsDirectory() error {
	// symlink file in the temporary directory that points to the openshift license
	os.Symlink(pathToOCLicense, filepath.Join(artifactsConfig.TempDir, ocLicenseFile))

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
