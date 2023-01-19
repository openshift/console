package server

import (
	"compress/gzip"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/serverutils"

	"k8s.io/klog"
)

// Middleware generates a middleware wrapper for request hanlders.
// Responds with 401 for requests with missing/invalid/incomplete token with verified email address.
func authenticatedMiddleware(server *Server, hdlr http.HandlerFunc) http.Handler {
	f := func(user *auth.User, w http.ResponseWriter, r *http.Request) {
		hdlr.ServeHTTP(w, r)
	}
	return authenticatedMiddlewareWithUser(server, f)
}

func authenticatedMiddlewareWithUser(server *Server, handlerFunc func(user *auth.User, w http.ResponseWriter, r *http.Request)) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get the correct Auther for the cluster.
		cluster := serverutils.GetCluster(r)
		authenticator, status, err := server.GetAuthenticator(cluster)
		if err != nil {
			w.WriteHeader(status)
			w.Write([]byte(err.Error()))
		}

		// Get the correct Auther for the cluster.
		user, err := authenticator.Authenticate(r)
		if err != nil {
			klog.V(4).Infof("authentication failed: %v", err)
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))

		safe := false
		switch r.Method {
		case
			"GET",
			"HEAD",
			"OPTIONS",
			"TRACE":
			safe = true
		}
		if !safe {
			if err := authenticator.VerifySourceOrigin(r); err != nil {
				klog.Errorf("invalid source origin: %v", err)
				w.WriteHeader(http.StatusForbidden)
				return
			}

			if err := authenticator.VerifyCSRFToken(r); err != nil {
				klog.Errorf("invalid CSRFToken: %v", err)
				w.WriteHeader(http.StatusForbidden)
				return
			}
		}
		handlerFunc(user, w, r)
	})
}

type gzipResponseWriter struct {
	io.Writer
	http.ResponseWriter
	sniffDone bool
}

func (w *gzipResponseWriter) Write(b []byte) (int, error) {
	if !w.sniffDone {
		if w.Header().Get("Content-Type") == "" {
			w.Header().Set("Content-Type", http.DetectContentType(b))
		}
		w.sniffDone = true
	}
	return w.Writer.Write(b)
}

// gzipHandler wraps a http.Handler to support transparent gzip encoding.
func gzipHandler(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Vary", "Accept-Encoding")
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			h.ServeHTTP(w, r)
			return
		}
		w.Header().Set("Content-Encoding", "gzip")
		gz := gzip.NewWriter(w)
		defer gz.Close()
		h.ServeHTTP(&gzipResponseWriter{Writer: gz, ResponseWriter: w}, r)
	})
}

func securityHeadersMiddleware(hdlr http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Prevent MIME sniffing (https://en.wikipedia.org/wiki/Content_sniffing)
		w.Header().Set("X-Content-Type-Options", "nosniff")
		// Ancient weak protection against reflected XSS (equivalent to CSP no unsafe-inline)
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		// Prevent clickjacking attacks involving iframes
		w.Header().Set("X-Frame-Options", "DENY")
		// Less information leakage about what domains we link to
		w.Header().Set("X-DNS-Prefetch-Control", "off")
		// Less information leakage about what domains we link to
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		hdlr.ServeHTTP(w, r)
	}
}
