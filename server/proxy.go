package server

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"path"
)

type proxyConfig struct {
	HeaderBlacklist []string
	Target          url.URL
}

func newProxy(cfg proxyConfig) *httputil.ReverseProxy {
	urlDirector := func(r *http.Request) {
		r.Host = cfg.Target.Host
		r.URL.Host = cfg.Target.Host
		r.URL.Scheme = cfg.Target.Scheme
		r.URL.Path = path.Join(cfg.Target.Path, r.URL.Path)
	}

	headerDirector := func(r *http.Request) {
		for _, h := range cfg.HeaderBlacklist {
			r.Header.Del(h)
		}
	}

	p := &httputil.ReverseProxy{}

	if len(cfg.HeaderBlacklist) == 0 {
		p.Director = urlDirector
	} else {
		p.Director = func(r *http.Request) {
			headerDirector(r)
			urlDirector(r)
		}
	}

	return p
}
