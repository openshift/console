package utils

import (
	"net/http"
	"net/url"
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
		{"provenance wrong case", "https://10.1.2.3/charts/a.tgz.PROV", ""},
		{"query suffix spoof", "https://10.1.2.3/secret?file=.tgz", ""},
		{"fragment suffix spoof", "https://10.1.2.3/secret#.tgz", ""},
		{"index query spoof", "https://10.1.2.3/secret?x=/index.yaml", ""},
		{"wrong scheme", "ftp://10.1.2.3/a.tgz", ""},
		{"index wrong case", "https://10.1.2.3/Index.yaml", ""},
		{"release asset chart", releaseAssetURL("rscd", "response-content-disposition", "redhat-nodejs-0.0.2.tgz"), "chart"},
		{"release asset github encoding", "https://release-assets.githubusercontent.com/github-production-release-asset/342201906/0be8e035-f681-4185-b220-8bc41c3a2c2d?sp=r&rscd=attachment%3B%20filename%3Dredhat-nodejs-0.0.2.tgz&response-content-disposition=attachment%3B%20filename%3Dredhat-nodejs-0.0.2.tgz", "chart"},
		{"release asset host case", "https://Release-Assets.GitHubUserContent.com/asset/1?rscd=attachment%3B%20filename%3Da.tgz", "chart"},
		{"release asset one disposition", releaseAssetURL("rscd", "", "redhat-nodejs-0.0.2.tgz"), "chart"},
		{"release asset other disposition", releaseAssetURL("", "response-content-disposition", "a.TGZ"), "chart"},
		{"release asset tar.gz", releaseAssetURL("rscd", "response-content-disposition", "a.tar.gz"), "chart"},
		{"release asset provenance", releaseAssetURL("rscd", "response-content-disposition", "a.tgz.prov"), "prov"},
		{"release asset provenance wrong case", releaseAssetURL("rscd", "", "a.tgz.PROV"), ""},
		{"release asset index", releaseAssetURL("rscd", "", "index.yaml"), "index"},
		{"release asset index path", releaseAssetQuoted("charts/index.yaml"), "index"},
		{"release asset plain file", releaseAssetURL("rscd", "response-content-disposition", "notes.txt"), ""},
		{"release asset index wrong case", releaseAssetURL("rscd", "", "Index.yaml"), ""},
		{"release asset shape disagreement", releaseAssetDisagreement(), ""},
		{"release asset missing filename", "https://release-assets.githubusercontent.com/asset/1?rscd=attachment", ""},
		{"release asset raw filename ignored", "https://release-assets.githubusercontent.com/asset/1?filename=a.tgz", ""},
		{"release asset lookalike host", "https://release-assets.githubusercontent.com.evil.test/asset/1?rscd=attachment%3B%20filename%3Da.tgz", ""},
		{"release asset suffix host", "https://evil.release-assets.githubusercontent.com/asset/1?rscd=attachment%3B%20filename%3Da.tgz", ""},
		{"disposition on other host", "https://10.1.2.3/secret?rscd=attachment%3B%20filename%3Da.tgz", ""},
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

	github := mustReq(t, "https://github.com/openshift-helm-charts/charts/releases/download/redhat-nodejs-0.0.2/redhat-nodejs-0.0.2.tgz")
	asset := releaseAssetURL("rscd", "response-content-disposition", "redhat-nodejs-0.0.2.tgz")
	require.True(t, FetchShapePreserved(redirectTo(t, github, asset)))
	require.False(t, FetchShapePreserved(redirectTo(t, github, releaseAssetURL("rscd", "", "redhat-nodejs-0.0.2.tgz.prov"))))
	require.False(t, FetchShapePreserved(redirectTo(t, github, "https://10.2.3.4/secret")))
	followed := redirectTo(t, redirectTo(t, github, asset), "https://10.2.3.4/secret")
	require.False(t, FetchShapePreserved(followed))

	provAsset := releaseAssetURL("rscd", "", "redhat-nodejs-0.0.2.tgz.prov")
	require.True(t, FetchShapePreserved(redirectTo(t, provOrig, provAsset)))
}

func TestFetchShapeAdditionalHost(t *testing.T) {
	saved := append([]fetchShapeHost(nil), fetchShapeHosts...)
	t.Cleanup(func() { fetchShapeHosts = saved })
	fetchShapeHosts = append(fetchShapeHosts, fetchShapeHost{
		host:           "charts.example.test",
		filenameParams: []string{"filename"},
	}, fetchShapeHost{
		host:              "mirror.example.test",
		dispositionParams: []string{"content-disposition"},
	})

	req, err := http.NewRequest(http.MethodGet, "https://charts.example.test/objects/1?filename=a.tgz", nil)
	require.NoError(t, err)
	require.Equal(t, "chart", FetchShape(req.URL))

	quoted := &url.URL{
		Scheme: "https",
		Host:   "mirror.example.test",
		Path:   "/objects/1",
	}
	query := quoted.Query()
	query.Set("content-disposition", `attachment; filename="a.tar.gz"`)
	quoted.RawQuery = query.Encode()
	require.Equal(t, "chart", FetchShape(quoted))

	elsewhere, err := http.NewRequest(http.MethodGet, "https://10.9.8.7/objects/1?filename=a.tgz", nil)
	require.NoError(t, err)
	require.Empty(t, FetchShape(elsewhere.URL))
}

func releaseAssetURL(firstKey, secondKey, filename string) string {
	u := &url.URL{
		Scheme: "https",
		Host:   "release-assets.githubusercontent.com",
		Path:   "/github-production-release-asset/1/uuid",
	}
	query := u.Query()
	if firstKey != "" {
		query.Set(firstKey, "attachment; filename="+filename)
	}
	if secondKey != "" {
		query.Set(secondKey, "attachment; filename="+filename)
	}
	u.RawQuery = query.Encode()
	return u.String()
}

func releaseAssetQuoted(filename string) string {
	u := &url.URL{
		Scheme: "https",
		Host:   "release-assets.githubusercontent.com",
		Path:   "/github-production-release-asset/1/uuid",
	}
	query := u.Query()
	query.Set("rscd", `attachment; filename="`+filename+`"`)
	u.RawQuery = query.Encode()
	return u.String()
}

func releaseAssetDisagreement() string {
	u := &url.URL{
		Scheme: "https",
		Host:   "release-assets.githubusercontent.com",
		Path:   "/github-production-release-asset/1/uuid",
	}
	query := u.Query()
	query.Set("rscd", "attachment; filename=a.tgz")
	query.Set("response-content-disposition", "attachment; filename=a.tgz.prov")
	u.RawQuery = query.Encode()
	return u.String()
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
