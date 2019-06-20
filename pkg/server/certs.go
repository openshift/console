package server

import (
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"io/ioutil"
)

func readCert(file string) ([]byte, error) {
	b, err := ioutil.ReadFile(file)
	if err != nil {
		return nil, fmt.Errorf("Could not open CA cert file: %v", err)
	}
	return b, err
}

func parseCertExpiration(b []byte) (int64, error) {
	block, rest := pem.Decode(b)
	if len(rest) > 0 {
		return 0, fmt.Errorf("Extra data in PEM")
	}
	if block == nil {
		return 0, fmt.Errorf("Failed to decode CA certificate PEM")
	}

	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return 0, fmt.Errorf("Failed to parse CA certificate: %v", err)
	}
	return cert.NotAfter.Unix(), err
}

func getCertExpiration(path string) (int64, error) {
	b, err := readCert(path)
	if err != nil {
		return 0, err
	}
	expiration, err := parseCertExpiration([]byte(b))
	return expiration, err
}
