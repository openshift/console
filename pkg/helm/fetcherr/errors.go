// Package fetcherr turns Helm chart and repository fetch failures into
// client-safe errors. Connection, DNS, timeout, and HTTP failures that do not
// yield a chart or index are reported as missing files, so a caller cannot
// tell a missing host from a refused port. Response bodies that are not a
// Helm chart or repository index are never included.
package fetcherr

import (
	"errors"
	"regexp"
	"strings"
)

var (
	// ErrChartFileNotFound is returned when a chart URL cannot be retrieved.
	// DNS failures, refused connections, timeouts, and non-auth HTTP errors
	// all use this error.
	ErrChartFileNotFound = errors.New("chart file not found")
	// ErrChartAuthentication is returned when the registry or chart server
	// rejects the request for credentials. The upstream status and body are
	// omitted.
	ErrChartAuthentication = errors.New(`chart registry requires authentication; select a Secret with valid "username" and "password" keys for basic authentication`)
	// ErrNotHelmChart is returned when bytes were retrieved but are not a
	// Helm chart archive. The retrieved bytes are not included.
	ErrNotHelmChart = errors.New("retrieved file is not a Helm chart")

	// ErrIndexFileNotFound is returned when a repository index cannot be
	// retrieved. It covers the same unreachable-host cases as ErrChartFileNotFound.
	ErrIndexFileNotFound = errors.New("repository index file not found")
	// ErrIndexAuthentication is returned when an index request is rejected
	// for credentials, without the upstream status or body.
	ErrIndexAuthentication = errors.New("repository index requires authentication")
	// ErrIndexNotHelm is returned when the response is not a Helm repository
	// index. The response body is not included.
	ErrIndexNotHelm = errors.New("retrieved file is not a Helm repository index")
)

// Match credential failures without treating a chart version such as 1.2.401
// as an HTTP status. Helm reports "401 Unauthorized" / "403 Forbidden", and
// OCI clients report "status code 401".
var authPattern = regexp.MustCompile(`(?i)(?:status(?:\s+code)?\s+|: )(?:401|403)\b|unauthorized|forbidden|authentication failed|requires authentication`)

// SanitizeChartLocateError classifies an error from resolving or downloading
// a chart.
func SanitizeChartLocateError(err error) error {
	return SanitizeChartError(err)
}

// SanitizeChartLoadError classifies an error from reading a chart archive
// that was already retrieved. The original text is kept only for a few
// structural problems that do not quote archive contents.
func SanitizeChartLoadError(err error) error {
	if err == nil {
		return nil
	}
	if preserved, ok := safeChartStructureError(err); ok {
		return preserved
	}
	return ErrNotHelmChart
}

// SanitizeChartError classifies a chart fetch or chart-verifier failure.
// Post-fetch Helm and Kubernetes errors are returned unchanged. Any other
// unrecognized error is reported as a non-chart response, without its
// original text.
func SanitizeChartError(err error) error {
	if err == nil {
		return nil
	}
	msg := err.Error()
	lower := strings.ToLower(msg)
	if preserveFetchedChartError(lower) {
		return err
	}
	if authPattern.MatchString(lower) {
		return ErrChartAuthentication
	}
	if inaccessible(lower) {
		return ErrChartFileNotFound
	}
	if preserved, ok := safeChartStructureError(err); ok {
		return preserved
	}
	return ErrNotHelmChart
}

func preserveFetchedChartError(lower string) bool {
	switch {
	case strings.HasPrefix(lower, "check error:"),
		strings.Contains(lower, "install failure"),
		strings.Contains(lower, "chart test failure"),
		strings.Contains(lower, "upgrade testing"),
		strings.Contains(lower, "release: not found"),
		strings.Contains(lower, "revision not found"),
		strings.Contains(lower, "unsupported chart url"),
		strings.Contains(lower, "chart url is required"),
		strings.Contains(lower, "invalid chart url"),
		strings.Contains(lower, "chart path is invalid"),
		strings.Contains(lower, "missing registry client"),
		strings.HasPrefix(lower, "path ") && strings.Contains(lower, " not found"),
		strings.Contains(lower, "can't create tls config"),
		strings.Contains(lower, "content cache must be set"),
		strings.Contains(lower, "not found in") && strings.Contains(lower, "index"):
		return true
	default:
		return false
	}
}

func inaccessible(lower string) bool {
	switch {
	case strings.Contains(lower, "connection refused"),
		strings.Contains(lower, "connection reset"),
		strings.Contains(lower, "broken pipe"),
		strings.Contains(lower, "no such host"),
		strings.Contains(lower, "server misbehaving"),
		strings.Contains(lower, "no route to host"),
		strings.Contains(lower, "network is unreachable"),
		strings.Contains(lower, "i/o timeout"),
		strings.Contains(lower, "timeout exceeded"),
		strings.Contains(lower, "deadline exceeded"),
		strings.Contains(lower, "dial tcp"),
		strings.Contains(lower, "dial udp"),
		strings.Contains(lower, "tls:"),
		strings.Contains(lower, "x509:"),
		strings.Contains(lower, "certificate"),
		strings.Contains(lower, "handshake"),
		strings.Contains(lower, "failed to fetch"),
		strings.Contains(lower, "chart not found:"),
		strings.Contains(lower, "manifest unknown"),
		strings.Contains(lower, "name unknown"),
		strings.Contains(lower, "blob unknown"),
		strings.Contains(lower, "status code"),
		strings.Contains(lower, "stopped after"),
		strings.Contains(lower, "redirect from https"),
		strings.Contains(lower, "server gave http"),
		strings.Contains(lower, "use of closed network connection"),
		strings.HasSuffix(lower, ": eof"),
		lower == "eof":
		return true
	default:
		return false
	}
}

func safeChartStructureError(err error) (error, bool) {
	switch err.Error() {
	case "Chart.yaml file is missing",
		"no files in chart archive",
		"chart illegally contains absolute paths",
		"chart illegally references parent directory",
		"chart contains illegally named files",
		"cannot load a directory":
		return err, true
	default:
		return nil, false
	}
}
