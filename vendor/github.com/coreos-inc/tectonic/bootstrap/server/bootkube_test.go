package server

import (
	"net"
	"testing"

	"github.com/stretchr/testify/assert"
)

var (
	someMAC = mustMAC(parseMACAddr("52:54:00:a1:9c:ae"))
	someIP  = net.ParseIP("172.15.0.21")
)

func TestAssertValid(t *testing.T) {
	cluster := validBootkubeCluster()
	assert.Nil(t, cluster.AssertValid())
}

func TestAssertValid_TooFewMasters(t *testing.T) {
	cluster := validBootkubeCluster()
	// Remove master node
	cluster.Masters = []Node{}
	if err := cluster.AssertValid(); assert.Error(t, err) {
		assert.Equal(t, errTooFewMasters, err)
	}
}

func TestAssertValid_ClusterTooSmall(t *testing.T) {
	cluster := validBootkubeCluster()
	// Remove two nodes
	cluster.Workers = cluster.Workers[2:]
	if err := cluster.AssertValid(); assert.Error(t, err) {
		assert.Equal(t, errClusterTooSmall, err)
	}
}

func TestAssertValid_MissingBootcfgEndpoint(t *testing.T) {
	cluster := validBootkubeCluster()
	cluster.BootcfgHTTP = nil
	if err := cluster.AssertValid(); assert.Error(t, err) {
		assert.Equal(t, errMissingBootcfgEndpoint, err)
	}
}

func TestAssertValid_MissingMAC(t *testing.T) {
	// nil master MAC
	cluster := validBootkubeCluster()
	cluster.Masters[0].MAC = nil
	if err := cluster.AssertValid(); assert.Error(t, err) {
		assert.Equal(t, errMissingMACAddress, err)
	}
	// nil worker MAC
	cluster = validBootkubeCluster()
	cluster.Workers[0].MAC = nil
	if err := cluster.AssertValid(); assert.Error(t, err) {
		assert.Equal(t, errMissingMACAddress, err)
	}
}

func TestAssertValid_SkipNetwork(t *testing.T) {
	// SkipNetwork means NetworkGateway and NetworkDNS are ignored
	cluster := validBootkubeCluster()
	cluster.SkipNetwork = Bool(true)
	cluster.NetworkGateway = nil
	cluster.NetworkDNS = nil
	cluster.NetworkMask = nil
	assert.Nil(t, cluster.AssertValid())
}

func TestAssertValid_MissingNetworkGateway(t *testing.T) {
	cluster := validBootkubeCluster()
	cluster.NetworkGateway = nil
	if err := cluster.AssertValid(); assert.Error(t, err) {
		assert.Equal(t, errMissingNetworkGateway, err)
	}
}

func TestAssertValid_MissingNetworkDNS(t *testing.T) {
	cluster := validBootkubeCluster()
	cluster.NetworkDNS = nil
	if err := cluster.AssertValid(); assert.Error(t, err) {
		assert.Equal(t, errMissingNetworkDNS, err)
	}
}

func TestAssertValid_MissingNetworkMask(t *testing.T) {
	cluster := validBootkubeCluster()
	cluster.NetworkMask = nil
	if err := cluster.AssertValid(); assert.Error(t, err) {
		assert.Equal(t, errMissingNetworkMask, err)
	}
}

// mustMAC is a helper which wraps a call to a function returning a (macAddr,
// error) and panics if the error is non-nil. It should be used in tests only.
//     var mac = mustMac(parseMACAddr("52:54:00:a1:9c:ae"))
func mustMAC(addr macAddr, err error) macAddr {
	if err != nil {
		panic(err)
	}
	return addr
}

// validBootkubeCluster returns a BootkubeCluster which can be modified and
// used for testing.
func validBootkubeCluster() *BootkubeCluster {
	someMAC := mustMAC(parseMACAddr("52:54:00:a1:9c:ae"))
	someIP := net.ParseIP("172.15.0.21")
	return &BootkubeCluster{
		BootcfgHTTP: String("172.15.0.2:8081"),
		Masters: []Node{
			Node{
				IP:  &someIP,
				MAC: &someMAC,
			},
		},
		Workers: []Node{
			Node{
				IP:  &someIP,
				MAC: &someMAC,
			},
			Node{
				IP:  &someIP,
				MAC: &someMAC,
			},
		},
		NetworkGateway:    &someIP,
		NetworkDNS:        &someIP,
		NetworkMask:       Int(16),
		SSHAuthorizedKeys: []string{"ssh-rsa pubkey"},
	}
}
