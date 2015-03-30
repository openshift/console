package server

import (
	"io"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"path"
	"sync"
	"time"

	"github.com/coreos/pkg/log"
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
	reverseProxy := &httputil.ReverseProxy{
		FlushInterval: time.Millisecond * 500,
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

	targetConn, err := net.Dial("tcp", p.target.Host)
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
	defer clientConn.Close()
	defer targetConn.Close()

	err = req.Write(targetConn)
	if err != nil {
		log.Errorf("error copying request to target: %v", err)
		return
	}

	// Proxy TCP; wait until both connections are closed so we can report
	// errors.
	var wg sync.WaitGroup
	var clientToTargErr error
	var targToClientErr error
	wg.Add(2)
	cp := func(dst io.Writer, src io.Reader, dstErr *error) {
		_, err := io.Copy(dst, src)
		*dstErr = err
		wg.Done()
	}
	go cp(clientConn, targetConn, &targToClientErr)
	go cp(targetConn, clientConn, &clientToTargErr)
	wg.Wait()

	if clientToTargErr != nil {
		log.Errorf("error writing from client to target: %v", clientToTargErr)
	}

	if targToClientErr != nil {
		log.Errorf("error writing from target to client: %v", targToClientErr)
	}
}
