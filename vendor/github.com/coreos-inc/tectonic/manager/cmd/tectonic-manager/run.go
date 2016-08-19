package main

import (
	"net/http"
	"net/http/pprof"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/coreos/pkg/health"
	"github.com/spf13/cobra"

	"github.com/coreos-inc/tectonic/manager/pkg/version"
)

// runCmd represents the run command
var (
	runCmd = &cobra.Command{
		Use:   "run",
		Short: "install components in the cluster and continue running",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runRun()
		},
		SilenceUsage: true,
	}
)

func init() {
	RootCmd.AddCommand(runCmd)
}

func runRun() error {
	logger.Printf("starting %s version %s with config %+v", binaryName, version.Version, cfg)

	cmdfactory, schema, err := newKubeCmdFactorySchema()
	if err != nil {
		return err
	}
	clientset, err := newKubeClientSet()
	if err != nil {
		return err
	}
	namespace, _, err := kconfig.Namespace()
	if err != nil {
		return err
	}

	configMaps := []string{"tectonic-config"}
	secrets := []string{
		"tectonic-license",
		"tectonic-ca-cert-secret",
		"tectonic-console-tls-secret",
		"tectonic-identity-tls-secret",
		"tectonic-identity-config-secret",
		"coreos-pull-secret",
	}

	resyncPeriod := time.Minute / 2
	tc, err := NewTectonicController(clientset, cmdfactory, schema, namespace, resyncPeriod, secrets, configMaps)
	if err != nil {
		return err
	}

	go registerHandlers(tc)
	go handleSigterm(tc)

	tc.Run()

	return nil
}

func registerHandlers(tc *TectonicController) {
	mux := http.NewServeMux()
	checker := health.Checker{
		// Nothing to check yet
		Checks: nil,
	}

	mux.Handle("/tectonic-deployment/status", tc.componentHealthWatcher)
	mux.Handle("/health", checker)

	http.HandleFunc("/stop", func(w http.ResponseWriter, r *http.Request) {
		tc.Stop()
	})

	if cfg.EnableProfiling {
		mux.HandleFunc("/debug/pprof/", pprof.Index)
		mux.HandleFunc("/debug/pprof/profile", pprof.Profile)
		mux.HandleFunc("/debug/pprof/symbol", pprof.Symbol)
	}

	server := &http.Server{
		Addr:    cfg.ListenAddr,
		Handler: mux,
	}
	logger.Fatalln(server.ListenAndServe())
}

func handleSigterm(tc *TectonicController) {
	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, syscall.SIGTERM)
	<-signalChan
	logger.Printf("Received SIGTERM, shutting down")

	exitCode := 0
	if err := tc.Stop(); err != nil {
		logger.Printf("Error during shutdown %v", err)
		exitCode = 1
	}

	logger.Printf("Exiting with %v", exitCode)
	os.Exit(exitCode)
}
