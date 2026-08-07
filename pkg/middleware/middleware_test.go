package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestWithSecurityHeaders(t *testing.T) {
	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	handler := WithSecurityHeaders(inner)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	expected := map[string]string{
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options":        "DENY",
		"X-DNS-Prefetch-Control": "off",
		"Referrer-Policy":        "strict-origin-when-cross-origin",
		"Cache-Control":          "no-cache, no-store, must-revalidate",
		"Pragma":                 "no-cache",
	}

	for header, want := range expected {
		got := rr.Header().Get(header)
		if got != want {
			t.Errorf("header %s = %q, want %q", header, got, want)
		}
	}
}

func TestWithStaticCacheHeaders(t *testing.T) {
	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	handler := WithSecurityHeaders(WithStaticCacheHeaders(inner))

	req := httptest.NewRequest(http.MethodGet, "/static/main-bundle-abc123.min.js", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	wantCache := "public, max-age=31536000, immutable"
	if got := rr.Header().Get("Cache-Control"); got != wantCache {
		t.Errorf("Cache-Control = %q, want %q", got, wantCache)
	}
	if got := rr.Header().Get("Pragma"); got != "" {
		t.Errorf("Pragma = %q, want empty (deleted)", got)
	}
}

func TestNonStaticEndpointHasNoCacheHeaders(t *testing.T) {
	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	handler := WithSecurityHeaders(inner)

	req := httptest.NewRequest(http.MethodGet, "/api/console/version", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	wantCache := "no-cache, no-store, must-revalidate"
	if got := rr.Header().Get("Cache-Control"); got != wantCache {
		t.Errorf("Cache-Control = %q, want %q", got, wantCache)
	}
	wantPragma := "no-cache"
	if got := rr.Header().Get("Pragma"); got != wantPragma {
		t.Errorf("Pragma = %q, want %q", got, wantPragma)
	}
}
