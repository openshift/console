package server

import (
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestDevfileHandlerDoesNotReflectParserError(t *testing.T) {
	// A devfile whose parent.uri points at an unreachable/internal endpoint must
	// not have the parser's raw error (which can embed the resolved response body)
	// reflected back to the client. Doing so would turn a parse failure into a
	// partial-read SSRF oracle. The handler must return a generic message and keep
	// the detailed error server-side only.
	// Stand-in for an internal endpoint (metadata service, etcd, kubelet, ...) that
	// an attacker points parent.uri at. Its response body must never surface in the
	// client-facing error.
	sentinel := "SSRF-SENTINEL-9f3a"
	target := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(sentinel))
	}))
	defer target.Close()

	// components: [] leaves nothing locally defined, so the parse fails and the
	// handler hits the parse-error path.
	devfileWithParentURI := "schemaVersion: 2.2.0\n" +
		"metadata:\n" +
		"  name: test\n" +
		"parent:\n" +
		"  uri: '" + target.URL + "'\n" +
		"components: []\n"

	body := `{"devfile":{"devfileContent":` + strconv.Quote(devfileWithParentURI) + `}}`

	req := httptest.NewRequest(http.MethodPost, "/api/devfile/", strings.NewReader(body))
	rec := httptest.NewRecorder()

	s := &Server{}
	s.devfileHandler(rec, req)

	// The security invariant: whatever the failure, nothing derived from the
	// resolved response must ever reach the client.
	assert.NotContains(t, rec.Body.String(), sentinel,
		"parser error must not be reflected to the client")
}

func TestDevfileHandlerRejectsOversizedBody(t *testing.T) {
	// A request body larger than maxDevfileRequestBodySize must be rejected
	// before it can be buffered into memory, guarding against DoS.
	oversized := `{"devfile":{"devfileContent":"` + strings.Repeat("A", maxDevfileRequestBodySize+1) + `"}}`

	req := httptest.NewRequest(http.MethodPost, "/api/devfile/", strings.NewReader(oversized))
	rec := httptest.NewRecorder()

	s := &Server{}
	s.devfileHandler(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
	assert.Contains(t, rec.Body.String(), "request body too large")
}

func TestDevfileHandlerRejectsTrailingData(t *testing.T) {
	// json.Decoder.Decode reads only the first JSON value, so a small valid object
	// followed by arbitrary trailing data would otherwise slip past both the
	// decoder and the MaxBytesReader size guard. The handler must reject it.
	body := `{"devfile":{"devfileContent":"x"}}` + strings.Repeat("A", maxDevfileRequestBodySize+1)

	req := httptest.NewRequest(http.MethodPost, "/api/devfile/", strings.NewReader(body))
	rec := httptest.NewRecorder()

	s := &Server{}
	s.devfileHandler(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
	assert.Contains(t, rec.Body.String(), "single JSON object")
}
