package downloads

import (
	"archive/tar"
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"text/template"

	klog "k8s.io/klog/v2"
)

// HtmlPageData holds data passed to the template
type HtmlPageData struct {
	Heading                  string
	SubdirectoriesPathToRoot string
	Items                    []ListItemLink
}

type ListItemLink struct {
	Type   string // "link to artifacts" or "license link"
	URL    string
	Name   string
	TarURL string
	ZipURL string
}

// specification of the artifacts to be served
type artifactFileSpec struct {
	Arch            string
	OperatingSystem string
	Path            string
}

type ArtifactsConfig struct {
	Port            string
	Spec            []artifactFileSpec
	TempDir         string
	TemplateHTML    *template.Template
	PathToOCLicense string
}

const templateStringHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    {{ if .Heading }} <h1>{{ .Heading }}</h1> {{ end }}
	{{ if .SubdirectoriesPathToRoot }}<p>Directory listings are disabled. See <a href="/private/{{ .SubdirectoriesPathToRoot }}">here</a> for available content.</p> {{ end }}
	{{ if .Items }}
	<ul>
		{{ range .Items }}
            {{ if eq .Type "link" }}
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
func loadArtifacts(path string) ([]artifactFileSpec, error) {
	specs := []artifactFileSpec{}
	// open the JSON spec config file
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	// convert to artifactFileSpec
	decoder := json.NewDecoder(file)
	err = decoder.Decode(&specs)
	if err != nil {
		return nil, err
	}

	// check if the specs are empty
	if len(specs) == 0 {
		return nil, fmt.Errorf("no artifacts to serve")
	}

	return specs, nil
}

func NewArtifactsConfig(port string, specsFilePath string) (*ArtifactsConfig, error) {
	tempDir, err := os.MkdirTemp("", "artifacts")
	if err != nil {
		return nil, err
	}

	specs, err := loadArtifacts(specsFilePath)
	if err != nil {
		return nil, err
	}

	templateHTML, err := template.New("artifacts").Parse(templateStringHTML)
	if err != nil {
		return nil, err
	}

	artifactsConfig := ArtifactsConfig{
		Port:         port,
		Spec:         specs,
		TempDir:      tempDir,
		TemplateHTML: templateHTML,
	}
	err = artifactsConfig.setupArtifactsDirectory()
	if err != nil {
		return nil, err
	}
	artifactsConfig.PathToOCLicense = "/usr/share/openshift/LICENSE"
	klog.Infof("Artifacts server configuration initialized, serving from %s", tempDir)

	return &artifactsConfig, nil
}

// credits to https://www.arthurkoziel.com/writing-tar-gz-files-in-go/
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

func createArchives(pathToTargetFile string) error {
	// create archives in the same directory as the target file
	tarFile, err := os.Create(pathToTargetFile + ".tar")
	if err != nil {
		return err
	}
	defer tarFile.Close()
	zipFile, err := os.Create(pathToTargetFile + ".zip")
	if err != nil {
		return err
	}
	defer zipFile.Close()

	zw := zip.NewWriter(zipFile)
	defer zw.Close()
	tw := tar.NewWriter(tarFile)
	defer tw.Close()
	addFileToTar(tw, pathToTargetFile)
	addFileToZip(zw, pathToTargetFile)

	return nil
}

func (artifactsConfig *ArtifactsConfig) createHTMLFile(path string, data HtmlPageData) error {
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

func (artifactsConfig *ArtifactsConfig) generateDirFileContents(tempDir string) ([]ListItemLink, error) {
	content := []ListItemLink{
		{
			Type: "license",
			URL:  "oc-license",
		},
	}

	// create subdirectories for the artifacts
	for _, spec := range artifactsConfig.Spec {
		basename := filepath.Base(spec.Path)
		artifactPath := filepath.Join(artifactsConfig.TempDir, spec.Arch, spec.OperatingSystem, basename)
		archDir := filepath.Join(artifactsConfig.TempDir, spec.Arch)
		osDir := filepath.Join(artifactsConfig.TempDir, spec.Arch, spec.OperatingSystem)

		// create subdirectory for the architecture
		err := createDir(archDir)
		if err != nil {
			return nil, err
		}
		err = artifactsConfig.createHTMLFile(
			filepath.Join(archDir, "index.html"),
			HtmlPageData{
				Heading:                  "",
				SubdirectoriesPathToRoot: tempDir,
				Items:                    []ListItemLink{},
			},
		)
		if err != nil {
			return nil, err
		}

		// create subdirectory for the operating system
		err = createDir(osDir)
		if err != nil {
			return nil, err
		}
		err = artifactsConfig.createHTMLFile(
			filepath.Join(osDir, "index.html"),
			HtmlPageData{
				Heading:                  "",
				SubdirectoriesPathToRoot: tempDir,
				Items:                    []ListItemLink{},
			},
		)
		if err != nil {
			return nil, err
		}

		err = os.Symlink(spec.Path, artifactPath)
		if err != nil {
			return nil, err
		}

		err = createArchives(artifactPath)
		if err != nil {
			return nil, err
		}

		// append new entry in the list of links to artifacts
		content = append(content, ListItemLink{
			Type:   "link",
			URL:    artifactPath,
			Name:   fmt.Sprintf("%s %s", spec.Arch, spec.OperatingSystem),
			TarURL: fmt.Sprintf("%s.tar", artifactPath),
			ZipURL: fmt.Sprintf("%s.zip", artifactPath),
		})
	}

	return content, nil
}

func (artifactsConfig *ArtifactsConfig) setupArtifactsDirectory() error {
	// symlink file in the temporary directory that points to the openshift license
	os.Symlink(artifactsConfig.PathToOCLicense, filepath.Join(artifactsConfig.TempDir, "oc-license"))

	// generates content of the root html file and creates directories, files and archives for artifacts
	content, err := artifactsConfig.generateDirFileContents(artifactsConfig.TempDir)
	if err != nil {
		return err
	}

	// create the root html file
	err = artifactsConfig.createHTMLFile(filepath.Join(artifactsConfig.TempDir, "index.html"), HtmlPageData{
		Heading:                  "",
		SubdirectoriesPathToRoot: "",
		Items:                    content,
	})
	if err != nil {
		return err
	}

	return nil
}
