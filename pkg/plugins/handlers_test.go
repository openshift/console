package plugins

import "testing"

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
