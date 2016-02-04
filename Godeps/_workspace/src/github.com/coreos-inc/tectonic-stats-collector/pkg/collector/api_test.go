package collector

import (
	"errors"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/coreos-inc/tectonic-stats-collector/pkg/stats"
)

var (
	httpHeaderJSONContentType = http.Header{"Content-Type": []string{"application/json"}}
	minimumRecordJSON         = `{}`
)

// HandlerRoundTripper implements the net/http.RoundTripper using
// an in-memory net/http.Handler, skipping any network calls.
type HandlerRoundTripper struct {
	Handler http.Handler
}

func (rt *HandlerRoundTripper) RoundTrip(r *http.Request) (*http.Response, error) {
	w := httptest.NewRecorder()
	rt.Handler.ServeHTTP(w, r)

	resp := http.Response{
		StatusCode: w.Code,
		Header:     w.Header(),
		Body:       ioutil.NopCloser(w.Body),
	}

	return &resp, nil
}

type memRecordRepo struct {
	Records []stats.Record
}

func (d *memRecordRepo) Store(r stats.Record) error {
	d.Records = append(d.Records, r)
	return nil
}

type testServer struct {
	RecordRepo stats.RecordRepo
	srv        *APIServer
}

func (ts *testServer) URL(p string) string {
	u := url.URL{
		Scheme: "http",
		Host:   "example.com",
		Path:   p,
	}
	return u.String()
}

func (ts *testServer) Server() *APIServer {
	if ts.srv == nil {
		ts.srv = &APIServer{
			RecordRepo: ts.RecordRepo,
		}
	}
	return ts.srv
}

func (ts *testServer) HTTPClient() *http.Client {
	return &http.Client{
		Transport: &HandlerRoundTripper{
			Handler: ts.Server().newHandler(),
		},
	}
}

type errRecordRepo struct {
	err error
}

func (d *errRecordRepo) Store(stats.Record) error {
	return d.err
}

func TestRecordResourceStoreBadContentType(t *testing.T) {
	repo := &memRecordRepo{}
	srv := &testServer{RecordRepo: repo}
	cli := srv.HTTPClient()

	req, err := http.NewRequest("POST", srv.URL(StatsEndpoint), strings.NewReader(minimumRecordJSON))
	if err != nil {
		t.Fatalf("unable to create HTTP request: %v", err)
	}

	resp, err := cli.Do(req)
	if err != nil {
		t.Fatalf("unable to get HTTP response: %v", err)
	}

	wantStatusCode := http.StatusUnsupportedMediaType
	if wantStatusCode != resp.StatusCode {
		t.Fatalf("incorrect status code: want=%d got=%d", wantStatusCode, resp.StatusCode)
	}
}

func TestRecordResourceStoreInternalError(t *testing.T) {
	repo := &errRecordRepo{err: errors.New("fail!")}
	srv := &testServer{RecordRepo: repo}
	cli := srv.HTTPClient()

	req, err := http.NewRequest("POST", srv.URL(StatsEndpoint), strings.NewReader(minimumRecordJSON))
	if err != nil {
		t.Fatalf("unable to create HTTP request: %v", err)
	}

	req.Header = httpHeaderJSONContentType

	resp, err := cli.Do(req)
	if err != nil {
		t.Fatalf("unable to get HTTP response: %v", err)
	}

	wantStatusCode := http.StatusInternalServerError
	if wantStatusCode != resp.StatusCode {
		t.Fatalf("incorrect status code: want=%d got=%d", wantStatusCode, resp.StatusCode)
	}
}

func TestRecordResourceStoreBadRecord(t *testing.T) {
	tests := []string{
		// invalid JSON
		`{`,
	}
	for i, tt := range tests {
		repo := &memRecordRepo{}
		srv := &testServer{RecordRepo: repo}
		cli := srv.HTTPClient()

		req, err := http.NewRequest("POST", srv.URL(StatsEndpoint), strings.NewReader(tt))
		if err != nil {
			t.Fatalf("case %d: unable to create HTTP request: %v", i, err)
		}

		req.Header = httpHeaderJSONContentType

		resp, err := cli.Do(req)
		if err != nil {
			t.Fatalf("case %d: unable to get HTTP response: %v", i, err)
		}

		wantStatusCode := http.StatusBadRequest
		if wantStatusCode != resp.StatusCode {
			t.Fatalf("case %d: incorrect status code: want=%d got=%d", i, wantStatusCode, resp.StatusCode)
		}
	}
}

func TestRecordResoureStoreSuccess(t *testing.T) {
	repo := &memRecordRepo{}
	srv := &testServer{RecordRepo: repo}
	cli := srv.HTTPClient()

	req, err := http.NewRequest("POST", srv.URL(StatsEndpoint), strings.NewReader(minimumRecordJSON))
	if err != nil {
		t.Fatalf("unable to create HTTP request: %v", err)
	}

	req.Header = httpHeaderJSONContentType

	resp, err := cli.Do(req)
	if err != nil {
		t.Fatalf("unable to get HTTP response: %v", err)
	}

	wantStatusCode := http.StatusNoContent
	if wantStatusCode != resp.StatusCode {
		t.Fatalf("incorrect status code: want=%d got=%d", wantStatusCode, resp.StatusCode)
	}
}
