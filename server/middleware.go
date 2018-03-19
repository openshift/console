package server

import (
	"fmt"
	"github.com/coreos-inc/bridge/auth"
	"net/http"
)

// Middleware generates a middleware wrapper for request hanlders.
// Responds with 401 for requests with missing/invalid/incomplete token with verified email address.
func authMiddleware(a *auth.Authenticator, hdlr http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		encTok, err := a.TokenExtractor(r)
		if err != nil {
			plog.Infof("no token found for %v: %v", r.URL.String(), err)
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		_, err = a.TokenVerifier(encTok)
		if err != nil {
			plog.Infof("error verifying token: %v", err)
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", encTok))

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
			if err := a.VerifyReferer(r); err != nil {
				plog.Infof("Invalid referer %v", err)
				w.WriteHeader(http.StatusForbidden)
				return
			}
			if err := a.VerifyCSRFToken(r); err != nil {
				plog.Infof("Invalid CSRFToken %v", err)
				w.WriteHeader(http.StatusForbidden)
				return
			}
		}

		hdlr.ServeHTTP(w, r)
	}
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
