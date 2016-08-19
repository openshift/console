package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/Sirupsen/logrus"
	"github.com/spf13/cobra"
	clientset "k8s.io/kubernetes/pkg/client/clientset_generated/release_1_3"

	"github.com/coreos-inc/tectonic/wiz/server"
	"github.com/coreos-inc/tectonic/wiz/util"
)

var (
	logger *logrus.Entry

	prefix = "WIZ_"

	rootFlags struct {
		logLevel string
	}

	rootCmd = &cobra.Command{
		Use:   "wiz",
		Short: "",
		Long:  `wiz takes the pain away from installing Tectonic.`,
	}

	startFlags struct {
		reloadTemplates       bool
		address               string
		port                  int
		publicDir             string
		manifestFile          string
		target                string
		k8sOffClusterHost     string
		k8sOffClusterCredsDir string
	}

	startCmd = &cobra.Command{
		Use:   "start",
		Short: "starts the wiz server.",
		Run:   startServer,
	}

	version = "(This version was not built propertly)"
)

func startServer(cmd *cobra.Command, args []string) {
	var err error
	var cset *clientset.Clientset
	var writer server.Writer
	var statusChecker server.StatusChecker
	switch startFlags.target {
	case "k8s-off-cluster":
		if startFlags.k8sOffClusterHost == "" {
			fmt.Println("--k8s-off-cluster-host is required when --target=k8s-off-cluster")
			os.Exit(1)
		}
		if startFlags.k8sOffClusterCredsDir == "" {
			fmt.Println("--k8s-off-cluster-creds-dir is required when --target=k8s-off-cluster")
			os.Exit(1)
		}

		cset, err = server.NewK8sOffClusterClientset(startFlags.k8sOffClusterHost, startFlags.k8sOffClusterCredsDir, logger)
		if err != nil {
			panic(err)
		}

		writer, err = server.NewK8sWriter(logger, cset)
		if err != nil {
			panic(err)
		}

		statusChecker, err = server.NewK8sStatusChecker(logger, cset)
		if err != nil {
			panic(err)
		}
	case "k8s-in-cluster":
		cset, err = server.NewK8sInClusterClientset(logger)
		if err != nil {
			panic(err)
		}

		writer, err = server.NewK8sWriter(logger, cset)
		if err != nil {
			panic(err)
		}

		statusChecker, err = server.NewK8sStatusChecker(logger, cset)
		if err != nil {
			panic(err)
		}
	case "file":
		writer = server.NewFileWriter(logger)
		statusChecker = server.NewNoopStatusChecker(logger)
	default:
		writer = server.NewFileWriter(logger)
		statusChecker = server.NewNoopStatusChecker(logger)
	}

	whs := []server.WizHandler{server.NewTectonicHandler(writer, statusChecker, logger)}
	srv, err := server.New(logger, startFlags.publicDir, startFlags.manifestFile, whs)
	if err != nil {
		panic(err)
	}
	if startFlags.reloadTemplates {
		go util.DoFuncOnDirChange(startFlags.publicDir, logger, srv.LoadTemplates)
	}

	httpsrv := &http.Server{
		Addr:    fmt.Sprintf("%s:%d", startFlags.address, startFlags.port),
		Handler: srv.HTTPHandler(),
	}
	logger.Infof("Binding to %s...", httpsrv.Addr)
	logger.Fatal(httpsrv.ListenAndServe())
}

func init() {
	startCmd.Flags().StringVar(&startFlags.address, "address",
		"0.0.0.0", "IP address to bind to")

	startCmd.Flags().IntVar(&startFlags.port, "port", 4445,
		"The port wiz will listen on for incoming connections")

	startCmd.Flags().StringVar(&startFlags.publicDir, "public-dir",
		"./web", "directory containing static web assets")

	startCmd.Flags().StringVar(&startFlags.manifestFile, "manifest-file",
		"tectonic.json", "filename of manifest json to drive the wizard, must exist in ./manifest/")

	startCmd.Flags().BoolVar(&startFlags.reloadTemplates, "reload-templates",
		false, "reloads templates when a file has changed. FOR DEV ONLY - NOT AT ALL THREAD SAFE.")

	startCmd.Flags().StringVar(&startFlags.target, "target",
		"file", "target to write output. valid options are 'file', 'k8s-in-cluster', and 'k8s-off-cluster'.")

	startCmd.Flags().StringVar(&startFlags.k8sOffClusterHost, "k8s-off-cluster-host",
		"", "API server hostname. Required and only valid if '--target=k8s-off-cluser'")

	startCmd.Flags().StringVar(&startFlags.k8sOffClusterCredsDir, "k8s-off-cluster-creds-dir",
		"", "location of client cert credentials to use when connecting to kubernetes. Required and only valid if '--target=k8s-off-cluser'")

	rootCmd.PersistentFlags().StringVar(&rootFlags.logLevel, "log-level", logrus.InfoLevel.String(), "level of logging information by package (pkg=level)")

	versionCmd := &cobra.Command{
		Use:   "version",
		Short: fmt.Sprintf("Displays version information (version is %s)", version),
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Printf("Version: %s\n", version)
		},
	}

	rootCmd.AddCommand(versionCmd, startCmd)
}

func configureLogger() {
	logrus.SetFormatter(&logrus.TextFormatter{})
	logger = logrus.WithFields(logrus.Fields{
		"app": "wiz",
	})
	llc, err := logrus.ParseLevel(rootFlags.logLevel)
	if err != nil {
		logger.Fatal(err)
	}
	logrus.SetLevel(llc)
	logger.Printf("setting log level to %s", rootFlags.logLevel)
}

func main() {
	configureLogger()
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(-1)
	}
}
