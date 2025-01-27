package utils

import (
	"reflect"
	"testing"

	consolev1 "github.com/openshift/api/console/v1"
	v1 "github.com/openshift/api/console/v1"
	"github.com/openshift/console/pkg/serverconfig"
)

const (
	onClusterBaseUri        = "base-uri 'self'"
	onClusterDefaultSrc     = "default-src 'self' console.redhat.com"
	onClusterImgSrc         = "img-src 'self'"
	onClusterFontSrc        = "font-src 'self'"
	onClusterScriptSrc      = "script-src 'self' console.redhat.com"
	onClusterStyleSrc       = "style-src 'self'"
	offClusterBaseUri       = "base-uri 'self' http://localhost:8080 ws://localhost:8080"
	offClusterDefaultSrc    = "default-src 'self' console.redhat.com http://localhost:8080 ws://localhost:8080"
	offClusterImgSrc        = "img-src 'self' http://localhost:8080"
	offClusterFontSrc       = "font-src 'self' http://localhost:8080"
	offClusterScriptSrc     = "script-src 'self' console.redhat.com http://localhost:8080 ws://localhost:8080"
	offClusterStyleSrc      = "style-src 'self' http://localhost:8080"
	connectSrcDirective     = "connect-src"
	objectSrcDirective      = "object-src"
	frameSrcDirective       = "frame-src 'none'"
	frameAncestorsDirective = "frame-ancestors 'none'"
)

func TestParseContentSecurityPolicyConfig(t *testing.T) {
	tests := []struct {
		name string
		csp  serverconfig.MultiKeyValue
		want *map[v1.DirectiveType][]string
	}{
		{
			name: "empty string",
			csp:  serverconfig.MultiKeyValue{},
			want: &map[consolev1.DirectiveType][]string{},
		},
		{
			name: "valid CSP",
			csp: serverconfig.MultiKeyValue{
				"DefaultSrc": "foo.bar.default",
				"ScriptSrc":  "foo.bar.script",
			},
			want: &map[consolev1.DirectiveType][]string{
				"DefaultSrc": {"foo.bar.default"},
				"ScriptSrc":  {"foo.bar.script"},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			parsedCSP := ParseContentSecurityPolicyConfig(tt.csp)
			if !reflect.DeepEqual(parsedCSP, tt.want) {
				t.Errorf("ParseContentSecurityPolicyConfig() error = %v, want %v", parsedCSP, tt.want)
			}
		})
	}
}

func TestBuildCSPDirectives(t *testing.T) {
	tests := []struct {
		name                  string
		k8sMode               string
		contentSecurityPolicy serverconfig.MultiKeyValue
		indexPageScriptNonce  string
		want                  []string
	}{
		{
			name:                  "on-cluster",
			k8sMode:               "on-cluster",
			contentSecurityPolicy: serverconfig.MultiKeyValue{},
			indexPageScriptNonce:  "foobar",
			want: []string{
				onClusterBaseUri,
				onClusterDefaultSrc,
				onClusterImgSrc + " data:",
				onClusterFontSrc + " data:",
				onClusterScriptSrc + " 'unsafe-eval' 'nonce-foobar'",
				onClusterStyleSrc + " 'unsafe-inline'",
				objectSrcDirective + " 'none'",
				connectSrcDirective + " 'none'",
				frameSrcDirective,
				frameAncestorsDirective,
			},
		},
		{
			name:                  "off-cluster",
			k8sMode:               "off-cluster",
			contentSecurityPolicy: serverconfig.MultiKeyValue{},
			indexPageScriptNonce:  "foobar",
			want: []string{
				offClusterBaseUri,
				offClusterDefaultSrc,
				offClusterImgSrc + " data:",
				offClusterFontSrc + " data:",
				offClusterScriptSrc + " 'unsafe-eval' 'nonce-foobar'",
				offClusterStyleSrc + " 'unsafe-inline'",
				objectSrcDirective + " 'none'",
				connectSrcDirective + " 'none'",
				frameSrcDirective,
				frameAncestorsDirective,
			},
		},
		{
			name:                 "on-cluster with config",
			k8sMode:              "on-cluster",
			indexPageScriptNonce: "foobar",
			contentSecurityPolicy: serverconfig.MultiKeyValue{
				"DefaultSrc": "foo.bar",
				"ImgSrc":     "foo.bar.baz",
				"FontSrc":    "foo.bar.baz",
				"ScriptSrc":  "foo.bar foo.bar.baz",
				"StyleSrc":   "foo.bar foo.bar.baz",
				"ObjectSrc":  "foo.bar.baz",
				"ConnectSrc": "foo.bar.baz",
			},
			want: []string{
				onClusterBaseUri,
				onClusterDefaultSrc + " foo.bar",
				onClusterImgSrc + " foo.bar.baz data:",
				onClusterFontSrc + " foo.bar.baz data:",
				onClusterScriptSrc + " foo.bar foo.bar.baz 'unsafe-eval' 'nonce-foobar'",
				onClusterStyleSrc + " foo.bar foo.bar.baz 'unsafe-inline'",
				objectSrcDirective + " foo.bar.baz",
				connectSrcDirective + " foo.bar.baz",
				frameSrcDirective,
				frameAncestorsDirective,
			},
		},
		{
			name:                 "off-cluster with config",
			k8sMode:              "off-cluster",
			indexPageScriptNonce: "foobar",
			contentSecurityPolicy: serverconfig.MultiKeyValue{
				"DefaultSrc": "foo.bar",
				"ImgSrc":     "foo.bar.baz",
				"FontSrc":    "foo.bar.baz",
				"ScriptSrc":  "foo.bar foo.bar.baz",
				"StyleSrc":   "foo.bar foo.bar.baz",
				"ObjectSrc":  "foo.bar.baz",
				"ConnectSrc": "foo.bar.baz",
			},
			want: []string{
				offClusterBaseUri,
				offClusterDefaultSrc + " foo.bar",
				offClusterImgSrc + " foo.bar.baz data:",
				offClusterFontSrc + " foo.bar.baz data:",
				offClusterScriptSrc + " foo.bar foo.bar.baz 'unsafe-eval' 'nonce-foobar'",
				offClusterStyleSrc + " foo.bar foo.bar.baz 'unsafe-inline'",
				objectSrcDirective + " foo.bar.baz",
				connectSrcDirective + " foo.bar.baz",
				frameSrcDirective,
				frameAncestorsDirective,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			got, err := BuildCSPDirectives(tt.k8sMode, tt.contentSecurityPolicy, tt.indexPageScriptNonce)
			if err != nil {
				t.Fatalf("buildCSPDirectives() error = %v", err)
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("buildCSPDirectives() got = %v, want %v", got, tt.want)
			}
		})
	}
}
