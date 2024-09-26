package main

import (
	"flag"
	"fmt"

	"net/http"
	"os"

	"github.com/openshift/console/cmd/downloads/config"
	klog "k8s.io/klog/v2"
)

func main() {
	fs := flag.NewFlagSet("downloads", flag.ExitOnError)
	klog.InitFlags(fs)
	defer klog.Flush()

	fPort := fs.Int("port", 8081, "Port number used to start the downloads server.")
	fPathToArtifactsFileConfig := fs.String("config-path", "/opt/downloads/defaultArtifactsConfig.yaml", "Path to the configuration file of available 'oc' artifacts.")

	if err := fs.Parse(os.Args[1:]); err != nil {
		klog.Fatalf("Failed to parse flags: %v", err)
		os.Exit(1)
	}
	downloadsServerConfig, err := config.NewDownloadsServerConfig(*fPort, *fPathToArtifactsFileConfig)
	if err != nil {
		klog.Fatalf("Failed to configure downloads server config: %v", err)
		os.Exit(1)
	}
	defer os.RemoveAll(downloadsServerConfig.TempDir)

	// Listen for incoming connections
	klog.Infof("Server started. Listening on http://0.0.0.0:%s", downloadsServerConfig.Port)

	// Serve the files and listen for incoming connections
	downlsrv := &http.Server{
		Addr:    fmt.Sprintf("0.0.0.0:%s", downloadsServerConfig.Port),
		Handler: http.FileServer(http.Dir(downloadsServerConfig.TempDir)),
	}
	klog.Fatal(downlsrv.ListenAndServe())

}
