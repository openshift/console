package backend

import (
	"context"
	"crypto/tls"
	"io"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"

	"github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
)

const (
	// StatusClientClosedRequest non-standard HTTP status code for client disconnection
	StatusClientClosedRequest = 499
	// StatusClientClosedRequestText non-standard HTTP status for client disconnection.
	StatusClientClosedRequestText = "Client Closed Request"
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

	proxy.ErrorHandler = func(w http.ResponseWriter, request *http.Request, err error) {
		statusCode := http.StatusInternalServerError

		switch {
		case errors.Is(err, io.EOF):
			statusCode = http.StatusBadGateway
		case errors.Is(err, context.Canceled):
			statusCode = StatusClientClosedRequest
		default:
			var netErr net.Error
			if errors.As(err, &netErr) {
				if netErr.Timeout() {
					statusCode = http.StatusGatewayTimeout
				} else {
					statusCode = http.StatusBadGateway
				}
			}
		}
		log.Infof("'%d %s' caused by: %v", statusCode, statusText(statusCode), err)
		w.WriteHeader(statusCode)
		_, werr := w.Write([]byte(statusText(statusCode)))
		if werr != nil {
			log.Infof("Error while writing status code", werr)
		}
	}

	return proxy
}

func statusText(statusCode int) string {
	if statusCode == StatusClientClosedRequest {
		return StatusClientClosedRequestText
	}
	return http.StatusText(statusCode)
}
