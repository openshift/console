package csrfverifier

import (
	"net/http"
	"net/url"
	"testing"

	"github.com/stretchr/testify/require"
)

const validReferer string = "https://example.com/asdf/"

func testReferer(t *testing.T, referer string, accept bool) {
	refererURL, err := url.Parse(validReferer)
	require.NoError(t, err)

	a := CSRFVerifier{refererURL: refererURL}

	r, err := http.NewRequest("POST", "/some-path", nil)

	if err != nil {
		t.Fatal(err)
		return
	}

	if len(referer) > 0 {
		r.Header.Set("Referer", referer)
	}

	err = a.verifySourceOrigin(r)

	if err != nil && accept {
		t.Errorf("Unexpected error for referer `%v`:\n%v", referer, err)
		return
	}

	if err == nil && !accept {
		t.Errorf("Unexpected pass for referer: `%v:`\n%v", referer, err)
	}

	if accept {
		t.Logf("referer accepted %v", referer)
	} else {
		t.Logf("referer rejected %v", referer)
	}
}

func TestReferer(t *testing.T) {
	testReferer(t, validReferer, true)
	testReferer(t, validReferer, true)
	testReferer(t, validReferer, true)
	testReferer(t, validReferer+"other/path", true)
	testReferer(t, validReferer+"?a=b&b=c#33", true)
	testReferer(t, "", false)
	testReferer(t, "http://example.com/asdf/", false)
	testReferer(t, "http://example.com:8000/asdf/", false)
	testReferer(t, "https://google.com/asdf/", false)
	testReferer(t, "https://example.com/", false)
	testReferer(t, "https://example.com/asdff/", false)
	testReferer(t, "/asdff/", false)
	testReferer(t, "🍆🍆🍆🍆🍆🍆", false)
	testReferer(t, "https://google.com/asdf/", false)
}

func testCSRF(t *testing.T, token string, cookie string, accept bool) {
	a := CSRFVerifier{secureCookies: false}

	r, err := http.NewRequest("POST", "/some-path", nil)

	if err != nil {
		t.Fatal(err)
		return
	}

	if len(cookie) > 0 {
		r.Header.Set(CSRFHeader, token)
		r.AddCookie(&http.Cookie{
			Name:     CSRFCookieName,
			Value:    cookie,
			MaxAge:   1000000,
			HttpOnly: true,
			Path:     "/",
		})
	}

	err = a.verifyCSRFToken(r)

	if err != nil && accept {
		t.Errorf("Unexpected error for CSRF `%v//%v`:\n%v", token, cookie, err)
		return
	}

	if err == nil && !accept {
		t.Errorf("Unexpected pass  for CSRF `%v//%v`:\n%v", token, cookie, err)
	}

	if accept {
		t.Logf("CSRF accepted `%v` / `%v`", cookie, token)
	} else {
		t.Logf("CSRF rejected `%v` / `%v`", cookie, token)
	}
}
func TestCSRF(t *testing.T) {
	testCSRF(t, "a", "a", true)
	testCSRF(t, "a", "b", false)
	testCSRF(t, "a", "", false)
	testCSRF(t, "", "b", false)
	testCSRF(t, "", "", false)
}
