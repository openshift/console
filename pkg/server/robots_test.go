package server

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path"
	"testing"
)

func TestRobotsTxtHandler(t *testing.T) {
	dir := t.TempDir()
	content := "User-agent: *\nDisallow: /\n"
	if err := os.WriteFile(path.Join(dir, "robots.txt"), []byte(content), 0644); err != nil {
		t.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/robots.txt", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, path.Join(dir, "robots.txt"))
	})

	req := httptest.NewRequest(http.MethodGet, "/robots.txt", nil)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rec.Code)
	}
	if got := rec.Body.String(); got != content {
		t.Errorf("expected body %q, got %q", content, got)
	}
}
