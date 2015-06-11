package server

import (
	"crypto/tls"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"path"
	"time"

	"github.com/coreos/pkg/netutil"
)

const (
	proxyWriteDeadline = time.Second * 10
	proxyReadDeadline  = time.Second * 10
)

type proxyConfig struct {
	HeaderBlacklist []string
	Target          url.URL
}

type proxy struct {
	reverseProxy *httputil.ReverseProxy
	target       url.URL
}

func newProxy(cfg proxyConfig) *proxy {
	headerDirector := func(r *http.Request) {
		for _, h := range cfg.HeaderBlacklist {
			r.Header.Del(h)
		}
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
		target:       cfg.Target,
	}

	if len(cfg.HeaderBlacklist) == 0 {
		reverseProxy.Director = func(r *http.Request) {
			proxy.rewriteURL(r)
		}
	} else {
		reverseProxy.Director = func(r *http.Request) {
			headerDirector(r)
			proxy.rewriteURL(r)
		}
	}

	return proxy
}

func (p *proxy) rewriteURL(req *http.Request) {
	req.Host = p.target.Host
	req.URL.Host = p.target.Host
	req.URL.Scheme = p.target.Scheme
	req.URL.Path = path.Join(p.target.Path, req.URL.Path)
}

func isWebsocket(req *http.Request) bool {
	upgrades := req.Header["Upgrade"]
	for _, upgrade := range upgrades {
		if upgrade == "websocket" {
			return true
		}
	}
	return false
}

func (p *proxy) ServeHTTP(res http.ResponseWriter, req *http.Request) {
	if !isWebsocket(req) {
		p.reverseProxy.ServeHTTP(res, req)
		return
	}

	// Copy the request, since we'll be modifying it.
	outreq := new(http.Request)
	*outreq = *req

	p.rewriteURL(outreq)

	var targetConn net.Conn
	var err error
	if p.target.Scheme == "https" {
		targetConn, err = tls.Dial("tcp", p.target.Host, &tls.Config{InsecureSkipVerify: true})
	} else {
		targetConn, err = net.Dial("tcp", p.target.Host)
	}
	if err != nil {
		http.Error(res, "Error contacting Kubernetes API server.", http.StatusInternalServerError)
		log.Errorf("error dialing websocket backend %s: %v", p.target.Host, err)
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
