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
			ref := r.Referer()
			if len(ref) == 0 {
				plog.Infof("No referer!")
				w.WriteHeader(http.StatusUnauthorized)
				return
			}
			err := a.VerifyReferer(ref)
			if err != nil {
				plog.Infof("Invalid referer %v", err)
				w.WriteHeader(http.StatusForbidden)
				return
			}

		}

		hdlr.ServeHTTP(w, r)
	}
}
