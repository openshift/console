package server

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"k8s.io/client-go/rest"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/auth/csrfverifier"
	"github.com/openshift/console/pkg/proxy"
)

// TestOLMMigrationRoutesUnderBasePath exercises the actual server router with a non-root Console prefix.
func TestOLMMigrationRoutesUnderBasePath(t *testing.T) {
	apiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { http.Error(w, "Forbidden", http.StatusForbidden) }))
	defer apiServer.Close()
	apiURL, err := url.Parse(apiServer.URL)
	require.NoError(t, err)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	s := &Server{
		BaseURL:                        &url.URL{Path: "/console/"},
		Authenticator:                  passingAuthenticator{},
		CSRFVerifier:                   csrfverifier.NewCSRFVerifier(nil, false),
		InternalProxiedK8SClientConfig: &rest.Config{Host: apiServer.URL},
		K8sProxyConfig:                 &proxy.Config{Endpoint: apiURL},
		ClusterManagementProxyConfig:   &proxy.Config{Endpoint: apiURL},
		CatalogdProxyConfig:            &proxy.Config{Endpoint: apiURL},
		AuthMetrics:                    auth.NewMetrics(http.DefaultTransport),
		TechPreview:                    true,
	}
	handler, err := s.HTTPHandler(ctx)
	require.NoError(t, err)
	for _, endpoint := range []string{"dry-run", "bulk", "rollback", "cleanup", "jobs/job/cancel"} {
		t.Run(endpoint, func(t *testing.T) {
			response := httptest.NewRecorder()
			handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/console/api/olm/migration/"+endpoint, nil))
			assert.Equal(t, http.StatusMethodNotAllowed, response.Code, response.Body.String())
		})
	}
	for _, endpoint := range []string{"operators", "jobs", "jobs/job"} {
		t.Run(endpoint, func(t *testing.T) {
			response := httptest.NewRecorder()
			handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/console/api/olm/migration/"+endpoint, nil))
			assert.Equal(t, http.StatusForbidden, response.Code, response.Body.String())
		})
	}
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/api/olm/migration/jobs", nil))
	assert.Equal(t, http.StatusNotFound, response.Code)
}
