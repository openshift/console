package server

import (
	"crypto/tls"
	"net/url"
)

type ProxyConfig struct {
	HeaderBlacklist []string
	Endpoint        *url.URL
	BearerToken     string
	TLSClientConfig *tls.Config
}
