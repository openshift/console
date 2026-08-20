package main

import (
	_ "embed"
	"flag"
	"fmt"
	"net/http"
	"os"
	"strconv"

	"k8s.io/klog/v2"

	"github.com/openshift/console/cmd/downloads/config"
)

//go:embed config/defaultArtifactsConfig.yaml
var downloadConfigBytes []byte

func main() {
	fs := flag.NewFlagSet("downloads", flag.ExitOnError)
	klog.InitFlags(fs)
	defer klog.Flush()

	var portArg int

	fs.IntVar(&portArg, "port", 8080, "Port number used to start the downloads server.")
	// leave it here for backward compatible
	_ = fs.String("config-path", "", "this flag is deprecated and ignored")

	if err := fs.Parse(os.Args[1:]); err != nil {
		klog.Fatalf("Failed to parse flags: %v", err)
		os.Exit(1)
	}
	port := strconv.Itoa(portArg)

	downloadsServerConfig, err := config.NewDownloadsServerConfig(downloadConfigBytes)
	if err != nil {
		klog.Fatalf("Failed to configure downloads server config: %v", err)
		os.Exit(1)
	}
	downloadsServerConfig.CreateArchivesInBackground()

	// Listen for incoming connections
	klog.Infof("Server started. Listening on http://0.0.0.0:%s", port)

	// Serve the files and listen for incoming connections
	downlsrv := &http.Server{
		Addr:    fmt.Sprintf("0.0.0.0:%s", port),
		Handler: downloadsServerConfig.Handler(),
	}
	klog.Fatal(downlsrv.ListenAndServe())
}
