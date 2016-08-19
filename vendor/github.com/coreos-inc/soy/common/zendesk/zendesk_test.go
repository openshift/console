package zendesk

import (
	"testing"
)

func TestOrganizationTagsDiff(t *testing.T) {
	tests := []struct {
		argGot       []string
		argWant      []string
		argWhitelist []string

		wantAdd    []string
		wantRemove []string
		wantOK     bool
	}{
		// nothing to do
		{
			argGot:       []string{},
			argWant:      []string{},
			argWhitelist: []string{},
			wantAdd:      []string{},
			wantRemove:   []string{},
			wantOK:       true,
		},
		// unrecognized tag wanted
		{
			argGot:       []string{},
			argWant:      []string{"foo"},
			argWhitelist: []string{},
			wantAdd:      []string{},
			wantRemove:   []string{},
			wantOK:       true,
		},
		// unrecognized tag exists
		{
			argGot:       []string{"foo"},
			argWant:      []string{},
			argWhitelist: []string{},
			wantAdd:      []string{},
			wantRemove:   []string{},
			wantOK:       true,
		},
		// recognized tag needs to be removed
		{
			argGot:       []string{"bar"},
			argWant:      []string{},
			argWhitelist: []string{"bar"},
			wantAdd:      []string{},
			wantRemove:   []string{"bar"},
			wantOK:       false,
		},
		// recognized tag needs to be added
		{
			argGot:       []string{},
			argWant:      []string{"bar"},
			argWhitelist: []string{"bar"},
			wantAdd:      []string{"bar"},
			wantRemove:   []string{},
			wantOK:       false,
		},
		// real world case: existing tags, account switches from delinquent to terminated
		{
			argGot:       []string{"ignored-tag", OrganizationTagDelinquent},
			argWant:      []string{OrganizationTagTerminated},
			argWhitelist: OrganizationTags,
			wantAdd:      []string{OrganizationTagTerminated},
			wantRemove:   []string{OrganizationTagDelinquent},
			wantOK:       false,
		},
	}

	for i, tt := range tests {
		gotAdd, gotRemove, gotOK := DiffOrganizationTags(tt.argGot, tt.argWant, tt.argWhitelist)
		if tt.wantOK != gotOK {
			t.Errorf("case %d: wantOK=%t gotOK=%t", i, tt.wantOK, gotOK)
		}
		if !cmpStrings(tt.wantAdd, gotAdd) {
			t.Errorf("case %d: wantAdd=%q gotAdd=%q", i, tt.wantAdd, gotAdd)
		}
		if !cmpStrings(tt.wantRemove, gotRemove) {
			t.Errorf("case %d: wantRemove=%q gotRemove=%q", i, tt.wantRemove, gotRemove)
		}
	}
}

func cmpStrings(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
