package auth

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"crypto/tls"
	"crypto/x509"
	"encoding/hex"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/coreos/dex/api"
	oidc "github.com/coreos/go-oidc"
	"github.com/coreos/pkg/capnslog"
	"golang.org/x/oauth2"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
)

const (
	CSRFCookieName    = "csrf-token"
	CSRFHeader        = "X-CSRFToken"
	stateCookieName   = "state-token"
	errorOAuth        = "oauth_error"
	errorLoginState   = "login_state_error"
	errorCookie       = "cookie_error"
	errorInternal     = "internal_error"
	errorMissingCode  = "missing_code"
	errorMissingState = "missing_state"
	errorInvalidCode  = "invalid_code"
	errorInvalidState = "invalid_state"
)

var log = capnslog.NewPackageLogger("github.com/openshift/console", "auth")

type Authenticator struct {
	tokenVerifier func(string) (*loginState, error)

	oauth2Client *oauth2.Config

	client *http.Client

	errorURL      string
	successURL    string
	cookiePath    string
	refererURL    *url.URL
	secureCookies bool

	loginMethod loginMethod
}

// loginMethod is used to handle OAuth2 responses and associate bearer tokens
// with a user.
//
// This interface is largely a hack to allow both OpenShift and generic Tectonic
// support. It should not be made public or exposed to other packages.
type loginMethod interface {
	// login turns on oauth2 token response into a user session and associates a
	// cookie with the user.
	login(http.ResponseWriter, *oauth2.Token) (*loginState, error)
	// logout deletes any cookies associated with the user.
	logout(http.ResponseWriter, *http.Request)
	// authenticate fetches the bearer token from the cookie of a request.
	authenticate(*http.Request) (*User, error)
}

// AuthSource allows callers to switch between Tectonic and OpenShift login support.
type AuthSource int

const (
	AuthSourceTectonic  AuthSource = 0
	AuthSourceOpenShift AuthSource = 1
)

type Config struct {
	AuthSource AuthSource

	IssuerURL    string
	IssuerCA     string
	RedirectURL  string
	ClientID     string
	ClientSecret string
	Scope        []string

	SuccessURL  string
	ErrorURL    string
	RefererPath string
	// cookiePath is an abstraction leak. (unfortunately, a necessary one.)
	CookiePath    string
	SecureCookies bool
}

func newHTTPClient(issuerCA string) (*http.Client, error) {
	if issuerCA == "" {
		return http.DefaultClient, nil
	}
	data, err := ioutil.ReadFile(issuerCA)
	if err != nil {
		return nil, fmt.Errorf("load issuer CA file %s: %v", issuerCA, err)
	}

	certPool := x509.NewCertPool()
	if !certPool.AppendCertsFromPEM(data) {
		return nil, fmt.Errorf("file %s contained no CA data", issuerCA)
	}
	return &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				RootCAs: certPool,
			},
		},
		Timeout: time.Second * 5,
	}, nil
}

// NewAuthenticator initializes an Authenticator struct. It blocks until the authenticator is
// able to contact the provider.
func NewAuthenticator(ctx context.Context, c *Config) (*Authenticator, error) {
	a, err := newUnstartedAuthenticator(c)
	if err != nil {
		return nil, err
	}

	// Retry connecting to the identity provider a few times
	backoff := time.Second * 2
	maxSteps := 5
	steps := 0

	for {
		var (
			lm       loginMethod
			endpoint oauth2.Endpoint
			err      error
		)
		switch c.AuthSource {
		case AuthSourceOpenShift:
			endpoint, lm, err = newOpenShiftAuth(ctx, &openShiftConfig{
				client:        a.client,
				issuerURL:     c.IssuerURL,
				cookiePath:    c.CookiePath,
				secureCookies: c.SecureCookies,
			})
		default:
			endpoint, lm, err = newOIDCAuth(ctx, &oidcConfig{
				client:        a.client,
				issuerURL:     c.IssuerURL,
				clientID:      c.ClientID,
				cookiePath:    c.CookiePath,
				secureCookies: c.SecureCookies,
			})
		}
		if err != nil {
			steps++
			if steps > maxSteps {
				log.Errorf("error contacting openid connect provider: %v", err)
				return nil, err
			}

			log.Errorf("error contacting openid connect provider (retrying in %s): %v", backoff, err)

			time.Sleep(backoff)
			backoff *= 2
			continue
		}

		a.loginMethod = lm
		a.oauth2Client.Endpoint = endpoint
		return a, nil
	}
}

func newUnstartedAuthenticator(c *Config) (*Authenticator, error) {
	client, err := newHTTPClient(c.IssuerCA)
	if err != nil {
		return nil, err
	}

	oauth2Client := &oauth2.Config{
		ClientID:     c.ClientID,
		ClientSecret: c.ClientSecret,
		RedirectURL:  c.RedirectURL,
		Scopes:       c.Scope,
	}

	errURL := "/"
	if c.ErrorURL != "" {
		errURL = c.ErrorURL
	}

	sucURL := "/"
	if c.SuccessURL != "" {
		sucURL = c.SuccessURL
	}

	if c.CookiePath == "" {
		c.CookiePath = "/"
	}

	refUrl, err := url.Parse(c.RefererPath)
	if err != nil {
		return nil, err
	}

	return &Authenticator{
		oauth2Client:  oauth2Client,
		client:        client,
		errorURL:      errURL,
		successURL:    sucURL,
		cookiePath:    c.CookiePath,
		refererURL:    refUrl,
		secureCookies: c.SecureCookies,
	}, nil
}

// User holds fields representing a user.
type User struct {
	ID       string
	Username string
	Token    string
}

func (a *Authenticator) Authenticate(r *http.Request) (*User, error) {
	return a.loginMethod.authenticate(r)
}

// LoginFunc redirects to the OIDC provider for user login.
func (a *Authenticator) LoginFunc(w http.ResponseWriter, r *http.Request) {
	var randData [4]byte
	if _, err := io.ReadFull(rand.Reader, randData[:]); err != nil {
		panic(err)
	}
	state := hex.EncodeToString(randData[:])

	cookie := http.Cookie{
		Name:     stateCookieName,
		Value:    state,
		HttpOnly: true,
		Secure:   a.secureCookies,
	}
	http.SetCookie(w, &cookie)
	http.Redirect(w, r, a.oauth2Client.AuthCodeURL(state), http.StatusSeeOther)
}

// LogoutFunc cleans up session cookies.
func (a *Authenticator) LogoutFunc(w http.ResponseWriter, r *http.Request) {
	a.loginMethod.logout(w, r)
}

// ExchangeAuthCode allows callers to return a raw token response given a OAuth2
// code. This is useful for clients which need to request refresh tokens.
func (a *Authenticator) ExchangeAuthCode(code string) (idToken, refreshToken string, err error) {
	ctx := oidc.ClientContext(context.TODO(), a.client)
	token, err := a.oauth2Client.Exchange(ctx, code)
	if err != nil {
		return "", "", fmt.Errorf("request token: %v", err)
	}
	rawIDToken, _ := token.Extra("id_token").(string)
	return rawIDToken, token.RefreshToken, nil
}

// CallbackFunc handles OAuth2 callbacks and code/token exchange.
// Requests with unexpected params are redirected to the root route.
func (a *Authenticator) CallbackFunc(fn func(loginInfo LoginJSON, successURL string, w http.ResponseWriter)) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		qErr := q.Get("error")
		code := q.Get("code")
		urlState := q.Get("state")

		cookieState, err := r.Cookie(stateCookieName)
		if err != nil {
			log.Errorf("failed to parse state cookie: %v", err)
			a.redirectAuthError(w, errorMissingState, err)
			return
		}

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

		if urlState != cookieState.Value {
			log.Errorf("State in url does not match State cookie")
			a.redirectAuthError(w, errorInvalidState, nil)
			return
		}
		ctx := oidc.ClientContext(context.TODO(), a.client)
		token, err := a.oauth2Client.Exchange(ctx, code)
		if err != nil {
			log.Infof("unable to verify auth code with issuer: %v", err)
			a.redirectAuthError(w, errorInvalidCode, err)
			return
		}

		ls, err := a.loginMethod.login(w, token)
		if err != nil {
			log.Errorf("error constructing login state: %v", err)
			a.redirectAuthError(w, errorInternal, nil)
			return
		}

		log.Infof("oauth success, redirecting to: %q", a.successURL)
		fn(ls.toLoginJSON(), a.successURL, w)
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
