package actions

import (
	"fmt"
	"net"
	"net/url"
	"strings"

	"github.com/openshift/console/pkg/utils"
)

// validateChartURL checks the scheme, chart filename, and local target before
// a user-supplied chart reference is handed to Helm. Localhost, loopback, and
// unspecified addresses are rejected. Private addresses are allowed. It is a
// package-level variable so tests can skip the check; production code must
// not reassign it.
var validateChartURL = validateChartURLStrict

// lookupChartHost resolves a chart URL hostname. Tests may replace it.
var lookupChartHost = net.LookupIP

// ValidateChartURL checks that a chart reference uses oci, http, or https and,
// for http(s), names a .tgz or .tar.gz archive. Localhost, loopback, and
// unspecified addresses are rejected. Other hosts, including private
// addresses, are allowed.
func ValidateChartURL(raw string) error {
	return validateChartURL(raw)
}

// validateChartURLStrict accepts an oci:// reference or an http(s) URL whose
// path ends in .tgz or .tar.gz, and rejects localhost, loopback, and
// unspecified addresses.
func validateChartURLStrict(raw string) error {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return fmt.Errorf("chart URL is required")
	}
	if !IsChartURLWellFormed(raw) {
		return fmt.Errorf("invalid chart URL: must be an oci:// reference or an http(s) URL whose path ends in .tgz or .tar.gz")
	}
	parsed, err := url.Parse(raw)
	if err != nil {
		return fmt.Errorf("invalid chart URL: %v", err)
	}
	if utils.HostTargetsLoopback(parsed.Hostname(), lookupChartHost) {
		return utils.ErrLoopbackTarget
	}
	return nil
}
