package server

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"html/template"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"path"
	"strconv"
	"time"

	"github.com/coreos/dex/api"
	"github.com/coreos/dex/connector"
	"github.com/coreos/dex/connector/ldap"
	"github.com/coreos/go-oidc/jose"
	"github.com/coreos/pkg/capnslog"
	"github.com/coreos/pkg/health"

	"github.com/coreos-inc/bridge/auth"
	"github.com/coreos-inc/bridge/pkg/proxy"
	"github.com/coreos-inc/bridge/verify"
	"github.com/coreos-inc/bridge/version"
	"github.com/coreos-inc/tectonic-licensing/license"

	"github.com/Sirupsen/logrus"
)

const (
	BridgeAPIVersion          = "v1"
	K8sAPIVersion             = "v1"
	IndexPageTemplateName     = "index.html"
	TokenizerPageTemplateName = "tokener.html"

	AuthLoginEndpoint         = "/auth/login"
	AuthLoginCallbackEndpoint = "/auth/callback"
	AuthLoginSuccessEndpoint  = "/"
	AuthLoginErrorEndpoint    = "/error"
	AuthLogoutEndpoint        = "/auth/logout"
)

var (
	plog = capnslog.NewPackageLogger("github.com/coreos-inc/bridge", "server")
)

type jsGlobals struct {
	ConsoleVersion   string `json:"consoleVersion"`
	K8sAPIVersion    string `json:"k8sAPIVersion"`
	AuthDisabled     bool   `json:"authDisabled"`
	KubectlClientID  string `json:"kubectlClientID"`
	BasePath         string `json:"basePath"`
	LoginURL         string `json:"loginURL"`
	LoginSuccessURL  string `json:"loginSuccessURL"`
	LoginErrorURL    string `json:"loginErrorURL"`
	LogoutURL        string `json:"logoutURL"`
	KubeAPIServerURL string `json:"kubeAPIServerURL"`
	ClusterName      string `json:"clusterName"`
}

type Server struct {
	K8sProxyConfig      *proxy.Config
	BaseURL             *url.URL
	PublicDir           string
	TectonicVersion     string
	TectonicLicenseFile string
	TectonicCACertFile  string
	Auther              *auth.Authenticator
	KubectlClientID     string
	ClusterName         string
	KubeAPIServerURL    string
	// Helpers for logging into kubectl and rendering kubeconfigs. These fields
	// may be nil.
	KubectlAuther                  *auth.Authenticator
	KubeConfigTmpl                 *KubeConfigTmpl
	DexClient                      api.DexClient
	NamespaceLister                *ResourceLister
	CustomResourceDefinitionLister *ResourceLister
}

func (s *Server) AuthDisabled() bool {
	return s.Auther == nil
}

func (s *Server) HTTPHandler() http.Handler {
	mux := http.NewServeMux()

	var k8sHandler http.Handler = proxy.NewProxy(s.K8sProxyConfig)
	if !s.AuthDisabled() {
		k8sHandler = authMiddleware(s.Auther, k8sHandler)
	}
	handle := func(path string, handler http.Handler) {
		mux.Handle(proxy.SingleJoiningSlash(s.BaseURL.Path, path), handler)
	}

	handleFunc := func(path string, handler http.HandlerFunc) { handle(path, handler) }

	handle("/api/kubernetes/", http.StripPrefix(proxy.SingleJoiningSlash(s.BaseURL.Path, "/api/kubernetes/"), k8sHandler))
	fn := func(loginInfo auth.LoginJSON, successURL string, w http.ResponseWriter) {
		jsg := struct {
			auth.LoginJSON  `json:",inline"`
			LoginSuccessURL string `json:"loginSuccessURL"`
		}{
			LoginJSON:       loginInfo,
			LoginSuccessURL: successURL,
		}

		tpl := template.New(TokenizerPageTemplateName)
		tpl.Delims("[[", "]]")
		tpls, err := tpl.ParseFiles(path.Join(s.PublicDir, TokenizerPageTemplateName))
		if err != nil {
			fmt.Printf("%v not found in configured public-dir path: %v", TokenizerPageTemplateName, err)
			os.Exit(1)
		}

		if err := tpls.ExecuteTemplate(w, TokenizerPageTemplateName, jsg); err != nil {
			fmt.Printf("%v", err)
			os.Exit(1)
		}
	}

	if !s.AuthDisabled() {
		handleFunc(AuthLoginEndpoint, s.Auther.LoginFunc)
		handleFunc(AuthLogoutEndpoint, s.Auther.LogoutFunc)
		handleFunc(AuthLoginCallbackEndpoint, s.Auther.CallbackFunc(fn))

		if s.KubectlAuther != nil {
			handleFunc("/api/tectonic/kubectl/code", s.KubectlAuther.LoginFunc)
			handleFunc("/api/tectonic/kubectl/config", s.handleRenderKubeConfig)
		}
	}

	handleFunc("/api/", notFoundHandler)

	staticHandler := http.StripPrefix(proxy.SingleJoiningSlash(s.BaseURL.Path, "/static/"), http.FileServer(http.Dir(s.PublicDir)))
	handle("/static/", staticHandler)

	handleFunc("/health", health.Checker{
		Checks: []health.Checkable{},
	}.ServeHTTP)

	useVersionHandler := s.versionHandler
	useValidateLicenseHandler := s.validateLicenseHandler
	useListNamespaces := s.handleListNamespaces
	useListCRDs := s.handleListCRDs
	useCertsHandler := s.certsHandler
	useClientsHandler := s.handleListClients
	useTokenRevocationHandler := s.handleTokenRevocation

	if !s.AuthDisabled() {
		useVersionHandler = authMiddleware(s.Auther, http.HandlerFunc(s.versionHandler))
		useValidateLicenseHandler = authMiddleware(s.Auther, http.HandlerFunc(s.validateLicenseHandler))
		useListNamespaces = authMiddleware(s.Auther, http.HandlerFunc(s.handleListNamespaces))
		useListCRDs = authMiddleware(s.Auther, http.HandlerFunc(s.handleListCRDs))
		useCertsHandler = authMiddleware(s.Auther, http.HandlerFunc(s.certsHandler))
		useClientsHandler = authMiddleware(s.Auther, http.HandlerFunc(s.handleListClients))
		useTokenRevocationHandler = authMiddleware(s.Auther, http.HandlerFunc(s.handleTokenRevocation))
	}

	handleFunc("/version", useVersionHandler)
	handleFunc("/license/validate", useValidateLicenseHandler)
	handleFunc("/tectonic/ldap/validate", handleLDAPVerification)
	handleFunc("/api/tectonic/namespaces", useListNamespaces)
	handleFunc("/api/tectonic/crds", useListCRDs)
	mux.HandleFunc("/tectonic/certs", useCertsHandler)
	mux.HandleFunc("/tectonic/clients", useClientsHandler)
	mux.HandleFunc("/tectonic/revoke-token", useTokenRevocationHandler)
	mux.HandleFunc(s.BaseURL.Path, s.indexHandler)

	return http.Handler(mux)
}

type apiError struct {
	Err string `json:"error"`
}

func (s *Server) handleRenderKubeConfig(w http.ResponseWriter, r *http.Request) {
	statusCode, err := func() (int, error) {
		if r.Method != "POST" {
			return http.StatusMethodNotAllowed, errors.New("not found")
		}
		if s.KubeConfigTmpl == nil {
			return http.StatusNotImplemented, errors.New("Kubeconfig generation not configured.")
		}
		oauth2Code := r.FormValue("code")
		if oauth2Code == "" {
			return http.StatusBadRequest, errors.New("No 'code' form value provided.")
		}

		token, err := s.KubectlAuther.ExchangeAuthCode(oauth2Code)
		if err != nil {
			return http.StatusInternalServerError, fmt.Errorf("Failed to exchange auth token: %v", err)
		}
		buff := new(bytes.Buffer)
		if err := s.KubeConfigTmpl.Execute(buff, token.IDToken, token.RefreshToken); err != nil {
			return http.StatusInternalServerError, fmt.Errorf("Failed to render kubeconfig: %v", err)
		}
		w.Header().Set("Content-Length", strconv.Itoa(buff.Len()))
		buff.WriteTo(w)
		return 0, nil
	}()
	if err != nil {
		sendResponse(w, statusCode, apiError{err.Error()})
	}
}

func (s *Server) indexHandler(w http.ResponseWriter, r *http.Request) {
	jsg := &jsGlobals{
		ConsoleVersion:   version.Version,
		K8sAPIVersion:    K8sAPIVersion,
		AuthDisabled:     s.AuthDisabled(),
		KubectlClientID:  s.KubectlClientID,
		BasePath:         s.BaseURL.Path,
		LoginURL:         proxy.SingleJoiningSlash(s.BaseURL.String(), AuthLoginEndpoint),
		LoginSuccessURL:  proxy.SingleJoiningSlash(s.BaseURL.String(), AuthLoginSuccessEndpoint),
		LoginErrorURL:    proxy.SingleJoiningSlash(s.BaseURL.String(), AuthLoginErrorEndpoint),
		LogoutURL:        proxy.SingleJoiningSlash(s.BaseURL.String(), AuthLogoutEndpoint),
		ClusterName:      s.ClusterName,
		KubeAPIServerURL: s.KubeAPIServerURL,
	}
	tpl := template.New(IndexPageTemplateName)
	tpl.Delims("[[", "]]")
	tpls, err := tpl.ParseFiles(path.Join(s.PublicDir, IndexPageTemplateName))
	if err != nil {
		fmt.Printf("index.html not found in configured public-dir path: %v", err)
		os.Exit(1)
	}

	if err := tpls.ExecuteTemplate(w, IndexPageTemplateName, jsg); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (s *Server) readLicense() (expiration time.Time, graceExpiration time.Time, entitlementKind string, entitlementCount int64, licenseError error) {
	licenseBytes, err := ioutil.ReadFile(s.TectonicLicenseFile)
	if err != nil {
		plog.Warning("Could not open license file.")
		return
	}

	expiration, graceExpiration, entitlementKind, entitlementCount, licenseError = verify.Verify(license.ProductionSigningPublicKey, string(licenseBytes), time.Now())
	return
}

func (s *Server) versionHandler(w http.ResponseWriter, r *http.Request) {
	expiration, graceExpiration, entitlementKind, entitlementCount, licenseError := s.readLicense()
	licenseErrorString := ""
	if licenseError != nil {
		licenseErrorString = licenseError.Error()
	}

	sendResponse(w, http.StatusOK, struct {
		Version          string    `json:"version"`
		ConsoleVersion   string    `json:"consoleVersion"`
		Expiration       time.Time `json:"expiration"`
		GraceExpiration  time.Time `json:"graceExpiration"`
		EntitlementKind  string    `json:"entitlementKind"`
		EntitlementCount int64     `json:"entitlementCount"`
		ErrorMessage     string    `json:"errorMessage"`
	}{
		Version:          s.TectonicVersion,
		ConsoleVersion:   version.Version,
		Expiration:       expiration,
		GraceExpiration:  graceExpiration,
		EntitlementKind:  entitlementKind,
		EntitlementCount: entitlementCount,
		ErrorMessage:     licenseErrorString,
	})
}

type certsInfo struct {
	CaCert struct {
		ExpirationDate int64  `json:"expirationDate"`
		ErrorMessage   string `json:"errorMessage"`
	} `json:"ca-cert"`
}

func (s *Server) certsHandler(w http.ResponseWriter, r *http.Request) {
	info := new(certsInfo)
	expiration, err := getCertExpiration(s.TectonicCACertFile)
	info.CaCert.ExpirationDate = expiration
	if err != nil {
		info.CaCert.ErrorMessage = err.Error()
		sendResponse(w, http.StatusInternalServerError, info)
		return
	}

	sendResponse(w, http.StatusOK, info)
}

// This method extracts the JWT encoded token from a request, parses it and
// returns 'sub' from the payload as user Id.
func extractUserIdFromRequest(a *auth.Authenticator, r *http.Request) (string, error) {
	userId := ""
	token, err := a.TokenExtractor(r)
	if err != nil {
		plog.Errorf("Received an error while extracting token: %v", err)
		return userId, err
	}

	jwt, err := jose.ParseJWT(token)
	if err != nil {
		plog.Errorf("Received an error while parsing token: %v", err)
		return userId, err
	}

	claims, err := jwt.Claims()
	if err != nil {
		plog.Errorf("Received an error while extracting claims: %v", err)
		return userId, err
	}

	userId, _, err = claims.StringClaim("sub")
	if err != nil {
		plog.Errorf("Received an error while extracting userId: %v", err)
		return userId, err
	}

	return userId, err
}

// Validate that a license should be used, purely based on it being
// a valid, unexpired license. Does not factor in entitlements.
func (s *Server) validateLicenseHandler(w http.ResponseWriter, r *http.Request) {
	badLicense := func(message string) {
		err := errors.New(message)
		sendResponse(w, http.StatusOK, apiError{err.Error()})
	}

	licenseBytesInBase64 := r.FormValue("license")
	licenseBytes, err := base64.StdEncoding.DecodeString(licenseBytesInBase64)
	if err != nil {
		badLicense("Invalid license encoding")
		return
	}
	licenseString := string(licenseBytes)

	now := time.Now()
	expiration, _, _, _, licenseError := verify.Verify(license.ProductionSigningPublicKey, licenseString, now)
	if licenseError != nil {
		badLicense(licenseError.Error())
		return
	}

	if expiration.Before(now) || expiration == now {
		badLicense(fmt.Sprintf("License expired on %s", expiration.Format("January 1, 2006")))
		return
	}

	sendResponse(w, http.StatusOK, struct {
		Message string `json:"message"`
	}{
		Message: "Valid license",
	})
}

func (s *Server) handleListCRDs(w http.ResponseWriter, r *http.Request) {
	bearerToken, err := auth.GetTokenBySessionCookie(r)
	if err != nil {
		plog.Printf("no bearer token found for %v: %v", r.URL.String(), err)
	}
	s.CustomResourceDefinitionLister.handleResources(bearerToken, w, r)
}

func (s *Server) handleListNamespaces(w http.ResponseWriter, r *http.Request) {
	bearerToken, err := auth.GetTokenBySessionCookie(r)
	if err != nil {
		plog.Printf("no bearer token found for %v: %v", r.URL.String(), err)
	}
	s.NamespaceLister.handleResources(bearerToken, w, r)
}

func notFoundHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotFound)
	w.Write([]byte("not found"))
}

// KubeConfigTmpl is a template which can be rendered into kubectl config file
// ready to talk to a tectonic installation.
type KubeConfigTmpl struct {
	tectonicClusterName string

	clientID     string
	clientSecret string

	k8sURL           string
	k8sCAPEMBase64ed string

	dexURL           string
	dexCAPEMBase64ed string
}

// NewKubeConfigTmpl takes the necessary arguments required to create a KubeConfigTmpl.
func NewKubeConfigTmpl(clusterName, clientID, clientSecret, k8sURL, dexURL string, k8sCA, dexCA []byte) *KubeConfigTmpl {
	encode := func(b []byte) string {
		if b == nil {
			return ""
		}
		return base64.StdEncoding.EncodeToString(b)
	}
	return &KubeConfigTmpl{
		tectonicClusterName: clusterName,
		clientID:            clientID,
		clientSecret:        clientSecret,
		k8sURL:              k8sURL,
		dexURL:              dexURL,
		k8sCAPEMBase64ed:    encode(k8sCA),
		dexCAPEMBase64ed:    encode(dexCA),
	}
}

// Execute renders a kubectl config file unqiue to an authentication session.
func (k *KubeConfigTmpl) Execute(w io.Writer, idToken, refreshToken string) error {
	data := kubeConfigTmplData{
		TectonicClusterName: k.tectonicClusterName,
		K8sCA:               k.k8sCAPEMBase64ed,
		K8sURL:              k.k8sURL,
		DexCA:               k.dexCAPEMBase64ed,
		DexURL:              k.dexURL,
		ClientID:            k.clientID,
		ClientSecret:        k.clientSecret,
		IDToken:             idToken,
		RefreshToken:        refreshToken,
	}
	return kubeConfigTmpl.Execute(w, data)
}

type kubeConfigTmplData struct {
	TectonicClusterName    string
	K8sCA, K8sURL          string
	DexCA, DexURL          string
	ClientID, ClientSecret string
	IDToken                string
	RefreshToken           string
}

var kubeConfigTmpl = template.Must(template.New("kubeConfig").Parse(`apiVersion: v1
kind: Config

clusters:
- cluster:
    server: {{ .K8sURL }}{{ if .K8sCA }}
    certificate-authority-data: {{ .K8sCA }}{{ end }}
  name: {{ .TectonicClusterName }}

users:
- name: {{ .TectonicClusterName }}-user
  user:
    auth-provider:
      config:
        client-id: {{ .ClientID }}
        client-secret: {{ .ClientSecret }}
        id-token: {{ .IDToken }}{{ if .DexCA }}
        idp-certificate-authority-data: {{ .DexCA }}{{ end }}
        idp-issuer-url: {{ .DexURL }}{{ if .RefreshToken }}
        refresh-token: {{ .RefreshToken }}{{ end }}
        extra-scopes: groups
      name: oidc

preferences: {}

contexts:
- context:
    cluster: {{ .TectonicClusterName }}
    user: {{ .TectonicClusterName }}-user
  name: {{ .TectonicClusterName }}-context

current-context: {{ .TectonicClusterName }}-context
`))

// DirectorFromTokenExtractor creates a new reverse proxy director
// that rewrites the Authorization header of the request using the
// tokenExtractor parameter.
// (see https://golang.org/src/net/http/httputil/reverseproxy.go?s=778:806)
func DirectorFromTokenExtractor(config *proxy.Config, tokenExtractor func(*http.Request) (string, error)) func(*http.Request) {
	return func(r *http.Request) {
		// At this writing, the only errors we can get from TokenExtractor
		// are benign and correct variations on "no token found"
		token, err := tokenExtractor(r)

		if err != nil {
			plog.Errorf("Received an error while extracting token: %v", err)
		} else {
			r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
		}

		// The header removal must happen after the token extraction
		// because the token extraction relies on the `Cookie` header,
		// which also happens to be the header that is removed.
		// TODO: don't blacklist the cookie
		for _, h := range config.HeaderBlacklist {
			r.Header.Del(h)
		}

		r.Host = config.Endpoint.Host
		r.URL.Host = config.Endpoint.Host
		r.URL.Path = proxy.SingleJoiningSlash(config.Endpoint.Path, r.URL.Path)
		r.URL.Scheme = config.Endpoint.Scheme
	}
}

// ldapReq is an attempt to test an LDAP configuration object for dex.
// It takes a username, password, and config object, then attempts to
// get user, email, and group information.
type ldapReq struct {
	Username string `json:"username"`
	Password string `json:"password"`

	// A full dex LDAP configuration object. Details can be found in the
	// dex source code and documentation.
	//
	// https://godoc.org/github.com/coreos/dex/connector/ldap#Config
	// https://github.com/coreos/dex/blob/master/Documentation/ldap-connector.md
	Config ldap.Config `json:"config"`
}

// On a successful LDAP verification request, the resulting user is returned.
type ldapResp struct {
	Username string   `json:"username"`
	Email    string   `json:"email"`
	Groups   []string `json:"groups"`
}

// If an error was returned, it will be in the following format.
type ldapError struct {
	Error  string `json:"error"`
	Reason string `json:"reason"`
}

func handleLDAPVerification(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		sendResponse(w, http.StatusBadRequest, &ldapError{
			Error:  "Invalid method",
			Reason: "Endpoint only responses to POSTs.",
		})
		return
	}

	var req ldapReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendResponse(w, http.StatusBadRequest, &ldapError{
			Error:  "Malformed request body",
			Reason: err.Error(),
		})
		return
	}

	resp, err := verifyLDAP(r.Context(), req)
	if err != nil {
		sendResponse(w, http.StatusOK, err)
		return
	}
	sendResponse(w, http.StatusOK, resp)
}

func verifyLDAP(ctx context.Context, req ldapReq) (*ldapResp, *ldapError) {
	logger := &logrus.Logger{
		Out:       os.Stderr,
		Formatter: &logrus.TextFormatter{DisableColors: true},
		Level:     logrus.DebugLevel,
	}
	conn, err := req.Config.OpenConnector(logger)
	if err != nil {
		return nil, &ldapError{"Invalid config fields", err.Error()}
	}

	// Only search for groups if a base dn has been specified.
	scopes := connector.Scopes{Groups: req.Config.GroupSearch.BaseDN != ""}

	ident, validPassword, err := conn.Login(ctx, scopes, req.Username, req.Password)
	if err != nil {
		return nil, &ldapError{"LDAP query failed", err.Error()}
	}
	if !validPassword {
		return nil, &ldapError{"Failed to login", "Invalid username and password combination."}
	}

	return &ldapResp{
		Username: ident.Username,
		Email:    ident.Email,
		Groups:   ident.Groups,
	}, nil
}

func (s *Server) handleTokenRevocation(w http.ResponseWriter, r *http.Request) {
	if s.DexClient == nil {
		sendResponse(w, http.StatusNotImplemented, apiError{"Failed to revoke refresh token: Dex API access not configured"})
		return
	}

	clientID := r.FormValue("clientId")
	if clientID == "" {
		sendResponse(w, http.StatusBadRequest, apiError{"Failed to revoke refresh token: client_id not provided"})
		return
	}

	userID, err := extractUserIdFromRequest(s.Auther, r)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, apiError{fmt.Sprintf("Failed to revoke refresh token: cannot extract user id from cookie: %v", err)})
		return
	}

	if userID == "" {
		sendResponse(w, http.StatusBadRequest, apiError{"Failed to revoke refresh token: user_id not provided"})
		return
	}

	req := &api.RevokeRefreshReq{
		UserId:   userID,
		ClientId: clientID,
	}

	resp, err := s.DexClient.RevokeRefresh(r.Context(), req)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, apiError{fmt.Sprintf("Failed to revoke refresh token: %v", err)})
		return
	}
	if resp.NotFound {
		sendResponse(w, http.StatusNotFound, apiError{"Failed to revoke refresh token: refresh token not found"})
		return
	}

	sendResponse(w, http.StatusOK, apiError{})
}

func (s *Server) handleListClients(w http.ResponseWriter, r *http.Request) {
	if s.DexClient == nil {
		sendResponse(w, http.StatusNotImplemented, apiError{"Failed to List Client: Dex API access not configured."})
		return
	}

	userID, err := extractUserIdFromRequest(s.Auther, r)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, apiError{fmt.Sprintf("Failed to List Client: cannot extract user id from cookie: %v", err)})
		return
	}

	if userID == "" {
		sendResponse(w, http.StatusBadRequest, apiError{"Failed to list clients: user_id not provided"})
		return
	}

	req := &api.ListRefreshReq{
		UserId: userID,
	}

	resp, err := s.DexClient.ListRefresh(r.Context(), req)
	if err != nil {
		sendResponse(w, http.StatusInternalServerError, apiError{fmt.Sprintf("Failed to list clients: %v", err)})
		return
	}

	sendResponse(w, http.StatusOK, struct {
		TokenData []*api.RefreshTokenRef `json:"token_data"`
	}{
		TokenData: resp.RefreshTokens,
	})
}
