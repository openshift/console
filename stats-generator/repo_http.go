// This is copied from https://github.com/coreos-inc/tectonic-stats-collector/tree/ab5c1d4f2cc36cea32b366ec65bdfd21642f70be/pkg/generator
package generator

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

	"github.com/coreos-inc/tectonic-stats-collector/pkg/stats"
)

var (
	statsEndpoint = "/api/v1/stats"
)

// NewHTTPRecordRepo returns a RecordRepo that interacts with a
// collector API using the provided HTTP client.
func NewHTTPRecordRepo(c *http.Client, u url.URL) (stats.RecordRepo, error) {
	p, err := u.Parse(statsEndpoint)
	if err != nil {
		return nil, fmt.Errorf("generator: unable to prepare API URL: %v", err)
	}

	r := &httpRecordRepo{
		statsURL: p.String(),
		client:   c,
	}

	return r, nil
}

type httpRecordRepo struct {
	statsURL string
	client   *http.Client
}

func (h *httpRecordRepo) Store(r stats.Record) error {
	body, err := json.Marshal(r)
	if err != nil {
		return fmt.Errorf("generator: unable to encode HTTP request body: %v", err)
	}
	req, err := http.NewRequest("POST", h.statsURL, bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("generator: unable to prepare HTTP request: %v", err)
	}
	req.Header.Add("Content-Type", "application/json")
	res, err := h.client.Do(req)
	if err != nil {
		return fmt.Errorf("generator: HTTP request failed: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusNoContent {
		return fmt.Errorf("generator: received unexpected HTTP response code %d", res.StatusCode)
	}
	return nil
}
