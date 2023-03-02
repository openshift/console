package metrics

import "net/http"

func AddHeaderAsCookieMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Requests from prometheus-k8s have the access token in headers instead of cookies.
		// This allows metric requests with proper tokens in either headers or cookies.
		if r.URL.Path == "/metrics" {
			openshiftSessionCookieName := "openshift-session-token"
			openshiftSessionCookieValue := r.Header.Get("Authorization")
			r.AddCookie(&http.Cookie{Name: openshiftSessionCookieName, Value: openshiftSessionCookieValue})
		}
		next.ServeHTTP(w, r)
	})
}
