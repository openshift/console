package utils

import (
	"reflect"
	"testing"
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
	frameSrcDirective       = "frame-src 'none'"
	frameAncestorsDirective = "frame-ancestors 'none'"
	objectSrcDirective      = "object-src 'none'"
)

func TestParseContentSecurityPolicyConfig(t *testing.T) {
	tests := []struct {
		name    string
		csp     string
		wantErr bool
	}{
		{
			name:    "empty string",
			csp:     `{}`,
			wantErr: false,
		},
		{
			name:    "valid CSP",
			csp:     `{"DefaultSrc": ["foo.bar.default"], "ScriptSrc": ["foo.bar.script"]}`,
			wantErr: false,
		},
		{
			name:    "invalid CSP",
			csp:     `{"InvalidSrc": ["foo.bar"]}`,
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := ParseContentSecurityPolicyConfig(tt.csp)
			if (err != nil) != tt.wantErr {
				t.Errorf("ParseContentSecurityPolicyConfig() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestBuildCSPDirectives(t *testing.T) {
	tests := []struct {
		name                  string
		k8sMode               string
		contentSecurityPolicy string
		indexPageScriptNonce  string
		want                  []string
	}{
		{
			name:                  "on-cluster",
			k8sMode:               "on-cluster",
			contentSecurityPolicy: "",
			indexPageScriptNonce:  "foobar",
			want: []string{
				onClusterBaseUri,
				onClusterDefaultSrc,
				onClusterImgSrc + " data:",
				onClusterFontSrc + " data:",
				onClusterScriptSrc + " 'unsafe-eval' 'nonce-foobar'",
				onClusterStyleSrc + " 'unsafe-inline'",
				frameSrcDirective,
				frameAncestorsDirective,
				objectSrcDirective,
			},
		},
		{
			name:                  "off-cluster",
			k8sMode:               "off-cluster",
			contentSecurityPolicy: "",
			indexPageScriptNonce:  "foobar",
			want: []string{
				offClusterBaseUri,
				offClusterDefaultSrc,
				offClusterImgSrc + " data:",
				offClusterFontSrc + " data:",
				offClusterScriptSrc + " 'unsafe-eval' 'nonce-foobar'",
				offClusterStyleSrc + " 'unsafe-inline'",
				frameSrcDirective,
				frameAncestorsDirective,
				objectSrcDirective,
			},
		},
		{
			name:                 "on-cluster with config",
			k8sMode:              "on-cluster",
			indexPageScriptNonce: "foobar",
			contentSecurityPolicy: `
				{
					"DefaultSrc": ["foo.bar"],
					"ImgSrc": ["foo.bar.baz"],
					"FontSrc": ["foo.bar.baz"],
					"ScriptSrc": ["foo.bar", "foo.bar.baz"],
					"StyleSrc": ["foo.bar", "foo.bar.baz"]
				}
			`,
			want: []string{
				onClusterBaseUri,
				onClusterDefaultSrc + " foo.bar",
				onClusterImgSrc + " foo.bar.baz data:",
				onClusterFontSrc + " foo.bar.baz data:",
				onClusterScriptSrc + " foo.bar foo.bar.baz 'unsafe-eval' 'nonce-foobar'",
				onClusterStyleSrc + " foo.bar foo.bar.baz 'unsafe-inline'",
				frameSrcDirective,
				frameAncestorsDirective,
				objectSrcDirective,
			},
		},
		{
			name:                 "off-cluster with config",
			k8sMode:              "off-cluster",
			indexPageScriptNonce: "foobar",
			contentSecurityPolicy: `
				{
					"DefaultSrc": ["foo.bar"],
					"ImgSrc": ["foo.bar.baz"],
					"FontSrc": ["foo.bar.baz"],
					"ScriptSrc": ["foo.bar", "foo.bar.baz"],
					"StyleSrc": ["foo.bar", "foo.bar.baz"]
				}
			`,
			want: []string{
				offClusterBaseUri,
				offClusterDefaultSrc + " foo.bar",
				offClusterImgSrc + " foo.bar.baz data:",
				offClusterFontSrc + " foo.bar.baz data:",
				offClusterScriptSrc + " foo.bar foo.bar.baz 'unsafe-eval' 'nonce-foobar'",
				offClusterStyleSrc + " foo.bar foo.bar.baz 'unsafe-inline'",
				frameSrcDirective,
				frameAncestorsDirective,
				objectSrcDirective,
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
