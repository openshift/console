package actions

import (
	"fmt"
	"net"
	"net/url"
	"strings"

	"github.com/openshift/console/pkg/utils"
)

// validateChartURL checks a user-supplied chart reference before it is handed
// to Helm, rejecting a malformed reference and certain addresses. It is a
// package-level variable so tests can skip the check; production code must
// not reassign it.
var validateChartURL = validateChartURLStrict

// lookupChartHost resolves a chart URL hostname. Tests may replace it.
var lookupChartHost = net.LookupIP

// ValidateChartURL checks a chart reference before it is handed to Helm,
// rejecting a malformed reference and certain addresses.
func ValidateChartURL(raw string) error {
	return validateChartURL(raw)
}

// validateChartURLStrict checks a chart reference before it is handed to Helm,
// rejecting a malformed reference and certain addresses.
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
	if utils.HostDisallowed(parsed.Hostname(), lookupChartHost) {
		return utils.ErrDisallowedHost
	}
	return nil
}
