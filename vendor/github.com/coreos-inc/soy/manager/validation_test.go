package manager

import (
	"testing"
)

func TestValidEmail(t *testing.T) {
	tests := []struct {
		email  string
		expect bool
	}{
		{
			email:  "",
			expect: false,
		},
		{
			email:  "test",
			expect: false,
		},
		{
			email:  "test@",
			expect: false,
		},
		{
			email:  "@",
			expect: false,
		},
		{
			email:  " @ ",
			expect: false,
		},
		{
			email:  "test@example",
			expect: false,
		},
		{
			email:  "test@example.com ",
			expect: false,
		},
		{
			email:  " test@example.com",
			expect: false,
		},
		{
			email:  "test@example.com",
			expect: true,
		},
	}
	for i, tt := range tests {
		got := ValidEmail(tt.email)
		if got != tt.expect {
			t.Errorf("case %d: email validation failure for: %q. want: %v, got: %v", i, tt.email, tt.expect, got)
		}
	}
}

func TestValidRole(t *testing.T) {
	tests := []struct {
		role   string
		expect bool
	}{
		{
			role:   "",
			expect: false,
		},
		{
			role:   "junkstring",
			expect: false,
		},
		{
			role:   "read_only",
			expect: false,
		},
		{
			role:   "admin",
			expect: false,
		},
		{
			role:   "super_user",
			expect: false,
		},
		{
			role:   "READ_ONLY",
			expect: true,
		},
		{
			role:   "ADMIN",
			expect: true,
		},
		{
			role:   "SUPER_USER",
			expect: true,
		},
	}
	for i, tt := range tests {
		got := ValidRole(tt.role)
		if got != tt.expect {
			t.Errorf("case %d: role validation failure for: %q. want: %v, got: %v", i, tt.role, tt.expect, got)
		}
	}
}
