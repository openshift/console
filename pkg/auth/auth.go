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
	"sync"
	"time"

	"github.com/coreos/dex/api"
	oidc "github.com/coreos/go-oidc"
	"github.com/coreos/pkg/capnslog"
	"golang.org/x/oauth2"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"

	oscrypto "github.com/openshift/library-go/pkg/crypto"
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

var (
	log = capnslog.NewPackageLogger("github.com/openshift/console", "auth")

	// Cache HTTP clients to avoid recreating them for each request to the
	// OAuth server. The key is the ca.crt bytes cast to a string and the
	// value is a pointer to the http.Client. Keep two maps: one that
	// incldues system roots and one that doesn't.
	httpClientCache            sync.Map
	httpClientCacheSystemRoots sync.Map
)

type Authenticator struct {
	authFunc func() (*oauth2.Config, loginMethod)

	clientFunc func() *http.Client

	// userFunc returns the User associated with the cookie from a request.
	// This is not part of loginMethod to avoid creating an unnecessary
	// HTTP client for every call.
	userFunc func(*http.Request) (*User, error)

	errorURL      string
	successURL    string
	cookiePath    string
	refererURL    *url.URL
	secureCookies bool
}

type SpecialAuthURLs struct {
	// RequestToken is a special page in the OpenShift integrated OAuth server for requesting a token.
	RequestToken string
	// KubeAdminLogout is the logout URL for the special kube:admin user in OpenShift.
	KubeAdminLogout string
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
	getSpecialURLs() SpecialAuthURLs
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

	// K8sCA is required for OpenShift OAuth metadata discovery. This is the CA
	// used to talk to the master, which might be different than the issuer CA.
	K8sCA string

	SuccessURL  string
	ErrorURL    string
	RefererPath string
	// cookiePath is an abstraction leak. (unfortunately, a necessary one.)
	CookiePath    string
	SecureCookies bool
}

func newHTTPClient(issuerCA string, includeSystemRoots bool) (*http.Client, error) {
	if issuerCA == "" {
		return http.DefaultClient, nil
	}
	data, err := ioutil.ReadFile(issuerCA)
	if err != nil {
		return nil, fmt.Errorf("load issuer CA file %s: %v", issuerCA, err)
	}

	caKey := string(data)
	var certPool *x509.CertPool
	if includeSystemRoots {
		if httpClient, ok := httpClientCacheSystemRoots.Load(caKey); ok {
			return httpClient.(*http.Client), nil
		}
		certPool, err = x509.SystemCertPool()
		if err != nil {
			log.Errorf("error copying system cert pool: %v", err)
			certPool = x509.NewCertPool()
		}
	} else {
		if httpClient, ok := httpClientCache.Load(caKey); ok {
			return httpClient.(*http.Client), nil
		}
		certPool = x509.NewCertPool()
	}
	if !certPool.AppendCertsFromPEM(data) {
		return nil, fmt.Errorf("file %s contained no CA data", issuerCA)
	}

	httpClient := &http.Client{
		Transport: &http.Transport{
			Proxy: http.ProxyFromEnvironment,
			TLSClientConfig: oscrypto.SecureTLSConfig(&tls.Config{
				RootCAs: certPool,
			}),
		},
		Timeout: time.Second * 5,
	}

	if includeSystemRoots {
		httpClientCacheSystemRoots.Store(caKey, httpClient)
	} else {
		httpClientCache.Store(caKey, httpClient)
	}

	return httpClient, nil
}

// NewAuthenticator initializes an Authenticator struct. It blocks until the authenticator is
// able to contact the provider.
func NewAuthenticator(ctx context.Context, c *Config) (*Authenticator, error) {
	// Retry connecting to the identity provider every 10s for 5 minutes
	const (
		backoff  = time.Second * 10
		maxSteps = 30
	)
	steps := 0

	for {
		a, err := newUnstartedAuthenticator(c)
		if err != nil {
			return nil, err
		}

		var authSourceFunc func() (oauth2.Endpoint, loginMethod, error)
		switch c.AuthSource {
		case AuthSourceOpenShift:
			a.userFunc = getOpenShiftUser
			authSourceFunc = func() (oauth2.Endpoint, loginMethod, error) {
				// Use the k8s CA for OAuth metadata discovery.
				// Don't include system roots when talking to the API server.
				k8sClient, errK8Client := newHTTPClient(c.K8sCA, false)
				if errK8Client != nil {
					return oauth2.Endpoint{}, nil, errK8Client
				}

				return newOpenShiftAuth(ctx, &openShiftConfig{
					k8sClient:     k8sClient,
					oauthClient:   a.clientFunc(),
					issuerURL:     c.IssuerURL,
					cookiePath:    c.CookiePath,
					secureCookies: c.SecureCookies,
				})
			}
		default:
			// OIDC auth source is stateful, so only create it once.
			endpoint, oidcAuthSource, err := newOIDCAuth(ctx, &oidcConfig{
				client:        a.clientFunc(),
				issuerURL:     c.IssuerURL,
				clientID:      c.ClientID,
				cookiePath:    c.CookiePath,
				secureCookies: c.SecureCookies,
			})
			a.userFunc = func(r *http.Request) (*User, error) {
				if oidcAuthSource == nil {
					return nil, fmt.Errorf("OIDC auth source is not intialized")
				}
				return oidcAuthSource.authenticate(r)
			}
			authSourceFunc = func() (oauth2.Endpoint, loginMethod, error) {
				return endpoint, oidcAuthSource, err
			}
		}

		fallbackEndpoint, fallbackLoginMethod, err := authSourceFunc()
		if err != nil {
			steps++
			if steps > maxSteps {
				log.Errorf("error contacting auth provider: %v", err)
				return nil, err
			}

			log.Errorf("error contacting auth provider (retrying in %s): %v", backoff, err)

			time.Sleep(backoff)
			continue
		}

		a.authFunc = func() (*oauth2.Config, loginMethod) {
			// rebuild non-pointer struct each time to prevent any mutation
			baseOAuth2Config := oauth2.Config{
				ClientID:     c.ClientID,
				ClientSecret: c.ClientSecret,
				RedirectURL:  c.RedirectURL,
				Scopes:       c.Scope,
				Endpoint:     fallbackEndpoint,
			}

			currentEndpoint, currentLoginMethod, errAuthSource := authSourceFunc()
			if errAuthSource != nil {
				log.Errorf("failed to get latest auth source data: %v", errAuthSource)
				return &baseOAuth2Config, fallbackLoginMethod
			}

			baseOAuth2Config.Endpoint = currentEndpoint
			return &baseOAuth2Config, currentLoginMethod
		}

		return a, nil
	}
}

func newUnstartedAuthenticator(c *Config) (*Authenticator, error) {
	// make sure we get a valid starting client
	fallbackClient, err := newHTTPClient(c.IssuerCA, true)
	if err != nil {
		return nil, err
	}

	clientFunc := func() *http.Client {
		currentClient, err := newHTTPClient(c.IssuerCA, true)
		if err != nil {
			log.Errorf("failed to get latest http client: %v", err)
			return fallbackClient
		}
		return currentClient
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
		clientFunc:    clientFunc,
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
	return a.userFunc(r)
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
	http.Redirect(w, r, a.getOAuth2Config().AuthCodeURL(state), http.StatusSeeOther)
}

// LogoutFunc cleans up session cookies.
func (a *Authenticator) LogoutFunc(w http.ResponseWriter, r *http.Request) {
	a.getLoginMethod().logout(w, r)
}

// GetKubeAdminLogoutURL returns the logout URL for the special kube:admin user in OpenShift
func (a *Authenticator) GetSpecialURLs() SpecialAuthURLs {
	return a.getLoginMethod().getSpecialURLs()
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
			a.redirectAuthError(w, errorMissingState)
			return
		}

		// Lack of both `error` and `code` indicates some other redirect with no params.
		if qErr == "" && code == "" {
			http.Redirect(w, r, a.errorURL, http.StatusSeeOther)
			return
		}

		if code == "" {
			log.Infof("missing auth code in query param")
			a.redirectAuthError(w, errorMissingCode)
			return
		}

		if urlState != cookieState.Value {
			log.Errorf("State in url does not match State cookie")
			a.redirectAuthError(w, errorInvalidState)
			return
		}
		ctx := oidc.ClientContext(context.TODO(), a.clientFunc())
		oauthConfig, lm := a.authFunc()
		token, err := oauthConfig.Exchange(ctx, code)
		if err != nil {
			log.Infof("unable to verify auth code with issuer: %v", err)
			a.redirectAuthError(w, errorInvalidCode)
			return
		}

		ls, err := lm.login(w, token)
		if err != nil {
			log.Errorf("error constructing login state: %v", err)
			a.redirectAuthError(w, errorInternal)
			return
		}

		log.Infof("oauth success, redirecting to: %q", a.successURL)
		fn(ls.toLoginJSON(), a.successURL, w)
	}
}

func (a *Authenticator) getOAuth2Config() *oauth2.Config {
	oauthConfig, _ := a.authFunc()
	return oauthConfig
}

func (a *Authenticator) getLoginMethod() loginMethod {
	_, lm := a.authFunc()
	return lm
}

func (a *Authenticator) redirectAuthError(w http.ResponseWriter, authErr string) {
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
	u.RawQuery = q.Encode()
	w.Header().Set("Location", u.String())
	w.WriteHeader(http.StatusSeeOther)
}

func (a *Authenticator) getSourceOrigin(r *http.Request) string {
	origin := r.Header.Get("Origin")
	if len(origin) != 0 {
		return origin
	}

	return r.Referer()
}

// VerifySourceOrigin checks that the Origin request header, if present, matches the target origin. Otherwise, it checks the Referer request header.
// https://www.owasp.org/index.php/Cross-Site_Request_Forgery_(CSRF)_Prevention_Cheat_Sheet#Identifying_Source_Origin
func (a *Authenticator) VerifySourceOrigin(r *http.Request) (err error) {
	source := a.getSourceOrigin(r)
	if len(source) == 0 {
		return fmt.Errorf("no Origin or Referer header in request")
	}

	u, err := url.Parse(source)
	if err != nil {
		return err
	}

	isValid := a.refererURL.Hostname() == u.Hostname() &&
		a.refererURL.Port() == u.Port() &&
		a.refererURL.Scheme == u.Scheme &&
		// The Origin header does not have a path
		(u.Path == "" || strings.HasPrefix(u.Path, a.refererURL.Path))

	if !isValid {
		return fmt.Errorf("invalid Origin or Referer: %v expected `%v`", source, a.refererURL)
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

	clientTLSConfig := oscrypto.SecureTLSConfig(&tls.Config{
		RootCAs:      certPool,
		Certificates: []tls.Certificate{clientCert},
	})
	creds := credentials.NewTLS(clientTLSConfig)

	conn, err := grpc.Dial(hostAndPort, grpc.WithTransportCredentials(creds))
	if err != nil {
		return nil, fmt.Errorf("dail: %v", err)
	}
	return api.NewDexClient(conn), nil
}
