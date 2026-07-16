package actions

import (
	"bytes"
	"errors"
	"fmt"
	"strings"

	"helm.sh/helm/v4/pkg/action"
	"helm.sh/helm/v4/pkg/chart/loader"
	chartv2 "helm.sh/helm/v4/pkg/chart/v2"
	"helm.sh/helm/v4/pkg/cli"
	"helm.sh/helm/v4/pkg/release"
)

// RenderManifest performs a client-side dry-run installation of the provided
// chartURL with vals and release name. The provided conf serves as a baseline
// configuration, after which the installer is configured for client-side dry
// run.
//
// Helm libraries handle parsing of chartURL. CRDs and Hooks (if enabled) are
// added. The finally output contains the rendered manifests of what would be
// installed by the provided chart.
func RenderManifests(releaseName string, chartURL string, vals map[string]any, conf *action.Configuration) (string, error) {
	installer := action.NewInstall(conf)
	// Prepare client for rendering only, no installation
	installer.DryRunStrategy = "client"
	// Skip the releaseName check by enabling Replace mode.
	installer.Replace = true
	emptyResponse := ""

	// Must set the capabilities on *action.Install{}.KubeVersion directly
	// because Helm will replace our capabilities with the defaults they
	// configure.
	if conf.Capabilities != nil {
		installer.KubeVersion = &conf.Capabilities.KubeVersion
	}

	// Roundtrip through the installer name validation to make sure
	// installer flags don't conflict with a passed in releaseName and chartURL.
	releaseName, chartURL, err := installer.NameAndChart([]string{releaseName, chartURL})
	if err != nil {
		return emptyResponse, err
	}

	installer.ReleaseName = releaseName

	chartPath, err := installer.LocateChart(chartURL, cli.New())
	if err != nil {
		return emptyResponse, err
	}

	ch, err := loader.Load(chartPath)
	if err != nil {
		return emptyResponse, err
	}

	rel, err := installer.Run(ch, vals)
	if err != nil {
		return emptyResponse, err
	}

	relAccessor, err := release.NewAccessor(rel)
	if err != nil {
		return emptyResponse, err
	}

	var manifests bytes.Buffer
	var output bytes.Buffer

	// CRDObjects() method is not accessible from the chart.Charter interface,
	// we need to assert the supported type and pull the CRDs from there.
	switch v := relAccessor.Chart().(type) {
	case *chartv2.Chart:
		for _, f := range v.CRDObjects() {
			fmt.Fprintf(&manifests, "---\n# Source: %s\n%s\n", f.Name, f.File.Data)
		}
	// TODO(komish): When chartv3 becomes a part of Helm's public API, we should
	// be able to uncomment this and add the right imports to support that chart
	// type. May need to validate CRD types have not changed.
	//
	// case *chartv3.Chart:
	//  for _, f := range v.CRDObjects() {
	//      fmt.Fprintf(&manifests, "---\n# Source: %s\n%s\n", f.Name, f.File.Data)
	//  }
	default:
		return emptyResponse, errors.New("unsupported chart type")
	}

	fmt.Fprintln(&manifests, strings.TrimSpace(relAccessor.Manifest()))

	if !installer.DisableHooks {
		for _, hook := range relAccessor.Hooks() {
			hookAccessor, err := release.NewHookAccessor(hook)
			if err != nil {
				return emptyResponse, err
			}
			fmt.Fprintf(&manifests, "---\n# Source: %s\n%s\n", hookAccessor.Path(), hookAccessor.Manifest())
		}
	}

	fmt.Fprintf(&output, "%s", manifests.String())
	return output.String(), nil
}
