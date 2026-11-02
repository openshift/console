package migration

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/wait"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/portforward"
	"k8s.io/client-go/transport/spdy"
	"sigs.k8s.io/controller-runtime/pkg/client"

	ocv1 "github.com/operator-framework/operator-controller/api/v1"
)

// catalogMeta represents a single entry from the catalog JSONL response.
type catalogMeta struct {
	Schema         string          `json:"schema"`
	Name           string          `json:"name"`
	Package        string          `json:"package"`
	DefaultChannel string          `json:"defaultChannel,omitempty"`
	Props          json.RawMessage `json:"properties,omitempty"`
	Entries        []channelEntry  `json:"entries,omitempty"`
}

type channelEntry struct {
	Name string `json:"name"`
}

// CatalogPackageInfo holds the results of querying a catalog for a package.
type CatalogPackageInfo struct {
	Found             bool
	DefaultChannel    string // the package's declared defaultChannel from the FBC
	AvailableVersions []string
	AvailableChannels []string
	VersionFound      bool
	ChannelFound      bool
}

// QueryCatalogForPackage queries a ClusterCatalog's content to check if the
// specified package, version, and channel are available.
func (m *Migrator) QueryCatalogForPackage(ctx context.Context, catalog *ocv1.ClusterCatalog, packageName, version, channel string, restConfig *rest.Config) (*CatalogPackageInfo, error) {
	if catalog.Status.URLs == nil {
		return nil, fmt.Errorf("catalog %s has no URLs in status", catalog.Name)
	}

	endpoint, stop, inClusterConfig, err := catalogEndpoint(ctx, catalog, restConfig)
	if err != nil {
		return nil, err
	}
	defer stop()
	transport, err := catalogHTTPTransport(inClusterConfig)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Accept", "application/json")
	resp, err := (&http.Client{Transport: transport}).Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to query catalog: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("catalog returned status %d", resp.StatusCode)
	}

	return parseCatalogResponse(resp.Body, packageName, version, channel)
}

// FBC schema type constants for parsing catalog JSONL responses.
const (
	fbcSchemaPackage = "olm.package"
	fbcSchemaBundle  = "olm.bundle"
	fbcSchemaChannel = "olm.channel"
)

// catalogHTTPTransport creates an unauthenticated transport for catalogd.
// Kubernetes credentials are used only for the API calls that establish access.
func catalogHTTPTransport(catalogConfig *rest.Config) (http.RoundTripper, error) {
	if catalogConfig == nil {
		return nil, fmt.Errorf("catalog transport requires a REST config")
	}
	transport, err := rest.TransportFor(rest.AnonymousClientConfig(catalogConfig))
	if err != nil {
		return nil, fmt.Errorf("create catalog transport: %w", err)
	}
	return transport, nil
}

// catalogEndpoint returns an authenticated API-server path for port forwarding
// outside a cluster or the catalog URL and its dedicated TLS config in a pod.
func catalogEndpoint(ctx context.Context, catalog *ocv1.ClusterCatalog, config *rest.Config) (string, func(), *rest.Config, error) {
	inCluster := config == nil
	if config == nil {
		var err error
		config, err = rest.InClusterConfig()
		if err != nil {
			return "", nil, nil, fmt.Errorf("load in-cluster REST config: %w", err)
		}
	}
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return "", nil, nil, fmt.Errorf("create Kubernetes client for catalog port-forward: %w", err)
	}
	namespace, serverName, err := catalogdServiceLocation(catalog)
	if err != nil {
		return "", nil, nil, err
	}
	podName, err := catalogdLeader(ctx, clientset, namespace)
	if err != nil {
		return "", nil, nil, err
	}
	catalogConfig, err := catalogdTLSConfig(ctx, clientset, config, namespace, podName)
	if err != nil {
		return "", nil, nil, err
	}
	if inCluster {
		return catalog.Status.URLs.Base + "/api/v1/all", func() {}, catalogConfig, nil
	}
	u, err := url.Parse(config.Host)
	if err != nil {
		return "", nil, nil, err
	}
	u.Path = path.Join(u.Path, "api", "v1", "namespaces", namespace, "pods", podName, "portforward")
	rt, upgrader, err := spdy.RoundTripperFor(config)
	if err != nil {
		return "", nil, nil, fmt.Errorf("create catalogd port-forward: %w", err)
	}
	stop, ready := make(chan struct{}), make(chan struct{})
	fw, err := portforward.NewOnAddresses(spdy.NewDialer(upgrader, &http.Client{Transport: rt}, http.MethodPost, u), []string{"127.0.0.1"}, []string{"0:8443"}, stop, ready, io.Discard, io.Discard)
	if err != nil {
		return "", nil, nil, err
	}
	forwardErr := make(chan error, 1)
	go func() { forwardErr <- fw.ForwardPorts() }()
	waitCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	select {
	case <-ready:
	case err := <-forwardErr:
		close(stop)
		if err != nil {
			return "", nil, nil, fmt.Errorf("start catalogd port-forward: %w", err)
		}
		return "", nil, nil, fmt.Errorf("catalogd port-forward stopped before becoming ready")
	case <-waitCtx.Done():
		close(stop)
		return "", nil, nil, fmt.Errorf("wait for catalogd port-forward: %w", waitCtx.Err())
	}
	ports, err := fw.GetPorts()
	if err != nil {
		close(stop)
		return "", nil, nil, err
	}
	// The local port-forward address is not the catalogd certificate's identity.
	// Verify the service DNS name advertised by ClusterCatalog status instead.
	catalogConfig.ServerName = serverName
	return fmt.Sprintf("https://127.0.0.1:%d/catalogs/%s/api/v1/all", ports[0].Local, catalog.Name), func() { close(stop) }, catalogConfig, nil
}

// catalogdServiceLocation derives catalogd's service namespace and TLS server
// name from the in-cluster endpoint published by operator-controller. This
// avoids imposing either the upstream cert-manager layout or OpenShift's
// service-ca layout on migration users.
func catalogdServiceLocation(catalog *ocv1.ClusterCatalog) (string, string, error) {
	if catalog.Status.URLs == nil || catalog.Status.URLs.Base == "" {
		return "", "", fmt.Errorf("catalog %s has no base URL in status", catalog.Name)
	}
	u, err := url.Parse(catalog.Status.URLs.Base)
	if err != nil {
		return "", "", fmt.Errorf("parse catalog %s base URL: %w", catalog.Name, err)
	}
	host := u.Hostname()
	parts := strings.Split(host, ".")
	if len(parts) < 3 || parts[0] == "" || parts[1] == "" || parts[2] != "svc" {
		return "", "", fmt.Errorf("catalog %s base URL %q does not use a Kubernetes service hostname", catalog.Name, catalog.Status.URLs.Base)
	}
	return parts[1], host, nil
}

// catalogdTLSConfig replaces the Kubernetes API CA with the CA carried by the
// serving certificate mounted in the current catalogd leader Pod. The secret
// name is deliberately discovered from the Pod: upstream installs use a
// cert-manager secret while OpenShift uses a service-ca-generated secret.
func catalogdTLSConfig(ctx context.Context, clientset kubernetes.Interface, config *rest.Config, namespace, podName string) (*rest.Config, error) {
	pod, err := clientset.CoreV1().Pods(namespace).Get(ctx, podName, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("get catalogd pod: %w", err)
	}
	secretName := catalogdServingCertificateSecret(pod)
	if secretName == "" {
		return nil, fmt.Errorf("catalogd pod %s/%s has no serving certificate Secret", namespace, podName)
	}
	secret, err := clientset.CoreV1().Secrets(namespace).Get(ctx, secretName, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("get catalogd CA: %w", err)
	}
	ca := secret.Data["ca.crt"]
	if len(ca) == 0 {
		ca = secret.Data["tls.crt"]
	}
	if len(ca) == 0 {
		return nil, fmt.Errorf("catalogd CA secret has no certificate")
	}
	catalogConfig := rest.CopyConfig(config)
	catalogConfig.CAFile = ""
	catalogConfig.CAData = ca
	// The copied API-server configuration may accept an insecure server or use
	// an outbound proxy. Neither setting is correct for catalogd: its serving
	// certificate must be verified with its own CA, and an external proxy cannot
	// reach the loopback endpoint used by the port-forward path.
	catalogConfig.Insecure = false
	catalogConfig.Proxy = nil
	return catalogConfig, nil
}

func catalogdServingCertificateSecret(pod *corev1.Pod) string {
	for _, volume := range pod.Spec.Volumes {
		if volume.Name == "catalogserver-certs" && volume.Secret != nil {
			return volume.Secret.SecretName
		}
	}
	return ""
}

// catalogdLeader waits for catalogd's leader Lease to reference a current pod.
func catalogdLeader(ctx context.Context, clientset kubernetes.Interface, namespace string) (string, error) {
	var lastErr error
	var leader string
	err := wait.PollUntilContextTimeout(ctx, time.Second, 30*time.Second, true, func(context.Context) (bool, error) {
		pods, err := clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{LabelSelector: "app.kubernetes.io/name=catalogd"})
		if err != nil {
			lastErr = fmt.Errorf("list catalogd pods: %w", err)
			return false, nil
		}
		lease, err := clientset.CoordinationV1().Leases(namespace).Get(ctx, "catalogd-operator-lock", metav1.GetOptions{})
		if err != nil {
			lastErr = fmt.Errorf("get catalogd leader lease: %w", err)
			return false, nil
		}
		if lease.Spec.HolderIdentity == nil || *lease.Spec.HolderIdentity == "" {
			lastErr = fmt.Errorf("catalogd leader lease has no holder identity")
			return false, nil
		}
		candidate := strings.SplitN(*lease.Spec.HolderIdentity, "_", 2)[0]
		for _, pod := range pods.Items {
			if pod.Name == candidate {
				leader = candidate
				return true, nil
			}
		}
		lastErr = fmt.Errorf("catalogd leader pod %q was not found", candidate)
		return false, nil
	})
	if err != nil {
		if lastErr != nil {
			return "", fmt.Errorf("resolve catalogd leader: %w", lastErr)
		}
		return "", fmt.Errorf("resolve catalogd leader: %w", err)
	}
	return leader, nil
}

func parseCatalogResponse(body io.Reader, packageName, version, channel string) (*CatalogPackageInfo, error) {
	info := &CatalogPackageInfo{}
	versionSet := map[string]bool{}
	channelSet := map[string]bool{}

	scanner := bufio.NewScanner(body)
	scanner.Buffer(make([]byte, 0, 1024*1024), 10*1024*1024)

	for scanner.Scan() {
		var meta catalogMeta
		if err := json.Unmarshal(scanner.Bytes(), &meta); err != nil {
			continue
		}

		switch meta.Schema {
		case fbcSchemaPackage:
			if meta.Name == packageName {
				info.Found = true
				if meta.DefaultChannel != "" {
					info.DefaultChannel = meta.DefaultChannel
				}
			}
		case fbcSchemaBundle:
			if meta.Package != packageName {
				continue
			}
			bundleVersion := extractBundleVersion(meta.Props)
			if bundleVersion != "" {
				versionSet[bundleVersion] = true
			}
		case fbcSchemaChannel:
			if meta.Package != packageName {
				continue
			}
			channelSet[meta.Name] = true
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading catalog response: %w", err)
	}

	for v := range versionSet {
		info.AvailableVersions = append(info.AvailableVersions, v)
	}
	for ch := range channelSet {
		info.AvailableChannels = append(info.AvailableChannels, ch)
	}

	info.VersionFound = versionSet[version]
	info.ChannelFound = channel == "" || channelSet[channel]

	return info, nil
}

func extractBundleVersion(propsRaw json.RawMessage) string {
	if propsRaw == nil {
		return ""
	}
	var props []struct {
		Type  string          `json:"type"`
		Value json.RawMessage `json:"value"`
	}
	if err := json.Unmarshal(propsRaw, &props); err != nil {
		return ""
	}
	for _, p := range props {
		if p.Type == "olm.package" {
			var pkg struct {
				Version string `json:"version"`
			}
			if err := json.Unmarshal(p.Value, &pkg); err == nil {
				return pkg.Version
			}
		}
	}
	return ""
}

// ResolveClusterCatalog selects the highest-priority serving ClusterCatalog
// containing the requested package and independently containing the installed
// version and, when specified, channel. It does not verify that the installed
// version belongs to that channel. Catalogs that cannot be queried are skipped;
// if none match, it returns a PackageNotFoundError.
func (m *Migrator) ResolveClusterCatalog(ctx context.Context, info *MigrationInfo, restConfig *rest.Config) (string, error) {
	var catalogList ocv1.ClusterCatalogList
	if err := m.Client.List(ctx, &catalogList); err != nil {
		return "", fmt.Errorf("failed to list ClusterCatalogs: %w", err)
	}

	type catalogCandidate struct {
		name     string
		priority int32
		pkgInfo  *CatalogPackageInfo
	}
	var candidates []catalogCandidate
	var queriedCatalogs []string

	for i := range catalogList.Items {
		catalog := &catalogList.Items[i]

		if catalog.Spec.AvailabilityMode == ocv1.AvailabilityModeUnavailable {
			continue
		}

		serving := false
		for _, c := range catalog.Status.Conditions {
			if c.Type == "Serving" && c.Status == metav1.ConditionTrue {
				serving = true
				break
			}
		}
		if !serving {
			continue
		}

		queriedCatalogs = append(queriedCatalogs, catalog.Name)
		m.progress(ProgressEvent{Step: ProgressStepCatalog, Status: ProgressWaiting, Message: fmt.Sprintf("Querying catalog %s for package %s@%s...", catalog.Name, info.PackageName, info.Version)})

		pkgInfo, err := m.QueryCatalogForPackage(ctx, catalog, info.PackageName, info.Version, info.Channel, restConfig)
		if err != nil {
			m.progress(ProgressEvent{Step: ProgressStepCatalog, Status: ProgressWarning, Message: fmt.Sprintf("Could not query catalog %s", catalog.Name), Err: err})
			continue
		}

		if pkgInfo.Found && pkgInfo.VersionFound && pkgInfo.ChannelFound {
			candidates = append(candidates, catalogCandidate{
				name:     catalog.Name,
				priority: catalog.Spec.Priority,
				pkgInfo:  pkgInfo,
			})
		}
	}

	if len(candidates) == 0 {
		return "", &PackageNotFoundError{
			PackageName:     info.PackageName,
			Version:         info.Version,
			Channel:         info.Channel,
			QueriedCatalogs: queriedCatalogs,
		}
	}

	best := candidates[0]
	for _, c := range candidates[1:] {
		if c.priority > best.priority {
			best = c
		}
	}

	return best.name, nil
}

// PackageNotFoundError is returned when no ClusterCatalog contains the required package.
type PackageNotFoundError struct {
	PackageName     string
	Version         string
	Channel         string
	QueriedCatalogs []string
}

func (e *PackageNotFoundError) Error() string {
	msg := fmt.Sprintf("package %q at version %q", e.PackageName, e.Version)
	if e.Channel != "" {
		msg += fmt.Sprintf(" in channel %q", e.Channel)
	}
	msg += " not found in any serving ClusterCatalog"
	if len(e.QueriedCatalogs) > 0 {
		msg += fmt.Sprintf(" (queried: %v)", e.QueriedCatalogs)
	}
	return msg
}

// CreateClusterCatalog creates a ClusterCatalog from a CatalogSource image reference
// and waits for it to reach a serving state.
func (m *Migrator) CreateClusterCatalog(ctx context.Context, name, imageRef string) error {
	catalog := &ocv1.ClusterCatalog{
		ObjectMeta: metav1.ObjectMeta{
			Name: name,
		},
		Spec: ocv1.ClusterCatalogSpec{
			Source: ocv1.CatalogSource{
				Type: ocv1.SourceTypeImage,
				Image: &ocv1.ImageSource{
					Ref: imageRef,
				},
			},
		},
	}

	if err := m.Client.Create(ctx, catalog); err != nil {
		return fmt.Errorf("failed to create ClusterCatalog: %w", err)
	}

	return wait.PollUntilContextTimeout(ctx, 5*time.Second, 3*time.Minute, true, func(ctx context.Context) (bool, error) {
		var cat ocv1.ClusterCatalog
		if err := m.Client.Get(ctx, client.ObjectKeyFromObject(catalog), &cat); err != nil {
			return false, err
		}
		for _, c := range cat.Status.Conditions {
			if c.Type == "Serving" && c.Status == metav1.ConditionTrue {
				return true, nil
			}
		}
		m.progress(ProgressEvent{Step: ProgressStepCatalog, Status: ProgressWaiting, Message: fmt.Sprintf("Waiting for ClusterCatalog %s to become ready...", name)})
		return false, nil
	})
}
