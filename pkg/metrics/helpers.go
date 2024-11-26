package metrics

import (
	"bytes"
	"strings"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/common/expfmt"
)

// (Only) Used in different metrics_tests.
//
// Format multiple metrics into the common prometheus text format with a comment
// for the metric title and description.
//
//	# TEXT metric title
//	# HELP metric description
//	a_metric_total 1
func FormatMetrics(cs ...prometheus.Collector) string {
	registry := prometheus.NewRegistry()
	registry.MustRegister(cs...)
	mfs, _ := registry.Gather()
	writer := &bytes.Buffer{}
	enc := expfmt.NewEncoder(writer, expfmt.FmtText)
	for _, mf := range mfs {
		enc.Encode(mf)
	}
	return writer.String()
}

// (Only) Used in different metrics_tests.
//
// Removes all lines starting with an # (comments) from the input string,
// so that the metric title and description could be ignored in unit tests.
func RemoveComments(s string) string {
	lines := strings.Split(s, "\n")
	filteredLines := make([]string, 0, len(lines))
	for _, line := range lines {
		trimmedLine := strings.TrimSpace(line)
		if len(trimmedLine) > 0 && !strings.HasPrefix(trimmedLine, "#") {
			filteredLines = append(filteredLines, trimmedLine)
		}
	}
	return strings.Join(filteredLines, "\n")
}
