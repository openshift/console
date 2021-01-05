package server

import (
	"context"
	"crypto/tls"
	"net/http"

	"github.com/openshift/console/pkg/config/dynamic"
	"github.com/openshift/console/pkg/crypto"
	_ "github.com/openshift/console/pkg/hypercloud/middlewares"
	_ "github.com/openshift/console/pkg/provider"
	_ "github.com/openshift/console/pkg/provider/file"
	"github.com/openshift/console/pkg/server"
	log "github.com/sirupsen/logrus"
	"github.com/traefik/traefik/safe"
	// pServer "github.com/openshift/console/pkg/hypercloud/proxy
)

type stoppableServer interface {
	Shutdown(ctx context.Context) error
	Close() error
	ListenAndServe() error
}
type HttpServer struct {
	Server   stoppableServer
	Switcher *HTTPHandlerSwitcher
	Conf     *dynamic.Configuration
}

// NewServer create Server from server.Server
func NewServer(srv *server.Server, tlsCa, tlsKey *string) (*HttpServer, error) {
	httpSwitcher := NewHandlerSwitcher(http.NotFoundHandler())
	var handler http.Handler
	handler = httpSwitcher

	listenURL := srv.BaseURL

	serverHTTP := &http.Server{
		Addr:         listenURL.Host,
		Handler:      handler,
		TLSNextProto: make(map[string]func(*http.Server, *tls.Conn, http.Handler)),
		TLSConfig: &tls.Config{
			CipherSuites: crypto.DefaultCiphers(),
		},
	}

	go func() {
		log.Infof("Binding to %s...", serverHTTP.Addr)
		if listenURL.Scheme == "https" {
			log.Info("using TLS")
			log.Fatal(serverHTTP.ListenAndServeTLS(*tlsCa, *tlsKey))
		} else {
			log.Info("not using TLS")
			log.Fatal(serverHTTP.ListenAndServe())
		}
	}()
	return &HttpServer{
		Server:   serverHTTP,
		Switcher: httpSwitcher,
	}, nil
}

func (s *HttpServer) Start(ctx context.Context) {

	logger := log.StandardLogger()
	logger.Info("Start Server")

}

type HTTPHandlerSwitcher struct {
	handler *safe.Safe
}

// NewHandlerSwitcher builds a new instance of HTTPHandlerSwitcher.
func NewHandlerSwitcher(newHandler http.Handler) (hs *HTTPHandlerSwitcher) {
	return &HTTPHandlerSwitcher{
		handler: safe.New(newHandler),
	}
}

func (h *HTTPHandlerSwitcher) ServeHTTP(rw http.ResponseWriter, req *http.Request) {
	handlerBackup := h.handler.Get().(http.Handler)
	handlerBackup.ServeHTTP(rw, req)
}

// GetHandler returns the current http.ServeMux.
func (h *HTTPHandlerSwitcher) GetHandler() (newHandler http.Handler) {
	handler := h.handler.Get().(http.Handler)
	return handler
}

// UpdateHandler safely updates the current http.ServeMux with a new one.
func (h *HTTPHandlerSwitcher) UpdateHandler(newHandler http.Handler) {
	h.handler.Set(newHandler)
}
