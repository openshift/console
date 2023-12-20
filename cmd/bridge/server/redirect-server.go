package server

import (
	"flag"
	"fmt"
	"net/http"
	"net/url"

	"k8s.io/klog"
)

type RedirectServer struct {
	port int
}

func NewRedirectServer(fs *flag.FlagSet) *RedirectServer {
	s := &RedirectServer{}
	fs.IntVar(&s.port, "redirect-port", 0, "Port number under which the console should listen for custom hostname redirect.")
	return s
}

func (s *RedirectServer) Serve(scheme, host string) error {
	if s.port == 0 {
		return nil
	}
	// Listen on passed port number to be redirected to the console
	redirectServer := http.NewServeMux()
	redirectServer.HandleFunc("/", func(res http.ResponseWriter, req *http.Request) {
		redirectURL := &url.URL{
			Scheme:   scheme,
			Host:     host,
			RawQuery: req.URL.RawQuery,
			Path:     req.URL.Path,
		}
		http.Redirect(res, req, redirectURL.String(), http.StatusMovedPermanently)
	})

	addr := fmt.Sprintf(":%d", s.port)
	klog.Infof("Redirect server listening on %v", addr)
	return http.ListenAndServe(addr, redirectServer)
}
