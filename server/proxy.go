package server

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/http"
	"net/http/httputil"
	"strings"
	"time"

	"github.com/coreos/pkg/netutil"
)

const (
	proxyWriteDeadline = time.Second * 10
	proxyReadDeadline  = time.Second * 10
)

type proxy struct {
	reverseProxy *httputil.ReverseProxy
	config       *ProxyConfig
}

func newProxy(cfg *ProxyConfig) *proxy {
	if strings.HasSuffix(cfg.Endpoint.Path, "/") {
		panic("Proxy paths must not end in a slash")
	}

	// Copy of http.DefaultTransport with TLSClientConfig added
	insecureTransport := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		Dial: (&net.Dialer{
			Timeout:   30 * time.Second,
			KeepAlive: 30 * time.Second,
		}).Dial,
		TLSClientConfig:     &tls.Config{InsecureSkipVerify: true},
		TLSHandshakeTimeout: 10 * time.Second,
	}

	reverseProxy := &httputil.ReverseProxy{
		FlushInterval: time.Millisecond * 500,
		Transport:     insecureTransport,
	}
	proxy := &proxy{
		reverseProxy: reverseProxy,
		config:       cfg,
	}

	reverseProxy.Director = func(r *http.Request) {
		proxy.rewriteRequest(r)
	}

	return proxy
}

func (p *proxy) rewriteRequest(r *http.Request) {
	// At this writing, the only errors we can get from TokenExtractor
	// are benign and correct variations on "no token found"
	if token, err := p.config.TokenExtractor(r); err == nil {
		r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	}

	for _, h := range p.config.HeaderBlacklist {
		r.Header.Del(h)
	}

	r.Host = p.config.Endpoint.Host
	r.URL.Host = p.config.Endpoint.Host
	r.URL.Scheme = p.config.Endpoint.Scheme
	r.URL.Path = p.config.Endpoint.Path + "/" + r.URL.Path
}

func (p *proxy) ServeHTTP(res http.ResponseWriter, req *http.Request) {
	isWebsocket := false
	upgrades := req.Header["Upgrade"]
	for _, upgrade := range upgrades {
		if upgrade == "websocket" {
			isWebsocket = true
			break
		}
	}

	if !isWebsocket {
		p.reverseProxy.ServeHTTP(res, req)
		return
	}

	p.rewriteRequest(req)

	var targetConn net.Conn
	var err error
	if p.config.Endpoint.Scheme == "https" {
		targetConn, err = tls.Dial("tcp", p.config.Endpoint.Host, p.config.TLSClientConfig)
	} else {
		targetConn, err = net.Dial("tcp", p.config.Endpoint.Host)
	}
	if err != nil {
		http.Error(res, "Error contacting Kubernetes API server.", http.StatusInternalServerError)
		log.Errorf("error dialing websocket backend %s: %v", p.config.Endpoint.Host, err)
		return
	}

	hj, ok := res.(http.Hijacker)
	if !ok {
		// This should never happen.
		http.Error(res, "Error trying to create websocket proxy.", http.StatusInternalServerError)
		log.Error("http.ResponseWriter is not hijack-able")
		return
	}
	clientConn, _, err := hj.Hijack()
	if err != nil {
		log.Errorf("Hijack error: %v", err)
		return
	}

	err = req.Write(targetConn)
	if err != nil {
		log.Errorf("error copying request to target: %v", err)
		return
	}

	netutil.ProxyTCP(clientConn, targetConn, proxyWriteDeadline, proxyReadDeadline)
}
