package actions

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
	releaseutil "helm.sh/helm/v4/pkg/release/v1/util"
)

// requireManifestsEqual ignores whitespace around document boundaries while
// preserving document order and whitespace within each document.
func requireManifestsEqual(t *testing.T, expected, actual string) {
	t.Helper()

	normalize := func(manifest string) map[string]string {
		documents := releaseutil.SplitManifests(manifest)
		for name, document := range documents {
			documents[name] = strings.TrimSpace(document)
		}
		return documents
	}

	require.Equal(t, normalize(expected), normalize(actual))
}
