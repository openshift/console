package server

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"

	"github.com/openshift/console/pkg/auth/csrfverifier"
	"github.com/openshift/console/pkg/serverconfig"
)

func TestIndexHandlerCSPMode(t *testing.T) {
	publicDir := t.TempDir()
	if err := os.WriteFile(filepath.Join(publicDir, "index.html"), []byte(`<script nonce="[[ .ScriptNonce ]]">window.SERVER_FLAGS = [[ .ServerFlags ]];</script>`), 0600); err != nil {
		t.Fatal(err)
	}
	var baseline string
	for _, test := range []struct {
		name   string
		mode   serverconfig.CSPMode
		header string
	}{
		{"default", "", "Content-Security-Policy-Report-Only"},
		{"report-only", serverconfig.CSPModeReportOnly, "Content-Security-Policy-Report-Only"},
		{"enforce", serverconfig.CSPModeEnforce, "Content-Security-Policy"},
	} {
		t.Run(test.name, func(t *testing.T) {
			s := &Server{
				AlertManagerPublicURL: &url.URL{},
				DocumentationBaseURL:  &url.URL{},
				GrafanaPublicURL:      &url.URL{},
				PrometheusPublicURL:   &url.URL{},
				ThanosPublicURL:       &url.URL{},
				CSPMode:               test.mode,
				ContentSecurityPolicy: serverconfig.MultiKeyValue{"script-src": "https://plugin.example.com"},
				K8sMode:               "in-cluster",
				PublicDir:             publicDir,
				BaseURL:               &url.URL{Path: "/console/"},
				Authenticator:         passingAuthenticator{},
				CSRFVerifier:          csrfverifier.NewCSRFVerifier(nil, false),
			}
			req := httptest.NewRequest(http.MethodGet, "/console/", nil)
			req.Header.Set("Test-CSP-Reporting-Endpoint", "https://reports.example.com/csp")
			rec := httptest.NewRecorder()
			s.indexHandler(rec, req)
			if rec.Code != http.StatusOK {
				t.Fatalf("expected HTTP 200, got %d", rec.Code)
			}
			policy := rec.Header().Get(test.header)
			if policy == "" {
				t.Fatalf("missing %s header", test.header)
			}
			for _, header := range []string{"Content-Security-Policy", "Content-Security-Policy-Report-Only"} {
				if header != test.header && rec.Header().Get(header) != "" {
					t.Errorf("unexpected %s header", header)
				}
			}
			for _, directive := range []string{
				"script-src 'self' console.redhat.com https://plugin.example.com 'nonce-",
				"style-src 'self' 'unsafe-inline'",
				"report-uri https://reports.example.com/csp",
			} {
				if !strings.Contains(policy, directive) {
					t.Errorf("policy is missing %q: %s", directive, policy)
				}
			}
			noncePattern := regexp.MustCompile(`'nonce-([^']+)'`)
			match := noncePattern.FindStringSubmatch(policy)
			if len(match) != 2 || !strings.Contains(rec.Body.String(), `nonce="`+match[1]+`"`) {
				t.Fatal("CSP nonce does not match the rendered script nonce")
			}
			// Each request generates a new nonce; all other directives must match.
			normalized := noncePattern.ReplaceAllString(policy, "'nonce-test'")
			if baseline == "" {
				baseline = normalized
			} else if baseline != normalized {
				t.Errorf("directives changed with mode: got %s, expected %s", normalized, baseline)
			}
		})
	}
}
