package downloads

import (
	"archive/tar"
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"text/template"
)

//TODO remove print statements

// HtmlPageData holds the data we want to pass to the template
type HtmlPageData struct {
	Heading                  string
	SubdirectoriesPathToRoot string
	Items                    []string
}

// specification of the artifacts to be served
type artifactFileSpec struct {
	arch            string
	operatingSystem string
	path            string
}

type ArtifactsConfig struct {
	Port         string
	Spec         []artifactFileSpec
	TempDir      string
	TemplateHTML *template.Template
}

var specs = []artifactFileSpec{
	{
		arch:            "amd64",
		operatingSystem: "linux",
		path:            "/usr/share/openshift/linux_amd64/oc",
	},
	{
		arch:            "amd64",
		operatingSystem: "mac",
		path:            "/usr/share/openshift/mac/oc",
	},
	{
		arch:            "amd64",
		operatingSystem: "windows",
		path:            "/usr/share/openshift/windows/oc.exe",
	},
	{
		arch:            "arm64",
		operatingSystem: "linux",
		path:            "/usr/share/openshift/linux_arm64/oc",
	},
	{
		arch:            "arm64",
		operatingSystem: "mac",
		path:            "/usr/share/openshift/mac_arm64/oc",
	},
	{
		arch:            "ppc64le",
		operatingSystem: "linux",
		path:            "/usr/share/openshift/linux_ppc64le/oc",
	},
	{
		arch:            "s390x",
		operatingSystem: "linux",
		path:            "/usr/share/openshift/linux_s390x/oc",
	},
}

var templateStringHTML = `<!DOCTYPE html>
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
			<li>{{ . }}</li>
		{{ end }}
	</ul>
	{{ end }}
</body>
</html>`

func NewArtifactsConfig(port uint) (*ArtifactsConfig, error) {
	tempDir, err := os.MkdirTemp("", "artifacts")
	if err != nil {
		return nil, err
	}

	fmt.Println("Serving from ", tempDir)

	templateHTML, err := template.New("artifacts").Parse(templateStringHTML)
	if err != nil {
		return nil, err
	}

	artifactsConfig := ArtifactsConfig{
		Port:         fmt.Sprint(port),
		Spec:         specs,
		TempDir:      tempDir,
		TemplateHTML: templateHTML,
	}
	err = artifactsConfig.configureFileStructure()
	if err != nil {
		return nil, err
	}

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

func (artifactsConfig *ArtifactsConfig) generateDirFileContents(tempDir string) ([]string, error) {
	content := []string{"<a href=\"oc-license\">license</a>"}

	// create subdirectories for the artifacts
	for _, spec := range artifactsConfig.Spec {
		basename := filepath.Base(spec.path)
		artifactPath := filepath.Join(artifactsConfig.TempDir, spec.arch, spec.operatingSystem, basename)
		archDir := filepath.Join(artifactsConfig.TempDir, spec.arch)
		osDir := filepath.Join(artifactsConfig.TempDir, spec.arch, spec.operatingSystem)

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
				Items:                    []string{},
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
				Items:                    []string{},
			},
		)
		if err != nil {
			return nil, err
		}

		err = os.Symlink(spec.path, artifactPath)
		if err != nil {
			return nil, err
		}

		err = createArchives(artifactPath)
		if err != nil {
			return nil, err
		}

		content = append(content, fmt.Sprintf("<a href=\"%s\">oc (%s %s)</a> (<a href=\"%s.tar\">tar</a> <a href=\"%s.zip\">zip</a>)",
			artifactPath, spec.arch, spec.operatingSystem, artifactPath, artifactPath))
	}

	return content, nil
}

// TODO improve the naming of the function
func (artifactsConfig *ArtifactsConfig) configureFileStructure() error {
	// symlink file in the temporary directory that points to the openshift license
	os.Symlink("/usr/share/openshift/LICENSE", filepath.Join(artifactsConfig.TempDir, "oc-license"))

	// generates content of the root html file and creates directories, files and archives for artifacts
	content, err := artifactsConfig.generateDirFileContents(artifactsConfig.TempDir)
	if err != nil {
		return err
	}

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
