package server

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/url"
	"strings"
	"sync"

	bootkube "github.com/coreos/bootkube/pkg/asset"
	"github.com/coreos/bootkube/pkg/tlsutil"
	"github.com/coreos/coreos-baremetal/bootcfg/storage/storagepb"

	"github.com/coreos-inc/tectonic/bootstrap/binassets"
	"github.com/coreos-inc/tectonic/bootstrap/server/asset"
)

var (
	// BootkubeCluster errors
	errMissingBootcfgEndpoint = errors.New("installer: Missing bootcfg endpoint")
	errMissingNetworkGateway  = errors.New("installer: Missing networkGateway or skipNetwork")
	errMissingNetworkDNS      = errors.New("installer: Missing networkDNS or skipNetwork")
	errMissingNetworkMask     = errors.New("installer: Missing networkMask or skipNetwork")

	// bootkube cluster defaults
	bootkubeDefault = bootkubeDefaults{
		channel:           "beta",
		version:           "1081.5.0",
		installIgnTmpl:    binassets.MustAsset("install-reboot.yaml.tmpl"),
		masterIgnTmpl:     binassets.MustAsset("bootkube-master.yaml.tmpl"),
		workerIgnTmpl:     binassets.MustAsset("bootkube-worker.yaml.tmpl"),
		k8sDNSServiceIP:   "10.3.0.10",
		k8sPodNetwork:     "10.2.0.0/16",
		k8sServiceIPRange: "10.3.0.0/24",
	}
)

// bootkube Cluster defaults
type bootkubeDefaults struct {
	channel           string
	version           string
	installIgnTmpl    []byte
	masterIgnTmpl     []byte
	workerIgnTmpl     []byte
	k8sDNSServiceIP   string
	k8sPodNetwork     string
	k8sServiceIPRange string
}

// BootkubeCluster provides bootcfg manifests to boot and provision a
// self-hosted Kubernetes cluster.
type BootkubeCluster struct {
	// bootcfg HTTP name/IP and port
	BootcfgHTTP *string `json:"bootcfgHTTP"`

	// CoreOS PXE and install channel/version
	Channel *string `json:"channel"`
	Version *string `json:"version"`

	// Kubernetes Control Plane nodes
	Masters []Node `json:"masters"`
	// Kuberntes Worker nodes
	Workers []Node `json:"workers"`
	// Admin SSH Public Keys
	SSHAuthorizedKeys []string `json:"sshAuthorizedKeys"`

	// Custom Certificate Authority (optional)
	CACertificate *string `json:"caCertificate"`
	CAPrivateKey  *string `json:"caPrivateKey"`

	// Optionally enable skipNetwork to skip networkd configuration
	SkipNetwork    *bool   `json:"skipNetwork"`
	NetworkGateway *net.IP `json:"networkGateway"`
	NetworkDNS     *net.IP `json:"networkDNS"`
	NetworkMask    *int    `json:"networkMask"`

	// bootkube rendered assets
	assets               []asset.Asset
	certificateAuthority string
	clientCertificate    string
	clientKey            string
}

// GenerateAssets generates bootkube assets.
func (c *BootkubeCluster) GenerateAssets() error {
	// etcd client net.URLs (e.g. http://172.15.0.21:2379)
	etcds, err := etcdURLs(c.Masters)
	if err != nil {
		return err
	}

	// apiserver net.URLs (e.g. https://172.15.0.21:443)
	apis, err := c.controllerURLs()
	if err != nil {
		return err
	}

	// (optional) user-provided certificate authority
	caCert, err := getCACertificate(c.CACertificate)
	if err != nil {
		return err
	}
	caPrivateKey, err := getCAPrivateKey(c.CAPrivateKey)
	if err != nil {
		return err
	}

	// Configure bootkube asset rendering
	cfg := bootkube.Config{
		EtcdServers: etcds,
		CACert:      caCert,
		CAPrivKey:   caPrivateKey,
		APIServers:  apis,
		AltNames: &tlsutil.AltNames{
			IPs: c.controllerIPs(),
		},
	}

	// bootkube-generated Assets
	bootkubeAssets, err := bootkube.NewDefaultAssets(cfg)
	if err != nil {
		return err
	}
	for _, asset := range bootkubeAssets {
		c.assets = append(c.assets, bootkubeToAsset(asset))
	}
	// Add Tectonic manifests
	c.assets = append(c.assets, newTectonicAssets()...)

	// Parse the generated kubeconfig for required host metadata
	kubecfg, err := parseKubeConfig(c.assets)
	if err != nil {
		return err
	}
	c.certificateAuthority = kubecfg.certificateAuthority
	c.clientCertificate = kubecfg.clientCertificate
	c.clientKey = kubecfg.clientKey
	return err
}

// GetAssets returns a BootkubeCluster's generated self-hosted Kubernetes and
// Tectonic assets.
func (c *BootkubeCluster) GetAssets() []asset.Asset {
	return c.assets
}

// Profiles returns the bootkube controller and worker profiles.
func (c *BootkubeCluster) Profiles() []*storagepb.Profile {
	install := c.installProfile()
	controller := controllerProfile()
	worker := workerProfile()
	return []*storagepb.Profile{install, controller, worker}
}

// Kind returns the kind name.
func (c *BootkubeCluster) Kind() string {
	return "bootkube"
}

// Groups returns a machine group for each bootkube cluster node.
func (c *BootkubeCluster) Groups() (groups []*storagepb.Group, err error) {
	// Match to CoreOS install-reboot Profile
	for _, node := range c.nodes() {
		install := &storagepb.Group{
			Id:      fmt.Sprintf("tectonic-install-%s", node.MAC.DashString()),
			Name:    "CoreOS Install",
			Profile: "install-reboot",
			Selector: map[string]string{
				"mac": node.MAC.String(),
			},
		}
		install.Metadata, err = c.installMetadata()
		if err != nil {
			return nil, err
		}
		groups = append(groups, install)
	}

	// Match masters to bootkube-master Profile
	for i, master := range c.Masters {
		group := &storagepb.Group{
			Id:      fmt.Sprintf("tectonic-node-%s", master.MAC.DashString()),
			Profile: "bootkube-master",
			Selector: map[string]string{
				"mac": master.MAC.String(),
				"os":  "installed",
			},
		}
		group.Metadata, err = c.masterMetadata(i)
		if err != nil {
			return nil, err
		}
		groups = append(groups, group)
	}

	// Match workers to bootkube-worker Profile
	for i, worker := range c.Workers {
		group := &storagepb.Group{
			Id:      fmt.Sprintf("tectonic-node-%s", worker.MAC.DashString()),
			Profile: "bootkube-worker",
			Selector: map[string]string{
				"mac": worker.MAC.String(),
				"os":  "installed",
			},
		}
		group.Metadata, err = c.workerMetadata(i)
		if err != nil {
			return nil, err
		}
		groups = append(groups, group)
	}

	return groups, nil
}

// IgnitionTemplates returns the bootkube Ignition template assets.
func (c BootkubeCluster) IgnitionTemplates() []asset.Asset {
	return []asset.Asset{
		asset.New("bootkube-master.yaml.tmpl", bootkubeDefault.masterIgnTmpl),
		asset.New("bootkube-worker.yaml.tmpl", bootkubeDefault.workerIgnTmpl),
		asset.New("install-reboot.yaml.tmpl", bootkubeDefault.installIgnTmpl),
	}
}

// AssertValid validates the cluster configuration for common errors.
func (c *BootkubeCluster) AssertValid() error {
	if len(c.Masters) < 1 {
		return errTooFewMasters
	}
	if c.size() < 2 {
		return errClusterTooSmall
	}
	if c.BootcfgHTTP == nil {
		return errMissingBootcfgEndpoint
	}

	for _, node := range c.nodes() {
		if node.MAC == nil {
			return errMissingMACAddress
		}
	}

	for _, node := range c.nodes() {
		if node.IP == nil {
			return errMissingIPAddress
		}
	}

	if c.SkipNetwork == nil || !*c.SkipNetwork {
		if c.NetworkGateway == nil {
			return errMissingNetworkGateway
		}
		if c.NetworkDNS == nil {
			return errMissingNetworkDNS
		}
		if c.NetworkMask == nil {
			return errMissingNetworkMask
		}
	}

	if c.Channel == nil {
		c.Channel = String(bootkubeDefault.channel)
	}

	if c.Version == nil {
		c.Version = String(bootkubeDefault.version)
	}

	return nil
}

// Health returns ths health status of etcd, on-host kublets, and Tectonic.
func (c *BootkubeCluster) Health() ([]byte, error) {
	type Kubelet struct {
		Controllers []ServiceStatus `json:"controllers"`
		Workers     []ServiceStatus `json:"workers"`
	}
	type BootkubeStatus struct {
		Etcd     []ServiceStatus `json:"etcd"`
		Kubelet  Kubelet         `json:"kubelet"`
		Tectonic []ServiceStatus `json:"tectonic"`
	}

	status := &BootkubeStatus{
		Etcd: make([]ServiceStatus, len(c.Masters)),
		Kubelet: Kubelet{
			Controllers: make([]ServiceStatus, len(c.Masters)),
			Workers:     make([]ServiceStatus, len(c.Workers)),
		},
		Tectonic: make([]ServiceStatus, c.size()),
	}
	checker := NewHealthChecker(nil)

	var wg sync.WaitGroup
	for i, node := range c.Masters {
		wg.Add(2)
		go func(i int, node Node) {
			defer wg.Done()
			status.Etcd[i] = checker.EtcdHealth(node)
		}(i, node)
		go func(i int, node Node) {
			defer wg.Done()
			status.Kubelet.Controllers[i] = checker.KubeletHealth(node)
		}(i, node)
	}
	for i, node := range c.Workers {
		wg.Add(1)
		go func(i int, node Node) {
			defer wg.Done()
			status.Kubelet.Workers[i] = checker.KubeletHealth(node)
		}(i, node)
	}
	for i, node := range c.nodes() {
		wg.Add(1)
		go func(i int, node Node) {
			defer wg.Done()
			status.Tectonic[i] = checker.TectonicHealth(node)
		}(i, node)
	}

	// Wait for health checks to get responses or timeout
	wg.Wait()
	return json.Marshal(status)
}

func (c *BootkubeCluster) installProfile() *storagepb.Profile {
	return &storagepb.Profile{
		Id:         "install-reboot",
		Name:       "CoreOS Install and Reboot",
		IgnitionId: "install-reboot.yaml.tmpl",
		Boot: &storagepb.NetBoot{
			Kernel: fmt.Sprintf("/assets/coreos/%s/coreos_production_pxe.vmlinuz", *c.Version),
			Initrd: []string{
				fmt.Sprintf("/assets/coreos/%s/coreos_production_pxe_image.cpio.gz", *c.Version),
			},
			Cmdline: map[string]string{
				"coreos.first_boot": "1",
				"coreos.config.url": ignitionPath(*c.BootcfgHTTP),
			},
		},
	}
}

func controllerProfile() *storagepb.Profile {
	return &storagepb.Profile{
		Id:         "bootkube-master",
		Name:       "bootkube-ready master",
		IgnitionId: "bootkube-master.yaml.tmpl",
		Boot:       &storagepb.NetBoot{},
	}
}

func workerProfile() *storagepb.Profile {
	return &storagepb.Profile{
		Id:         "bootkube-worker",
		Name:       "bootkube-ready worker",
		IgnitionId: "bootkube-worker.yaml.tmpl",
		Boot:       &storagepb.NetBoot{},
	}
}

// size returns the total number of nodes in the cluster.
func (c *BootkubeCluster) size() int {
	return len(c.Masters) + len(c.Workers)
}

// nodes returns the slice of the nodes in the cluster.
func (c *BootkubeCluster) nodes() []Node {
	return append(c.Masters[:], c.Workers[:]...)
}

func (c *BootkubeCluster) controllerIPs() []net.IP {
	ips := make([]net.IP, len(c.Masters))
	for i, master := range c.Masters {
		ips[i] = *master.IP
	}
	return ips
}

func (c *BootkubeCluster) controllerURLs() ([]*url.URL, error) {
	urls := make([]*url.URL, len(c.Masters))
	for i, master := range c.Masters {
		raw := fmt.Sprintf("https://%s:443", master.IP.String())
		u, err := url.Parse(raw)
		if err != nil {
			return nil, err
		}
		urls[i] = u
	}
	return urls, nil
}

func (c *BootkubeCluster) controllerString() string {
	controllers := make([]string, len(c.Masters))
	for i, master := range c.Masters {
		controllers[i] = fmt.Sprintf("https://%s:443", master.IP.String())
	}
	return strings.Join(controllers, ",")
}

// installMetadata returns the group metadata for installing CoreOS.
func (c *BootkubeCluster) installMetadata() ([]byte, error) {
	data := map[string]interface{}{
		"coreos_channel":      *c.Channel,
		"coreos_version":      *c.Version,
		"ignition_endpoint":   fmt.Sprintf("http://%s/ignition", *c.BootcfgHTTP),
		"baseurl":             coreosAssetsPath(*c.BootcfgHTTP),
		"ssh_authorized_keys": c.SSHAuthorizedKeys,
	}
	return json.Marshal(data)
}

// masterMetadata returns the group metadata for master nodes. Requires
// validated cluster data.
func (c *BootkubeCluster) masterMetadata(i int) ([]byte, error) {
	node := c.Masters[i]
	data := map[string]interface{}{
		"ipv4_address":              node.IP.String(),
		"etcd_name":                 etcdNodeName(i),
		"etcd_initial_cluster":      etcdInitialCluster(c.Masters),
		"k8s_etcd_endpoints":        etcdEndpoints(c.Masters),
		"k8s_master_endpoint":       c.controllerString(),
		"k8s_dns_service_ip":        bootkubeDefault.k8sDNSServiceIP,
		"k8s_pod_network":           bootkubeDefault.k8sPodNetwork,
		"k8s_service_ip_range":      bootkubeDefault.k8sServiceIPRange,
		"k8s_certificate_authority": c.certificateAuthority,
		"k8s_client_certificate":    c.clientCertificate,
		"k8s_client_key":            c.clientKey,
		"ssh_authorized_keys":       c.SSHAuthorizedKeys,
	}
	if c.SkipNetwork != nil && *c.SkipNetwork {
		data["skip_networkd"] = "true"
	} else {
		data["networkd_address"] = fmt.Sprintf("%s/%d", node.IP.String(), *c.NetworkMask)
		data["networkd_dns"] = c.NetworkDNS.String()
		data["networkd_gateway"] = c.NetworkGateway.String()
	}
	return json.Marshal(data)
}

// workerMetadata returns the group metadata for worker nodes. Requires
// validated cluster data.
func (c *BootkubeCluster) workerMetadata(i int) ([]byte, error) {
	node := c.Workers[i]
	data := map[string]interface{}{
		"ipv4_address":              node.IP.String(),
		"etcd_initial_cluster":      etcdInitialCluster(c.Masters),
		"k8s_master_endpoint":       c.controllerString(),
		"k8s_dns_service_ip":        bootkubeDefault.k8sDNSServiceIP,
		"k8s_pod_network":           bootkubeDefault.k8sPodNetwork,
		"k8s_service_ip_range":      bootkubeDefault.k8sServiceIPRange,
		"k8s_certificate_authority": c.certificateAuthority,
		"k8s_client_certificate":    c.clientCertificate,
		"k8s_client_key":            c.clientKey,
		"ssh_authorized_keys":       c.SSHAuthorizedKeys,
	}
	if c.SkipNetwork != nil && *c.SkipNetwork {
		data["skip_networkd"] = "true"
	} else {
		data["networkd_address"] = fmt.Sprintf("%s/%d", node.IP.String(), *c.NetworkMask)
		data["networkd_dns"] = c.NetworkDNS.String()
		data["networkd_gateway"] = c.NetworkGateway.String()
	}
	return json.Marshal(data)
}

// Returns a custom certificate authority certificate or nil.
func getCACertificate(cert *string) (*x509.Certificate, error) {
	if cert == nil {
		return nil, nil
	}
	return tlsutil.ParsePEMEncodedCACert([]byte(*cert))
}

// Returns a custom certificate authority private key or nil.
func getCAPrivateKey(key *string) (*rsa.PrivateKey, error) {
	if key == nil {
		return nil, nil
	}
	return tlsutil.ParsePEMEncodedPrivateKey([]byte(*key))
}

// bootkubeToAsset converts a bootkube.Asset to an Asset interface.
func bootkubeToAsset(ba bootkube.Asset) asset.Asset {
	return asset.New(ba.Name, ba.Data)
}
