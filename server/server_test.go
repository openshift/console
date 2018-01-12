package server

import (
	"github.com/coreos-inc/bridge/auth"
	"github.com/coreos/go-oidc/jose"
	"github.com/coreos/go-oidc/oidc"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
)

func TestKubeConfigTempl(t *testing.T) {
	if err := NewKubeConfigTmpl(
		"tectonic_cluster_name",
		"client_foo",
		"client_foo_secret",
		"https://k8s.example.com",
		"https://dex.example.com",
		nil, nil,
	).Execute(ioutil.Discard, "id_token", "refresh_token"); err != nil {
		t.Errorf("failed to execute template: %v", err)
	}

	if err := NewKubeConfigTmpl(
		"tectonic_cluster_name",
		"client_foo",
		"client_foo_secret",
		"https://k8s.example.com",
		"https://dex.example.com",
		[]byte("foobar"),
		[]byte("barfoo"),
	).Execute(ioutil.Discard, "id_token", "refresh_token"); err != nil {
		t.Errorf("failed to execute template: %v", err)
	}
}

func httpHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(200)
}

const validReferer string = "https://example.com/asdf/"

func makeAuthenticator(t *testing.T) http.HandlerFunc {
	errURL := "https://example.com/error"
	sucURL := "https://example.com/success"

	ccfg := oidc.ClientConfig{
		Credentials: oidc.ClientCredentials{
			ID:     "fake-client-id",
			Secret: "fake-secret",
		},
		RedirectURL: "https://example.com/callback",
	}
	a, err := auth.NewAuthenticator(ccfg, &url.URL{Scheme: "http", Host: "auth.example.com"}, errURL, sucURL, "/", validReferer)

	if err != nil {
		t.Fatal(err)
	}

	// We don't care about jwt validity for these tests
	a.TokenExtractor = auth.ConstantTokenExtractor("invalid token")
	a.TokenVerifier = func(bearer string) (auth.Token, error) {
		jwt, _ := jose.ParseJWT(bearer)
		return &jwt, nil
	}
	return authMiddleware(a, http.HandlerFunc(httpHandler))
}

func testReferer(t *testing.T, method string, referer string, status int) {
	authHandler := makeAuthenticator(t)
	w := httptest.NewRecorder()

	r, err := http.NewRequest(method, "/some-path", nil)
	if err != nil {
		t.Fatal(err)
	}

	if len(referer) > 0 {
		r.Header.Set("Referer", referer)
	}

	authHandler.ServeHTTP(w, r)

	if w.Code != status {
		t.Errorf("wrong status code for request: %v: \n%v %v %v", w.Code, method, referer, status)
	}
}

func TestReferer(t *testing.T) {
	testReferer(t, "PATCH", validReferer, 200)
	testReferer(t, "POST", validReferer, 200)
	testReferer(t, "GET", validReferer, 200)
	testReferer(t, "POST", validReferer+"other/path", 200)
	testReferer(t, "GET", "https://google.com/asdf/", 200)
	testReferer(t, "POST", validReferer+"?a=b&b=c#33", 200)
	testReferer(t, "POST", "", 401)
	testReferer(t, "POST", "http://example.com/asdf/", 403)
	testReferer(t, "POST", "http://example.com:8000/asdf/", 403)
	testReferer(t, "POST", "https://google.com/asdf/", 403)
	testReferer(t, "POST", "https://example.com/", 403)
	testReferer(t, "POST", "https://example.com/asdff/", 403)
	testReferer(t, "POST", "/asdff/", 403)
	testReferer(t, "POST", "🍆🍆🍆🍆🍆🍆", 403)
}
