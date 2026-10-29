package server

import (
	"flag"
	"fmt"
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
				"img-src 'self' https: blob: data:",
				"script-src 'self' console.redhat.com https://plugin.example.com 'nonce-",
				"style-src 'self' 'unsafe-inline'",
				"object-src 'none'",
				"media-src 'none'",
				"child-src 'none'",
				"worker-src 'self'",
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

func TestIndexHandlerRejectsInvalidCSP(t *testing.T) {
	publicDir := t.TempDir()
	if err := os.WriteFile(filepath.Join(publicDir, "index.html"), []byte(`<script nonce="[[ .ScriptNonce ]]">window.SERVER_FLAGS = [[ .ServerFlags ]];</script>`), 0600); err != nil {
		t.Fatal(err)
	}
	for _, mode := range []struct {
		name  string
		value serverconfig.CSPMode
	}{
		{"default", ""},
		{"report-only", serverconfig.CSPModeReportOnly},
		{"enforce", serverconfig.CSPModeEnforce},
	} {
		for _, source := range []struct {
			name     string
			value    string
			fromYAML bool
		}{
			{"semicolon", "https://plugin.example; object-src 'self'", false},
			{"comma", "https://plugin.example, object-src https:", false},
			{"carriage-return", "https://plugin.example\robject-src 'self'", false},
			{"line-feed", "https://plugin.example\nobject-src 'self'", false},
			{"crlf", "https://plugin.example\r\nContent-Security-Policy: object-src 'self'", false},
			{"yaml-comma", "https://plugin.example/a,b", true},
			{"yaml-comma-entry", "https://plugin.example,script-src=https://other.example", true},
		} {
			t.Run(mode.name+"/"+source.name, func(t *testing.T) {
				csp := serverconfig.MultiKeyValue{"script-src": source.value}
				if source.fromYAML {
					filename := filepath.Join(t.TempDir(), "console-config.yaml")
					content := fmt.Sprintf("apiVersion: console.openshift.io/v1\nkind: ConsoleConfig\ncontentSecurityPolicy:\n  ScriptSrc: [%q]\n", source.value)
					if err := os.WriteFile(filename, []byte(content), 0600); err != nil {
						t.Fatal(err)
					}
					csp = serverconfig.MultiKeyValue{}
					fs := flag.NewFlagSet(t.Name(), flag.ContinueOnError)
					fs.Var(&csp, "content-security-policy", "")
					if _, err := serverconfig.SetFlagsFromConfigFile(fs, filename); err != nil {
						t.Fatal(err)
					}
				}
				s := &Server{
					AlertManagerPublicURL: &url.URL{},
					DocumentationBaseURL:  &url.URL{},
					GrafanaPublicURL:      &url.URL{},
					PrometheusPublicURL:   &url.URL{},
					ThanosPublicURL:       &url.URL{},
					CSPMode:               mode.value,
					ContentSecurityPolicy: csp,
					PublicDir:             publicDir,
					BaseURL:               &url.URL{Path: "/console/"},
					Authenticator:         passingAuthenticator{},
					CSRFVerifier:          csrfverifier.NewCSRFVerifier(nil, false),
				}
				req := httptest.NewRequest(http.MethodGet, "/console/", nil)
				rec := httptest.NewRecorder()
				s.indexHandler(rec, req)
				if rec.Code != http.StatusInternalServerError {
					t.Fatalf("expected HTTP 500, got %d", rec.Code)
				}
				if strings.Contains(rec.Body.String(), "window.SERVER_FLAGS") {
					t.Fatal("rendered the Console page without a valid CSP")
				}
				for _, header := range []string{"Content-Security-Policy", "Content-Security-Policy-Report-Only"} {
					if rec.Header().Get(header) != "" {
						t.Errorf("invalid configuration returned a partial %s header", header)
					}
				}
				// A rejected request must not stop the server from handling later requests.
				s.ContentSecurityPolicy = nil
				rec = httptest.NewRecorder()
				s.indexHandler(rec, req)
				if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), "window.SERVER_FLAGS") {
					t.Fatalf("failed to serve a subsequent request with valid CSP: HTTP %d", rec.Code)
				}
			})
		}
	}
}
