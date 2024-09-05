package main

import (
	"archive/tar"
	"compress/gzip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

type artifactFileSpec struct {
	arch            string
	operatingSystem string
	path            string
}

// credits to https://www.arthurkoziel.com/writing-tar-gz-files-in-go/
func addFileToArchive(tw *tar.Writer, filename string) error {
	// Open the file which will be written into the archive
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

	// Use full path as name (FileInfoHeader only takes the basename)
	// https://golang.org/src/archive/tar/common.go?#L639
	header.Name = filename

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

func createArchive(tarName string, path string) error {
	tarFile, err := os.Create(tarName)
	if err != nil {
		return err
	}
	defer tarFile.Close()

	gw := gzip.NewWriter(tarFile)
	defer gw.Close()
	tw := tar.NewWriter(tarFile)
	defer tw.Close()

	return addFileToArchive(tw, path)
}

func createHTMLFile(path string, message string) error {
	content := strings.Join([]string{
		"<!doctype html>",
		"<html lang=\"en\">",
		"<head>",
		"  <meta charset=\"utf-8\">",
		"</head>",
		"<body>",
		"  " + message,
		"</body>",
		"</html>",
		"",
	}, "\n")
	return os.WriteFile(path, []byte(content), 0644)
}

func start() error {
	f, err := os.CreateTemp("", "example")
	if err != nil {
		return err
	}
	fmt.Println("Temp file name:", f.Name())
	defer os.Remove(f.Name())

	tempDir, err := os.MkdirTemp("", "sampledir")
	if err != nil {
		return err
	}
	defer os.RemoveAll(tempDir)
	fmt.Println("serving from ", tempDir)
	os.Chdir(tempDir)
	fname := filepath.Join(tempDir, "file1")
	err = os.WriteFile(fname, []byte("Hello, Gophers!"), 0666)
	if err != nil {
		return err
	}
	architectures := []string{"amd64", "arm64", "ppc64le", "s390x"}
	for _, arch := range architectures {
		err = os.Mkdir(arch, 0755)
		if err != nil {
			return err
		}
	}

	content := []string{"<a href=\"oc-license\">license</a>"}

	// symlink file in the temporary directory that points to the openshift license
	os.Symlink("/usr/share/openshift/LICENSE", "oc-license")

	specs := []artifactFileSpec{
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

	for _, spec := range specs {
		basename := filepath.Base(spec.path)
		targetPath := filepath.Join(spec.arch, spec.operatingSystem, basename)
		dirPath := filepath.Join(spec.arch, spec.operatingSystem)
		os.Mkdir(dirPath, 0755)
		os.Symlink(spec.path, targetPath)
		//extension := filepath.Ext(spec.path)
		//baseRoot := basename[:len(basename)-len(extension)]
		archivePathRoot := filepath.Join(spec.arch, spec.operatingSystem, basename)

		//fmt.Printf("path: %s\n", spec.path)
		//fmt.Printf("target: %s\n", targetPath)
		//fmt.Printf("dir: %s\n", dirPath)
		//fmt.Printf("Base name without extension (baseRoot): %s\n", baseRoot)
		//fmt.Printf("Extension: %s\n\n", extension)
		//fmt.Printf("Archive path root: %s\n", archivePathRoot)
		createArchive(archivePathRoot+".tar", targetPath)
		content = append(content, fmt.Sprintf("<a href=\"%s\">oc (%s %s)</a> (<a href=\"%s.tar\">tar</a> <a href=\"%s.zip\">zip</a>)",
			targetPath, spec.arch, spec.operatingSystem, archivePathRoot, archivePathRoot))
	}
	fmt.Println(content)

	// Walk the temporary directory and create index files for each directory
	err = filepath.Walk(tempDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			// Get the relative path from tempDir to the current directory
			joinedChilds := filepath.Join(path, "child")

			relPath, err := filepath.Rel(tempDir, joinedChilds)
			if err != nil {
				return err
			}

			// Replace path separators with '/'
			rootLink := strings.Replace(relPath, string(filepath.Separator), "/", -1)

			// Write index for the current directory
			createHTMLFile(
				filepath.Join(path, "index.html"),
				fmt.Sprintf("<p>Directory listings are disabled. See <a href=\"%s\">here</a> for available content.</p>", rootLink),
			)
		}

		return nil
	})
	if err != nil {
		fmt.Println("Error walking the path : ", err)
	}

	// construct the list of links
	message := "<ul>\n"
	for _, entry := range content {
		message += (fmt.Sprintf("  <li>%s</li>\n", entry))
	}
	message += "</ul>\n"

	// Write the index file
	err = createHTMLFile(filepath.Join(tempDir, "index.html"), message)
	if err != nil {
		fmt.Println("Error writing index file: ", err)
	}

	// Serve files from the temporary directory
	//http.Handle("/", http.FileServer(http.Dir(tempDir)))

	// Define the port to listen on
	//port := ":8081"

	// Listen for incoming connections
	//fmt.Println("Server started. Listening on port", port)
	//if err := http.ListenAndServe(port, nil); err != nil {
	//	fmt.Println("ListenAndServe: ", err)
	//}
	//const PORT = 8080
	//http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {fmt.Fprintf(w, "This is simple http request handler")})
	//http.ListenAndServe(fmt.Sprintf(":%d", PORT), nil)
	return nil
}

func main() {
	err := start()
	if err != nil {
		fmt.Println("Error starting the server: ", err)
	}
}
