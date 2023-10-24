package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"golang.org/x/oauth2"

	"github.com/openshift/console/pkg/proxy"
)

// openShiftAuth implements OpenShift Authentication as defined in:
// https://access.redhat.com/documentation/en-us/openshift_container_platform/4.9/html/authentication_and_authorization/understanding-authentication
type openShiftAuth struct {
	issuerURL     string
	cookiePath    string
	secureCookies bool
	k8sClient     *http.Client
	client        *http.Client
}

type oidcDiscovery struct {
	Issuer string `json:"issuer"`
	Auth   string `json:"authorization_endpoint"`
	Token  string `json:"token_endpoint"`
}

func validateAbsURL(value string) error {
	ur, err := url.Parse(value)
	if err != nil {
		return err
	}

	if ur == nil || ur.String() == "" || ur.Scheme == "" || ur.Host == "" {
		return fmt.Errorf("url is not absolute: %v", ur)
	}

	return nil
}

func newOpenShiftAuth(ctx context.Context, k8sClient *http.Client, c *oidcConfig) (oauth2.Endpoint, loginMethod, error) {
	o := &openShiftAuth{
		issuerURL:     c.issuerURL,
		cookiePath:    c.cookiePath,
		secureCookies: c.secureCookies,
		k8sClient:     k8sClient,
		client:        c.client,
	}

	// TODO: repeat the discovery several times as in the auth.go logic
	metadata, err := o.getOIDCDiscovery(ctx)
	if err != nil {
		return oauth2.Endpoint{}, nil, err
	}

	return oauth2.Endpoint{
		AuthURL:  metadata.Auth,
		TokenURL: metadata.Token,
	}, o, nil
}

func (o *openShiftAuth) getOIDCDiscovery(ctx context.Context) (*oidcDiscovery, error) {
	// Use metadata discovery to determine the OAuth2 token and authorization URL.
	// https://access.redhat.com/documentation/en-us/openshift_container_platform/4.9/html/authentication_and_authorization/configuring-internal-oauth#oauth-server-metadata_configuring-internal-oauth
	// FIXME: this all belongs to `login()``
	wellKnownURL := strings.TrimSuffix(o.issuerURL, "/") + "/.well-known/oauth-authorization-server"

	req, err := http.NewRequest(http.MethodGet, wellKnownURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := o.k8sClient.Do(req.WithContext(ctx))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode/100 != 2 {
		return nil, fmt.Errorf("discovery through endpoint %s failed: %s",
			wellKnownURL, resp.Status)
	}

	metadata := &oidcDiscovery{}
	if err := json.NewDecoder(resp.Body).Decode(metadata); err != nil {
		return nil, fmt.Errorf("discovery through endpoint %s failed to decode body: %v",
			wellKnownURL, err)
	}

	if err := validateAbsURL(metadata.Issuer); err != nil {
		return nil, err
	}

	if err := validateAbsURL(metadata.Auth); err != nil {
		return nil, err
	}

	if err := validateAbsURL(metadata.Token); err != nil {
		return nil, err
	}

	// Make sure we can talk to the issuer endpoint.
	req, err = http.NewRequest(http.MethodHead, metadata.Issuer, nil)
	if err != nil {
		return nil, err
	}

	resp, err = o.client.Do(req.WithContext(ctx))
	if err != nil {
		return nil, fmt.Errorf("request to OAuth issuer endpoint %s failed: %v",
			metadata.Token, err)
	}
	defer resp.Body.Close()

	return metadata, nil
}

func (o *openShiftAuth) login(w http.ResponseWriter, token *oauth2.Token) (*loginState, error) {
	if token.AccessToken == "" {
		return nil, fmt.Errorf("token response did not contain an access token %#v", token)
	}
	ls := &loginState{
		// Not clear if there's another way to fill in information like the user's name.
		rawToken: token.AccessToken,
	}

	expiresIn := (time.Hour * 24).Seconds()
	if !token.Expiry.IsZero() {
		expiresIn = token.Expiry.Sub(time.Now()).Seconds()
	}

	// NOTE: In Tectonic, we previously had issues with tokens being bigger than
	// cookies can handle. Since OpenShift doesn't store groups in the token, the
	// token can't grow arbitrarily big, so we assume it will always fit in a cookie
	// value.
	//
	// NOTE: in the future we'll have to avoid the use of cookies. This should likely switch to frontend
	// only logic using the OAuth2 implicit flow.
	// https://tools.ietf.org/html/rfc6749#section-4.2
	cookie := http.Cookie{
		Name:     openshiftAccessTokenCookieName,
		Value:    ls.rawToken,
		MaxAge:   int(expiresIn),
		HttpOnly: true,
		Path:     o.cookiePath,
		Secure:   o.secureCookies,
		SameSite: http.SameSiteLaxMode,
	}

	http.SetCookie(w, &cookie)
	return ls, nil
}

// NOTE: cookies are going away, this should be removed in the future
func (o *openShiftAuth) deleteCookie(w http.ResponseWriter, r *http.Request) {
	// Delete session cookie
	cookie := http.Cookie{
		Name:     openshiftAccessTokenCookieName,
		Value:    "",
		MaxAge:   0,
		HttpOnly: true,
		Path:     o.cookiePath,
		Secure:   o.secureCookies,
	}
	http.SetCookie(w, &cookie)
}

func (o *openShiftAuth) logout(w http.ResponseWriter, r *http.Request) {
	o.deleteCookie(w, r)
	w.WriteHeader(http.StatusNoContent)
}

func (o *openShiftAuth) getUser(r *http.Request) (*User, error) {
	// TODO: This doesn't do any validation of the cookie with the assumption that the
	// API server will reject tokens it doesn't recognize. If we want to keep some backend
	// state we should sign this cookie. If not there's not much we can do.
	cookie, err := r.Cookie(openshiftAccessTokenCookieName)
	if err != nil {
		return nil, err
	}
	if cookie.Value == "" {
		return nil, fmt.Errorf("unauthenticated, no value for cookie %s", openshiftAccessTokenCookieName)
	}

	return &User{
		Token: cookie.Value,
	}, nil
}

func (o *openShiftAuth) getSpecialURLs(ctx context.Context) (SpecialAuthURLs, error) {
	discovery, err := o.getOIDCDiscovery(ctx)
	if err != nil {
		return SpecialAuthURLs{}, err
	}

	// Special page on the integrated OAuth server for requesting a token.
	// TODO: We will need to implement this directly console to support external OAuth servers.
	requestTokenURL := proxy.SingleJoiningSlash(discovery.Token, "/request")
	kubeAdminLogoutURL := proxy.SingleJoiningSlash(discovery.Issuer, "/logout")

	return SpecialAuthURLs{
		RequestToken:    requestTokenURL,
		KubeAdminLogout: kubeAdminLogoutURL,
	}, nil
}

func (o *openShiftAuth) getEndpointConfig(ctx context.Context) (oauth2.Endpoint, error) {
	metadata, err := o.getOIDCDiscovery(ctx)
	if err != nil {
		return oauth2.Endpoint{}, nil
	}
	return oauth2.Endpoint{
		AuthURL:  metadata.Auth,
		TokenURL: metadata.Token,
	}, nil
}
