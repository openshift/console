package utils

import (
	"reflect"
	"testing"

	"github.com/openshift/console/pkg/serverconfig"
)

const (
	onClusterBaseUri        = "base-uri 'self'"
	onClusterDefaultSrc     = "default-src 'self'"
	onClusterImgSrc         = "img-src 'self'"
	onClusterFontSrc        = "font-src 'self'"
	onClusterScriptSrc      = "script-src 'self' console.redhat.com"
	onClusterStyleSrc       = "style-src 'self'"
	offClusterBaseUri       = "base-uri 'self' http://localhost:8080 ws://localhost:8080"
	offClusterDefaultSrc    = "default-src 'self' http://localhost:8080 ws://localhost:8080"
	offClusterImgSrc        = "img-src 'self' http://localhost:8080"
	offClusterFontSrc       = "font-src 'self' http://localhost:8080"
	offClusterScriptSrc     = "script-src 'self' console.redhat.com http://localhost:8080 ws://localhost:8080"
	offClusterStyleSrc      = "style-src 'self' http://localhost:8080"
	connectSrcDirective     = "connect-src 'self' console.redhat.com"
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
		shouldError           bool
	}{
		{
			name:                  "on-cluster",
			k8sMode:               "on-cluster",
			contentSecurityPolicy: serverconfig.MultiKeyValue{},
			indexPageScriptNonce:  "foobar",
			cspReportingEndpoint:  "",
			want: []string{
				onClusterBaseUri,
				connectSrcDirective,
				onClusterDefaultSrc,
				onClusterFontSrc + " data:",
				frameAncestorsDirective,
				frameSrcDirective,
				onClusterImgSrc + " data:",
				onClusterScriptSrc + " 'unsafe-eval' 'nonce-foobar'",
				onClusterStyleSrc + " 'unsafe-inline'",
			},
			shouldError: false,
		},
		{
			name:                  "off-cluster",
			k8sMode:               "off-cluster",
			contentSecurityPolicy: serverconfig.MultiKeyValue{},
			indexPageScriptNonce:  "foobar",
			cspReportingEndpoint:  "",
			want: []string{
				offClusterBaseUri,
				connectSrcDirective,
				offClusterDefaultSrc,
				offClusterFontSrc + " data:",
				frameAncestorsDirective,
				frameSrcDirective,
				offClusterImgSrc + " data:",
				offClusterScriptSrc + " 'unsafe-eval' 'nonce-foobar'",
				offClusterStyleSrc + " 'unsafe-inline'",
			},
			shouldError: false,
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
				connectSrcDirective + " foo.bar.baz",
				onClusterDefaultSrc + " foo.bar",
				onClusterFontSrc + " foo.bar.baz data:",
				frameAncestorsDirective,
				frameSrcDirective,
				onClusterImgSrc + " foo.bar.baz data:",
				onClusterScriptSrc + " foo.bar foo.bar.baz 'unsafe-eval' 'nonce-foobar'",
				onClusterStyleSrc + " foo.bar foo.bar.baz 'unsafe-inline'",
			},
			shouldError: false,
		},
		{
			name:                  "on-cluster with CSP reporting enabled",
			k8sMode:               "on-cluster",
			contentSecurityPolicy: serverconfig.MultiKeyValue{},
			indexPageScriptNonce:  "foobar",
			cspReportingEndpoint:  "http://localhost:7777/csp-test-endpoint",
			want: []string{
				onClusterBaseUri,
				connectSrcDirective,
				onClusterDefaultSrc,
				onClusterFontSrc + " data:",
				frameAncestorsDirective,
				frameSrcDirective,
				onClusterImgSrc + " data:",
				onClusterScriptSrc + " 'unsafe-eval' 'nonce-foobar'",
				onClusterStyleSrc + " 'unsafe-inline'",
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
				connectSrcDirective + " foo.bar.baz",
				offClusterDefaultSrc + " foo.bar",
				offClusterFontSrc + " foo.bar.baz data:",
				frameAncestorsDirective,
				frameSrcDirective,
				offClusterImgSrc + " foo.bar.baz data:",
				offClusterScriptSrc + " foo.bar foo.bar.baz 'unsafe-eval' 'nonce-foobar'",
				offClusterStyleSrc + " foo.bar foo.bar.baz 'unsafe-inline'",
			},
			shouldError: false,
		},
		{
			name:                 "config with invalid CSP",
			k8sMode:              "off-cluster",
			indexPageScriptNonce: "foobar",
			cspReportingEndpoint: "",
			contentSecurityPolicy: serverconfig.MultiKeyValue{
				"invalid-src": "foo.bar.baz",
			},
			want:        []string{},
			shouldError: true,
		},
		{
			name:                  "off-cluster with CSP reporting enabled",
			k8sMode:               "off-cluster",
			contentSecurityPolicy: serverconfig.MultiKeyValue{},
			indexPageScriptNonce:  "foobar",
			cspReportingEndpoint:  "http://localhost:7777/csp-test-endpoint",
			want: []string{
				offClusterBaseUri,
				connectSrcDirective,
				offClusterDefaultSrc,
				offClusterFontSrc + " data:",
				frameAncestorsDirective,
				frameSrcDirective,
				offClusterImgSrc + " data:",
				offClusterScriptSrc + " 'unsafe-eval' 'nonce-foobar'",
				offClusterStyleSrc + " 'unsafe-inline'",
				"report-uri http://localhost:7777/csp-test-endpoint",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			got, err := BuildCSPDirectives(tt.k8sMode, tt.contentSecurityPolicy, tt.indexPageScriptNonce, tt.cspReportingEndpoint)

			if (err != nil) != tt.shouldError {
				t.Errorf("buildCSPDirectives() error = %v, wantErr %v", err, tt.shouldError)
				return
			}

			if err == nil && !reflect.DeepEqual(got, tt.want) {
				t.Errorf("buildCSPDirectives() got = %v, want %v", got, tt.want)
			}
		})
	}
}
