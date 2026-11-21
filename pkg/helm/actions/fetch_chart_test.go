package actions

import (
	"context"
	"net"
	"net/http"
	"testing"

	"github.com/openshift/console/pkg/helm/utils"
	"github.com/stretchr/testify/require"
)

func TestValidateChartFetchRequestNil(t *testing.T) {
	require.EqualError(t, validateChartFetchRequest(nil), "nil chart URL")

	req, err := http.NewRequest(http.MethodGet, "https://10.1.2.3/charts/a.tgz", nil)
	require.NoError(t, err)
	req.URL = nil
	require.EqualError(t, validateChartFetchRequest(req), "nil chart URL")
}

func TestChartTransportRejectsRedirectShape(t *testing.T) {
	prev := utils.LoopbackDialAllowed()
	utils.SetAllowLoopbackDialForTest(false)
	t.Cleanup(func() { utils.SetAllowLoopbackDialForTest(prev) })

	tr, err := chartTransport(nil)
	require.NoError(t, err)
	proxy := tr.Proxy

	orig, err := http.NewRequest(http.MethodGet, "https://10.1.2.3/charts/a.tgz", nil)
	require.NoError(t, err)
	_, err = proxy(orig)
	require.NoError(t, err)

	same, err := http.NewRequest(http.MethodGet, "https://10.2.3.4/mirror/b.tar.gz?x=1", nil)
	require.NoError(t, err)
	same.Response = &http.Response{Request: orig}
	_, err = proxy(same)
	require.NoError(t, err)

	other, err := http.NewRequest(http.MethodGet, "https://10.2.3.4/secret", nil)
	require.NoError(t, err)
	other.Response = &http.Response{Request: orig}
	_, err = proxy(other)
	require.EqualError(t, err, "invalid chart URL")

	down, err := http.NewRequest(http.MethodGet, "http://10.2.3.4/mirror/b.tgz", nil)
	require.NoError(t, err)
	down.Response = &http.Response{Request: orig}
	_, err = proxy(down)
	require.EqualError(t, err, "redirect from https to http is not allowed")

	loop, err := http.NewRequest(http.MethodGet, "https://127.0.0.1/mirror/b.tgz", nil)
	require.NoError(t, err)
	loop.Response = &http.Response{Request: orig}
	_, err = proxy(loop)
	require.ErrorIs(t, err, utils.ErrDisallowedHost)

	index, err := http.NewRequest(http.MethodGet, "https://10.1.2.3/charts/index.yaml", nil)
	require.NoError(t, err)
	_, err = proxy(index)
	require.NoError(t, err)
	indexElsewhere, err := http.NewRequest(http.MethodGet, "https://10.2.3.4/mirror/index.yaml", nil)
	require.NoError(t, err)
	indexElsewhere.Response = &http.Response{Request: index}
	_, err = proxy(indexElsewhere)
	require.NoError(t, err)
	chartFromIndex, err := http.NewRequest(http.MethodGet, "https://10.2.3.4/a.tgz", nil)
	require.NoError(t, err)
	chartFromIndex.Response = &http.Response{Request: index}
	_, err = proxy(chartFromIndex)
	require.EqualError(t, err, "invalid chart URL")
}

func TestChartTransportAllowsReleaseAssetRedirect(t *testing.T) {
	prev := utils.LoopbackDialAllowed()
	utils.SetAllowLoopbackDialForTest(false)
	t.Cleanup(func() {
		utils.SetAllowLoopbackDialForTest(prev)
		utils.SetRequestHostLookupForTest(nil)
	})
	utils.SetRequestHostLookupForTest(func(context.Context, string) ([]net.IP, error) {
		return []net.IP{net.ParseIP("8.8.8.8")}, nil
	})

	tr, err := chartTransport(nil)
	require.NoError(t, err)
	proxy := tr.Proxy

	orig, err := http.NewRequest(http.MethodGet, "https://github.com/openshift-helm-charts/charts/releases/download/redhat-nodejs-0.0.2/redhat-nodejs-0.0.2.tgz", nil)
	require.NoError(t, err)
	asset, err := http.NewRequest(http.MethodGet, "https://release-assets.githubusercontent.com/github-production-release-asset/1/uuid?rscd=attachment%3B%20filename%3Dredhat-nodejs-0.0.2.tgz&response-content-disposition=attachment%3B%20filename%3Dredhat-nodejs-0.0.2.tgz", nil)
	require.NoError(t, err)
	asset.Response = &http.Response{Request: orig}
	_, err = proxy(asset)
	require.NoError(t, err)

	provName, err := http.NewRequest(http.MethodGet, "https://release-assets.githubusercontent.com/github-production-release-asset/1/uuid?rscd=attachment%3B%20filename%3Dredhat-nodejs-0.0.2.tgz.prov", nil)
	require.NoError(t, err)
	provName.Response = &http.Response{Request: orig}
	_, err = proxy(provName)
	require.EqualError(t, err, "invalid chart URL")

	elsewhere, err := http.NewRequest(http.MethodGet, "https://10.2.3.4/secret?rscd=attachment%3B%20filename%3Dredhat-nodejs-0.0.2.tgz", nil)
	require.NoError(t, err)
	elsewhere.Response = &http.Response{Request: orig}
	_, err = proxy(elsewhere)
	require.EqualError(t, err, "invalid chart URL")

	down, err := http.NewRequest(http.MethodGet, "http://release-assets.githubusercontent.com/github-production-release-asset/1/uuid?rscd=attachment%3B%20filename%3Dredhat-nodejs-0.0.2.tgz", nil)
	require.NoError(t, err)
	down.Response = &http.Response{Request: orig}
	_, err = proxy(down)
	require.EqualError(t, err, "redirect from https to http is not allowed")
}
