package main

import (
	"crypto/tls"
	"testing"
)

func TestTLSCurvePreferences(t *testing.T) {
	tests := []struct {
		name            string
		groups          []string
		want            []tls.CurveID
		wantUnsupported []string
	}{
		{
			name:   "maps all supported TLS groups",
			groups: []string{"X25519", "secp256r1", "secp384r1", "secp521r1", "X25519MLKEM768", "SecP256r1MLKEM768", "SecP384r1MLKEM1024"},
			want:   []tls.CurveID{tls.X25519, tls.CurveP256, tls.CurveP384, tls.CurveP521, tls.X25519MLKEM768, tls.SecP256r1MLKEM768, tls.SecP384r1MLKEM1024},
		},
		{
			name:            "skips unknown TLS groups when supported groups remain",
			groups:          []string{"X25519", "unknown", "secp256r1"},
			want:            []tls.CurveID{tls.X25519, tls.CurveP256},
			wantUnsupported: []string{"unknown"},
		},
		{
			name:            "returns no curves when all TLS groups are unsupported",
			groups:          []string{"unknown", "future-group"},
			wantUnsupported: []string{"unknown", "future-group"},
		},
		{
			name:   "returns nothing for empty input",
			groups: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, unsupported := tlsCurvePreferences(tt.groups)

			if len(unsupported) != len(tt.wantUnsupported) {
				t.Fatalf("tlsCurvePreferences() unsupported len = %d, want %d", len(unsupported), len(tt.wantUnsupported))
			}
			for i := range tt.wantUnsupported {
				if unsupported[i] != tt.wantUnsupported[i] {
					t.Fatalf("tlsCurvePreferences() unsupported[%d] = %q, want %q", i, unsupported[i], tt.wantUnsupported[i])
				}
			}

			if len(got) != len(tt.want) {
				t.Fatalf("tlsCurvePreferences() len = %d, want %d", len(got), len(tt.want))
			}
			for i := range tt.want {
				if got[i] != tt.want[i] {
					t.Fatalf("tlsCurvePreferences()[%d] = %v, want %v", i, got[i], tt.want[i])
				}
			}
		})
	}
}
