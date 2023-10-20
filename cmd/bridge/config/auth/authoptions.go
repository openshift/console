package auth

import (
	"context"
	"flag"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/bridge"
	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/pkg/server"
	"github.com/openshift/console/pkg/serverconfig"
	"k8s.io/client-go/rest"
	"k8s.io/klog"
)

type AuthOptions struct {
	AuthType string

	IssuerURL            string
	ClientID             string
	ClientSecret         string
	ClientSecretFilePath string
	CAFilePath           string

	InactivityTimeoutSeconds int
	LogoutRedirect           string
}

func NewAuthOptions() *AuthOptions {
	return &AuthOptions{}
}

func (c *AuthOptions) AddFlags(fs *flag.FlagSet) {
	fs.StringVar(&c.AuthType, "user-auth", "", "User authentication provider type. Possible values: disabled, oidc, openshift. Defaults to 'openshift'")
	fs.StringVar(&c.IssuerURL, "user-auth-oidc-issuer-url", "", "The OIDC/OAuth2 issuer URL.")
	fs.StringVar(&c.ClientID, "user-auth-oidc-client-id", "", "The OIDC OAuth2 Client ID.")
	fs.StringVar(&c.ClientSecret, "user-auth-oidc-client-secret", "", "The OIDC OAuth2 Client Secret.")
	fs.StringVar(&c.ClientSecretFilePath, "user-auth-oidc-client-secret-file", "", "File containing the OIDC OAuth2 Client Secret.")
	fs.StringVar(&c.CAFilePath, "user-auth-oidc-ca-file", "", "Path to a PEM file for the OIDC/OAuth2 issuer CA.")

	fs.IntVar(&c.InactivityTimeoutSeconds, "inactivity-timeout", 0, "Number of seconds, after which user will be logged out if inactive. Ignored if less than 300 seconds (5 minutes).")
	fs.StringVar(&c.LogoutRedirect, "user-auth-logout-redirect", "", "Optional redirect URL on logout needed for some single sign-on identity providers.")
}

func (c *AuthOptions) ApplyConfig(config *serverconfig.Auth) {
	setIfUnset(&c.ClientID, config.ClientID)
	setIfUnset(&c.ClientSecretFilePath, config.ClientSecretFile)
	setIfUnset(&c.CAFilePath, config.OAuthEndpointCAFile)
	setIfUnset(&c.LogoutRedirect, config.LogoutRedirect)

	if c.InactivityTimeoutSeconds == 0 {
		c.InactivityTimeoutSeconds = config.InactivityTimeoutSeconds
	}
}

func (c *AuthOptions) Validate(k8sAuthType string) []error {
	var errs []error

	switch c.AuthType {
	case "":
		// Validate() should be called after all initialization. AuthType stayed empty,
		// default to "openshift"
		// TODO: add a `func Complete() completedAuthnOptions` and do this there
		c.AuthType = "openshift"
	case "openshift", "oidc", "disabled":
	default:
		errs = append(errs, bridge.NewInvalidFlagError("user-auth", "must be one of: oidc, openshift, disabled"))
	}

	if c.AuthType == "openshift" && c.IssuerURL != "" {
		errs = append(errs, bridge.NewInvalidFlagError("user-auth-oidc-issuer-url", "cannot be used with --user-auth=\"openshift\""))
	}

	if c.AuthType == "oidc" {
		if _, err := bridge.ValidateFlagIsURL("user-auth-oidc-issuer-url", c.IssuerURL, false); err != nil {
			errs = append(errs, err)
		}
	}

	if _, err := bridge.ValidateFlagIsURL("user-auth-logout-redirect", c.LogoutRedirect, true); err != nil {
		errs = append(errs, err)
	}

	if c.InactivityTimeoutSeconds > 0 && c.InactivityTimeoutSeconds < 300 {
		klog.Warning("Flag inactivity-timeout is set to less then 300 seconds and will be ignored!")
		c.InactivityTimeoutSeconds = 0
	} else {
		switch k8sAuthType {
		case "oidc", "openshift":
			klog.Infof("Setting user inactivity timout to %d seconds", c.InactivityTimeoutSeconds)
		default:
			errs = append(errs, bridge.NewInvalidFlagError("inactivity-timeout", "In order to activate the user inactivity timout, flag --user-auth must be one of: oidc, openshift"))
		}
	}

	return errs
}

func (c *AuthOptions) ApplyTo(
	srv *server.Server,
	k8sEndpoint *url.URL,
	pubAPIServerEndpoint string,
	caCertFilePath string,
) error {
	srv.InactivityTimeout = c.InactivityTimeoutSeconds

	if len(c.LogoutRedirect) > 0 {
		logoutURL, err := url.Parse(c.LogoutRedirect)
		if err != nil {
			return fmt.Errorf("invalid logout redirect URL: %w", err)
		}
		srv.LogoutRedirect = logoutURL
	}

	var err error
	srv.Authenticator, err = c.getAuthenticator(
		srv.BaseURL,
		k8sEndpoint,
		pubAPIServerEndpoint,
		caCertFilePath,
		srv.K8sClient.Transport,
	)
	if err != nil {
		return err
	}

	return nil
}

func (c *AuthOptions) getAuthenticator(
	baseURL *url.URL,
	k8sEndpoint *url.URL,
	pubAPIServerEndpoint string,
	caCertFilePath string,
	k8sTransport http.RoundTripper,
) (*auth.Authenticator, error) {

	if c.AuthType == "disabled" {
		klog.Warning("running with AUTHENTICATION DISABLED!")
		return nil, nil
	}

	bridge.ValidateFlagNotEmpty("base-address", baseURL.String())

	var (
		err                      error
		userAuthOIDCIssuerURL    *url.URL
		authLoginErrorEndpoint   = proxy.SingleJoiningSlash(baseURL.String(), server.AuthLoginErrorEndpoint)
		authLoginSuccessEndpoint = proxy.SingleJoiningSlash(baseURL.String(), server.AuthLoginSuccessEndpoint)
		oidcClientSecret         = c.ClientSecret
		// Abstraction leak required by NewAuthenticator. We only want the browser to send the auth token for paths starting with basePath/api.
		cookiePath       = proxy.SingleJoiningSlash(baseURL.Path, "/api/")
		refererPath      = baseURL.String()
		useSecureCookies = baseURL.Scheme == "https"
	)

	if err := bridge.ValidateFlagNotEmpty("user-auth-oidc-client-id", c.ClientID); err != nil {
		return nil, err
	}

	if c.ClientSecret == "" && c.ClientSecretFilePath == "" {
		fmt.Fprintln(os.Stderr, "Must provide either --user-auth-oidc-client-secret or --user-auth-oidc-client-secret-file")
		os.Exit(1)
	}

	if c.ClientSecret != "" && c.ClientSecretFilePath != "" {
		fmt.Fprintln(os.Stderr, "Cannot provide both --user-auth-oidc-client-secret and --user-auth-oidc-client-secret-file")
		os.Exit(1)
	}

	scopes := []string{"openid", "email", "profile", "groups"}
	authSource := auth.AuthSourceTectonic

	if c.AuthType == "openshift" {
		// Scopes come from OpenShift documentation
		// https://access.redhat.com/documentation/en-us/openshift_container_platform/4.9/html/authentication_and_authorization/using-service-accounts-as-oauth-client
		//
		// TODO(ericchiang): Support other scopes like view only permissions.
		scopes = []string{"user:full"}
		authSource = auth.AuthSourceOpenShift

		userAuthOIDCIssuerURL = k8sEndpoint
	} else {
		userAuthOIDCIssuerURL, err = url.Parse(c.IssuerURL)
		if err != nil {
			return nil, fmt.Errorf("failed to parse issuer URL: %w", err)
		}

	}

	if c.ClientSecretFilePath != "" {
		buf, err := ioutil.ReadFile(c.ClientSecretFilePath)
		if err != nil {
			klog.Fatalf("Failed to read client secret file: %v", err)
		}
		oidcClientSecret = string(buf)
	}

	// Config for logging into console.
	oidcClientConfig := &auth.Config{
		AuthSource:   authSource,
		IssuerURL:    userAuthOIDCIssuerURL.String(),
		IssuerCA:     c.CAFilePath,
		ClientID:     c.ClientID,
		ClientSecret: oidcClientSecret,
		RedirectURL:  proxy.SingleJoiningSlash(baseURL.String(), server.AuthLoginCallbackEndpoint),
		Scope:        scopes,

		// Use the k8s CA file for OpenShift OAuth metadata discovery.
		// This might be different than IssuerCA.
		K8sCA: caCertFilePath,

		ErrorURL:   authLoginErrorEndpoint,
		SuccessURL: authLoginSuccessEndpoint,

		CookiePath:    cookiePath,
		RefererPath:   refererPath,
		SecureCookies: useSecureCookies,

		K8sConfig: &rest.Config{
			Host:      pubAPIServerEndpoint,
			Transport: k8sTransport,
		},
	}

	authenticator, err := auth.NewAuthenticator(context.Background(), oidcClientConfig)
	if err != nil {
		klog.Fatalf("Error initializing authenticator: %v", err)
	}

	return authenticator, nil
}

func setIfUnset(flagVal *string, val string) {
	if len(*flagVal) == 0 {
		*flagVal = val
	}
}
