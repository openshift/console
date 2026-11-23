// Package kubernetesreleases serves a normalised list of Kubernetes release
// cycles (latest patch and end-of-life date per minor version) that the bridge
// fetches periodically from an endoflife.date-compatible URL.
package kubernetesreleases

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"k8s.io/klog/v2"

	"github.com/openshift/console/pkg/serverutils"
)

const (
	// refreshInterval keeps upstream checks to at most twice a day.
	refreshInterval = 12 * time.Hour
	maxBodyBytes    = 5 << 20
)

// Release is one Kubernetes minor version line.
type Release struct {
	Cycle       string `json:"cycle"`
	Latest      string `json:"latest,omitempty"`
	ReleaseDate string `json:"releaseDate,omitempty"`
	// EOL is the end-of-life date (YYYY-MM-DD), or nil when unknown.
	EOL *string `json:"eol"`
}

// Response is the body of GET /api/console/kubernetes-releases.
type Response struct {
	Releases  []Release `json:"releases"`
	FetchedAt time.Time `json:"fetchedAt"`
}

// Normalise converts an endoflife.date product document into releases.
// Entries without a cycle are dropped; an eol that is not a date string
// (endoflife.date also uses booleans) becomes nil.
func Normalise(body []byte) ([]Release, error) {
	var cycles []struct {
		Cycle       string          `json:"cycle"`
		Latest      string          `json:"latest"`
		ReleaseDate string          `json:"releaseDate"`
		EOL         json.RawMessage `json:"eol"`
	}
	if err := json.Unmarshal(body, &cycles); err != nil {
		return nil, fmt.Errorf("decoding release info: %w", err)
	}
	releases := make([]Release, 0, len(cycles))
	for _, c := range cycles {
		if c.Cycle == "" {
			continue
		}
		r := Release{Cycle: c.Cycle, Latest: c.Latest, ReleaseDate: c.ReleaseDate}
		var eol string
		if json.Unmarshal(c.EOL, &eol) == nil && eol != "" {
			r.EOL = &eol
		}
		releases = append(releases, r)
	}
	if len(releases) == 0 {
		return nil, fmt.Errorf("release info contains no release cycles")
	}
	return releases, nil
}

// Store holds the last successfully fetched release info. A nil *Store is the
// feature switched off: its handler answers 404.
type Store struct {
	url    string
	client *http.Client

	mu   sync.RWMutex
	data *Response
}

func NewStore(url string) *Store {
	// The default transport honours HTTP_PROXY, HTTPS_PROXY and NO_PROXY.
	return &Store{url: url, client: &http.Client{Timeout: 30 * time.Second}}
}

// Run fetches now and then every refreshInterval until ctx is done.
func (s *Store) Run(ctx context.Context) {
	go func() {
		for {
			s.refresh(ctx)
			select {
			case <-ctx.Done():
				return
			case <-time.After(refreshInterval):
			}
		}
	}()
}

// refresh replaces the stored data on success and keeps the last good data on failure.
func (s *Store) refresh(ctx context.Context) {
	releases, err := s.fetch(ctx)
	if err != nil {
		klog.Errorf("failed to fetch Kubernetes release info from %s: %v", s.url, err)
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data = &Response{Releases: releases, FetchedAt: time.Now().UTC()}
}

func (s *Store) fetch(ctx context.Context) ([]Release, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, s.url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %s", resp.Status)
	}
	body, err := io.ReadAll(io.LimitReader(resp.Body, maxBodyBytes))
	if err != nil {
		return nil, err
	}
	return Normalise(body)
}

func (s *Store) get() *Response {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.data
}

func (s *Store) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if s == nil {
		serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{Err: "Kubernetes release info is not configured"})
		return
	}
	data := s.get()
	if data == nil {
		serverutils.SendResponse(w, http.StatusServiceUnavailable, serverutils.ApiError{Err: "Kubernetes release info has not been fetched yet"})
		return
	}
	serverutils.SendResponse(w, http.StatusOK, data)
}
