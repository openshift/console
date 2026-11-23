package kubernetesreleases

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
)

const sample = `[
  {"cycle":"1.35","releaseDate":"2025-12-17","eol":"2027-02-28","latest":"1.35.10","latestReleaseDate":"2026-10-27","lts":false,"support":"2026-12-28"},
  {"cycle":"1.34","releaseDate":"2025-08-27","eol":false,"latest":"1.34.13"},
  {"cycle":"1.0","eol":true},
  {"latest":"9.9.9","eol":"2030-01-01"}
]`

func TestNormalise(t *testing.T) {
	releases, err := Normalise([]byte(sample))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(releases) != 3 {
		t.Fatalf("expected 3 releases (entry without cycle dropped), got %d: %+v", len(releases), releases)
	}
	if r := releases[0]; r.Cycle != "1.35" || r.Latest != "1.35.10" || r.ReleaseDate != "2025-12-17" || r.EOL == nil || *r.EOL != "2027-02-28" {
		t.Errorf("unexpected string-eol release: %+v", r)
	}
	if r := releases[1]; r.EOL != nil {
		t.Errorf("boolean false eol should be nil, got %q", *r.EOL)
	}
	if r := releases[2]; r.EOL != nil || r.Latest != "" || r.ReleaseDate != "" {
		t.Errorf("boolean true eol and missing fields should be empty, got %+v", r)
	}
}

func TestNormaliseRejectsBadInput(t *testing.T) {
	for name, body := range map[string]string{
		"not json":  `<html>`,
		"object":    `{"cycle":"1.35"}`,
		"empty":     `[]`,
		"no cycles": `[{"latest":"1.2.3"}]`,
	} {
		if _, err := Normalise([]byte(body)); err == nil {
			t.Errorf("%s: expected an error", name)
		}
	}
}

func TestRefreshKeepsLastGoodData(t *testing.T) {
	var fail atomic.Bool
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if fail.Load() {
			http.Error(w, "boom", http.StatusBadGateway)
			return
		}
		w.Write([]byte(sample))
	}))
	defer upstream.Close()

	s := NewStore(upstream.URL)
	ctx := context.Background()

	fail.Store(true)
	s.refresh(ctx)
	if s.get() != nil {
		t.Fatal("expected no data after a failed first fetch")
	}

	fail.Store(false)
	s.refresh(ctx)
	good := s.get()
	if good == nil || len(good.Releases) != 3 || good.FetchedAt.IsZero() {
		t.Fatalf("expected data after a successful fetch, got %+v", good)
	}

	fail.Store(true)
	s.refresh(ctx)
	if s.get() != good {
		t.Fatal("expected the last good data to be kept after a failed fetch")
	}
}

func TestServeHTTP(t *testing.T) {
	serve := func(s *Store) *httptest.ResponseRecorder {
		rec := httptest.NewRecorder()
		s.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/console/kubernetes-releases", nil))
		return rec
	}

	var off *Store
	if rec := serve(off); rec.Code != http.StatusNotFound {
		t.Errorf("feature off: expected 404, got %d", rec.Code)
	}

	s := NewStore("http://unused.invalid")
	if rec := serve(s); rec.Code != http.StatusServiceUnavailable {
		t.Errorf("before first fetch: expected 503, got %d", rec.Code)
	}

	releases, err := Normalise([]byte(sample))
	if err != nil {
		t.Fatal(err)
	}
	s.data = &Response{Releases: releases}
	rec := serve(s)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if _, ok := body["fetchedAt"]; !ok {
		t.Errorf("missing fetchedAt: %s", rec.Body)
	}
	got := body["releases"].([]any)
	first := got[0].(map[string]any)
	if first["cycle"] != "1.35" || first["latest"] != "1.35.10" || first["eol"] != "2027-02-28" || first["releaseDate"] != "2025-12-17" {
		t.Errorf("unexpected first release: %v", first)
	}
	if eol, ok := got[1].(map[string]any)["eol"]; !ok || eol != nil {
		t.Errorf("expected explicit null eol, got %v (present=%v)", eol, ok)
	}
}
