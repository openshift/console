package utils

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestFetchShape(t *testing.T) {
	tests := []struct {
		name string
		raw  string
		want string
	}{
		{"chart tgz", "https://10.1.2.3/charts/a.tgz", "chart"},
		{"chart tar.gz", "http://10.1.2.3/a.tar.gz", "chart"},
		{"chart uppercase", "https://10.1.2.3/a.TGZ", "chart"},
		{"chart with query", "https://10.1.2.3/a.tgz?foo=bar", "chart"},
		{"encoded dot", "https://10.1.2.3/a%2Etgz", "chart"},
		{"index", "https://10.1.2.3/charts/index.yaml", "index"},
		{"index with query", "https://10.1.2.3/index.yaml?x=1", "index"},
		{"encoded index dot", "https://10.1.2.3/index%2Eyaml", "index"},
		{"provenance", "https://10.1.2.3/charts/a.tgz.prov", "prov"},
		{"query suffix spoof", "https://10.1.2.3/secret?file=.tgz", ""},
		{"fragment suffix spoof", "https://10.1.2.3/secret#.tgz", ""},
		{"index query spoof", "https://10.1.2.3/secret?x=/index.yaml", ""},
		{"wrong scheme", "ftp://10.1.2.3/a.tgz", ""},
		{"index wrong case", "https://10.1.2.3/Index.yaml", ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, err := http.NewRequest(http.MethodGet, tt.raw, nil)
			require.NoError(t, err)
			require.Equal(t, tt.want, FetchShape(req.URL))
		})
	}
}

func TestFetchShapePreserved(t *testing.T) {
	orig := mustReq(t, "https://10.1.2.3/charts/a.tgz")
	same := redirectTo(t, orig, "https://10.2.3.4/mirror/b.tar.gz?x=1")
	require.True(t, FetchShapePreserved(same))

	otherPath := redirectTo(t, orig, "https://10.2.3.4/secret")
	require.False(t, FetchShapePreserved(otherPath))

	index := redirectTo(t, orig, "https://10.2.3.4/index.yaml")
	require.False(t, FetchShapePreserved(index))

	provOrig := mustReq(t, "https://10.1.2.3/charts/a.tgz.prov")
	prov := redirectTo(t, provOrig, "https://10.2.3.4/a.tgz.prov")
	require.True(t, FetchShapePreserved(prov))
	require.False(t, FetchShapePreserved(redirectTo(t, provOrig, "https://10.2.3.4/a.tgz")))
}

func TestHTTPSDowngraded(t *testing.T) {
	orig := mustReq(t, "https://10.1.2.3/charts/a.tgz")
	require.True(t, HTTPSDowngraded(redirectTo(t, orig, "http://10.1.2.3/mirror/a.tgz")))
	require.False(t, HTTPSDowngraded(redirectTo(t, orig, "https://10.2.3.4/mirror/a.tgz")))

	httpOrig := mustReq(t, "http://10.1.2.3/charts/a.tgz")
	require.False(t, HTTPSDowngraded(redirectTo(t, httpOrig, "http://10.2.3.4/mirror/a.tgz")))
	require.False(t, HTTPSDowngraded(redirectTo(t, httpOrig, "https://10.2.3.4/mirror/a.tgz")))
}

func mustReq(t *testing.T, raw string) *http.Request {
	t.Helper()
	req, err := http.NewRequest(http.MethodGet, raw, nil)
	require.NoError(t, err)
	return req
}

func redirectTo(t *testing.T, orig *http.Request, raw string) *http.Request {
	t.Helper()
	req := mustReq(t, raw)
	req.Response = &http.Response{Request: orig}
	return req
}
