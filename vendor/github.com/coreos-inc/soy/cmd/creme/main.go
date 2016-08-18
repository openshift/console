package main

import (
	"flag"
	"fmt"
	htmltmpl "html/template"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"path"

	"github.com/Sirupsen/logrus"
	"github.com/coreos/pkg/flagutil"
	"google.golang.org/grpc"
	"google.golang.org/grpc/grpclog"

	"github.com/coreos-inc/soy/creme/server"
)

var (
	log = logrus.WithFields(logrus.Fields{"app": "creme"})
)

func main() {
	fs := flag.NewFlagSet("creme", flag.ExitOnError)
	listen := fs.String("listen", "http://0.0.0.0:9003", "")
	logLevel := fs.String("log-level", "", "level of logging information by package (pkg=level)")
	publicDir := fs.String("public-dir", "./creme/web/public/dist", "directory containing static web assets")
	rpcEndpoint := fs.String("rpc-endpoint", "127.0.0.1:8181", "IP/Port of the RCP server")
	healthEndpoint := fs.String("health-endpoint", "http://127.0.0.1:8182", "URL of the RPC server's HTTP health endpoint")
	authClientID := fs.String("auth-client-id", "", "The OIDC OAuth2 Client ID.")
	authClientSecret := fs.String("auth-client-secret", "", "The OIDC/OAuth2 Client Secret.")
	authIssuerURL := fs.String("auth-issuer-url", "", "The OIDC/OAuth2 issuer URL")
	stripePublishableKey := fs.String("stripe-publishable-key", "", "Public Stripe API key to use for Stripe.js")
	//stripePrivateKey := fs.String("stripe-private-key", "", "Private Stripe API key")
	sentryURL := fs.String("sentry-url", "", "if present, use this URL to report errors to getsentry.com")
	host := fs.String("host", "http://127.0.0.1:9003", "The externally visible hostname/port of the service. Used in OIDC/OAuth2 Redirect URL.")
	licensePublicKey := fs.String("license-public-key", "", "Path to the RSA public key in PEM format for verifying licenses")

	if err := fs.Parse(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		os.Exit(1)
	}

	if err := flagutil.SetFlagsFromEnv(fs, "CREME"); err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		os.Exit(1)
	}

	if *logLevel != "" {
		llc, err := logrus.ParseLevel(*logLevel)
		if err != nil {
			log.Fatal(err)
		}
		logrus.SetLevel(llc)
		log.Infof("Setting log level to %s", *logLevel)
	}

	if *licensePublicKey == "" {
		log.Fatal("Must set -license-public-key flag")
	}

	licensePublickKeyContents, err := ioutil.ReadFile(*licensePublicKey)
	if err != nil {
		log.Fatal(err)
	}

	keys := []server.Key{
		server.Key{
			ID:    "tectonic",
			Value: string(licensePublickKeyContents),
		},
	}

	idxTpl := htmltmpl.New("index.html").Delims("{{{", "}}}")
	tpls, err := idxTpl.ParseFiles(path.Join(*publicDir, server.IndexPageTemplateName))
	if err != nil {
		fmt.Printf("index.html not found in configured public-dir path: %v\n", err)
		os.Exit(1)
	}

	lu := validateURL(*listen, "--listen")
	if lu.Scheme != "http" {
		log.Fatalf("Unable to listen using scheme: %s", lu.Scheme)
	}

	iURL := validateURL(*authIssuerURL, "--auth-issuer-url")
	validateFlag(fs, "auth-client-id")
	validateFlag(fs, "auth-client-secret")
	validateFlag(fs, "stripe-publishable-key")
	//validateFlag(fs, "stripe-private-key")
	validateFlag(fs, "rpc-endpoint")

	cURL := validateURL(*healthEndpoint, "--health-endpoint")
	rURL := validateURL(*host, "--auth-redirect-host")
	rURL.Path = server.AuthCallbackEndpoint

	ac := server.AuthConfig{
		ClientID:     *authClientID,
		ClientSecret: *authClientSecret,
		RedirectURL:  rURL,
		IssuerURL:    iURL,
	}

	grpclog.SetLogger(logrus.WithFields(logrus.Fields{"app": "creme", "service": "grpc"}))
	rpcConn, err := grpc.Dial(*rpcEndpoint, grpc.WithInsecure())
	if err != nil {
		panic(err)
	}

	srvCfg := server.Config{
		HealthEndpoint:       cURL,
		PublicDir:            *publicDir,
		Templates:            tpls,
		AuthConfig:           ac,
		StripePublishableKey: *stripePublishableKey,
		SentryURL:            *sentryURL,
		RPCConnection:        rpcConn,
		Host:                 *host,
		LicenseKeys:          keys,
	}

	srv, err := server.NewServer(srvCfg)
	if err != nil {
		panic(err)
	}

	httpsrv := &http.Server{
		Addr:    lu.Host,
		Handler: srv.HTTPHandler(),
	}

	log.Infof("Binding to %s...", httpsrv.Addr)
	log.Fatal(httpsrv.ListenAndServe())
}

func validateURL(u string, flagName string) *url.URL {
	ur, err := url.Parse(u)
	if err != nil {
		log.Fatalf("Invalid flag: %s, error: %v", flagName, err)
	}
	if ur == nil || ur.String() == "" {
		log.Fatalf("Missing required flag: %s", flagName)
	}
	if ur.Scheme == "" || ur.Host == "" {
		log.Fatalf("Invalid flag: %s, error: malformed URL", flagName)
	}
	return ur
}

func validateFlag(fs *flag.FlagSet, name string) {
	flag := fs.Lookup(name)
	if flag.Value.String() == "" {
		log.Fatalf("Missing required flag: %s", flag.Name)
	}
}
