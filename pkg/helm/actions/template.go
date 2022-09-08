package actions

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/openshift/api/helm/v1beta1"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart/loader"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/releaseutil"
	"k8s.io/client-go/dynamic"
	corev1client "k8s.io/client-go/kubernetes/typed/core/v1"
)

func RenderManifests(name string, url string, vals map[string]interface{}, conf *action.Configuration, dynamicClient dynamic.Interface, coreClient corev1client.CoreV1Interface, ns, indexEntry string, fileCleanUp bool) (string, error) {
	var showFiles []string
	var chartInfo *ChartInfo
	var err error
	var chartLocation string
	response := make(map[string]string)
	validate := false
	client := action.NewInstall(conf)
	client.DryRun = true
	includeCrds := true
	client.ReleaseName = "RELEASE-NAME"
	client.Replace = true // Skip the releaseName check
	client.ClientOnly = !validate
	emptyResponse := ""
	tlsFiles := []*os.File{}
	if indexEntry == "" {
		chartInfo, err = getChartInfoFromChartUrl(url, ns, dynamicClient, coreClient)
		if err != nil {
			return "", err
		}
	} else {
		chartInfo = getChartInfoFromIndexEntry(indexEntry, ns, url)
	}
	client.ChartPathOptions.Version = chartInfo.Version
	connectionConfig, isClusterScoped, err := getRepositoryConnectionConfig(chartInfo.RepositoryName, ns, dynamicClient)
	if err != nil {
		return "", err
	}
	if isClusterScoped {
		clusterConnectionConfig := connectionConfig.(v1beta1.ConnectionConfig)
		tlsFiles, err = setUpAuthentication(&client.ChartPathOptions, &clusterConnectionConfig, coreClient)
		if err != nil {
			return "", fmt.Errorf("error setting up authentication: %w", err)
		}
	} else {
		namespaceConnectionConfig := connectionConfig.(v1beta1.ConnectionConfigNamespaceScoped)
		tlsFiles, err = setUpAuthenticationProject(&client.ChartPathOptions, &namespaceConnectionConfig, coreClient, ns)
		if err != nil {
			return "", fmt.Errorf("error setting up authentication: %w", err)
		}
	}
	client.ReleaseName = name
	if len(tlsFiles) == 0 {
		chartLocation = url
	} else {
		chartLocation = chartInfo.Name
	}
	cp, err := client.ChartPathOptions.LocateChart(chartLocation, cli.New())
	if err != nil {
		return emptyResponse, err
	}

	ch, err := loader.Load(cp)
	if err != nil {
		return emptyResponse, err
	}

	rel, err := client.Run(ch, vals)
	if err != nil {
		return emptyResponse, err
	}

	var manifests bytes.Buffer
	var output bytes.Buffer

	if includeCrds {
		for _, f := range rel.Chart.CRDs() {
			fmt.Fprintf(&manifests, "---\n# Source: %s\n%s\n", f.Name, f.Data)
		}
	}

	fmt.Fprintln(&manifests, strings.TrimSpace(rel.Manifest))

	if !client.DisableHooks {
		for _, m := range rel.Hooks {
			fmt.Fprintf(&manifests, "---\n# Source: %s\n%s\n", m.Path, m.Manifest)
		}
	}

	// if we have a list of files to render, then check that each of the
	// provided files exists in the chart.
	if len(showFiles) > 0 {
		splitManifests := releaseutil.SplitManifests(manifests.String())
		manifestNameRegex := regexp.MustCompile("# Source: [^/]+/(.+)")
		var manifestsToRender []string
		for _, f := range showFiles {
			missing := true
			for _, manifest := range splitManifests {
				submatch := manifestNameRegex.FindStringSubmatch(manifest)
				if len(submatch) == 0 {
					continue
				}
				manifestName := submatch[1]
				// manifest.Name is rendered using linux-style filepath separators on Windows as
				// well as macOS/linux.
				manifestPathSplit := strings.Split(manifestName, "/")
				manifestPath := filepath.Join(manifestPathSplit...)

				// if the filepath provided matches a manifest path in the
				// chart, render that manifest
				if f == manifestPath {
					manifestsToRender = append(manifestsToRender, manifest)
					missing = false
				}
			}
			if missing {
				return "", fmt.Errorf("could not find template %s in chart", f)
			}
			for _, m := range manifestsToRender {
				response[f] = m
				fmt.Fprintf(&output, "---\n%s\n", m)
			}
		}
	} else {
		fmt.Fprintf(&output, "%s", manifests.String())
	}
	// remove all the tls related files created by this process
	defer func() {
		if fileCleanUp == false {
			return
		}
		for _, f := range tlsFiles {
			os.Remove(f.Name())
		}
	}()
	return output.String(), nil
}
