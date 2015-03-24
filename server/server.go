package server

import (
	"fmt"
	"html/template"
	"net/http"

	"github.com/coreos-inc/bridge/etcd"
	"github.com/coreos-inc/bridge/fleet"

	"github.com/coreos/pkg/health"
)

const (
	BridgeAPIVersion      = "v1"
	IndexPageTemplateName = "index.html"
)

type jsGlobals struct {
	K8sVersion string `json:"k8sVersion"`
}

type Server struct {
	FleetClient *fleet.Client
	EtcdClient  *etcd.Client
	K8sConfig   *K8sConfig
	PublicDir   string
	Templates   *template.Template
}

func (s *Server) HTTPHandler() http.Handler {
	mux := http.NewServeMux()

	mux.Handle("/api/kubernetes/", http.StripPrefix("/api/kubernetes/", s.k8sHandler()))

	bridgePrefix := fmt.Sprintf("/api/bridge/%s/", BridgeAPIVersion)
	registerDiscovery(bridgePrefix, mux)
	csCfg := clusterServiceConfig{
		Mux:         mux,
		Prefix:      bridgePrefix,
		EtcdClient:  s.EtcdClient,
		FleetClient: s.FleetClient,
		K8sConfig:   s.K8sConfig,
	}
	registerClusterService(csCfg)

	// Respond with 404 for any other API rquests.
	mux.HandleFunc("/api/", notFoundHandler)

	// Serve all static files from public dir.
	staticHandler := http.StripPrefix("/static/", http.FileServer(http.Dir(s.PublicDir)))
	mux.Handle("/static/", staticHandler)

	// Serve index page for anything else.
	mux.HandleFunc("/", s.indexHandler)

	mux.HandleFunc("/health", health.Checker{
		Checks: []health.Checkable{
			newK8sAPICheck(
				k8sAPICheckConfig{
					version:  s.K8sConfig.APIVersion,
					endpoint: s.K8sConfig.Endpoint,
				},
			),
		},
	}.MakeHealthHandlerFunc())

	return http.Handler(mux)
}

func (s *Server) k8sHandler() http.Handler {
	t := *s.K8sConfig.Endpoint
	t.Path = "/api"
	proxy := newProxy(proxyConfig{
		Target:          t,
		HeaderBlacklist: []string{"Cookie"},
	})
	return proxy
}

func (s *Server) indexHandler(w http.ResponseWriter, r *http.Request) {
	jsg := &jsGlobals{
		K8sVersion: s.K8sConfig.APIVersion,
	}
	if err := s.Templates.ExecuteTemplate(w, IndexPageTemplateName, jsg); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func notFoundHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotFound)
	w.Write([]byte("not found"))
}
