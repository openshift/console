package server

import (
	"fmt"
	"net/http"

	"github.com/openshift/console/auth"
)

// Middleware generates a middleware wrapper for request hanlders.
// Responds with 401 for requests with missing/invalid/incomplete token with verified email address.
func authMiddleware(a *auth.Authenticator, hdlr http.HandlerFunc) http.Handler {
	f := func(user *auth.User, w http.ResponseWriter, r *http.Request) {
		hdlr.ServeHTTP(w, r)
	}
	return authMiddlewareWithUser(a, f)
}

func authMiddlewareWithUser(a *auth.Authenticator, handlerFunc func(user *auth.User, w http.ResponseWriter, r *http.Request)) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, err := a.Authenticate(r)
		if err != nil {
			plog.Infof("authentication failed: %v", err)
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
			if err := a.VerifySourceOrigin(r); err != nil {
				plog.Infof("invalid source origin: %v", err)
				w.WriteHeader(http.StatusForbidden)
				return
			}

			if err := a.VerifyCSRFToken(r); err != nil {
				plog.Infof("invalid CSRFToken: %v", err)
				w.WriteHeader(http.StatusForbidden)
				return
			}
		}

		handlerFunc(user, w, r)
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
