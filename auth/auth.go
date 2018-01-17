package auth

import (
	"crypto/subtle"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/coreos/dex/api"
	"github.com/coreos/go-oidc/oauth2"
	"github.com/coreos/go-oidc/oidc"
	"github.com/coreos/pkg/capnslog"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
)

const (
	CSRFCookieName   = "csrf-token"
	CSRFHeader       = "X-CSRFToken"
	errorOAuth       = "oauth_error"
	errorLoginState  = "login_state_error"
	errorCookie      = "cookie_error"
	errorInternal    = "internal_error"
	errorMissingCode = "missing_code"
	errorInvalidCode = "invalid_code"
)

var log = capnslog.NewPackageLogger("github.com/coreos-inc/bridge", "auth")

var ss = NewSessionStore(32768)

type Authenticator struct {
	TokenExtractor oidc.RequestTokenExtractor
	TokenVerifier  tokenVerifier

	oidcClient    *oidc.Client
	issuerURL     *url.URL
	errorURL      string
	successURL    string
	cookiePath    string
	refererURL    *url.URL
	secureCookies bool
}

// The trivial token "extractor" always extracts a constant string.
// s should not be the empty string, or else the Authorization header
// may end up as "Bearer ".
func ConstantTokenExtractor(s string) func(*http.Request) (string, error) {
	return func(_ *http.Request) (string, error) {
		return s, nil
	}
}

func getLoginState(r *http.Request) (*loginState, error) {
	sessionCookie, err := r.Cookie(tectonicSessionCookieName)
	if err != nil {
		return nil, err
	}
	sessionToken := sessionCookie.Value
	ls := ss.getSession(sessionToken)
	if ls == nil {
		return nil, fmt.Errorf("No session found on server")
	}
	if ls.exp.Sub(ls.now()) < 0 {
		ss.deleteSession(sessionToken)
		return nil, fmt.Errorf("Session is expired.")
	}
	return ls, nil
}

// GetTokenBySessionCookie gets the k8s bearer token from the session
func GetTokenBySessionCookie(r *http.Request) (string, error) {
	ls, err := getLoginState(r)
	if err != nil {
		return "", err
	}
	return ls.token.Encode(), nil
}

// NewAuthenticator initializes an Authenticator struct. cookiePath is an abstraction leak. (unfortunately, a necessary one.)
func NewAuthenticator(ccfg oidc.ClientConfig, issuerURL *url.URL, errorURL, successURL, cookiePath string, refererPath string, secureCookies bool) (*Authenticator, error) {
	client, err := oidc.NewClient(ccfg)
	if err != nil {
		return nil, err
	}

	errURL := "/"
	if errorURL != "" {
		errURL = errorURL
	}

	sucURL := "/"
	if successURL != "" {
		sucURL = successURL
	}

	if cookiePath == "" {
		cookiePath = "/"
	}

	refUrl, err := url.Parse(refererPath)
	if err != nil {
		return nil, err
	}

	return &Authenticator{
		TokenVerifier:  jwtVerifier(client),
		TokenExtractor: GetTokenBySessionCookie,
		oidcClient:     client,
		issuerURL:      issuerURL,
		errorURL:       errURL,
		successURL:     sucURL,
		cookiePath:     cookiePath,
		refererURL:     refUrl,
		secureCookies:  secureCookies,
	}, nil
}

// Start starts the authenticator's provider sync, and blocks until the initial sync has completed successfully.
func (a *Authenticator) Start() {
	a.oidcClient.SyncProviderConfig(a.issuerURL.String())
}

// LoginFunc redirects to the OIDC provider for user login.
func (a *Authenticator) LoginFunc(w http.ResponseWriter, r *http.Request) {
	oac, err := a.oidcClient.OAuthClient()
	if err != nil {
		log.Errorf("error generating OAuth client from OIDC client: %v", err)
		a.redirectAuthError(w, errorOAuth, err)
		return
	}

	// TODO(sym3tri): handle deep linking via state arg
	http.Redirect(w, r, oac.AuthCodeURL("", "", ""), http.StatusSeeOther)
}

// LogoutFunc cleans up session cookies.
func (a *Authenticator) LogoutFunc(w http.ResponseWriter, r *http.Request) {
	ls, _ := getLoginState(r)
	if ls != nil {
		ss.deleteSession(ls.sessionToken)
	}
	// Delete session cookie
	cookie := http.Cookie{
		Name:     tectonicSessionCookieName,
		Value:    "",
		MaxAge:   0,
		HttpOnly: true,
		Path:     a.cookiePath,
		Secure:   a.secureCookies,
	}
	http.SetCookie(w, &cookie)
	w.WriteHeader(http.StatusNoContent)
}

// ExchangeAuthCode allows callers to return a raw token response given a OAuth2
// code. This is useful for clients which need to request refresh tokens.
func (a *Authenticator) ExchangeAuthCode(code string) (oauth2.TokenResponse, error) {
	oauth2Client, err := a.oidcClient.OAuthClient()
	if err != nil {
		return oauth2.TokenResponse{}, err
	}
	return oauth2Client.RequestToken(oauth2.GrantTypeAuthCode, code)
}

// CallbackFunc handles OAuth2 callbacks and code/token exchange.
// Requests with unexpected params are redirected to the root route.
func (a *Authenticator) CallbackFunc(fn func(loginInfo LoginJSON, successURL string, w http.ResponseWriter)) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		qErr := q.Get("error")
		code := q.Get("code")

		// Lack of both `error` and `code` indicates some other redirect with no params.
		if qErr == "" && code == "" {
			http.Redirect(w, r, a.errorURL, http.StatusSeeOther)
			return
		}

		if code == "" {
			log.Infof("missing auth code in query param")
			a.redirectAuthError(w, errorMissingCode, nil)
			return
		}

		// NOTE: token is verified here
		jwt, err := a.oidcClient.ExchangeAuthCode(code)
		if err != nil {
			log.Infof("unable to verify auth code with issuer: %v", err)
			a.redirectAuthError(w, errorInvalidCode, err)
			return
		}

		ls, err := newLoginState(&jwt)
		if err != nil {
			log.Errorf("error constructing login state: %v", err)
			a.redirectAuthError(w, errorInternal, nil)
			return
		}

		err = ss.addSession(ls)
		if err != nil {
			log.Errorf("addSession error: %v", err)
			a.redirectAuthError(w, errorInternal, nil)
			return
		}
		cookie := http.Cookie{
			Name:     tectonicSessionCookieName,
			Value:    ls.sessionToken,
			MaxAge:   maxAge(ls.exp, time.Now()),
			HttpOnly: true,
			Path:     a.cookiePath,
			Secure:   a.secureCookies,
		}
		http.SetCookie(w, &cookie)

		log.Infof("oauth success, redirecting to: %q", a.successURL)
		fn(ls.toLoginJSON(), a.successURL, w)
		ss.PruneSessions()
	}
}

func (a *Authenticator) redirectAuthError(w http.ResponseWriter, authErr string, err error) {
	var u url.URL
	up, err := url.Parse(a.errorURL)
	if err != nil {
		u = url.URL{Path: a.errorURL}
	} else {
		u = *up
	}
	q := url.Values{}
	q.Set("error", authErr)
	q.Set("error_type", "auth")
	if err != nil {
		q.Set("error_msg", err.Error())
	}
	u.RawQuery = q.Encode()
	w.Header().Set("Location", u.String())
	w.WriteHeader(http.StatusSeeOther)
}

func (a *Authenticator) VerifyReferer(r *http.Request) (err error) {
	referer := r.Referer()
	if len(referer) == 0 {
		return fmt.Errorf("No referer!")
	}

	u, err := url.Parse(referer)
	if err != nil {
		return err
	}

	isValid := a.refererURL.Hostname() == u.Hostname() &&
		a.refererURL.Port() == u.Port() &&
		a.refererURL.Scheme == u.Scheme &&
		strings.HasPrefix(u.Path, a.refererURL.Path)

	if !isValid {
		return fmt.Errorf("invalid referer: %v expected `%v`", referer, a.refererURL)
	}
	return nil
}

func (a *Authenticator) SetCSRFCookie(path string, w *http.ResponseWriter) {
	cookie := http.Cookie{
		Name:  CSRFCookieName,
		Value: randomString(64),
		// JS needs to read this Cookie
		HttpOnly: false,
		Path:     path,
		Secure:   a.secureCookies,
	}
	http.SetCookie(*w, &cookie)
}

func (a *Authenticator) VerifyCSRFToken(r *http.Request) (err error) {
	CSRFToken := r.Header.Get(CSRFHeader)
	CRSCookie, err := r.Cookie(CSRFCookieName)
	if err != nil {
		return fmt.Errorf("No CSRF Cookie!")
	}

	tokenBytes := []byte(CSRFToken)
	cookieBytes := []byte(CRSCookie.Value)

	if 1 == subtle.ConstantTimeCompare(tokenBytes, cookieBytes) {
		return nil
	}

	return fmt.Errorf("CSRF token does not match CSRF cookie")
}

func NewDexClient(hostAndPort string, caCrt, clientCrt, clientKey string) (api.DexClient, error) {
	clientCert, err := tls.LoadX509KeyPair(clientCrt, clientKey)
	if err != nil {
		return nil, fmt.Errorf("invalid client crt file: %s", err)
	}

	var certPool *x509.CertPool
	if caCrt != "" {
		var caPEM []byte
		var err error

		if caPEM, err = ioutil.ReadFile(caCrt); err != nil {
			log.Fatalf("Failed to read cert file: %v", err)
		}

		certPool = x509.NewCertPool()
		if !certPool.AppendCertsFromPEM(caPEM) {
			log.Fatalf("No certs found in %q", caCrt)
		}
	}

	clientTLSConfig := &tls.Config{
		RootCAs:      certPool,
		Certificates: []tls.Certificate{clientCert},
	}
	creds := credentials.NewTLS(clientTLSConfig)

	conn, err := grpc.Dial(hostAndPort, grpc.WithTransportCredentials(creds))
	if err != nil {
		return nil, fmt.Errorf("dail: %v", err)
	}
	return api.NewDexClient(conn), nil
}
