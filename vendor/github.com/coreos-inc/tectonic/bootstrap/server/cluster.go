package server

import (
	"errors"
	"net"
	"strings"

	"github.com/coreos/coreos-baremetal/bootcfg/storage/storagepb"

	"github.com/coreos-inc/tectonic/bootstrap/server/asset"
)

// Common cluster errors
var (
	errInvalidClusterType = errors.New("installer: Invalid cluster kind")
	errTooFewMasters      = errors.New("installer: At least one master is required")
	errClusterTooSmall    = errors.New("installer: Cluster must have at least one controller and worker")
	errMissingMACAddress  = errors.New("installer: Missing MAC address")
	errMissingIPAddress   = errors.New("installer: Missing IP address")
)

// A Cluster provides bootcfg machine profiles, groups, and templates.
type Cluster interface {
	// AssertValid validates a ClusterConfig and returns any errors.
	AssertValid() error
	// GenerateAssets generates cluster provisioning assets, if any.
	GenerateAssets() error
	// GetAssets returns generated cluster assets, if any.
	GetAssets() []asset.Asset
	// Health checks the health status of the cluster.
	Health() ([]byte, error)
	// Profiles returns the machine profiles for cluster nodes.
	Profiles() []*storagepb.Profile
	// Kind returns the kind name of a cluster.
	Kind() string
	// Groups returns the machine groups for cluster nodes.
	Groups() ([]*storagepb.Group, error)
	// IgnitionTemplates returns the referenced Ignition templates.
	IgnitionTemplates() []asset.Asset
}

// The Node type can simplify generation of cluster manifests.
type Node struct {
	MAC *macAddr `json:"mac"`
	IP  *net.IP  `json:"ip"`
}

// macAddr is a net.HardwareAddr which can be JSON marshalled/unmarshalled.
type macAddr net.HardwareAddr

// ParseMACAddr parses s into a macAddr by calling through to net.ParseMAC.
func parseMACAddr(s string) (macAddr, error) {
	addr, err := net.ParseMAC(s)
	if err != nil {
		return nil, err
	}
	return macAddr(addr), nil
}

// String returns the ':' separated MAC address.
func (m *macAddr) String() string {
	return net.HardwareAddr(*m).String()
}

// DashString returns the '-' separated MAC address.
func (m *macAddr) DashString() string {
	return strings.Replace(m.String(), ":", "-", -1)
}

func (m *macAddr) MarshalJSON() ([]byte, error) {
	hwAddr := net.HardwareAddr(*m)
	return []byte(`"` + hwAddr.String() + `"`), nil
}

func (m *macAddr) UnmarshalJSON(data []byte) error {
	raw := strings.Replace(string(data), "\"", "", -1)
	addr, err := net.ParseMAC(raw)
	if err != nil {
		return err
	}
	*m = macAddr(addr)
	return nil
}

// Bool is a helper that allocates a new bool, stores v, and returns the
// pointer.
func Bool(v bool) *bool { return &v }

// String is a helper that allocates a new string, stores v, and returns the
// pointer.
func String(v string) *string { return &v }

// Int is a helper that allocates a new int, stores v, and returns the
// pointer.
func Int(v int) *int { return &v }
