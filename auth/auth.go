package auth

import (
	"net/http"
	"net/url"

	"github.com/coreos/go-oidc/oidc"
	"github.com/coreos/pkg/capnslog"
)

const (
	errorInternal    = "internal_error"
	errorMissingCode = "missing_code"
	errorInvalidCode = "invalid_code"

	cookieNameToken      = "token"
	cookieNameLoginState = "state"
)

var ExtractTokenFromCookie = oidc.CookieTokenExtractor(cookieNameToken)

var log = capnslog.NewPackageLogger("github.com/coreos-inc/bridge", "auth")

type Authenticator struct {
	TokenExtractor oidc.RequestTokenExtractor
	TokenVerifier  tokenVerifier

	oidcClient *oidc.Client
	issuerURL  *url.URL
	errorURL   string
	successURL string
}

func NewAuthenticator(ccfg oidc.ClientConfig, issuerURL *url.URL, errorURL, successURL string) (*Authenticator, error) {
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

	return &Authenticator{
		TokenVerifier:  jwtVerifier(client),
		TokenExtractor: ExtractTokenFromCookie,
		oidcClient:     client,
		issuerURL:      issuerURL,
		errorURL:       errURL,
		successURL:     sucURL,
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
		a.redirectAuthError(w, errorInternal)
		return
	}

	// TODO(sym3tri): handle deep linking via state arg
	http.Redirect(w, r, oac.AuthCodeURL("", "", ""), http.StatusSeeOther)
}

// CallbackFunc handles OAuth2 callbacks and code/token exchange.
// Requests with unexpected params are redirected to the root route.
func (a *Authenticator) CallbackFunc(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	qErr := q.Get("error")
	code := q.Get("code")

	// Lack of both `error` and `code` indicates some other redirect with no params.
	if qErr == "" && code == "" {
		deleteLoginCookies(w, r)
		http.Redirect(w, r, a.errorURL, http.StatusSeeOther)
		return
	}

	if code == "" {
		log.Infof("missing auth code in query param")
		a.redirectAuthError(w, errorMissingCode)
		return
	}

	// NOTE: token is verified here
	jwt, err := a.oidcClient.ExchangeAuthCode(code)
	if err != nil {
		log.Infof("unable to verify auth code with issuer: %v", err)
		a.redirectAuthError(w, errorInvalidCode)
		return
	}

	ls, err := newLoginState(&jwt)
	if err != nil {
		log.Errorf("error constructing login state: %v", err)
		a.redirectAuthError(w, errorInternal)
		return
	}
	http.SetCookie(w, ls.tokenCookie())

	sc, err := ls.stateCookie()
	if err != nil {
		log.Infof("error setting login state cookie: %v", err)
		a.redirectAuthError(w, errorInternal)
		return
	}

	log.Infof("oauth success, redirecting to: %q", a.successURL)

	http.SetCookie(w, sc)
	// TODO(sym3tri): handle deep linking via state arg
	http.Redirect(w, r, a.successURL, http.StatusSeeOther)
}

func (a *Authenticator) LogoutFunc(w http.ResponseWriter, r *http.Request) {
	deleteLoginCookies(w, r)
	w.WriteHeader(http.StatusOK)
}

func (a *Authenticator) redirectAuthError(w http.ResponseWriter, authErr string) {
	u := url.URL{Path: a.errorURL}
	q := url.Values{}
	q.Set("error", authErr)
	q.Set("error_type", "auth")
	u.RawQuery = q.Encode()
	w.Header().Set("Location", u.String())
	w.WriteHeader(http.StatusSeeOther)
}
