package devfile

import (
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

const validDevfileNoParent = `
schemaVersion: 2.2.0
metadata:
  name: test-app
  attributes:
    alpha.dockerimage-port: 8080
components:
  - name: image-build
    image:
      imageName: test-image:latest
      dockerfile:
        uri: Dockerfile
        buildContext: .
  - name: kubernetes-deploy
    kubernetes:
      inlined: |
        kind: Deployment
        apiVersion: apps/v1
        metadata:
          name: my-deploy
        spec:
          replicas: 1
          selector:
            matchLabels:
              app: test-app
          template:
            metadata:
              labels:
                app: test-app
            spec:
              containers:
                - name: my-container
                  image: test-image:latest
commands:
  - id: build-image
    apply:
      component: image-build
  - id: deployk8s
    apply:
      component: kubernetes-deploy
  - id: deploy
    composite:
      commands:
        - build-image
        - deployk8s
      group:
        kind: deploy
        isDefault: true
`

const devfileWithBadRegistry = `
schemaVersion: 2.2.0
metadata:
  name: test
parent:
  id: nonexistent-stack
  registryUrl: 'https://does-not-exist.invalid'
components:
  - name: image-build
    image:
      imageName: test:latest
      dockerfile:
        uri: Dockerfile
        buildContext: .
  - name: kubernetes-deploy
    kubernetes:
      inlined: |
        kind: Deployment
        apiVersion: apps/v1
        metadata:
          name: test-deploy
        spec:
          replicas: 1
          selector:
            matchLabels:
              app: test
          template:
            metadata:
              labels:
                app: test
            spec:
              containers:
                - name: test
                  image: test:latest
commands:
  - id: build-image
    apply:
      component: image-build
  - id: deployk8s
    apply:
      component: kubernetes-deploy
  - id: deploy
    composite:
      commands:
        - build-image
        - deployk8s
      group:
        kind: deploy
        isDefault: true
`

func TestParseDevfileWithFallback(t *testing.T) {
	httpTimeout := 10

	t.Run("devfile without parent parses on first attempt", func(t *testing.T) {
		devfileObj, err := parseDevfileWithFallback([]byte(validDevfileNoParent), &httpTimeout)
		assert.NoError(t, err)

		components, err := GetDeployComponents(devfileObj)
		assert.NoError(t, err)
		assert.Contains(t, components, "image-build")
		assert.Contains(t, components, "kubernetes-deploy")
	})

	t.Run("devfile with unreachable parent falls back to unflattened parse", func(t *testing.T) {
		devfileObj, err := parseDevfileWithFallback([]byte(devfileWithBadRegistry), &httpTimeout)
		assert.NoError(t, err, "fallback to unflattened parse should succeed")

		components, err := GetDeployComponents(devfileObj)
		assert.NoError(t, err)
		assert.Contains(t, components, "image-build")
		assert.Contains(t, components, "kubernetes-deploy")
	})

	t.Run("completely invalid devfile fails both attempts", func(t *testing.T) {
		_, err := parseDevfileWithFallback([]byte("not valid yaml: ["), &httpTimeout)
		assert.Error(t, err)
	})
}

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

	// components: [] leaves nothing locally defined, so both the flattened and
	// unflattened parses fail and the handler hits the parse-error path.
	devfileWithParentURI := "schemaVersion: 2.2.0\n" +
		"metadata:\n" +
		"  name: test\n" +
		"parent:\n" +
		"  uri: '" + target.URL + "'\n" +
		"components: []\n"

	body := `{"devfile":{"devfileContent":` + strconv.Quote(devfileWithParentURI) + `}}`

	req := httptest.NewRequest(http.MethodPost, "/api/devfile/", strings.NewReader(body))
	rec := httptest.NewRecorder()

	DevfileHandler(rec, req)

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

	DevfileHandler(rec, req)

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

	DevfileHandler(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
	assert.Contains(t, rec.Body.String(), "single JSON object")
}
