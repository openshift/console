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
	fPort := flag.Int("port", 8081, "Port number used to start the downloads server.")
	fPathToArtifactsFileConfig := flag.String("config-path", "/opt/downloads/artifactsFileSpec.yaml", "Path to the configuration file of available 'oc' artifacts.")

	// run artifacts server
	flag.Parse()
	artifactsConfig, err := config.NewArtifactsConfig(*fPort, *fPathToArtifactsFileConfig)
	if err != nil {
		klog.Fatalf("Failed to configure artifacts: %v", err)
		os.Exit(1)
	}
	defer os.RemoveAll(artifactsConfig.TempDir)

	// Listen for incoming connections
	klog.Infof("Server started. Listening on port:%s", artifactsConfig.Port)

	// Serve the files and listen for incoming connections
	downlsrv := &http.Server{
		Addr:    fmt.Sprintf("0.0.0.0:%s", artifactsConfig.Port),
		Handler: http.FileServer(http.Dir(artifactsConfig.TempDir)),
	}
	klog.Fatal(downlsrv.ListenAndServe())

}
