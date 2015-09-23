package server

import (
	"crypto/tls"
	"errors"
	"net/http"
	"net/url"

	"github.com/coreos/go-oidc/oidc"
)

type ProxyConfig struct {
	HeaderBlacklist []string
	Endpoint        *url.URL
	TokenExtractor  oidc.RequestTokenExtractor
	TLSClientConfig *tls.Config
}

// The trivial token "extractor" always extracts a constant string
func ConstantTokenExtractor(s string) func(*http.Request) (string, error) {
	var err error = nil
	if s == "" {
		err = errors.New("no token present")
	}

	return func(_ *http.Request) (string, error) {
		return s, err
	}
}
