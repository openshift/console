package actions

import (
	"fmt"
	"strings"
)

// validateChartURL checks the scheme and chart filename before a user-supplied
// chart reference is handed to Helm. Private and cluster-local hosts are
// allowed. It is a package-level variable so tests can skip the check;
// production code must not reassign it.
var validateChartURL = validateChartURLStrict

// ValidateChartURL checks that a chart reference uses oci, http, or https and,
// for http(s), names a .tgz or .tar.gz archive. It does not restrict the host.
func ValidateChartURL(raw string) error {
	return validateChartURL(raw)
}

// validateChartURLStrict accepts an oci:// reference or an http(s) URL whose
// path ends in .tgz or .tar.gz. Hostnames and IP addresses, including private
// and cluster-local targets, are not filtered.
func validateChartURLStrict(raw string) error {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return fmt.Errorf("chart URL is required")
	}
	if !IsChartURLWellFormed(raw) {
		return fmt.Errorf("invalid chart URL: must be an oci:// reference or an http(s) URL whose path ends in .tgz or .tar.gz")
	}
	return nil
}
