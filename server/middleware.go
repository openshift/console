package server

import (
	"fmt"
	"net/http"

	"github.com/coreos-inc/bridge/auth"
)

// Middleware generates a middleware wrapper for request hanlders.
// Responds with 401 for requests with missing/invalid/incomplete token with verified email address.
func authMiddleware(a *auth.Authenticator, hdlr http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		encTok, err := a.TokenExtractor(r)
		if err != nil {
			plog.Infof("no token found: %v", err)
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
		hdlr.ServeHTTP(w, r)
	}
}

// federationMiddleware wraps the given handler and adds a federation configuration to the contexts of all served requests.
func federationMiddleware(h http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, err := withFederationConfig(r.Context(), r)
		if err != nil {
			sendError(w, http.StatusBadRequest, err)
			return
		}
		h.ServeHTTP(w, r.WithContext(ctx))
	}
}
