package server

import (
	"compress/gzip"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/auth/csrfverifier"
	"github.com/openshift/console/pkg/serverutils"

	"k8s.io/klog/v2"
)

type HandlerWithUser func(*auth.User, http.ResponseWriter, *http.Request)

// Middleware generates a middleware wrapper for request hanlders.
// Responds with 401 for requests with missing/invalid/incomplete token with verified email address.
func authMiddleware(authenticator auth.Authenticator, csrfVerifier *csrfverifier.CSRFVerifier, h http.HandlerFunc) http.HandlerFunc {
	return authMiddlewareWithUser(
		authenticator,
		csrfVerifier,
		func(user *auth.User, w http.ResponseWriter, r *http.Request) {
			h.ServeHTTP(w, r)
		},
	)
}

func authMiddlewareWithUser(authenticator auth.Authenticator, csrfVerifier *csrfverifier.CSRFVerifier, h HandlerWithUser) http.HandlerFunc {
	return csrfVerifier.WithCSRFVerification(
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, err := authenticator.Authenticate(w, r)
			if err != nil {
				klog.V(4).Infof("authentication failed: %v", err)
				w.WriteHeader(http.StatusUnauthorized)
				return
			}
			r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
			h(user, w, r)
		}),
	)
}

func withBearerTokenReview(tokenReviewer *auth.TokenReviewer, h http.HandlerFunc) http.HandlerFunc {
	return http.HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {
			authorizationHeader := r.Header.Get("Authorization")
			if authorizationHeader == "" {
				klog.V(4).Infof("TOKEN_REVIEW: '%s %s' unauthorized, missing Authorization header", r.Method, r.URL.Path)
				w.WriteHeader(http.StatusUnauthorized)
				return
			}

			if !strings.HasPrefix(authorizationHeader, "Bearer ") {
				klog.V(4).Infof("TOKEN_REVIEW: '%s %s' unauthorized, 'Bearer' type Authorization header required", r.Method, r.URL.Path)
				w.WriteHeader(http.StatusUnauthorized)
				return
			}

			bearerToken := strings.TrimPrefix(authorizationHeader, "Bearer ")
			if bearerToken == "" {
				klog.V(4).Infof("TOKEN_REVIEW: '%s %s' unauthorized, empty or missing Bearer token", r.Method, r.URL.Path)
				w.WriteHeader(http.StatusUnauthorized)
				return
			}

			err := tokenReviewer.ReviewToken(r.Context(), bearerToken)
			if err != nil {
				klog.V(4).Infof("TOKEN_REVIEW: '%s %s' unauthorized, invalid user token, %v", r.Method, r.URL.Path, err)
				w.WriteHeader(http.StatusUnauthorized)
				return
			}
			klog.V(4).Infof("TOKEN_REVIEW: '%s %s' user token successfully validated", r.Method, r.URL.Path)
			h(w, r)
		})
}

func allowMethods(methods []string, h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		for _, method := range methods {
			if r.Method == method {
				h.ServeHTTP(w, r)
				return
			}
		}
		allowedStr := strings.Join(methods, ", ")
		w.Header().Set("Allow", allowedStr)
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: fmt.Sprintf("Method '%s' not allowed. Allowed methods: %s", r.Method, allowedStr)})
	}
}

func allowMethod(method string, h http.HandlerFunc) http.HandlerFunc {
	return allowMethods([]string{method}, h)
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
func gzipHandler(h http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Vary", "Accept-Encoding")
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			h.ServeHTTP(w, r)
			return
		}
		w.Header().Set("Content-Encoding", "gzip")
		gz := gzip.NewWriter(w)
		defer gz.Close()
		h.ServeHTTP(&gzipResponseWriter{Writer: gz, ResponseWriter: w}, r)
	}
}

func securityHeadersMiddleware(hdlr http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Prevent MIME sniffing (https://en.wikipedia.org/wiki/Content_sniffing)
		w.Header().Set("X-Content-Type-Options", "nosniff")
		// Prevent clickjacking attacks involving iframes
		w.Header().Set("X-Frame-Options", "DENY")
		// Less information leakage about what domains we link to
		w.Header().Set("X-DNS-Prefetch-Control", "off")
		// Less information leakage about what domains we link to
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		hdlr.ServeHTTP(w, r)
	}
}
