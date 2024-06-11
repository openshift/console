package httpserver

import (
	"context"
	"crypto/tls"
	"flag"
	"net"
	"net/http"

	"github.com/openshift/console/pkg/flags"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/certwatcher"
)

type Server struct {
	listenURL string
	certFile  string
	keyFile   string
}

func NewServer(fs *flag.FlagSet) *Server {
	s := &Server{}
	fs.StringVar(&s.listenURL, "listen", "http://0.0.0.0:9000", "")
	fs.StringVar(&s.certFile, "tls-cert-file", "", "TLS certificate. If the certificate is signed by a certificate authority, the certFile should be the concatenation of the server's certificate followed by the CA's certificate.")
	fs.StringVar(&s.keyFile, "tls-key-file", "", "The TLS certificate key.")
	return s
}

func (s *Server) Serve(handler http.Handler) error {
	// Context to clean up on exit
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	url, err := flags.ValidateFlagIsURL("listen", s.listenURL, false)
	flags.FatalIfFailed(err)

	switch url.Scheme {
	case "http":
	case "https":
		flags.FatalIfFailed(flags.ValidateFlagNotEmpty("tls-cert-file", s.certFile))
		flags.FatalIfFailed(flags.ValidateFlagNotEmpty("tls-key-file", s.keyFile))
	default:
		flags.FatalIfFailed(flags.NewInvalidFlagError("listen", "scheme must be one of: http, https"))
	}

	klog.Infof("Binding to %s...", url.Host)
	httpsrv := &http.Server{Handler: handler}
	listener, err := s.listen(ctx, url.Scheme, url.Host)
	if err != nil {
		return err
	}
	defer listener.Close()

	go func() {
		<-ctx.Done()
		klog.Infof("Shutting down server...")
		if err = httpsrv.Shutdown(ctx); err != nil {
			klog.Errorf("Error shutting down server: %v", err)
		}
	}()

	// Cancel context and close listener on Serve return
	return httpsrv.Serve(listener)
}

func (s *Server) listen(ctx context.Context, scheme, host string) (net.Listener, error) {
	if scheme == "http" {
		klog.Info("Not using TLS")
		return net.Listen("tcp", host)
	}
	klog.Info("Using TLS")
	klog.V(4).Infof("Creating cert watcher")
	// Initialize a new cert watcher with cert/key pair
	watcher, err := certwatcher.New(s.certFile, s.keyFile)
	if err != nil {
		return nil, err
	}
	// Start goroutine with certwatcher running fsnotify against supplied certdir
	go func() {
		klog.V(4).Infof("Starting cert watcher")
		if err := watcher.Start(ctx); err != nil {
			klog.Fatalf("Serving cert watcher failed: %v", err)
		}
	}()

	tlsConfig := &tls.Config{
		NextProtos:     []string{"http/1.1"},
		GetCertificate: watcher.GetCertificate,
	}
	return tls.Listen("tcp", host, tlsConfig)
}
