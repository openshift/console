package utils

import (
	"reflect"
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
