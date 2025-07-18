package oauth2

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"golang.org/x/oauth2"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/rest"
	"k8s.io/klog/v2"

	oauthv1client "github.com/openshift/client-go/oauth/clientset/versioned/typed/oauth/v1"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/auth/sessions"
	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/pkg/serverutils/asynccache"
	"github.com/openshift/console/pkg/utils"
)

// openShiftAuth implements OpenShift Authentication as defined in:
// https://access.redhat.com/documentation/en-us/openshift_container_platform/4.9/html/authentication_and_authorization/understanding-authentication
type openShiftAuth struct {
	*oidcConfig

	k8sClient *http.Client

	oauthEndpointCache *asynccache.AsyncCache[*oidcDiscovery]
	sessions           *sessions.CombinedSessionStore
	refreshLock        sync.Map
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

	var err error
	// TODO: repeat the discovery several times as in the auth.go logic
	o.oauthEndpointCache, err = asynccache.NewAsyncCache[*oidcDiscovery](ctx, 5*time.Minute, o.getOIDCDiscoveryInternal)
	if err != nil {
		return nil, fmt.Errorf("failed to construct OAuth endpoint cache: %w", err)
	}
	o.oauthEndpointCache.Run(ctx)

	authnKey, err := utils.RandomString(64)
	if err != nil {
		return nil, err
	}

	encryptionKey, err := utils.RandomString(32)
	if err != nil {
		return nil, err
	}

	o.sessions = sessions.NewSessionStore(
		[]byte(authnKey),
		[]byte(encryptionKey),
		c.secureCookies,
		c.cookiePath,
		c.sessionDir,
	)

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

func (o *openShiftAuth) login(w http.ResponseWriter, r *http.Request, token *oauth2.Token) (*sessions.LoginState, error) {
	if token.AccessToken == "" {
		return nil, fmt.Errorf("token response did not contain an access token %#v", token)
	}

	ls, err := o.sessions.AddSession(w, r, nil, token)
	if err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	return ls, nil
}

func (o *openShiftAuth) DeleteSession(w http.ResponseWriter, r *http.Request) {
	o.sessions.DeleteSession(w, r)
}

func (o *openShiftAuth) logout(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	k8sURL, err := url.Parse(o.issuerURL)
	if err != nil {
		klog.Errorf("failed to parse the URL to kube-apiserver: %v", err)
		http.Error(w, "removing the session failed", http.StatusInternalServerError)
		return
	}

	ls, err := o.getLoginState(w, r)
	if err != nil {
		klog.Errorf("error logging out: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	token := ls.AccessToken()

	configWithBearerToken := &rest.Config{
		Host:        "https://" + k8sURL.Host,
		Transport:   o.k8sClient.Transport,
		BearerToken: token,
		Timeout:     30 * time.Second,
	}

	oauthClient, err := oauthv1client.NewForConfig(configWithBearerToken)
	if err != nil {
		klog.Infof("failed setting up the oauthaccesstokens client: %v", err)
		http.Error(w, "removing the session failed", http.StatusInternalServerError)
		return
	}
	err = oauthClient.OAuthAccessTokens().Delete(ctx, tokenToObjectName(token), metav1.DeleteOptions{})
	if err != nil {
		http.Error(w, "removing the session failed", http.StatusInternalServerError)
		return
	}

	//  Delete the session
	o.sessions.DeleteSession(w, r)
	w.WriteHeader(http.StatusNoContent)
}

func (o *openShiftAuth) refreshSession(ctx context.Context, w http.ResponseWriter, r *http.Request, oauthConfig *oauth2.Config, cookieRefreshToken string) (*sessions.LoginState, error) {
	actual, _ := o.refreshLock.LoadOrStore(cookieRefreshToken, &sync.Mutex{})
	actual.(*sync.Mutex).Lock()
	defer actual.(*sync.Mutex).Unlock()

	session, err := o.sessions.GetSession(w, r)
	if err != nil {
		return nil, err
	}

	// if the refresh token got changed by someone else in the meantime (guarded by the refreshLock),
	//  use the most current session instead of doing the full token refresh
	if session != nil && session.RefreshToken() != cookieRefreshToken {
		o.sessions.UpdateCookieRefreshToken(w, r, session.RefreshToken()) // we must update our own client session, too!
		return session, nil
	}

	newTokens, err := oauthConfig.TokenSource(
		context.WithValue(ctx, oauth2.HTTPClient, o.getClient()), // supply our client with custom trust
		&oauth2.Token{RefreshToken: cookieRefreshToken},
	).Token()

	if err != nil {
		return nil, fmt.Errorf("failed to refresh a token %s: %w", cookieRefreshToken, err)
	}

	ls, err := o.sessions.UpdateTokens(w, r, nil, newTokens)
	if err != nil {
		return nil, fmt.Errorf("failed to update session tokens: %w", err)
	}

	return ls, nil
}

func (o *openShiftAuth) getLoginState(w http.ResponseWriter, r *http.Request) (*sessions.LoginState, error) {
	ls, err := o.sessions.GetSession(w, r)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve login state: %v", err)
	}

	if ls == nil || ls.ShouldRotate() {
		if refreshToken := o.sessions.GetCookieRefreshToken(r); refreshToken != "" {
			return o.refreshSession(r.Context(), w, r, o.oauth2Config(), refreshToken)
		}

		return nil, fmt.Errorf("a session was not found on server or is expired")
	}
	return ls, nil
}

func (o *openShiftAuth) LogoutRedirectURL() string {
	return o.logoutRedirectOverride
}

func (o *openShiftAuth) Authenticate(w http.ResponseWriter, r *http.Request) (*auth.User, error) {
	ls, err := o.getLoginState(w, r)
	if err != nil {
		return nil, fmt.Errorf("authentication error: %w", err)
	}

	if ls == nil {
		return nil, fmt.Errorf("user not authenticated")
	}

	return &auth.User{
		Token: ls.AccessToken(),
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
