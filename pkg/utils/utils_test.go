package utils

import (
	"reflect"
	"strings"
	"testing"

	"github.com/openshift/console/pkg/serverconfig"
)

const (
	onClusterBaseUri        = "base-uri 'self'"
	onClusterDefaultSrc     = "default-src 'self' console.redhat.com"
	onClusterImgSrc         = "img-src 'self' https: blob:"
	onClusterFontSrc        = "font-src 'self'"
	onClusterScriptSrc      = "script-src 'self' console.redhat.com"
	onClusterStyleSrc       = "style-src 'self'"
	onClusterObjectSrc      = "object-src 'none'"
	onClusterConnectSrc     = "connect-src 'self' console.redhat.com"
	offClusterBaseUri       = "base-uri 'self' http://localhost:8080 ws://localhost:8080"
	offClusterDefaultSrc    = "default-src 'self' console.redhat.com http://localhost:8080 ws://localhost:8080"
	offClusterImgSrc        = "img-src 'self' https: blob: http://localhost:8080"
	offClusterFontSrc       = "font-src 'self' http://localhost:8080"
	offClusterScriptSrc     = "script-src 'self' console.redhat.com http://localhost:8080 ws://localhost:8080"
	offClusterStyleSrc      = "style-src 'self' http://localhost:8080"
	offClusterObjectSrc     = "object-src 'none'"
	offClusterConnectSrc    = "connect-src 'self' console.redhat.com http://localhost:8080"
	mediaSrcDirective       = "media-src 'none'"
	childSrcDirective       = "child-src 'none'"
	workerSrcDirective      = "worker-src 'self'"
	frameSrcDirective       = "frame-src 'none'"
	frameAncestorsDirective = "frame-ancestors 'none'"
)

func TestBuildCSPDirectives(t *testing.T) {
	tests := []struct {
		name                  string
		k8sMode               string
		contentSecurityPolicy serverconfig.MultiKeyValue
		indexPageScriptNonce  string
		cspReportingEndpoint  string
		want                  []string
	}{
		{
			name:                  "on-cluster",
			k8sMode:               "on-cluster",
			contentSecurityPolicy: serverconfig.MultiKeyValue{},
			indexPageScriptNonce:  "foobar",
			cspReportingEndpoint:  "",
			want: []string{
				onClusterBaseUri,
				onClusterDefaultSrc,
				onClusterImgSrc + " data:",
				onClusterFontSrc + " data:",
				onClusterScriptSrc + " 'nonce-foobar'",
				onClusterStyleSrc + " 'unsafe-inline'",
				onClusterConnectSrc,
				onClusterObjectSrc,
				mediaSrcDirective,
				childSrcDirective,
				workerSrcDirective,
				frameSrcDirective,
				frameAncestorsDirective,
			},
		},
		{
			name:                  "off-cluster",
			k8sMode:               "off-cluster",
			contentSecurityPolicy: serverconfig.MultiKeyValue{},
			indexPageScriptNonce:  "foobar",
			cspReportingEndpoint:  "",
			want: []string{
				offClusterBaseUri,
				offClusterDefaultSrc,
				offClusterImgSrc + " data:",
				offClusterFontSrc + " data:",
				offClusterScriptSrc + " 'nonce-foobar'",
				offClusterStyleSrc + " 'unsafe-inline'",
				offClusterConnectSrc,
				offClusterObjectSrc,
				mediaSrcDirective,
				childSrcDirective,
				workerSrcDirective,
				frameSrcDirective,
				frameAncestorsDirective,
			},
		},
		{
			name:                 "on-cluster with config",
			k8sMode:              "on-cluster",
			indexPageScriptNonce: "foobar",
			cspReportingEndpoint: "",
			contentSecurityPolicy: serverconfig.MultiKeyValue{
				"default-src": "foo.bar",
				"img-src":     "foo.bar.baz",
				"font-src":    "foo.bar.baz",
				"script-src":  "foo.bar foo.bar.baz",
				"style-src":   "foo.bar foo.bar.baz",
				"connect-src": "foo.bar.baz",
			},
			want: []string{
				onClusterBaseUri,
				onClusterDefaultSrc + " foo.bar",
				onClusterImgSrc + " foo.bar.baz data:",
				onClusterFontSrc + " foo.bar.baz data:",
				onClusterScriptSrc + " foo.bar foo.bar.baz 'nonce-foobar'",
				onClusterStyleSrc + " foo.bar foo.bar.baz 'unsafe-inline'",
				onClusterConnectSrc + " foo.bar.baz",
				onClusterObjectSrc,
				mediaSrcDirective,
				childSrcDirective,
				workerSrcDirective,
				frameSrcDirective,
				frameAncestorsDirective,
			},
		},
		{
			name:                  "on-cluster with CSP reporting enabled",
			k8sMode:               "on-cluster",
			contentSecurityPolicy: nil,
			indexPageScriptNonce:  "foobar",
			cspReportingEndpoint:  "http://localhost:7777/csp-test-endpoint",
			want: []string{
				onClusterBaseUri,
				onClusterDefaultSrc,
				onClusterImgSrc + " data:",
				onClusterFontSrc + " data:",
				onClusterScriptSrc + " 'nonce-foobar'",
				onClusterStyleSrc + " 'unsafe-inline'",
				onClusterConnectSrc,
				onClusterObjectSrc,
				mediaSrcDirective,
				childSrcDirective,
				workerSrcDirective,
				frameSrcDirective,
				frameAncestorsDirective,
				"report-uri http://localhost:7777/csp-test-endpoint",
			},
		},
		{
			name:                 "off-cluster with config",
			k8sMode:              "off-cluster",
			indexPageScriptNonce: "foobar",
			cspReportingEndpoint: "",
			contentSecurityPolicy: serverconfig.MultiKeyValue{
				"default-src": "foo.bar",
				"img-src":     "foo.bar.baz",
				"font-src":    "foo.bar.baz",
				"script-src":  "foo.bar foo.bar.baz",
				"style-src":   "foo.bar foo.bar.baz",
				"connect-src": "foo.bar.baz",
			},
			want: []string{
				offClusterBaseUri,
				offClusterDefaultSrc + " foo.bar",
				offClusterImgSrc + " foo.bar.baz data:",
				offClusterFontSrc + " foo.bar.baz data:",
				offClusterScriptSrc + " foo.bar foo.bar.baz 'nonce-foobar'",
				offClusterStyleSrc + " foo.bar foo.bar.baz 'unsafe-inline'",
				offClusterConnectSrc + " foo.bar.baz",
				offClusterObjectSrc,
				mediaSrcDirective,
				childSrcDirective,
				workerSrcDirective,
				frameSrcDirective,
				frameAncestorsDirective,
			},
		},
		{
			name:                  "off-cluster with CSP reporting enabled",
			k8sMode:               "off-cluster",
			contentSecurityPolicy: nil,
			indexPageScriptNonce:  "foobar",
			cspReportingEndpoint:  "http://localhost:7777/csp-test-endpoint",
			want: []string{
				offClusterBaseUri,
				offClusterDefaultSrc,
				offClusterImgSrc + " data:",
				offClusterFontSrc + " data:",
				offClusterScriptSrc + " 'nonce-foobar'",
				offClusterStyleSrc + " 'unsafe-inline'",
				offClusterConnectSrc,
				offClusterObjectSrc,
				mediaSrcDirective,
				childSrcDirective,
				workerSrcDirective,
				frameSrcDirective,
				frameAncestorsDirective,
				"report-uri http://localhost:7777/csp-test-endpoint",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			got, err := BuildCSPDirectives(tt.k8sMode, tt.contentSecurityPolicy, tt.indexPageScriptNonce, tt.cspReportingEndpoint)
			if err != nil {
				t.Fatalf("buildCSPDirectives() error = %v", err)
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("buildCSPDirectives() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestBuildCSPDirectivesRejectsDirectiveInjection(t *testing.T) {
	for _, directive := range []string{"default-src", "script-src", "style-src", "img-src", "font-src", "connect-src"} {
		for _, source := range []string{
			"https://plugin.example; object-src 'self'",
			"https://plugin.example; media-src 'self'",
			"https://plugin.example; child-src 'self'",
			"https://plugin.example; worker-src blob:",
			"https://plugin.example;",
			"https://plugin.example\r\nContent-Security-Policy: object-src 'self'",
			"https://plugin.example\nobject-src 'self'",
		} {
			t.Run(directive+"/"+source, func(t *testing.T) {
				config := serverconfig.MultiKeyValue{}
				if err := config.Set(directive + "=" + source); err != nil {
					t.Fatal(err)
				}
				policy, err := BuildCSPDirectives("on-cluster", config, "nonce", "")
				if err == nil {
					t.Fatal("expected invalid CSP sources to be rejected")
				}
				if len(policy) != 0 {
					t.Errorf("invalid configuration returned a partial policy: %v", policy)
				}
			})
		}
	}
}

func TestBuildCSPDirectivesPreservesValidSources(t *testing.T) {
	config := serverconfig.MultiKeyValue{}
	if err := config.Set("script-src=https://plugin.example 'unsafe-eval',connect-src=https://api.example/path%3Bsegment%2Cpart https://backup.example"); err != nil {
		t.Fatal(err)
	}
	policy, err := BuildCSPDirectives("off-cluster", config, "nonce", "")
	if err != nil {
		t.Fatal(err)
	}
	header := strings.Join(policy, "; ")
	for _, want := range []string{
		"https://plugin.example 'unsafe-eval'",
		"https://api.example/path%3Bsegment%2Cpart https://backup.example",
		"object-src 'none'",
		"media-src 'none'",
		"child-src 'none'",
		"worker-src 'self'",
	} {
		if !strings.Contains(header, want) {
			t.Errorf("policy is missing %q: %s", want, header)
		}
	}
}

func TestBuildCSPDirectivesRejectsMultiplePolicies(t *testing.T) {
	for _, directive := range []string{"default-src", "script-src", "style-src", "img-src", "font-src", "connect-src"} {
		t.Run(directive, func(t *testing.T) {
			policy, err := BuildCSPDirectives("on-cluster", serverconfig.MultiKeyValue{
				directive: "https: , object-src https:",
			}, "nonce", "")
			if err == nil {
				t.Fatal("expected a value containing a policy separator to be rejected")
			}
			if len(policy) != 0 {
				t.Errorf("invalid configuration returned a partial policy: %v", policy)
			}
		})
	}
}
