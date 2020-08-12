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
	log         = capnslog.NewPackageLogger("github.com/openshift/console", "pkg/helm")
	DefaultRepo helmRepo
)

type config struct {
	repoUrl    string
	repoCaFile string
}

func RegisterFlags(fs *flag.FlagSet) *config {

	cfg := new(config)

	fs.StringVar(&cfg.repoUrl, "helm-chart-repo-url", "https://redhat-developer.github.io/redhat-helm-charts", "Helm chart repository URL")
	fs.StringVar(&cfg.repoCaFile, "helm-chart-repo-ca-file", "", "CA bundle for Helm chart repository.")

	return cfg
}

func (cfg *config) Configure() {
	repoURL := bridge.ValidateFlagIsURL("helm-chart-repo-repoUrl", cfg.repoUrl)

	var rootCAs *x509.CertPool
	if cfg.repoCaFile != "" {
		rootCAs = x509.NewCertPool()
		certPEM, err := ioutil.ReadFile(cfg.repoCaFile)
		if err != nil {
			log.Fatalf("failed to read helm chart repo ca file %v : %v", cfg.repoCaFile, err)
		}
		if !rootCAs.AppendCertsFromPEM(certPEM) {
			log.Fatalf("No CA found for Helm chart repo proxy")
		}
	} else {
		rootCAs, _ = x509.SystemCertPool()
	}

	DefaultRepo = helmRepo{
		Name: "redhat-helm-charts",
		Url:  repoURL,
		TlsClientConfig: oscrypto.SecureTLSConfig(&tls.Config{
			RootCAs:      rootCAs,
			CipherSuites: oscrypto.DefaultCiphers(),
		}),
	}

}
