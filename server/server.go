package server

import (
	"html/template"
	"net/http"
	"net/url"

	"github.com/coreos/pkg/capnslog"
	"github.com/coreos/pkg/health"

	"github.com/coreos-inc/bridge/auth"
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

var (
	log = capnslog.NewPackageLogger("github.com/coreos-inc/bridge", "server")
)

type jsGlobals struct {
	K8sVersion             string `json:"k8sVersion"`
	AuthDisabled           bool   `json:"authDisabled"`
	NewUserAuthCallbackURL string `json:"newUserAuthCallbackURL"`
}

type Server struct {
	K8sProxyConfig         *ProxyConfig
	DexProxyConfig         *ProxyConfig
	PublicDir              string
	Templates              *template.Template
	Auther                 *auth.Authenticator
	NewUserAuthCallbackURL *url.URL
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

	if !s.AuthDisabled() {
		mux.HandleFunc(AuthLoginEndpoint, s.Auther.LoginFunc)
		mux.HandleFunc(AuthLogoutEndpoint, s.Auther.LogoutFunc)
		mux.HandleFunc(AuthCallbackEndpoint, s.Auther.CallbackFunc)
	}

	if s.DexProxyConfig != nil {
		s.DexProxyConfig.Endpoint.Path = "/api"
		s.DexProxyConfig.HeaderBlacklist = []string{"Cookie"}
		dexHandler := newProxy(s.DexProxyConfig)
		mux.Handle("/api/dex/", http.StripPrefix("/api/dex/", dexHandler))
	}

	mux.HandleFunc("/api/", notFoundHandler)

	staticHandler := http.StripPrefix("/static/", http.FileServer(http.Dir(s.PublicDir)))
	mux.Handle("/static/", staticHandler)

	mux.HandleFunc("/health", health.Checker{
		Checks: []health.Checkable{},
	}.ServeHTTP)

	mux.HandleFunc("/", s.indexHandler)

	return http.Handler(mux)
}

func (s *Server) k8sHandler() http.Handler {
	s.K8sProxyConfig.Endpoint.Path = "/api"
	s.K8sProxyConfig.HeaderBlacklist = []string{"Cookie"}
	proxy := newProxy(s.K8sProxyConfig)
	return proxy
}

func (s *Server) indexHandler(w http.ResponseWriter, r *http.Request) {
	jsg := &jsGlobals{
		K8sVersion:             K8sAPIVersion,
		AuthDisabled:           s.AuthDisabled(),
		NewUserAuthCallbackURL: s.NewUserAuthCallbackURL.String(),
	}
	if err := s.Templates.ExecuteTemplate(w, IndexPageTemplateName, jsg); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func notFoundHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotFound)
	w.Write([]byte("not found"))
}
