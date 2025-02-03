package oauth2

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"
	"time"

	"golang.org/x/oauth2"

	authv1 "k8s.io/api/authentication/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/rest"
	"k8s.io/klog/v2"

	oauthv1client "github.com/openshift/client-go/oauth/clientset/versioned/typed/oauth/v1"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/auth/sessions"
	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/pkg/serverutils/asynccache"
)

const tokenReviewPath = "/apis/authentication.k8s.io/v1/tokenreviews"

// openShiftAuth implements OpenShift Authentication as defined in:
// https://access.redhat.com/documentation/en-us/openshift_container_platform/4.9/html/authentication_and_authorization/understanding-authentication
type openShiftAuth struct {
	*oidcConfig

	k8sClient *http.Client

	oauthEndpointCache *asynccache.AsyncCache[*oidcDiscovery]
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

func newOpenShiftAuth(ctx context.Context, k8sClient *http.Client, c *oidcConfig) (loginMethod, error) {
	o := &openShiftAuth{
		oidcConfig: c,
		k8sClient:  k8sClient,
	}

	// TODO: repeat the discovery several times as in the auth.go logic
	var err error
	o.oauthEndpointCache, err = asynccache.NewAsyncCache[*oidcDiscovery](ctx, 5*time.Minute, o.getOIDCDiscoveryInternal)
	if err != nil {
		return nil, fmt.Errorf("failed to construct OAuth endpoint cache: %w", err)
	}
	o.oauthEndpointCache.Run(ctx)

	return o, nil
}

func (o *openShiftAuth) getOIDCDiscovery() *oidcDiscovery {
	return o.oauthEndpointCache.GetItem()
}

func (o *openShiftAuth) getOIDCDiscoveryInternal(ctx context.Context) (*oidcDiscovery, error) {
	// Use metadata discovery to determine the OAuth2 token and authorization URL.
	// https://access.redhat.com/documentation/en-us/openshift_container_platform/4.9/html/authentication_and_authorization/configuring-internal-oauth#oauth-server-metadata_configuring-internal-oauth
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

	resp, err = o.getClient().Do(req.WithContext(ctx))
	if err != nil {
		return nil, fmt.Errorf("request to OAuth issuer endpoint %s failed: %v",
			metadata.Token, err)
	}
	defer resp.Body.Close()

	return metadata, nil
}

func (o *openShiftAuth) login(w http.ResponseWriter, _ *http.Request, token *oauth2.Token) (*sessions.LoginState, error) {
	if token.AccessToken == "" {
		return nil, fmt.Errorf("token response did not contain an access token %#v", token)
	}
	ls := sessions.NewRawLoginState(token.AccessToken)

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
		Name:     sessions.OpenshiftAccessTokenCookieName,
		Value:    ls.AccessToken(),
		MaxAge:   int(expiresIn),
		HttpOnly: true,
		Path:     o.cookiePath,
		Secure:   o.secureCookies,
		SameSite: http.SameSiteStrictMode,
	}

	http.SetCookie(w, &cookie)
	return ls, nil
}

// NOTE: cookies are going away, this should be removed in the future
func (o *openShiftAuth) DeleteCookie(w http.ResponseWriter, r *http.Request) {
	// Delete session cookie
	cookie := http.Cookie{
		Name:     sessions.OpenshiftAccessTokenCookieName,
		Value:    "",
		MaxAge:   -1,
		HttpOnly: true,
		Path:     o.cookiePath,
		Secure:   o.secureCookies,
	}
	http.SetCookie(w, &cookie)
}

func (o *openShiftAuth) logout(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	k8sURL, err := url.Parse(o.issuerURL)
	if err != nil {
		klog.Errorf("failed to parse the URL to kube-apiserver: %v", err)
		http.Error(w, "removing the session failed", http.StatusInternalServerError)
		return
	}

	cookie, err := r.Cookie(sessions.OpenshiftAccessTokenCookieName)
	if err != nil {
		klog.V(4).Infof("the session cookie is not present: %v", err)
		w.WriteHeader(http.StatusNoContent)
		return
	}

	configWithBearerToken := &rest.Config{
		Host:        "https://" + k8sURL.Host,
		Transport:   o.k8sClient.Transport,
		BearerToken: cookie.Value,
		Timeout:     30 * time.Second,
	}

	oauthClient, err := oauthv1client.NewForConfig(configWithBearerToken)
	if err != nil {
		klog.Infof("failed setting up the oauthaccesstokens client: %v", err)
		http.Error(w, "removing the session failed", http.StatusInternalServerError)
		return
	}
	err = oauthClient.OAuthAccessTokens().Delete(ctx, tokenToObjectName(cookie.Value), metav1.DeleteOptions{})
	if err != nil {
		http.Error(w, "removing the session failed", http.StatusInternalServerError)
		return
	}

	o.DeleteCookie(w, r)
	w.WriteHeader(http.StatusNoContent)
}

func (o *openShiftAuth) LogoutRedirectURL() string {
	return o.logoutRedirectOverride
}

func (o *openShiftAuth) reviewToken(token string) (*authv1.TokenReview, error) {
	tokenReviewURL, err := url.Parse(o.issuerURL)
	if err != nil {
		return nil, err
	}
	tokenReviewURL.Path = tokenReviewPath

	tokenReview := &authv1.TokenReview{
		TypeMeta: metav1.TypeMeta{
			APIVersion: "authentication.k8s.io/v1",
			Kind:       "TokenReview",
		},
		Spec: authv1.TokenReviewSpec{
			Token: token,
		},
	}

	tokenReviewJSON, err := json.Marshal(tokenReview)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(http.MethodPost, tokenReviewURL.String(), bytes.NewBuffer(tokenReviewJSON))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", o.internalK8sConfig.BearerToken))

	res, err := o.k8sClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("unable to validate user token: %v", res.Status)
	}

	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	// Unmarshal the response into a TokenReview object
	var responseTokenReview authv1.TokenReview
	err = json.Unmarshal(body, &responseTokenReview)
	if err != nil {
		return nil, err
	}

	// Check if the token is authenticated
	if !responseTokenReview.Status.Authenticated {
		err := fmt.Errorf("invalid token: %v", token)
		if responseTokenReview.Status.Error != "" {
			err = fmt.Errorf("invalid token: %s", responseTokenReview.Status.Error)
		}
		return nil, err
	}

	return tokenReview, nil
}

func (o *openShiftAuth) Authenticate(_ http.ResponseWriter, r *http.Request) (*auth.User, error) {
	cookie, err := r.Cookie(sessions.OpenshiftAccessTokenCookieName)
	if err != nil {
		return nil, err
	}

	if cookie.Value == "" {
		return nil, fmt.Errorf("unauthenticated, no value for cookie %s", sessions.OpenshiftAccessTokenCookieName)
	}

	if o.internalK8sConfig.BearerToken != "" {
		tokenReviewResponse, err := o.reviewToken(cookie.Value)
		if err != nil {
			klog.Errorf("failed to authenticate user token: %v", err)
			return nil, err
		}
		return &auth.User{
			Token:    cookie.Value,
			Username: tokenReviewResponse.Status.User.Username,
			ID:       tokenReviewResponse.Status.User.UID,
		}, nil
	}

	klog.V(4).Info("TokenReview skipped, no bearer token is set on internal K8s rest config")
	return &auth.User{
		Token: cookie.Value,
	}, nil
}

func (o *openShiftAuth) GetSpecialURLs() auth.SpecialAuthURLs {
	discovery := o.getOIDCDiscovery()

	// Special page on the integrated OAuth server for requesting a token.
	// TODO: We will need to implement this directly console to support external OAuth servers.
	requestTokenURL := proxy.SingleJoiningSlash(discovery.Token, "/request")
	kubeAdminLogoutURL := proxy.SingleJoiningSlash(discovery.Issuer, "/logout")

	return auth.SpecialAuthURLs{
		RequestToken:    requestTokenURL,
		KubeAdminLogout: kubeAdminLogoutURL,
	}
}

func (o *openShiftAuth) oauth2Config() *oauth2.Config {
	metadata := o.getOIDCDiscovery()

	return o.constructOAuth2Config(oauth2.Endpoint{
		AuthURL:  metadata.Auth,
		TokenURL: metadata.Token,
	})
}

func tokenToObjectName(token string) string {
	const sha256Prefix = "sha256~"

	name := strings.TrimPrefix(token, sha256Prefix)
	h := sha256.Sum256([]byte(name))
	return sha256Prefix + base64.RawURLEncoding.EncodeToString(h[0:])
}
