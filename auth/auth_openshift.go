package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"golang.org/x/oauth2"
)

// openShiftAuth implements OpenShift Authentication as defined in:
// https://docs.openshift.com/container-platform/3.9/architecture/additional_concepts/authentication.html
type openShiftAuth struct {
	cookiePath    string
	secureCookies bool
}

type openShiftConfig struct {
	client        *http.Client
	issuerURL     string
	cookiePath    string
	secureCookies bool
}

func newOpenShiftAuth(ctx context.Context, c *openShiftConfig) (oauth2.Endpoint, *openShiftAuth, error) {
	// Use metadata discovery to determine the OAuth2 token and authorization URL.
	// https://docs.openshift.com/container-platform/3.9/architecture/additional_concepts/authentication.html#oauth-server-metadata
	wellKnownURL := strings.TrimSuffix(c.issuerURL, "/") + "/.well-known/oauth-authorization-server"

	req, err := http.NewRequest(http.MethodGet, wellKnownURL, nil)
	if err != nil {
		return oauth2.Endpoint{}, nil, err
	}

	resp, err := c.client.Do(req.WithContext(ctx))
	if err != nil {
		return oauth2.Endpoint{}, nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode/100 != 2 {
		return oauth2.Endpoint{}, nil, fmt.Errorf("discovery through endpoint %s failed: %s",
			wellKnownURL, resp.Status)
	}

	var metadata struct {
		Auth  string `json:"authorization_endpoint"`
		Token string `json:"token_endpoint"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&metadata); err != nil {
		return oauth2.Endpoint{}, nil, fmt.Errorf("discovery through endpoint %s failed to decode body: %v",
			wellKnownURL, err)
	}

	return oauth2.Endpoint{
		AuthURL:  metadata.Auth,
		TokenURL: metadata.Token,
	}, &openShiftAuth{c.cookiePath, c.secureCookies}, nil

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
		Name:     openshiftSessionCookieName,
		Value:    ls.rawToken,
		MaxAge:   int(expiresIn),
		HttpOnly: true,
		Path:     o.cookiePath,
		Secure:   o.secureCookies,
	}

	http.SetCookie(w, &cookie)
	return ls, nil
}

func (o *openShiftAuth) logout(w http.ResponseWriter, r *http.Request) {
	// NOTE: cookies are going away, this should be removed in the future

	// Delete session cookie
	cookie := http.Cookie{
		Name:     openshiftSessionCookieName,
		Value:    "",
		MaxAge:   0,
		HttpOnly: true,
		Path:     o.cookiePath,
		Secure:   o.secureCookies,
	}
	http.SetCookie(w, &cookie)
	w.WriteHeader(http.StatusNoContent)
}

func (o *openShiftAuth) authenticate(r *http.Request) (*User, error) {
	// TODO: This doesn't do any validation of the cookie with the assumption that the
	// API server will reject tokens it doesn't recognize. If we want to keep some backend
	// state we should sign this cookie. If not there's not much we can do.
	cookie, err := r.Cookie(openshiftSessionCookieName)
	if err != nil {
		return nil, err
	}
	if cookie.Value == "" {
		return nil, fmt.Errorf("unauthenticated")
	}

	return &User{
		Token: cookie.Value,
	}, nil
}
