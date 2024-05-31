package csrfverifier

import (
	"crypto/subtle"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/gorilla/websocket"
	"github.com/openshift/console/pkg/auth/sessions"
)

const (
	CSRFCookieName = "csrf-token"
	CSRFHeader     = "X-CSRFToken"
)

type CSRFVerifier struct {
	refererURL    *url.URL
	secureCookies bool
}

func NewCSRFVerifier(refererURL *url.URL, secureCookies bool) *CSRFVerifier {
	return &CSRFVerifier{
		secureCookies: secureCookies,
		refererURL:    refererURL,
	}
}

func (c *CSRFVerifier) SetCSRFCookie(path string, w http.ResponseWriter) {
	cookie := http.Cookie{
		Name:  CSRFCookieName,
		Value: sessions.RandomString(64),
		// JS needs to read this Cookie
		HttpOnly: false,
		Path:     path,
		Secure:   c.secureCookies,
		SameSite: http.SameSiteStrictMode,
	}

	http.SetCookie(w, &cookie)
}

func (c *CSRFVerifier) WithCSRFVerification(delegate http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := c.verifyCSRF(r); err != nil {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}

		delegate.ServeHTTP(w, r)
	}
}

func (c *CSRFVerifier) verifyCSRF(r *http.Request) error {
	switch r.Method {
	case
		"GET",
		"HEAD",
		"OPTIONS",
		"TRACE":
		return nil
	}

	wsUpgrade := websocket.IsWebSocketUpgrade(r)
	if wsUpgrade {
		if err := c.verifySourceOrigin(r); err != nil {
			return fmt.Errorf("invalid source origin: %v", err)
		}
	}

	if err := c.verifyCSRFToken(r); err != nil {
		return fmt.Errorf("invalid CSRFToken: %v", err)
	}

	return nil
}

// VerifySourceOrigin checks that the Origin request header, if present, matches the target origin. Otherwise, it checks the Referer request header.
// https://www.owasp.org/index.php/Cross-Site_Request_Forgery_(CSRF)_Prevention_Cheat_Sheet#Identifying_Source_Origin
func (c *CSRFVerifier) verifySourceOrigin(r *http.Request) (err error) {
	source := getSourceOrigin(r)
	if len(source) == 0 {
		return fmt.Errorf("no Origin or Referer header in request")
	}

	u, err := url.Parse(source)
	if err != nil {
		return err
	}

	isValid := c.refererURL.Hostname() == u.Hostname() &&
		c.refererURL.Port() == u.Port() &&
		c.refererURL.Scheme == u.Scheme &&
		// The Origin header does not have a path
		(u.Path == "" || strings.HasPrefix(u.Path, c.refererURL.Path))

	if !isValid {
		return fmt.Errorf("invalid Origin or Referer: %v expected `%v`", source, c.refererURL)
	}
	return nil
}

func (c *CSRFVerifier) verifyCSRFToken(r *http.Request) error {
	CSRFToken := r.Header.Get(CSRFHeader)
	CRSCookie, err := r.Cookie(CSRFCookieName)
	if err != nil {
		return fmt.Errorf("no CSRF Cookie found in request")
	}

	tokenBytes := []byte(CSRFToken)
	cookieBytes := []byte(CRSCookie.Value)

	if subtle.ConstantTimeCompare(tokenBytes, cookieBytes) == 1 {
		return nil
	}

	return fmt.Errorf("CSRF token does not match CSRF cookie")
}

func getSourceOrigin(r *http.Request) string {
	origin := r.Header.Get("Origin")
	if len(origin) != 0 {
		return origin
	}

	return r.Referer()
}
