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

	a := CSRFVerifier{refererURLs: []*url.URL{refererURL}}

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

func TestRefererMultipleURLs(t *testing.T) {
	primaryURL, err := url.Parse("https://console.example.com/")
	require.NoError(t, err)
	secondaryURL, err := url.Parse("https://console-alt.example.com/")
	require.NoError(t, err)
	thirdURL, err := url.Parse("https://console.internal.example.com:8443/")
	require.NoError(t, err)

	a := CSRFVerifier{refererURLs: []*url.URL{primaryURL, secondaryURL, thirdURL}}

	tests := []struct {
		name    string
		referer string
		accept  bool
	}{
		{"primary URL accepted", "https://console.example.com/", true},
		{"primary URL with path accepted", "https://console.example.com/k8s/cluster/nodes", true},
		{"secondary URL accepted", "https://console-alt.example.com/", true},
		{"secondary URL with path accepted", "https://console-alt.example.com/dashboards", true},
		{"third URL with port accepted", "https://console.internal.example.com:8443/", true},
		{"third URL with port and path accepted", "https://console.internal.example.com:8443/overview", true},
		{"unknown host rejected", "https://evil.example.com/", false},
		{"wrong scheme rejected", "http://console.example.com/", false},
		{"wrong port rejected", "https://console.example.com:9999/", false},
		{"empty referer rejected", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r, err := http.NewRequest("POST", "/some-path", nil)
			require.NoError(t, err)
			if tt.referer != "" {
				r.Header.Set("Referer", tt.referer)
			}
			err = a.verifySourceOrigin(r)
			if tt.accept {
				require.NoError(t, err, "expected referer %q to be accepted", tt.referer)
			} else {
				require.Error(t, err, "expected referer %q to be rejected", tt.referer)
			}
		})
	}
}

func TestRefererOriginHeaderMultipleURLs(t *testing.T) {
	primaryURL, err := url.Parse("https://console.example.com/")
	require.NoError(t, err)
	secondaryURL, err := url.Parse("https://console-alt.example.com/")
	require.NoError(t, err)

	a := CSRFVerifier{refererURLs: []*url.URL{primaryURL, secondaryURL}}

	t.Run("Origin header for secondary URL accepted", func(t *testing.T) {
		r, err := http.NewRequest("POST", "/some-path", nil)
		require.NoError(t, err)
		r.Header.Set("Origin", "https://console-alt.example.com")
		require.NoError(t, a.verifySourceOrigin(r))
	})

	t.Run("Origin header for unknown URL rejected", func(t *testing.T) {
		r, err := http.NewRequest("POST", "/some-path", nil)
		require.NoError(t, err)
		r.Header.Set("Origin", "https://evil.example.com")
		require.Error(t, a.verifySourceOrigin(r))
	})
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
