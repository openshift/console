package actions

import (
	"context"
	"fmt"
	"net/url"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/openshift/api/helm/v1beta1"
	"github.com/openshift/console/pkg/helm/metrics"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chart/loader"
	"helm.sh/helm/v3/pkg/release"
	kv1 "k8s.io/api/core/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	corev1client "k8s.io/client-go/kubernetes/typed/core/v1"
	"k8s.io/klog/v2"
)

var (
	helmChartRepositoryClusterGVK = schema.GroupVersionResource{
		Group:    "helm.openshift.io",
		Version:  "v1beta1",
		Resource: "helmchartrepositories",
	}
	helmChartRepositoryNamespaceGVK = schema.GroupVersionResource{
		Group:    "helm.openshift.io",
		Version:  "v1beta1",
		Resource: "projecthelmchartrepositories",
	}
	svVersionCore     = `\d+\.\d+\.\d+`
	svId              = `[a-zA-Z0-9-]+`
	svPrerelease      = svId + `(?:\.` + svId + `)*`
	svPrereleaseOpt   = `(?:-` + svPrerelease + `)?`
	svBuild           = svId + `(?:\.` + svId + `)*`
	svBuildOpt        = `(?:\+` + svBuild + `)?`
	chartVersionRegex = regexp.MustCompile(`-(` + svVersionCore + svPrereleaseOpt + svBuildOpt + `)\.(?:tgz|tar\.gz)$`)

	dnsLabel  = `[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?`
	hostPort  = dnsLabel + `(?:\.` + dnsLabel + `)*\.?(?::\d+)?`
	ociURLRe  = regexp.MustCompile(`(?i)^oci://` + hostPort)
	httpURLRe = regexp.MustCompile(`(?i)^https?://` + hostPort + `/.+\.(?:tar\.gz|tgz)$`)
)

// isValidChartURL validates chart URLs using RFC-compliant hostname labels.
// Accepts oci://<registry>/<path> and http(s)://<host>/<path>.tgz|tar.gz URLs.
func isValidChartURL(raw string) bool {
	return ociURLRe.MatchString(raw) || httpURLRe.MatchString(raw)
}

// chartVersionFromURL extracts the chart version from a chart URL.
// For OCI URLs the version is the tag after the last ':' in the path:
//
//	oci://registry/repo/chart:1.0.0 -> "1.0.0"
//
// For HTTP(S) archive URLs the version is parsed from the filename using the
// Helm naming convention <name>-<version>.tgz (or .tar.gz):
//
//	https://example.com/charts/argo-cd-9.4.1.tgz -> "9.4.1"
//
// Returns an empty string when no version can be determined.
func chartVersionFromURL(raw string) string {
	u, err := url.Parse(raw)
	if err != nil {
		return ""
	}

	switch u.Scheme {
	case "oci":
		// Digest refs (`@sha256`:...) should not extract a "version" (digests are content-addressed)
		if strings.Contains(u.Path, "@") {
			return ""
		}

		// OCI ref tag is the segment after the last ':' in the path (host may be host/link:tag for version)
		if i := strings.LastIndex(u.Path, ":"); i >= 0 {
			return u.Path[i+1:]
		}
	case "http", "https":
		// Extract the chart version from the filename.
		if i := strings.LastIndex(u.Path, "/"); i >= 0 {
			filename := u.Path[i+1:]
			if ver := chartVersionRegex.FindStringSubmatch(filename); ver != nil {
				return ver[1]
			}
			return ""
		}
	}
	return ""
}

func InstallChart(ns, name, url string, vals map[string]interface{}, conf *action.Configuration, client dynamic.Interface, coreClient corev1client.CoreV1Interface, fileCleanUp bool, indexEntry string) (*release.Release, error) {
	var err error
	var chartInfo *ChartInfo
	var cp, chartLocation string
	cmd := action.NewInstall(conf)
	// tlsFiles contain references of files to be removed once the chart
	// operation depending on those files is finished.
	tlsFiles := []*os.File{}
	if indexEntry == "" {
		chartInfo, err = getChartInfoFromChartUrl(url, ns, client, coreClient)
		if err != nil {
			return nil, err
		}
	} else {
		chartInfo = getChartInfoFromIndexEntry(indexEntry, ns, url)
	}

	connectionConfig, isClusterScoped, err := getRepositoryConnectionConfig(chartInfo.RepositoryName, ns, client)
	if err != nil {
		return nil, err
	}

	if isClusterScoped {
		clusterConnectionConfig := connectionConfig.(v1beta1.ConnectionConfig)
		tlsFiles, err = setUpAuthentication(&cmd.ChartPathOptions, &clusterConnectionConfig, coreClient)
		if err != nil {
			return nil, fmt.Errorf("error setting up authentication: %v", err)
		}
	} else {
		namespaceConnectionConfig := connectionConfig.(v1beta1.ConnectionConfigNamespaceScoped)
		tlsFiles, err = setUpAuthenticationProject(&cmd.ChartPathOptions, &namespaceConnectionConfig, coreClient, ns)
		if err != nil {
			return nil, fmt.Errorf("error setting up authentication: %v", err)
		}
	}
	cmd.ReleaseName = name
	chartLocation = url

	cmd.ChartPathOptions.Version = chartInfo.Version
	cp, err = cmd.ChartPathOptions.LocateChart(chartLocation, settings)
	if err != nil {
		return nil, fmt.Errorf("error locating chart: %v", err)
	}
	ch, err := loader.Load(cp)
	if err != nil {
		return nil, err
	}

	// Add chart URL as an annotation before installation
	if ch.Metadata == nil {
		ch.Metadata = new(chart.Metadata)
	}
	if ch.Metadata.Annotations == nil {
		ch.Metadata.Annotations = make(map[string]string)
	}
	ch.Metadata.Annotations["chart_url"] = url

	cmd.Namespace = ns
	release, err := cmd.Run(ch, vals)
	if err != nil {
		return nil, err
	}

	if ch.Metadata.Name != "" && ch.Metadata.Version != "" {
		metrics.HandleconsoleHelmInstallsTotal(ch.Metadata.Name, ch.Metadata.Version)
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
	return release, nil
}

func InstallChartAsync(ns, name, url string, vals map[string]interface{}, conf *action.Configuration, client dynamic.Interface, coreClient corev1client.CoreV1Interface, fileCleanUp bool, indexEntry string) (*kv1.Secret, error) {
	var err error
	var chartInfo *ChartInfo
	var cp, chartLocation string
	cmd := action.NewInstall(conf)
	// tlsFiles contain references of files to be removed once the chart
	// operation depending on those files is finished.
	tlsFiles := []*os.File{}
	if indexEntry == "" {
		chartInfo, err = getChartInfoFromChartUrl(url, ns, client, coreClient)
		if err != nil {
			return nil, err
		}
	} else {
		chartInfo = getChartInfoFromIndexEntry(indexEntry, ns, url)
	}

	connectionConfig, isClusterScoped, err := getRepositoryConnectionConfig(chartInfo.RepositoryName, ns, client)
	if err != nil {
		return nil, err
	}

	if isClusterScoped {
		clusterConnectionConfig := connectionConfig.(v1beta1.ConnectionConfig)
		tlsFiles, err = setUpAuthentication(&cmd.ChartPathOptions, &clusterConnectionConfig, coreClient)
		if err != nil {
			return nil, fmt.Errorf("error setting up authentication: %v", err)
		}
	} else {
		namespaceConnectionConfig := connectionConfig.(v1beta1.ConnectionConfigNamespaceScoped)
		tlsFiles, err = setUpAuthenticationProject(&cmd.ChartPathOptions, &namespaceConnectionConfig, coreClient, ns)
		if err != nil {
			return nil, fmt.Errorf("error setting up authentication: %v", err)
		}
	}
	cmd.ReleaseName = name
	chartLocation = url
	cmd.ChartPathOptions.Version = chartInfo.Version
	cp, err = cmd.ChartPathOptions.LocateChart(chartLocation, settings)
	if err != nil {
		return nil, fmt.Errorf("error locating chart: %v", err)
	}
	ch, err := loader.Load(cp)
	if err != nil {
		return nil, err
	}

	// Add chart URL as an annotation before installation
	if ch.Metadata == nil {
		ch.Metadata = new(chart.Metadata)
	}
	if ch.Metadata.Annotations == nil {
		ch.Metadata.Annotations = make(map[string]string)
	}
	ch.Metadata.Annotations["chart_url"] = url

	cmd.Namespace = ns
	go func() {
		_, err := cmd.Run(ch, vals)
		if err == nil {
			if ch.Metadata.Name != "" && ch.Metadata.Version != "" {
				metrics.HandleconsoleHelmInstallsTotal(ch.Metadata.Name, ch.Metadata.Version)
			}
		} else {
			createSecret(ns, name, 1, coreClient, err)
			time.Sleep(15 * time.Second)
			coreClient.Secrets(ns).Delete(context.TODO(), name, v1.DeleteOptions{})
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
	}()
	secret, err := getSecret(ns, name, 1, coreClient)
	if err != nil {
		return nil, err
	}
	return &secret, nil
}

// applyBasicAuthFromSecret sets cmd.Username and cmd.Password from a Secret in ns with
// keys "username" and "password" (same convention as HelmChartRepository connectionConfig).
func applyBasicAuthFromSecret(cmd *action.Install, coreClient corev1client.CoreV1Interface, ns, secretName string) error {
	if secretName == "" {
		return nil
	}
	secret, err := coreClient.Secrets(ns).Get(context.TODO(), secretName, v1.GetOptions{})
	if err != nil {
		return fmt.Errorf("failed to get secret %q from namespace %q: %w", secretName, ns, err)
	}
	u, uok := secret.Data[username]
	p, pok := secret.Data[password]
	if !uok {
		return fmt.Errorf("failed to find %q key in secret %q/%q", username, ns, secretName)
	}
	if !pok {
		return fmt.Errorf("failed to find %q key in secret %q/%q", password, ns, secretName)
	}
	cmd.Username = string(u)
	cmd.Password = string(p)
	return nil
}

// InstallChartFromURL installs a chart from an OCI or direct HTTP(S) chart URL.
// If not provided, version is extracted from the OCI URL tag when applicable.
// basicAuthSecretName names a Secret in ns containing username and password keys for registry auth.
func InstallChartFromURL(ns, name, url string, vals map[string]interface{}, conf *action.Configuration, coreClient corev1client.CoreV1Interface, version string, basicAuthSecretName string) (*kv1.Secret, error) {

	if !isValidChartURL(url) {
		return nil, fmt.Errorf("invalid chart URL: %s, must be oci:// URL or http(s)://*.tgz", url)
	}

	cmd := action.NewInstall(conf)
	cmd.ReleaseName = name
	cmd.Namespace = ns

	if err := applyBasicAuthFromSecret(cmd, coreClient, ns, basicAuthSecretName); err != nil {
		return nil, err
	}
	// OCI pulls use conf.RegistryClient when set; the getter does not merge ChartPathOptions username/password
	// onto that client (see helm ocigetter). Rebuild the client with basic auth when credentials are supplied.
	if basicAuthSecretName != "" {
		rc, err := RegistryClientWithBasicAuth(false, false, cmd.Username, cmd.Password)
		if err != nil {
			return nil, fmt.Errorf("failed to configure OCI registry client: %w", err)
		}
		cmd.SetRegistryClient(rc)
	}

	// Set version so LocateChart (and Helm OCI) resolve the correct chart tag; matches InstallChart behavior.
	if version == "" {
		version = chartVersionFromURL(url)
	}
	url = strings.TrimSuffix(url, ":"+version) // remove version from URL for OCI as LocateChart will resolve the correct tag
	cmd.ChartPathOptions.Version = version

	cp, err := cmd.ChartPathOptions.LocateChart(url, settings)
	if err != nil {
		return nil, fmt.Errorf("error locating chart: %v", err)
	}
	ch, err := loader.Load(cp)
	if err != nil {
		return nil, err
	}

	// Add chart URL as an annotation before installation
	if ch.Metadata == nil {
		ch.Metadata = &chart.Metadata{}
	}
	if ch.Metadata.Annotations == nil {
		ch.Metadata.Annotations = make(map[string]string)
	}
	ch.Metadata.Annotations["chart_url"] = url
	ch.Metadata.Annotations["installation"] = "url_install"
	go func() {
		_, err := cmd.Run(ch, vals)
		if err == nil {
			klog.Infof("Successfully installed chart from URL %s as release %s/%s", url, ns, name)
			if ch.Metadata.Name != "" && ch.Metadata.Version != "" {
				metrics.HandleconsoleHelmInstallsTotal(ch.Metadata.Name, ch.Metadata.Version)
			}
		} else {
			klog.Errorf("Failed to install chart from URL %s as release %s/%s: %v", url, ns, name, err)
			if secretErr := createSecret(ns, name, 1, coreClient, err); secretErr != nil {
				klog.Errorf("Failed to create error-tracking secret for release %s/%s: %v", ns, name, secretErr)
			}
			time.Sleep(15 * time.Second)
			coreClient.Secrets(ns).Delete(context.TODO(), name, v1.DeleteOptions{})
		}
	}()
	secret, err := getSecret(ns, name, 1, coreClient)
	if err != nil {
		return nil, err
	}
	return &secret, nil
}
