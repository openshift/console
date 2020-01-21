package kiali

import (
	"crypto/tls"
	"crypto/x509"
	"flag"
	"io/ioutil"

	"github.com/coreos/pkg/capnslog"

	"github.com/openshift/console/pkg/bridge"
	"github.com/openshift/console/pkg/crypto"
	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/pkg/server"
)

var (
	log = capnslog.NewPackageLogger("github.com/openshift/console", "pkg/kiali")
)

type config struct {
	kialiHostUrl string
	kialiCaFile  string
}

func RegisterFlags(fs *flag.FlagSet) *config {

	cfg := new(config)

	fs.StringVar(&cfg.kialiHostUrl, "kiali-host-url", "https://kiali-istio-system.apps.sp33.devcluster.openshift.com", "Kiali backend URL")
	fs.StringVar(&cfg.kialiCaFile, "kiali-host-ca-file", "", "CA bundle for Kiali host.")

	return cfg
}

func (cfg *config) Configure(srv *server.Server) {
	kialiHostUrl := bridge.ValidateFlagIsURL("kiali-backend-hostUrl", cfg.kialiHostUrl)

	var rootCAs *x509.CertPool
	if cfg.kialiCaFile != "" {
		rootCAs = x509.NewCertPool()
		certPEM, err := ioutil.ReadFile(cfg.kialiCaFile)
		if err != nil {
			log.Fatalf("failed to read kiali ca file %v : %v", cfg.kialiCaFile, err)
		}
		if !rootCAs.AppendCertsFromPEM(certPEM) {
			log.Fatalf("No CA found for kiali proxy")
		}
	} else {
		rootCAs, _ = x509.SystemCertPool()
	}

	srv.KialiProxyConfig = &proxy.Config{
		TLSClientConfig: &tls.Config{
			RootCAs:      rootCAs,
			CipherSuites: crypto.DefaultCiphers(),
		},
		HeaderBlacklist: []string{"Cookie", "X-CSRFToken"},
		Endpoint:        kialiHostUrl,
	}

}
