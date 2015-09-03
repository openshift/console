package main

import (
	"crypto/tls"
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
	kclient "k8s.io/kubernetes/pkg/client/unversioned"

	"github.com/coreos-inc/bridge/auth"
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
	k8sInCluster := fs.Bool("k8s-in-cluster", false, "Configure --k8s-endpoint and --k8s-bearer-token from environment, typically used when deploying as a Kubernetes pod")
	fs.String("k8s-endpoint", "https://172.17.4.101:29101", "URL of the Kubernetes API server, ignored when --k8s-in-cluster=true")
	k8sBearerToken := fs.String("k8s-bearer-token", "", "Authorization token to send with proxied Kubernetes API requests. This should only be used when --disable-auth=true, as any OIDC-related authorization information will be blindly overridden. This flag is ignored with --k8s-in-cluster=true")
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

	k8sURL := validateURLFlag(fs, "k8s-endpoint")
	kCfg := &server.K8sConfig{
		TLSClientConfig:          &tls.Config{InsecureSkipVerify: true},
		APIService:               *k8sAPIService,
		ControllerManagerService: *k8sControllerManagerService,
		SchedulerService:         *k8sSchedulerService,
	}

	if *k8sInCluster {
		cc, err := kclient.InClusterConfig()
		if err != nil {
			log.Fatalf("Error inferring Kubernetes config from environment: %v", err)
		}
		kCfg.Endpoint, err = url.Parse(cc.Host)
		if err != nil {
			log.Fatalf("Kubernetes config provided invalid URL: %v", err)
		}
		kCfg.BearerToken = cc.BearerToken
	} else {
		kCfg.Endpoint = k8sURL
		kCfg.BearerToken = *k8sBearerToken
	}

	srv := &server.Server{
		K8sConfig: kCfg,
		PublicDir: *publicDir,
		Templates: tpls,
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
