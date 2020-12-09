package backend

import (
	"crypto/tls"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"

	// _ "github.com/openshift/console/pkg/proxy"
	"github.com/pkg/errors"
)

type Backend struct {
	Handler   *httputil.ReverseProxy
	Server    *url.URL
	Name      string
	Rule      string
	ServerURL string
}

func NewBackend(name string, serverURL string) (*Backend, error) {
	server, err := url.Parse(serverURL)
	if err != nil {
		return nil, errors.Wrapf(err, "URL Parsing failed for: %s", serverURL)
	}

	return &Backend{
		Name:    name,
		Handler: newReverseProxy(server),
		Server:  server,
	}, nil
}

func newReverseProxy(target *url.URL) *httputil.ReverseProxy {

	proxy := httputil.NewSingleHostReverseProxy(target)
	// proxy.Director = func(outReq *http.Request) {
	// 	u := outReq.URL
	// 	if outReq.RequestURI != "" {
	// 		parsedURL, err := url.ParseRequestURI(outReq.RequestURI)
	// 		if err == nil {
	// 			u = parsedURL
	// 		}
	// 	}

	// 	outReq.URL.Path = u.Path
	// 	outReq.URL.RawPath = u.RawPath
	// 	outReq.URL.RawQuery = u.RawQuery
	// 	outReq.RequestURI = "" // Outgoing request should not have RequestURI

	// 	outReq.Proto = "HTTP/1.1"
	// 	outReq.ProtoMajor = 1
	// 	outReq.ProtoMinor = 1

	// 	if _, ok := outReq.Header["User-Agent"]; !ok {
	// 		outReq.Header.Set("User-Agent", "")
	// 	}

	// 	// Do not pass client Host header unless optsetter PassHostHeader is set.
	// 	// if passHostHeader != nil && !*passHostHeader {
	// 	// 	outReq.Host = outReq.URL.Host
	// 	// }

	// 	// Even if the websocket RFC says that headers should be case-insensitive,
	// 	// some servers need Sec-WebSocket-Key, Sec-WebSocket-Extensions, Sec-WebSocket-Accept,
	// 	// Sec-WebSocket-Protocol and Sec-WebSocket-Version to be case-sensitive.
	// 	// https://tools.ietf.org/html/rfc6455#page-20
	// 	outReq.Header["Sec-WebSocket-Key"] = outReq.Header["Sec-Websocket-Key"]
	// 	outReq.Header["Sec-WebSocket-Extensions"] = outReq.Header["Sec-Websocket-Extensions"]
	// 	outReq.Header["Sec-WebSocket-Accept"] = outReq.Header["Sec-Websocket-Accept"]
	// 	outReq.Header["Sec-WebSocket-Protocol"] = outReq.Header["Sec-Websocket-Protocol"]
	// 	outReq.Header["Sec-WebSocket-Version"] = outReq.Header["Sec-Websocket-Version"]
	// 	delete(outReq.Header, "Sec-Websocket-Key")
	// 	delete(outReq.Header, "Sec-Websocket-Extensions")
	// 	delete(outReq.Header, "Sec-Websocket-Accept")
	// 	delete(outReq.Header, "Sec-Websocket-Protocol")
	// 	delete(outReq.Header, "Sec-Websocket-Version")
	// }
	proxy.Transport = &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   30 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: true,
		},
		TLSHandshakeTimeout: 10 * time.Second,
	}

	return proxy
}
