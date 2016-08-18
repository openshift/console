package server

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/coreos/go-oidc/jose"
	"github.com/coreos/go-oidc/oidc"
)

const (
	authErrorInternal           = "internal_error"
	authErrorMissingCode        = "missing_code"
	authErrorInvalidCode        = "invalid_code"
	authErrorInvalidToken       = "invalid_token"
	authErrorInvalidAuthCodeURL = "invalid_auth_code_url"

	cookieNameToken         = "token"
	cookieNameLoginState    = "state"
	cookieNameRepeatVisitor = "repeat-visitor"
	cookieNameDeepLink      = "next"
)

// tokenExtractor funcs extract a raw encoded token from a request.
type tokenExtractor func(r *http.Request) (string, error)

type loginSuccessHandler func(ls loginState) string

// tokenVerifier funcs parse and verify an encoded token into an actual token object.
type tokenVerifier func(string) (token, error)

type token interface {
	Claims() (jose.Claims, error)
	Encode() string
}

type AuthConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL  *url.URL
	IssuerURL    *url.URL
}

func (ac AuthConfig) Valid() error {
	if ac.ClientID == "" {
		return errors.New("invalid ClientID")
	}

	if ac.ClientSecret == "" {
		return errors.New("invalid ClientSecret")
	}

	if ac.RedirectURL.Scheme == "" || ac.RedirectURL.Host == "" {
		return errors.New("invalid RedirectURL")
	}

	if ac.IssuerURL.Scheme == "" || ac.IssuerURL.Host == "" {
		return errors.New("invalid IssuerURL")
	}

	return nil
}

// loginState represents the current login state of a user.
type loginState struct {
	Email         string `json:"email"`
	EmailVerified bool   `json:"emailVerified"`
	UserID        string `json:"userID"`
	exp           time.Time
	token         token
}

// newLoginState unpacks a token and generates a new loginState from it.
func newLoginState(tok token) (*loginState, error) {
	ls := &loginState{
		token: tok,
	}

	claims, err := tok.Claims()
	if err != nil {
		return nil, fmt.Errorf("error getting claims from token: %v", err)
	}

	exp, ok, err := claims.TimeClaim("exp")
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, errors.New("missing required exp claim")
	}
	ls.exp = exp

	e, ok, err := claims.StringClaim("email")
	if err != nil {
		return nil, err
	}
	if !ok || e == "" {
		return nil, errors.New("missig required email claim")
	}
	ls.Email = e

	ev, err := emailVerified(claims)
	if err != nil {
		return nil, err
	}
	ls.EmailVerified = ev

	sub, ok, err := claims.StringClaim("sub")
	if err != nil {
		return nil, err
	}
	if !ok || sub == "" {
		return nil, errors.New("missing required sub claim")
	}
	ls.UserID = sub

	return ls, nil
}

// TODO(sym3tri): move to authd jose pkg.
func emailVerified(claims jose.Claims) (bool, error) {
	cl, ok := claims["email_verified"]
	if !ok {
		return false, nil
	}

	v, ok := cl.(bool)
	if !ok {
		return false, errors.New("unable to parse email_verified claim as bool")
	}

	return v, nil
}

func (ls *loginState) maxAge() int {
	age := ls.exp.Sub(time.Now().UTC())
	return int(age.Seconds())
}

// stateCookie serializes the loginState to a cookie.
// This cookie is considered insecure, contains no sensitive info, and is used primarly for influencing UI decisions.
// Its expiration should match that of the auth cookie.
func (ls *loginState) stateCookie() (*http.Cookie, error) {
	enc, err := json.Marshal(&ls)
	if err != nil {
		return nil, err
	}

	return &http.Cookie{
		HttpOnly: false,
		Name:     cookieNameLoginState,
		Value:    url.QueryEscape(string(enc)),
		Path:     "/",
		MaxAge:   ls.maxAge(),
		// For old IE, ignored by most browsers.
		Expires: ls.exp,
	}, nil
}

// authCookie generates a new cookie for the user's token.
func (ls *loginState) authCookie() *http.Cookie {
	return &http.Cookie{
		HttpOnly: true,
		Name:     cookieNameToken,
		Value:    ls.token.Encode(),
		Path:     "/",
		MaxAge:   ls.maxAge(),
		// For old IE, ignored by most browsers.
		Expires: ls.exp,
	}
}

func redirectAuthError(w http.ResponseWriter, authErr string) {
	u := url.URL{Path: "/error"}
	q := url.Values{}
	q.Set("error", authErr)
	q.Set("error_type", "auth")
	u.RawQuery = q.Encode()
	plog.Infof("redirecting auth error to: %s", u.String())
	w.Header().Set("Location", u.String())
	w.WriteHeader(http.StatusSeeOther)
}

func deleteCookie(w http.ResponseWriter, name string) {
	c := &http.Cookie{
		Name:    name,
		Value:   "",
		Path:    "/",
		MaxAge:  -1,
		Expires: time.Time{},
	}
	http.SetCookie(w, c)
}

func deleteLoginCookies(w http.ResponseWriter) {
	for _, n := range []string{cookieNameToken, cookieNameLoginState} {
		deleteCookie(w, n)
	}
}

// repeatVisitorCookie generates a non-expiring cookie so we know if the user is a first-time visitor or not.
// This determines weather we bounce them to the "login" or "register" page.
func repeatVisitorCookie() *http.Cookie {
	now := time.Now()
	farFuture := now.AddDate(10, 0, 0)
	return &http.Cookie{
		HttpOnly: true,
		Name:     cookieNameRepeatVisitor,
		Value:    "",
		Path:     "/",
		MaxAge:   int(farFuture.Sub(now).Seconds()),
		// For old IE, ignored by most browsers.
		Expires: farFuture,
	}
}

func deepLinkCookie(next string) *http.Cookie {
	now := time.Now()
	exp := now.Add(12 * time.Hour)
	return &http.Cookie{
		HttpOnly: true,
		Name:     cookieNameDeepLink,
		Value:    next,
		Path:     "/",
		MaxAge:   int(exp.Sub(now).Seconds()),
		// For old IE, ignored by most browsers.
		Expires: exp,
	}
}

func cookieTokenExtractor(cookieName string) tokenExtractor {
	return func(r *http.Request) (string, error) {
		ck, err := r.Cookie(cookieName)
		if err != nil {
			return "", fmt.Errorf("token cookie not found in request: %v", err)
		}
		return ck.Value, nil
	}
}

func jwtVerifier(oidcClient *oidc.Client) tokenVerifier {
	return func(encodedToken string) (token, error) {
		jwt, err := jose.ParseJWT(encodedToken)
		if err != nil {
			return nil, err
		}

		if err = oidcClient.VerifyJWT(jwt); err != nil {
			return nil, err
		}

		return &jwt, nil
	}
}

// Authenticator is a wrapper around an OIDC client that also services all the auth endpoints.
type Authenticator struct {
	TokenExtractor      tokenExtractor
	oidcClient          *oidc.Client
	tokenVerifier       tokenVerifier
	authdClient         *http.Client
	cfg                 AuthConfig
	loginSuccessHandler loginSuccessHandler
}

func NewAuthenticator(ac AuthConfig, hdlr loginSuccessHandler) (*Authenticator, error) {
	cc := oidc.ClientCredentials{
		ID:     ac.ClientID,
		Secret: ac.ClientSecret,
	}

	ccfg := oidc.ClientConfig{
		Credentials: cc,
		RedirectURL: ac.RedirectURL.String(),
	}

	client, err := oidc.NewClient(ccfg)
	if err != nil {
		plog.Errorf("Unable to create OIDC client: %v", err)
		return nil, err
	}

	iss := ac.IssuerURL.String()
	client.SyncProviderConfig(iss)

	trans := &oidc.AuthenticatedTransport{
		TokenRefresher: &oidc.ClientCredsTokenRefresher{
			Issuer:     iss,
			OIDCClient: client,
		},
		RoundTripper: http.DefaultTransport,
	}

	return &Authenticator{
		TokenExtractor:      cookieTokenExtractor(cookieNameToken),
		cfg:                 ac,
		oidcClient:          client,
		tokenVerifier:       jwtVerifier(client),
		authdClient:         &http.Client{Transport: trans},
		loginSuccessHandler: hdlr,
	}, nil
}

func (a *Authenticator) ResendVerification(tok string) error {
	q := struct {
		Token       string `json:"token"`
		RedirectURI string `json:"redirectURI"`
	}{
		Token:       tok,
		RedirectURI: a.cfg.RedirectURL.String(),
	}
	qBytes, err := json.Marshal(&q)

	resendURL := &url.URL{}
	*resendURL = *a.cfg.IssuerURL
	resendURL.Path = "/resend-verify-email"

	res, err := a.authdClient.Post(resendURL.String(), "application/json", bytes.NewReader(qBytes))
	if err != nil {
		return err
	}

	if res.StatusCode != http.StatusOK {
		return errors.New("api responded with non 200 for resend verification request")
	}

	return nil
}

func (a *Authenticator) Healthy() error {
	return a.oidcClient.Healthy()
}

// LoginFunc redirects to the OIDC provider for user login.
func (a *Authenticator) LoginFunc(w http.ResponseWriter, r *http.Request) {
	oac, err := a.oidcClient.OAuthClient()
	if err != nil {
		plog.Errorf("error generating OAuth client from OIDC client: %v", err)
		redirectAuthError(w, authErrorInternal)
		return
	}

	next := parseNext(r.URL.Query().Get("next"))
	u, err := url.Parse(oac.AuthCodeURL(next, "", ""))
	if err != nil {
		plog.Errorf("unable to generate auth code URL: %v", err)
		redirectAuthError(w, authErrorInternal)
		return
	}

	// TODO(sym3tri): do a more robust check here
	if u.Host == "" {
		plog.Errorf("invalid auth code URL: %q, provider may be down", u.String())
		redirectAuthError(w, authErrorInvalidAuthCodeURL)
		return
	}

	if _, err = r.Cookie(cookieNameRepeatVisitor); err == nil {
		plog.Infof("%s cookie found, sending to login page", cookieNameRepeatVisitor)
	} else {
		plog.Infof("%s cookie not found, sending to registration page", cookieNameRepeatVisitor)
		q := u.Query()
		q.Set("register", "1")
		u.RawQuery = q.Encode()
	}

	http.SetCookie(w, repeatVisitorCookie())
	http.Redirect(w, r, u.String(), http.StatusFound)
}

func (a *Authenticator) LogoutFunc(w http.ResponseWriter, r *http.Request) {
	deleteLoginCookies(w)
	w.WriteHeader(http.StatusOK)
}

// CallbackFunc handles OAuth2 callbacks and code/token exchange.
// Requests with unexpected params are redirected to the root route.
func (a *Authenticator) CallbackFunc(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	qErr := q.Get("error")
	code := q.Get("code")
	next := parseNext(q.Get("state"))

	// Lack of error and code indicate email verification or other redirect with no params.
	if qErr == "" && code == "" {
		deleteLoginCookies(w)
		http.Redirect(w, r, "/", http.StatusFound)
		return
	}

	if code == "" {
		plog.Infof("missing auth code in query param")
		redirectAuthError(w, authErrorMissingCode)
		return
	}

	jwt, err := a.oidcClient.ExchangeAuthCode(code)
	if err != nil {
		plog.Infof("unable to verify auth code with issuer: %v", err)
		redirectAuthError(w, authErrorInvalidCode)
		return
	}

	ls, err := newLoginState(&jwt)
	if err != nil {
		plog.Errorf("error constructing login state: %v", err)
	}

	http.SetCookie(w, ls.authCookie())

	sc, err := ls.stateCookie()
	if err != nil {
		plog.Infof("error setting login state cookie: %v", err)
		redirectAuthError(w, authErrorInternal)
		return
	}
	http.SetCookie(w, sc)

	// Drop (or Read & Delete) cookie to allow deep linking across email verification flow.
	if ls.EmailVerified {
		nextCookie, err := r.Cookie(cookieNameDeepLink)
		if err == nil {
			next = nextCookie.Value
			plog.Debugf("found deep link cookie: %s", next)
		} else {
			plog.Warningf("error reading deep link cookie: %v", err)
		}
		deleteCookie(w, cookieNameDeepLink)
	} else if next != "/" {
		http.SetCookie(w, deepLinkCookie(next))
	}

	if a.loginSuccessHandler != nil {
		hdlrResult := a.loginSuccessHandler(*ls)
		if hdlrResult != "" {
			next = hdlrResult
			deleteLoginCookies(w)
		}
	}

	http.Redirect(w, r, next, http.StatusFound)
}

// LoginState generates a login state from a request using the configured token extractor and verifier.
func (a *Authenticator) LoginState(r *http.Request) (*loginState, error) {
	enc, err := a.TokenExtractor(r)
	if err != nil {
		return nil, err
	}

	tok, err := a.tokenVerifier(enc)
	if err != nil {
		return nil, err
	}

	return newLoginState(tok)
}

func parseNext(s string) string {
	u, err := url.Parse(s)
	if err != nil {
		plog.Warningf("error parsing next url: %v", err)
		return "/"
	}
	if u.Path == "" {
		return "/"
	}
	return u.Path
}
