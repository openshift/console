package main

import (
	"crypto/tls"
	"crypto/x509"
	"io/ioutil"

	"github.com/openshift/library-go/pkg/crypto"
	"k8s.io/klog"
)

// Read bytes from a file. Panic if any error is encountered.
func ReadFileOrDie(fileName string) []byte {
	data, err := ioutil.ReadFile(fileName)
	if err != nil {
		klog.Fatalf("Failed to read file %s: %v", fileName, err)
	}
	return data
}

// Read certs from a file and build a TLS client config contianing the parsed certs. Panic if any
// error is encountered.
func ReadCAFileToTLSConfigOrDie(fileName string) *tls.Config {
	pem := ReadFileOrDie(fileName)
	rootCAs := x509.NewCertPool()
	if !rootCAs.AppendCertsFromPEM(pem) {
		klog.Fatalf("Unable to parse PEM certs from file %s", fileName)
	}
	return crypto.SecureTLSConfig(&tls.Config{
		RootCAs: rootCAs,
	})
}
