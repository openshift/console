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
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	oidc "github.com/coreos/go-oidc"
	"golang.org/x/oauth2"

	"github.com/openshift/console/pkg/auth/sessions"
	oscrypto "github.com/openshift/library-go/pkg/crypto"

	"k8s.io/client-go/rest"
	"k8s.io/klog"
)

const (
	CSRFCookieName    = "csrf-token"
	CSRFHeader        = "X-CSRFToken"
	stateCookieName   = "login-state"
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
	// Cache HTTP clients to avoid recreating them for each request to the
	// OAuth server. The key is the ca.crt bytes cast to a string and the
	// value is a pointer to the http.Client. Keep two maps: one that
	// incldues system roots and one that doesn't.
	httpClientCache            sync.Map
	httpClientCacheSystemRoots sync.Map
)

type Authenticator struct {
	clientFunc func() *http.Client

	clientID     string
	clientSecret string
	scopes       []string

	loginMethod

	redirectURL   string
	errorURL      string
	successURL    string
	refererURL    *url.URL
	secureCookies bool

	k8sConfig *rest.Config
	metrics   *Metrics
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
	login(http.ResponseWriter, *http.Request, *oauth2.Token) (*sessions.LoginState, error)
	// Removes user token cookie, but does not write a response.
	DeleteCookie(http.ResponseWriter, *http.Request)
	// logout deletes any cookies associated with the user, and writes a no-content response.
	logout(http.ResponseWriter, *http.Request)

	// Authenticate checks if there's an authenticated session connected to the
	// request based on a cookie, and returns a user associated to the cookie
	// This does not itself perform an actual token request but it's based solely
	// on the cookie.
	Authenticate(http.ResponseWriter, *http.Request) (*User, error)
	oauth2Config() *oauth2.Config
	GetSpecialURLs() SpecialAuthURLs
}

// AuthSource allows callers to switch between Tectonic and OpenShift login support.
type AuthSource int

const (
	AuthSourceOIDC      AuthSource = 0
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
	CookiePath              string
	SecureCookies           bool
	CookieEncryptionKey     []byte
	CookieAuthenticationKey []byte

	K8sConfig *rest.Config
	Metrics   *Metrics
}

type completedConfig struct {
	*Config

	clientFunc func() *http.Client
	refererURL *url.URL
}

func newHTTPClient(issuerCA string, includeSystemRoots bool) (*http.Client, error) {
	if issuerCA == "" {
		return http.DefaultClient, nil
	}
	data, err := os.ReadFile(issuerCA)
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
			klog.Errorf("error copying system cert pool: %v", err)
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
func NewAuthenticator(ctx context.Context, config *Config) (*Authenticator, error) {
	c, err := config.Complete()
	if err != nil {
		return nil, err
	}

	a := newUnstartedAuthenticator(c)

	authConfig := &oidcConfig{
		getClient:             a.clientFunc,
		issuerURL:             c.IssuerURL,
		clientID:              c.ClientID,
		cookiePath:            c.CookiePath,
		secureCookies:         c.SecureCookies,
		constructOAuth2Config: a.oauth2ConfigConstructor,
	}

	var tokenHandler loginMethod
	switch c.AuthSource {
	case AuthSourceOpenShift:
		// TODO: once https://github.com/kubernetes/kubernetes/issues/11948 is fixed,
		// copy the transport config from c.k8sConfig with rest.CopyConfig,
		// add the c.K8SCA to it and use the roundtripper created from that config
		//
		// Use the k8s CA for OAuth metadata discovery.
		k8sClient, errK8Client := newHTTPClient(c.K8sCA, true)
		if errK8Client != nil {
			return nil, errK8Client
		}

		tokenHandler, err = newOpenShiftAuth(ctx, k8sClient, authConfig)
		if err != nil {
			return nil, err
		}
	case AuthSourceOIDC:
		sessionStore := sessions.NewSessionStore(
			c.CookieAuthenticationKey,
			c.CookieEncryptionKey,
			c.SecureCookies,
			c.CookiePath,
		)
		tokenHandler, err = newOIDCAuth(ctx, sessionStore, authConfig)
		if err != nil {
			return nil, err
		}
	default:
		return nil, fmt.Errorf("unknown auth source: %v", c.AuthSource)
	}
	a.loginMethod = tokenHandler

	return a, nil
}

func (a *Authenticator) oauth2ConfigConstructor(endpointConfig oauth2.Endpoint) *oauth2.Config {
	// rebuild non-pointer struct each time to prevent any mutation
	scopesCopy := make([]string, len(a.scopes))
	copy(scopesCopy, a.scopes)
	baseOAuth2Config := oauth2.Config{
		ClientID:     a.clientID,
		ClientSecret: a.clientSecret,
		RedirectURL:  a.redirectURL,
		Scopes:       scopesCopy,
		Endpoint:     endpointConfig,
	}

	return &baseOAuth2Config
}

func newUnstartedAuthenticator(c *completedConfig) *Authenticator {
	return &Authenticator{
		clientFunc: c.clientFunc,

		clientID:     c.ClientID,
		clientSecret: c.ClientSecret,
		scopes:       c.Scope,

		redirectURL:   c.RedirectURL,
		errorURL:      c.ErrorURL,
		successURL:    c.SuccessURL,
		refererURL:    c.refererURL,
		secureCookies: c.SecureCookies,
		k8sConfig:     c.K8sConfig,
		metrics:       c.Metrics,
	}
}

// User holds fields representing a user.
type User struct {
	ID       string
	Username string
	Token    string
}

// LoginFunc redirects to the OIDC provider for user login.
func (a *Authenticator) LoginFunc(w http.ResponseWriter, r *http.Request) {
	if a.metrics != nil {
		a.metrics.LoginRequested()
	}

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
	klog.Infof("-- Redirect request - %q", r.URL.String())
	klog.Infof("-- AuthCodeURL - %q", a.oauth2Config().AuthCodeURL(state))
	http.Redirect(w, r, a.oauth2Config().AuthCodeURL(state), http.StatusSeeOther)
}

// LogoutFunc cleans up session cookies.
func (a *Authenticator) LogoutFunc(w http.ResponseWriter, r *http.Request) {
	if a.metrics != nil {
		a.metrics.LogoutRequested(UnknownLogoutReason)
	}

	a.logout(w, r)
}

// CallbackFunc handles OAuth2 callbacks and code/token exchange.
// Requests with unexpected params are redirected to the root route.
func (a *Authenticator) CallbackFunc(fn func(loginInfo sessions.LoginJSON, successURL string, w http.ResponseWriter)) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		qErr := q.Get("error")
		qErrDesc := q.Get("error_description")
		code := q.Get("code")
		urlState := q.Get("state")

		if qErr != "" && qErrDesc != "" {
			klog.Errorf("OAuth error: %s", qErrDesc)
			a.redirectAuthError(w, qErrDesc)
			return
		}

		cookieState, err := r.Cookie(stateCookieName)
		if err != nil {
			klog.Errorf("failed to parse state cookie: %v", err)
			a.redirectAuthError(w, errorMissingState)
			return
		}

		// Lack of both `error` and `code` indicates some other redirect with no params.
		if qErr == "" && code == "" {
			http.Redirect(w, r, a.errorURL, http.StatusSeeOther)
			return
		}

		if code == "" {
			klog.Error("missing auth code in query param")
			a.redirectAuthError(w, errorMissingCode)
			return
		}

		if urlState != cookieState.Value {
			klog.Error("state in url does not match State cookie")
			a.redirectAuthError(w, errorInvalidState)
			return
		}
		ctx := oidc.ClientContext(r.Context(), a.clientFunc())
		oauthConfig := a.oauth2Config()
		token, err := oauthConfig.Exchange(ctx, code)
		if err != nil {
			klog.Errorf("unable to verify auth code with issuer: %v", err)
			a.redirectAuthError(w, errorInvalidCode)
			return
		}

		ls, err := a.login(w, r, token)
		if err != nil {
			klog.Errorf("error constructing login state: %v", err)
			a.redirectAuthError(w, errorInternal)
			return
		}

		if a.metrics != nil {
			a.metrics.LoginSuccessful(a.k8sConfig, ls)
		}

		klog.Infof("oauth success, redirecting to: %q", a.successURL)
		fn(ls.ToLoginJSON(), a.successURL, w)
	}
}

func (a *Authenticator) redirectAuthError(w http.ResponseWriter, authErr string) {
	if a.metrics != nil {
		a.metrics.LoginFailed(UnknownLoginFailureReason)
	}

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
		Value: sessions.RandomString(64),
		// JS needs to read this Cookie
		HttpOnly: false,
		Path:     path,
		Secure:   a.secureCookies,
		SameSite: http.SameSiteLaxMode,
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

func (c *Config) Complete() (*completedConfig, error) {
	completed := &completedConfig{
		Config: c,
	}

	// make sure we get a valid starting client
	fallbackClient, err := newHTTPClient(c.IssuerCA, true)
	if err != nil {
		return nil, err
	}

	clientFunc := func() *http.Client {
		currentClient, err := newHTTPClient(c.IssuerCA, true)
		if err != nil {
			klog.Errorf("failed to get latest http client: %v", err)
			return fallbackClient
		}
		return currentClient
	}
	completed.clientFunc = clientFunc

	errURL := "/"
	if c.ErrorURL != "" {
		errURL = c.ErrorURL
	}
	completed.ErrorURL = errURL

	sucURL := "/"
	if c.SuccessURL != "" {
		sucURL = c.SuccessURL
	}
	completed.SuccessURL = sucURL

	if c.CookiePath == "" {
		completed.CookiePath = "/"
	}

	refUrl, err := url.Parse(c.RefererPath)
	if err != nil {
		return nil, err
	}
	completed.refererURL = refUrl

	return completed, nil
}
