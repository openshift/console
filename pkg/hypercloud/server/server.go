package server

import (
	"github.com/coreos/pkg/capnslog"
)

var (
	plog = capnslog.NewPackageLogger("github.com/tmax-cloud/hypercloud-console", "server")
)

type Server struct {
	Grafana *ProxyInfo
	Kiali   *ProxyInfo
}

// func (s *Server) HTTPHandler() http.Handler {
// 	mux := mux.NewRouter()
// 	// mux.HandleFunc(path string, f func(http.ResponseWriter,
// 	// 	*http.Request))
// 	return mux
// }

func (s *Server) grafanaEnable() bool {
	return s.Grafana != nil
}

func (s *Server) kialiEnable() bool {
	return s.Kiali != nil
}
