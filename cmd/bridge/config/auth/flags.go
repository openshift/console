package auth

import "strings"

// optionalString is a string flag Value that records whether it was set.
type optionalString struct {
	Value string
	IsSet bool
}

func (o *optionalString) String() string { return o.Value }
func (o *optionalString) Set(v string) error {
	o.Value, o.IsSet = v, true
	return nil
}

// optionalStringSlice is a comma-separated flag value that records whether it was set.
// An explicitly empty value results in an empty list.
type optionalStringSlice struct {
	Values []string
	IsSet  bool
}

func (o *optionalStringSlice) String() string { return strings.Join(o.Values, ",") }
func (o *optionalStringSlice) Set(v string) error {
	o.IsSet = true
	o.Values = nil
	for item := range strings.SplitSeq(v, ",") {
		if item = strings.TrimSpace(item); item != "" {
			o.Values = append(o.Values, item)
		}
	}
	return nil
}
