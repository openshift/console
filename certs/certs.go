package certs

import (
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"io/ioutil"
	"time"

	"github.com/coreos/pkg/capnslog"
)

var (
	plog = capnslog.NewPackageLogger("github.com/coreos-inc/bridge", "certs")
)

func ReadCert(certFile string) (certBytes []byte, certError error) {
	certBytes, err := ioutil.ReadFile(certFile)

	if err != nil {
		certError = fmt.Errorf("Could not open CA cert file: %v", err)
		plog.Warning(certError)
		return
	}

	return
}

func ParseCert(certBytes []byte) (expiration time.Time, certError error) {
	block, rest := pem.Decode(certBytes)

	if len(rest) > 0 {
		certError = fmt.Errorf("Extra data in PEM")
		plog.Warning(certError)
		return
	}

	if block == nil {
		certError = fmt.Errorf("Failed to decode CA certificate PEM")
		plog.Warning(certError)
		return
	}

	cert, err := x509.ParseCertificate(block.Bytes)

	if err != nil {
		certError = fmt.Errorf("Failed to parse CA certificate: %v", err)
		plog.Warning(certError)
		return
	}

	return cert.NotAfter, certError
}
