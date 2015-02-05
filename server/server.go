package server

import (
	"fmt"
	"html/template"
	"net/http"

	"github.com/coreos-inc/bridge/etcd"
	"github.com/coreos-inc/bridge/fleet"
	"github.com/coreos-inc/bridge/proxy"
	"github.com/gorilla/mux"
)

const (
	staticPrefix          = "/static"
	APIVersion            = "v1"
	IndexPageTemplateName = "index.html"
)

var (
	indexTemplate *template.Template

	// TODO: remove this and pass to each service
	k8sproxy *proxy.K8sProxy
)

type Server struct {
	FleetClient *fleet.Client
	EtcdClient  *etcd.Client
	K8sProxy    *proxy.K8sProxy
	PublicDir   string
	Templates   *template.Template
}

func (s *Server) HTTPHandler() http.Handler {
	r := mux.NewRouter()

	// Simple static file server for requests containing static prefix.
	r.PathPrefix(staticPrefix).Handler(http.StripPrefix(staticPrefix, http.FileServer(http.Dir(s.PublicDir))))

	k8sproxy = s.K8sProxy

	apiBasePath := fmt.Sprintf("/api/bridge/%s", APIVersion)
	ar := r.PathPrefix(apiBasePath).Subrouter()
	registerDiscovery(ar)
	registerUsers(ar)
	registerPods(ar)
	registerControllers(ar)
	registerServices(ar)
	registerMinions(ar)
	_, err := NewClusterService(ar, s.EtcdClient, s.FleetClient)
	if err != nil {
		panic(err)
	}

	// Serve index page for all other requests.
	r.HandleFunc("/{path:.*}", s.IndexHandler)

	return http.Handler(r)
}

func (s *Server) IndexHandler(w http.ResponseWriter, r *http.Request) {
	if err := s.Templates.ExecuteTemplate(w, IndexPageTemplateName, nil); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
