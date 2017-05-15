package server

import (
	"crypto/tls"
	"fmt"
	"net/http"
	"net/url"

	"github.com/coreos-inc/bridge/pkg/proxy"
)

// federationConfig holds the configuration values needed to proxy requests to
// a federation API server.
type federationConfig struct {
	token string
	url   *url.URL
}

var federationProxyConfig = &proxy.Config{
	TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	Director: func(r *http.Request) {
		f, err := federationConfigFromContext(r.Context())
		if err != nil {
			plog.Errorf("failed to get federation config from context: %v", err)
			return
		}
		r.Host = f.url.Host
		r.URL.Host = f.url.Host
		r.URL.Path = proxy.SingleJoiningSlash(f.url.Path, r.URL.Path)
		r.URL.Scheme = f.url.Scheme
		r.Header.Add("Authorization", fmt.Sprintf("bearer %s", f.token))
	},
}
