package main

import (
	"flag"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path"

	pflag "github.com/coreos/pkg/flag"
	"github.com/coreos/pkg/log"

	"github.com/coreos-inc/bridge/etcd"
	"github.com/coreos-inc/bridge/fleet"
	"github.com/coreos-inc/bridge/proxy"
	"github.com/coreos-inc/bridge/server"
)

func main() {
	fs := flag.NewFlagSet("bridge", flag.ExitOnError)
	listen := fs.String("listen", "http://0.0.0.0:9000", "")
	logDebug := fs.Bool("log-debug", false, "log debug-level information")
	logTimestamps := fs.Bool("log-timestamps", false, "prefix log lines with timestamps")
	publicDir := fs.String("public-dir", "./frontend/public", "directory containing static web assets")
	k8sEndpoint := fs.String("k8s-endpoint", "http://172.17.8.101:8080", "URL of the Kubernetes API server")
	k8sAPIVersion := fs.String("k8s-api-version", "v1beta2", "version of Kubernetes API to use")
	etcdEndpoints := fs.String("etcd-endpoints", "http://localhost:7001", "comma separated list of etcd endpoints")
	fleetEndpoint := fs.String("fleet-endpoint", "unix://var/run/fleet.sock", "fleet API endpoint")

	if err := fs.Parse(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		os.Exit(1)
	}

	if err := pflag.SetFlagsFromEnv(fs, "BRIDGE"); err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		os.Exit(1)
	}

	if *logDebug {
		log.EnableDebug()
	}

	if *logTimestamps {
		log.EnableTimestamps()
	}

	if _, err := os.Stat(path.Join(*publicDir, "index.html")); err != nil {
		fmt.Println("index.html not found in configured public-dir path")
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

	k8sproxy, err := proxy.NewK8sProxy(*k8sEndpoint, *k8sAPIVersion, "api/bridge/v1")
	if err != nil {
		log.Fatalf("Error initializing k8s proxy: %v", err)
	}

	srv := &server.Server{
		FleetClient: fleetClient,
		EtcdClient:  etcdClient,
		K8sProxy:    k8sproxy,
		PublicDir:   *publicDir,
	}

	httpsrv := &http.Server{
		Addr:    lu.Host,
		Handler: srv.HTTPHandler(),
	}

	log.Infof("Binding to %s...", httpsrv.Addr)
	log.Fatal(httpsrv.ListenAndServe())
}
