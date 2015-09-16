package server

import (
	"crypto/tls"
	"net/url"
)

type K8sConfig struct {
	Endpoint        *url.URL
	BearerToken     string
	TLSClientConfig *tls.Config
}
