package server

import (
	"fmt"
	"html/template"
	"net/http"

	"github.com/coreos-inc/bridge/auth"
	"github.com/coreos-inc/bridge/etcd"
	"github.com/coreos-inc/bridge/fleet"

	"github.com/coreos/pkg/health"
)

const (
	BridgeAPIVersion      = "v1"
	K8sAPIVersion         = "v1"
	IndexPageTemplateName = "index.html"

	AuthLoginEndpoint    = "/auth/login"
	AuthLogoutEndpoint   = "/auth/logout"
	AuthCallbackEndpoint = "/auth/callback"
	AuthErrorURL         = "/error"
	AuthSuccessURL       = "/"
)

type jsGlobals struct {
	K8sVersion   string `json:"k8sVersion"`
	AuthDisabled bool   `json:"authDisabled"`
}

type Server struct {
	FleetClient *fleet.Client
	EtcdClient  *etcd.Client
	K8sConfig   *K8sConfig
	PublicDir   string
	Templates   *template.Template
	Auther      *auth.Authenticator
}

func (s *Server) AuthDisabled() bool {
	return s.Auther == nil
}

func (s *Server) HTTPHandler() http.Handler {
	mux := http.NewServeMux()

	k8sHandler := s.k8sHandler()
	if !s.AuthDisabled() {
		k8sHandler = authMiddleware(s.Auther, s.k8sHandler())
	}
	mux.Handle("/api/kubernetes/", http.StripPrefix("/api/kubernetes/", k8sHandler))

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

	if !s.AuthDisabled() {
		mux.HandleFunc(AuthLoginEndpoint, s.Auther.LoginFunc)
		mux.HandleFunc(AuthLogoutEndpoint, s.Auther.LogoutFunc)
		mux.HandleFunc(AuthCallbackEndpoint, s.Auther.CallbackFunc)
	}

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
					version:  K8sAPIVersion,
					endpoint: s.K8sConfig.Endpoint,
				},
			),
		},
	}.ServeHTTP)

	return http.Handler(mux)
}

func (s *Server) k8sHandler() http.Handler {
	s.K8sConfig.Endpoint.Path = "/api"
	proxy := newProxy(proxyConfig{
		K8sConfig:       s.K8sConfig,
		HeaderBlacklist: []string{"Cookie"},
	})
	return proxy
}

func (s *Server) indexHandler(w http.ResponseWriter, r *http.Request) {
	jsg := &jsGlobals{
		K8sVersion:   K8sAPIVersion,
		AuthDisabled: s.AuthDisabled(),
	}
	if err := s.Templates.ExecuteTemplate(w, IndexPageTemplateName, jsg); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func notFoundHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotFound)
	w.Write([]byte("not found"))
}
