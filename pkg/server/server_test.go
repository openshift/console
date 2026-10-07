package server

import (
	"reflect"
	"testing"

	"github.com/openshift/console/pkg/serverconfig"
)

func TestRedactSensitiveTelemetry(t *testing.T) {
	tests := []struct {
		name     string
		in       serverconfig.MultiKeyValue
		expected serverconfig.MultiKeyValue
	}{
		{
			name:     "nil telemetry",
			in:       nil,
			expected: serverconfig.MultiKeyValue{},
		},
		{
			name:     "empty telemetry",
			in:       serverconfig.MultiKeyValue{},
			expected: serverconfig.MultiKeyValue{},
		},
		{
			name: "no account mail leaves config untouched",
			in: serverconfig.MultiKeyValue{
				"CLUSTER_ID":      "some-cluster-id",
				"ORGANIZATION_ID": "12345",
			},
			expected: serverconfig.MultiKeyValue{
				"CLUSTER_ID":      "some-cluster-id",
				"ORGANIZATION_ID": "12345",
			},
		},
		{
			name: "account mail is replaced by its domain",
			in: serverconfig.MultiKeyValue{
				"ACCOUNT_MAIL": "shadowman@redhat.com",
				"CLUSTER_ID":   "some-cluster-id",
			},
			expected: serverconfig.MultiKeyValue{
				"ACCOUNT_MAIL_DOMAIN": "redhat.com",
				"CLUSTER_ID":          "some-cluster-id",
			},
		},
		{
			name: "subdomains are preserved",
			in: serverconfig.MultiKeyValue{
				"ACCOUNT_MAIL": "shadowman@mail.corp.redhat.com",
			},
			expected: serverconfig.MultiKeyValue{
				"ACCOUNT_MAIL_DOMAIN": "mail.corp.redhat.com",
			},
		},
		// The cases below mirror the invalid addresses already covered by the
		// frontend useTelemetry tests, which report an empty domain for each.
		{
			name:     "address without a separator yields no domain",
			in:       serverconfig.MultiKeyValue{"ACCOUNT_MAIL": "invalid-email"},
			expected: serverconfig.MultiKeyValue{},
		},
		{
			name:     "address with an empty domain yields no domain",
			in:       serverconfig.MultiKeyValue{"ACCOUNT_MAIL": "shadowman@"},
			expected: serverconfig.MultiKeyValue{},
		},
		{
			name:     "address with multiple separators yields no domain",
			in:       serverconfig.MultiKeyValue{"ACCOUNT_MAIL": "red@hat@redhat.com"},
			expected: serverconfig.MultiKeyValue{},
		},
		{
			name:     "only separators yields no domain",
			in:       serverconfig.MultiKeyValue{"ACCOUNT_MAIL": "@@"},
			expected: serverconfig.MultiKeyValue{},
		},
		{
			name:     "empty address yields no domain",
			in:       serverconfig.MultiKeyValue{"ACCOUNT_MAIL": ""},
			expected: serverconfig.MultiKeyValue{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			actual := redactSensitiveTelemetry(tt.in)

			if _, leaked := actual["ACCOUNT_MAIL"]; leaked {
				t.Errorf("ACCOUNT_MAIL must never reach the unauthenticated index page, got %q", actual["ACCOUNT_MAIL"])
			}
			if !reflect.DeepEqual(actual, tt.expected) {
				t.Errorf("expected %v, got %v", tt.expected, actual)
			}
		})
	}
}

// The caller embeds the result into an HTTP response, so redaction must not
// write back into the Server's long-lived telemetry config.
func TestRedactSensitiveTelemetryDoesNotMutateInput(t *testing.T) {
	in := serverconfig.MultiKeyValue{
		"ACCOUNT_MAIL": "shadowman@redhat.com",
		"CLUSTER_ID":   "some-cluster-id",
	}

	redactSensitiveTelemetry(in)

	if got := in["ACCOUNT_MAIL"]; got != "shadowman@redhat.com" {
		t.Errorf("input was mutated, ACCOUNT_MAIL is now %q", got)
	}
	if _, added := in["ACCOUNT_MAIL_DOMAIN"]; added {
		t.Error("input was mutated, ACCOUNT_MAIL_DOMAIN was added")
	}
}
