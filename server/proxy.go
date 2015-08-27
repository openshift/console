package server

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/http"
	"net/http/httputil"
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
	K8sConfig       *K8sConfig
}

type proxy struct {
	reverseProxy *httputil.ReverseProxy
	k8sConfig    *K8sConfig
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
		k8sConfig:    cfg.K8sConfig,
	}

	if len(cfg.HeaderBlacklist) == 0 {
		reverseProxy.Director = func(r *http.Request) {
			proxy.rewriteURL(r)
			proxy.maybeAddAuthorizationHeader(r)
		}
	} else {
		reverseProxy.Director = func(r *http.Request) {
			headerDirector(r)
			proxy.rewriteURL(r)
			proxy.maybeAddAuthorizationHeader(r)
		}
	}

	return proxy
}

func (p *proxy) maybeAddAuthorizationHeader(req *http.Request) {
	if p.k8sConfig.BearerToken != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", p.k8sConfig.BearerToken))
	}
}

func (p *proxy) rewriteURL(req *http.Request) {
	req.Host = p.k8sConfig.Endpoint.Host
	req.URL.Host = p.k8sConfig.Endpoint.Host
	req.URL.Scheme = p.k8sConfig.Endpoint.Scheme
	req.URL.Path = path.Join(p.k8sConfig.Endpoint.Path, req.URL.Path)
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
	p.maybeAddAuthorizationHeader(outreq)

	var targetConn net.Conn
	var err error
	if p.k8sConfig.Endpoint.Scheme == "https" {
		targetConn, err = tls.Dial("tcp", p.k8sConfig.Endpoint.Host, &tls.Config{InsecureSkipVerify: true})
	} else {
		targetConn, err = net.Dial("tcp", p.k8sConfig.Endpoint.Host)
	}
	if err != nil {
		http.Error(res, "Error contacting Kubernetes API server.", http.StatusInternalServerError)
		log.Errorf("error dialing websocket backend %s: %v", p.k8sConfig.Endpoint.Host, err)
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
