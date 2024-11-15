package utils

import (
	"reflect"
	"testing"
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
				"base-uri 'self'",
				"default-src 'self'",
				"img-src 'self' data:",
				"font-src 'self' data:",
				"script-src 'self' 'unsafe-eval' 'nonce-foobar'",
				"style-src 'self' 'unsafe-inline'",
				"frame-src 'none'",
				"frame-ancestors 'none'",
				"object-src 'none'",
			},
		},
		{
			name:                  "off-cluster",
			k8sMode:               "off-cluster",
			contentSecurityPolicy: "",
			indexPageScriptNonce:  "foobar",
			want: []string{
				"base-uri 'self' http://localhost:8080 ws://localhost:8080",
				"default-src 'self' http://localhost:8080 ws://localhost:8080",
				"img-src 'self' http://localhost:8080 ws://localhost:8080 data:",
				"font-src 'self' http://localhost:8080 ws://localhost:8080 data:",
				"script-src 'self' http://localhost:8080 ws://localhost:8080 'unsafe-eval' 'nonce-foobar'",
				"style-src 'self' http://localhost:8080 ws://localhost:8080 'unsafe-inline'",
				"frame-src 'none'",
				"frame-ancestors 'none'",
				"object-src 'none'",
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
				"base-uri 'self'",
				"default-src 'self' foo.bar",
				"img-src 'self' foo.bar.baz data:",
				"font-src 'self' foo.bar.baz data:",
				"script-src 'self' foo.bar foo.bar.baz 'unsafe-eval' 'nonce-foobar'",
				"style-src 'self' foo.bar foo.bar.baz 'unsafe-inline'",
				"frame-src 'none'",
				"frame-ancestors 'none'",
				"object-src 'none'",
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
				"base-uri 'self' http://localhost:8080 ws://localhost:8080",
				"default-src 'self' http://localhost:8080 ws://localhost:8080 foo.bar",
				"img-src 'self' http://localhost:8080 ws://localhost:8080 foo.bar.baz data:",
				"font-src 'self' http://localhost:8080 ws://localhost:8080 foo.bar.baz data:",
				"script-src 'self' http://localhost:8080 ws://localhost:8080 foo.bar foo.bar.baz 'unsafe-eval' 'nonce-foobar'",
				"style-src 'self' http://localhost:8080 ws://localhost:8080 foo.bar foo.bar.baz 'unsafe-inline'",
				"frame-src 'none'",
				"frame-ancestors 'none'",
				"object-src 'none'",
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
