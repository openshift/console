package main

import (
	"flag"
	"fmt"
	"html/template"
	"net/http"
	"net/url"
	"os"
	"path"

	"github.com/coreos/pkg/capnslog"
	"github.com/coreos/pkg/flagutil"

	"github.com/coreos-inc/bridge/etcd"
	"github.com/coreos-inc/bridge/fleet"
	"github.com/coreos-inc/bridge/server"
)

var (
	log = capnslog.NewPackageLogger("github.com/coreos-inc/bridge", "cmd/main")
)

func main() {
	rl := capnslog.MustRepoLogger("github.com/coreos-inc/bridge")
	capnslog.SetFormatter(capnslog.NewStringFormatter(os.Stderr))

	fs := flag.NewFlagSet("bridge", flag.ExitOnError)
	listen := fs.String("listen", "http://0.0.0.0:9000", "")
	logLevel := fs.String("log-level", "", "level of logging information by package (pkg=level)")
	publicDir := fs.String("public-dir", "./frontend/public", "directory containing static web assets")
	etcdEndpoints := fs.String("etcd-endpoints", "http://localhost:4001", "comma separated list of etcd endpoints")
	fleetEndpoint := fs.String("fleet-endpoint", "unix://var/run/fleet.sock", "fleet API endpoint")
	k8sEndpoint := fs.String("k8s-endpoint", "https://172.17.8.101:29101", "URL of the Kubernetes API server")
	k8sAPIVersion := fs.String("k8s-api-version", "v1beta3", "version of Kubernetes API to use")
	k8sAPIService := fs.String("k8s-api-service", "", "fleet service name to inspect for api server status")
	k8sControllerManagerService := fs.String("k8s-controller-manager-service", "", "fleet service name to inspect for controller manager status")
	k8sSchedulerService := fs.String("k8s-scheduler-service", "", "fleet service name to inspect for scheduler status")

	if err := fs.Parse(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		os.Exit(1)
	}

	if err := flagutil.SetFlagsFromEnv(fs, "BRIDGE"); err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		os.Exit(1)
	}

	capnslog.SetGlobalLogLevel(capnslog.INFO)
	if *logLevel != "" {
		llc, err := rl.ParseLogLevelConfig(*logLevel)
		if err != nil {
			log.Fatal(err)
		}
		rl.SetLogLevel(llc)
		log.Infof("Setting log level to %s", *logLevel)
	}

	tpls, err := template.ParseFiles(path.Join(*publicDir, server.IndexPageTemplateName))
	if err != nil {
		fmt.Printf("index.html not found in configured public-dir path: %v", err)
		os.Exit(1)
	}

	lu, err := url.Parse(*listen)
	if err != nil {
		log.Fatalf("Unable to use --listen flag: %v", err)
	}

	if lu.Scheme != "http" {
		log.Fatalf("Unable to listen using scheme: %s", lu.Scheme)
	}

	fleetClient, err := fleet.NewClient(*fleetEndpoint)
	if err != nil {
		log.Fatalf("Error initializing fleet client: %v", err)
	}

	etcdClient, err := etcd.NewClient(*etcdEndpoints)
	if err != nil {
		log.Fatalf("Error initializing etcd client: %v", err)
	}

	k8sURL, err := url.Parse(*k8sEndpoint)
	if err != nil {
		log.Fatalf("Unable to use k8s-endpoint flag: %v", err)
	}

	if k8sURL == nil || k8sURL.String() == "" {
		log.Fatal("Missing required flag: --k8s-endpoint")
	}

	if *k8sAPIVersion == "" {
		log.Fatal("Missing required flag: --k8s-api-version")
	}

	kCfg := &server.K8sConfig{
		Endpoint:                 k8sURL,
		APIVersion:               *k8sAPIVersion,
		APIService:               *k8sAPIService,
		ControllerManagerService: *k8sControllerManagerService,
		SchedulerService:         *k8sSchedulerService,
	}

	srv := &server.Server{
		FleetClient: fleetClient,
		EtcdClient:  etcdClient,
		K8sConfig:   kCfg,
		PublicDir:   *publicDir,
		Templates:   tpls,
	}

	httpsrv := &http.Server{
		Addr:    lu.Host,
		Handler: srv.HTTPHandler(),
	}

	log.Infof("Binding to %s...", httpsrv.Addr)
	log.Fatal(httpsrv.ListenAndServe())
}
