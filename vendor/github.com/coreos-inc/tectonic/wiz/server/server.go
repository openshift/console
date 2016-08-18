package server

import (
	"encoding/json"
	"html/template"
	"net/http"
	"net/url"
	"path"
	"strings"

	"github.com/Sirupsen/logrus"
	"github.com/coreos/pkg/health"
	"github.com/coreos/pkg/httputil"
	httprouter "github.com/julienschmidt/httprouter"
)

const (
	IndexPageTemplateName = "index.html"
)

var (
	version = "DEBUG"
)

type Server struct {
	publicDir    string
	manifestFile string
	templates    *template.Template
	logger       *logrus.Entry
	wizHandlers  []WizHandler
}

func New(logger *logrus.Entry, dir string, manifest string, wizHandlers []WizHandler) (*Server, error) {
	s := &Server{
		publicDir:    dir,
		manifestFile: manifest,
		logger:       logger,
		wizHandlers:  wizHandlers,
	}
	if err := s.LoadTemplates(); err != nil {
		return nil, err
	}

	return s, nil
}

func (s *Server) LoadTemplates() error {
	tpl := template.New(IndexPageTemplateName)

	// We use AngularJS and its templating syntax is {{ ... }}, which
	// conflicts with default Golang template syntax, so for Golang we
	// switch from {{ ... }} to [[ ... ]]
	tpl.Delims("[[", "]]")

	tpls, err := tpl.ParseFiles(path.Join(s.publicDir, IndexPageTemplateName))
	if err != nil {
		s.logger.WithError(err).Error("Problem parsing templates")
		return err
	}
	s.templates = tpls
	return nil
}

// newFileServer creates an http fileserver wrapper to prevent Chrome from caching all the sourcemaps.
// This is purely to solve an annoyance during development.
// See: https://bugs.chromium.org/p/chromium/issues/detail?id=508270
func newFileServer(root http.FileSystem) http.Handler {
	fs := http.FileServer(root)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Pragma", "no-cache")
		fs.ServeHTTP(w, r)
	})
}

func (s *Server) HTTPHandler() http.Handler {
	checks := []health.Checkable{}
	for _, h := range s.wizHandlers {
		checks = append(checks, h.Health()...)
	}

	// Default router: all non-frontend routes.
	r := httprouter.New()
	r.Handler("GET", "/health", health.Checker{
		Checks: checks,
	})
	r.HandlerFunc("GET", "/version", s.versionHandler)
	r.HandlerFunc("GET", "/manifest", s.manifestHandler)
	r.HandlerFunc("GET", "/", s.indexHandler)
	r.NotFound = s.notFoundHandler

	// Handles all frontned related routes.
	rFrontend := httprouter.New()
	rFrontend.ServeFiles("/app/static/*filepath", http.Dir(s.publicDir))
	rFrontend.HandlerFunc("GET", "/app/", s.appHandler)
	rFrontend.NotFound = s.appHandler

	// NOTE: Delegates necessary sub-routing between frontend/backend resources.
	mux := http.NewServeMux()
	mux.Handle("/app/", rFrontend)
	mux.Handle("/", r)

	for _, h := range s.wizHandlers {
		s.logger.WithField("handlerPath", h.Path()).Info("Adding handler path")
		mux.Handle(h.Path(), h)
	}

	return http.Handler(mux)
}

func (s *Server) manifestHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, path.Join("manifest/", s.manifestFile))
}

func (s *Server) appHandler(w http.ResponseWriter, r *http.Request) {
	// If we run behind proxy, we expect it to provide x-forwarded-uri
	// header, otherwise fallback to request uri
	xForwardedURI := r.Header.Get("x-forwarded-uri")
	if xForwardedURI == "" {
		xForwardedURI = r.RequestURI
	}

	parsedXForwardedURI, err := url.ParseRequestURI(xForwardedURI)
	if err != nil {
		s.logger.WithError(err).Error("Problem parsing x-forwarded-uri HTTP header")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// <prefix>/<path> - <path> = <prefix>/
	baseURI := strings.TrimSuffix(parsedXForwardedURI.Path, r.URL.Path)
	if !strings.HasSuffix(baseURI, "/") {
		baseURI += "/"
	}

	if err := s.templates.ExecuteTemplate(w, IndexPageTemplateName, struct{ BaseURI string }{baseURI}); err != nil {
		s.logger.WithError(err).Error("Problem executing HTML template")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

func (s *Server) indexHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		s.notFoundHandler(w, r)
		return
	}

	http.Redirect(w, r, "/app", http.StatusMovedPermanently)
}

func (s *Server) versionHandler(w http.ResponseWriter, r *http.Request) {
	httputil.WriteJSONResponse(w, http.StatusOK, struct {
		WizVersion string `json:"installerVersion"`
	}{
		WizVersion: version,
	})
}

func (s *Server) notFoundHandler(w http.ResponseWriter, r *http.Request) {
	s.logger.WithField("path", r.URL.Path).Debug("Path not found")
	w.WriteHeader(http.StatusNotFound)
	w.Write([]byte("not found"))
}

type ResponseError struct {
	Message string `json:"message"`
}

func writeErrorResponse(w http.ResponseWriter, code int, message string, logger *logrus.Entry) {
	writeResponseWithBody(w, code, ResponseError{message}, logger)
}

func writeResponseWithBody(w http.ResponseWriter, code int, resp interface{}, logger *logrus.Entry) {
	enc, err := json.Marshal(resp)
	if err != nil {
		logger.WithError(err).Error("Problem marshaling response body")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	if _, err = w.Write(enc); err != nil {
		logger.WithError(err).Error("Problem writing response body")
	}
}
