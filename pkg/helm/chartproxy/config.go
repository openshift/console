package chartproxy

import (
	"crypto/tls"
	"crypto/x509"
	"flag"
	"io/ioutil"

	"github.com/coreos/pkg/capnslog"

	"github.com/openshift/console/pkg/bridge"
	oscrypto "github.com/openshift/library-go/pkg/crypto"
)

var (
	log         = capnslog.NewPackageLogger("github.com/openshift/console", "helm/chartproxy")
	DefaultRepo helmRepo
)

type config struct {
	repoURL    string
	repoCAFile string
}

func RegisterFlags(fs *flag.FlagSet) *config {

	cfg := new(config)

	fs.StringVar(&cfg.repoURL, "helm-chart-repo-url", "https://redhat-developer.github.io/redhat-helm-charts", "Helm chart repository URL")
	fs.StringVar(&cfg.repoCAFile, "helm-chart-repo-ca-file", "", "CA bundle for Helm chart repository.")

	return cfg
}

func (cfg *config) Configure() {
	repoURL := bridge.ValidateFlagIsURL("helm-chart-repo-url", cfg.repoURL)

	var rootCAs *x509.CertPool
	if cfg.repoCAFile != "" {
		rootCAs = x509.NewCertPool()
		certPEM, err := ioutil.ReadFile(cfg.repoCAFile)
		if err != nil {
			log.Fatalf("failed to read helm chart repo ca file %v : %v", cfg.repoCAFile, err)
		}
		if !rootCAs.AppendCertsFromPEM(certPEM) {
			log.Fatalf("No CA found for Helm chart repo proxy")
		}
	} else {
		rootCAs, _ = x509.SystemCertPool()
	}

	DefaultRepo = helmRepo{
		Name: "redhat-helm-charts",
		URL:  repoURL,
		TLSClientConfig: oscrypto.SecureTLSConfig(&tls.Config{
			RootCAs:      rootCAs,
			CipherSuites: oscrypto.DefaultCiphers(),
		}),
	}

}
