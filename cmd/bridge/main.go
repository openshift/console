package main

import (
	"flag"
	"fmt"
	"html/template"
	"net/http"
	"net/url"
	"os"
	"path"

	"github.com/coreos/go-oidc/oidc"
	"github.com/coreos/pkg/capnslog"
	"github.com/coreos/pkg/flagutil"

	"github.com/coreos-inc/bridge/auth"
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
	fs.String("listen", "http://0.0.0.0:9000", "")
	logLevel := fs.String("log-level", "", "level of logging information by package (pkg=level)")
	publicDir := fs.String("public-dir", "./frontend/public", "directory containing static web assets")
	etcdEndpoints := fs.String("etcd-endpoints", "http://localhost:4001", "comma separated list of etcd endpoints")
	fleetEndpoint := fs.String("fleet-endpoint", "unix://var/run/fleet.sock", "fleet API endpoint")
	fs.String("k8s-endpoint", "https://172.17.4.101:29101", "URL of the Kubernetes API server")
	k8sAPIService := fs.String("k8s-api-service", "", "fleet service name to inspect for api server status")
	k8sControllerManagerService := fs.String("k8s-controller-manager-service", "", "fleet service name to inspect for controller manager status")
	k8sSchedulerService := fs.String("k8s-scheduler-service", "", "fleet service name to inspect for scheduler status")
	fs.String("host", "http://127.0.0.1:9000", "The externally visible hostname/port of the service. Used in OIDC/OAuth2 Redirect URL.")
	disableAuth := fs.Bool("disable-auth", false, "Disable all forms of authentication.")
	authClientID := fs.String("auth-client-id", "", "The OIDC OAuth2 Client ID.")
	authClientSecret := fs.String("auth-client-secret", "", "The OIDC/OAuth2 Client Secret.")
	fs.String("auth-issuer-url", "", "The OIDC/OAuth2 issuer URL")

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

	tpl := template.New(server.IndexPageTemplateName)
	tpl.Delims("[[", "]]")
	tpls, err := tpl.ParseFiles(path.Join(*publicDir, server.IndexPageTemplateName))
	if err != nil {
		fmt.Printf("index.html not found in configured public-dir path: %v", err)
		os.Exit(1)
	}

	lu := validateURLFlag(fs, "listen")
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

	k8sURL := validateURLFlag(fs, "k8s-endpoint")
	kCfg := &server.K8sConfig{
		Endpoint:                 k8sURL,
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

	if *disableAuth {
		log.Warningf("running with AUTHENTICATION DISABLED!")
	} else {
		validateFlagNotEmpty(fs, "auth-client-id")
		validateFlagNotEmpty(fs, "auth-client-secret")
		iURL := validateURLFlag(fs, "auth-issuer-url")
		rURL := validateURLFlag(fs, "host")
		rURL.Path = server.AuthCallbackEndpoint

		ocfg := oidc.ClientConfig{
			Credentials: oidc.ClientCredentials{
				ID:     *authClientID,
				Secret: *authClientSecret,
			},
			RedirectURL: rURL.String(),
		}

		auther, err := auth.NewAuthenticator(ocfg, iURL, server.AuthErrorURL, server.AuthSuccessURL)
		if err != nil {
			log.Fatalf("Error initializing authenticator: %v", err)
		}

		srv.Auther = auther
	}

	httpsrv := &http.Server{
		Addr:    lu.Host,
		Handler: srv.HTTPHandler(),
	}

	log.Infof("Binding to %s...", httpsrv.Addr)
	log.Fatal(httpsrv.ListenAndServe())
}

func validateURLFlag(fs *flag.FlagSet, name string) *url.URL {
	validateFlagNotEmpty(fs, name)
	flag := fs.Lookup(name)
	ur, err := url.Parse(flag.Value.String())
	if err != nil {
		log.Fatalf("Invalid flag: %s, error: %v", flag.Name, err)
	}
	if ur == nil || ur.String() == "" {
		log.Fatalf("Missing required flag: %s", flag.Name)
	}
	if ur.Scheme == "" || ur.Host == "" {
		log.Fatalf("Invalid flag: %s, error: malformed URL", flag.Name)
	}
	return ur
}

func validateFlagNotEmpty(fs *flag.FlagSet, name string) {
	flag := fs.Lookup(name)
	if flag.Value.String() == "" {
		log.Fatalf("Missing required flag: %s", flag.Name)
	}
}
