package actions

import (
	"bytes"
	"fmt"
	"path/filepath"
	"regexp"
	"strings"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart/loader"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/releaseutil"
)

func RenderManifests(name string, url string, vals map[string]interface{}, conf *action.Configuration) (string, error) {
	var showFiles []string
	response := make(map[string]string)
	validate := false
	client := action.NewInstall(conf)
	client.DryRun = true
	includeCrds := true
	client.ReleaseName = "RELEASE-NAME"
	client.Replace = true // Skip the releaseName check
	client.ClientOnly = !validate
	emptyResponse := ""

	name, chart, err := client.NameAndChart([]string{name, url})
	if err != nil {
		return emptyResponse, err
	}
	client.ReleaseName = name

	cp, err := client.ChartPathOptions.LocateChart(chart, cli.New())
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
	return output.String(), nil
}
