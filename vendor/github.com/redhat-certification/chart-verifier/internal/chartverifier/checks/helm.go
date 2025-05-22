/*
 * Copyright 2021 Red Hat
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package checks

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"

	"helm.sh/helm/v3/pkg/chartutil"

	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chart/loader"

	"helm.sh/helm/v3/pkg/action"
	kubefake "helm.sh/helm/v3/pkg/kube/fake"
	"helm.sh/helm/v3/pkg/storage"
	"helm.sh/helm/v3/pkg/storage/driver"

	"github.com/redhat-certification/chart-verifier/internal/helm/actions"
)

// loadChartFromRemote attempts to retrieve a Helm chart from the given remote url. Returns an error if the given url
// doesn't contain the 'http' or 'https' schema, or any other error related to retrieving the contents of the chart.
func loadChartFromRemote(url *url.URL) (*chart.Chart, error) {
	if url.Scheme != "http" && url.Scheme != "https" {
		return nil, fmt.Errorf("only 'http' and 'https' schemes are supported, but got %q", url.Scheme)
	}

	resp, err := http.Get(url.String())
	if err != nil {
		return nil, err
	}

	if resp.StatusCode == http.StatusNotFound {
		return nil, ChartNotFoundErr(url.String())
	}

	return loader.LoadArchive(resp.Body)
}

// loadChartFromAbsPath attempts to retrieve a local Helm chart by resolving the maybe relative path into an absolute
// path from the current working directory.
func loadChartFromAbsPath(path string) (*chart.Chart, error) {
	// although filepath.Abs() can return an error according to its signature, this won't happen (as of go 1.15)
	// because the only invalid value it would accept is an empty string, which is internally converted into "."
	// regardless, the error is still being caught and propagated to avoid being bitten by internal changes in the
	// future
	chartPath, err := filepath.Abs(path)
	if err != nil {
		return nil, err
	}

	c, err := loader.Load(chartPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, ChartNotFoundErr(path)
		}
		return nil, err
	}

	return c, nil
}

type ChartCache interface {
	MakeKey(uri string) string
	Add(uri string, chrt *chart.Chart) (ChartCacheItem, error)
	Get(uri string) (ChartCacheItem, bool, error)
}

type ChartCacheItem struct {
	Chart *chart.Chart
	Path  string
}

type chartCache struct {
	chartMap map[string]ChartCacheItem
}

func newChartCache() *chartCache {
	return &chartCache{
		chartMap: make(map[string]ChartCacheItem),
	}
}

func (c *chartCache) MakeKey(uri string) string {
	return regexp.MustCompile("[:/?.-]").ReplaceAllString(uri, "_")
}

func (c *chartCache) Get(uri string) (ChartCacheItem, bool, error) {
	if item, ok := c.chartMap[c.MakeKey(uri)]; !ok {
		return ChartCacheItem{}, false, nil
	} else {
		return item, true, nil
	}
}

func (c *chartCache) Add(opts *CheckOptions, chrt *chart.Chart) (ChartCacheItem, error) {
	var (
		err          error
		userCacheDir string
	)

	userCacheDir = getCacheDir(opts)
	if userCacheDir == "" {
		return ChartCacheItem{}, err
	}
	key := c.MakeKey(opts.URI)
	chartCacheDir := path.Join(userCacheDir, key)
	cacheItem := ChartCacheItem{Chart: chrt, Path: path.Join(chartCacheDir, chrt.Name())}
	if err = chartutil.SaveDir(chrt, chartCacheDir); err != nil {
		return ChartCacheItem{}, err
	}
	c.chartMap[key] = cacheItem
	return cacheItem, nil
}

var defaultChartCache *chartCache

func init() {
	defaultChartCache = newChartCache()
}

// LoadChartFromURI attempts to retrieve a chart from the given uri string. It accepts "http", "https", "file" schemes,
// and defaults to "file" if there isn't one.
func LoadChartFromURI(opts *CheckOptions) (*chart.Chart, string, error) {
	var (
		chrt *chart.Chart
		err  error
	)

	if cached, ok, _ := defaultChartCache.Get(opts.URI); ok {
		return cached.Chart, cached.Path, nil
	}

	u, err := url.Parse(opts.URI)
	if err != nil {
		return nil, "", err
	}

	switch u.Scheme {
	case "http", "https":
		chrt, err = loadChartFromRemote(u)
	case "file", "":
		chrt, err = loadChartFromAbsPath(u.Path)
	default:
		return nil, "", fmt.Errorf("scheme %q not supported", u.Scheme)
	}

	if err != nil {
		return nil, "", err
	}

	if cached, err := defaultChartCache.Add(opts, chrt); err != nil {
		return nil, "", err
	} else {
		return cached.Chart, cached.Path, nil
	}
}

type ChartNotFoundErr string

func (c ChartNotFoundErr) Error() string {
	return "chart not found: " + string(c)
}

func IsChartNotFound(err error) bool {
	_, ok := err.(ChartNotFoundErr)
	return ok
}

// getImageReferences renders the templates for chartURI and extracts
// imageReferences from the template output, using vals as necessaary.
//
// Note that template rendering doesn't technically need a remote cluster, but
// the chart's constraints are still validated against mocked cluster
// information. For this reaosn, serverKubeVersionString must produce a valid
// semantic version corresponding to a kubeVersion within the chart's
// constraints as defined in Chart.yaml.
func getImageReferences(chartURI string, vals map[string]interface{}, serverKubeVersionString string) ([]string, error) {
	// We'll start with DefaultCapabilities, but we'll really only use the
	// kubeVersion of this when rendering manifests because Helm replaces the
	// action config's capabilities for client-only execution.
	caps := chartutil.DefaultCapabilities.Copy()

	kubeVersion, err := chartutil.ParseKubeVersion(serverKubeVersionString)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", "unable to render manifests and extract images due to invalid kubeVersion in server capabilities", err)
	}

	caps.KubeVersion = *kubeVersion

	actionConfig := &action.Configuration{
		Releases:     nil,
		KubeClient:   &kubefake.PrintingKubeClient{Out: io.Discard},
		Capabilities: caps,
		Log:          func(format string, v ...interface{}) {},
	}

	mem := driver.NewMemory()
	mem.SetNamespace("TestNamespace")
	actionConfig.Releases = storage.Init(mem)

	txt, err := actions.RenderManifests("test-release", chartURI, vals, actionConfig)
	if err != nil {
		return nil, err
	}

	return getImagesFromContent(txt)
}

// getImagesFromContent evaluates generated templates from
// helm and extracts images which are returned in a slice
func getImagesFromContent(content string) ([]string, error) {
	re, err := regexp.Compile(`\s+image\:\s+(?P<image>.*)\n`)
	if err != nil {
		return nil, fmt.Errorf("error getting images; %v", err)
	}
	matches := re.FindAllStringSubmatch(content, -1)
	imageMap := make(map[string]struct{})
	for _, match := range matches {
		image := strings.TrimSpace(match[re.SubexpIndex("image")])
		image = strings.Trim(image, "\"")
		image = strings.Trim(image, "'")
		imageMap[image] = struct{}{}
	}

	var images []string
	for k := range imageMap {
		images = append(images, k)
	}

	return images, nil
}

func getCacheDir(opts *CheckOptions) string {
	var err error
	cacheDir := opts.HelmEnvSettings.RepositoryCache
	if cacheDir == "" {
		cacheDir, err = os.UserCacheDir()
		if err != nil {
			return ""
		}
	}
	return path.Join(cacheDir, "chart-verifier")
}
