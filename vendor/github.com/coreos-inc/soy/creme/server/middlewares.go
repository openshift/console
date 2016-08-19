package server

import (
	"errors"
	"net/http"

	"github.com/coreos/pkg/health"
	httprouter "gopkg.in/julienschmidt/httprouter.v1"

	"github.com/coreos-inc/soy/creme/middleware"
)

// AuthMiddleware generates a middleware wrapper for request handlers.
// Responds with 401 for requests with missing/invalid/incomplete token with verified email address.
func AuthMiddleware(cm *middleware.Manager, a *Authenticator) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		ls, err := a.LoginState(r)
		if err != nil {
			cm.SetError(r, PublicError{
				HTTPStatus: http.StatusUnauthorized,
				Inner:      err,
			})
			return
		}

		if ls.Email == "" {
			cm.SetError(r, PublicError{
				HTTPStatus: http.StatusUnauthorized,
				Inner:      errors.New("missing email claim"),
			})
			return
		}

		if !ls.EmailVerified {
			cm.SetError(r, PublicError{
				HTTPStatus: http.StatusUnauthorized,
				Inner:      errors.New("email unverified"),
			})
			return
		}

		cm.SetValue(r, ctxKeyLoginState, *ls)
	}
}

// AuthUnverifiedEmailMiddleware generates a middleware wrapper for request handlers.
// Responds with 401 for requests with missing/invalid/incomplete token, but allows tokens with an unverified email address.
func AuthUnverifiedEmailMiddleware(cm *middleware.Manager, a *Authenticator) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		ls, err := a.LoginState(r)
		if err != nil {
			cm.SetError(r, PublicError{
				HTTPStatus: http.StatusUnauthorized,
				Inner:      err,
			})
			return
		}

		if ls.Email == "" {
			cm.SetError(r, PublicError{
				HTTPStatus: http.StatusUnauthorized,
				Inner:      errors.New("missing email claim"),
			})
			return
		}

		cm.SetValue(r, ctxKeyLoginState, *ls)
	}
}

func LoggerMiddleware() httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		plog.Debugf("Request: %s %s", r.Method, r.URL.String())
	}
}

func HealthCheckSuccessMiddleware(cm *middleware.Manager, checks []health.Checkable) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		if err := health.Check(checks); err != nil {
			cm.SetError(r, PublicError{
				HTTPStatus: http.StatusServiceUnavailable,
				Inner:      err,
			})
			return
		}
	}
}
