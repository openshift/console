package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// ServiceStatus gives the status of an instance of a service.
type ServiceStatus struct {
	Instance string `json:"instance"`
	Message  string `json:"message"`
	Ready    bool   `json:"ready"`
}

// HealthChecker is a client for checking the health of node services.
type HealthChecker struct {
	client *http.Client
}

// DefaultHealthChecker is the default node HealthCheck client which will
// timeout requests after 10 seconds.
var DefaultHealthChecker = &HealthChecker{
	client: &http.Client{
		Timeout:   time.Duration(10 * time.Second),
		Transport: http.DefaultTransport,
	},
}

// NewHealthChecker returns a new HealthChecker with the given client. If no
// client is provided, the DefaultHealthChecker is returned.
func NewHealthChecker(client *http.Client) *HealthChecker {
	if client == nil {
		return DefaultHealthChecker
	}
	return &HealthChecker{
		client: client,
	}
}

// KubeletHealth returns the ServiceStatus of the given Node's Kubelet.
func (c *HealthChecker) KubeletHealth(node Node) ServiceStatus {
	status := ServiceStatus{
		Instance: node.IP.String(),
		Ready:    false,
	}

	// kubelet read-only port must return a 404 (indicates liveness)
	resp, err := c.client.Get(fmt.Sprintf("http://%s:%d", node.IP.String(), 10255))
	if err != nil {
		status.Message = err.Error()
		return status
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound && resp.Status == "404 Not Found" {
		status.Ready = true
	}
	return status
}

// EtcdHealth returns the ServiceStatus of the given Node's etcd instance.
func (c *HealthChecker) EtcdHealth(node Node) ServiceStatus {
	status := ServiceStatus{
		Instance: node.IP.String(),
		Ready:    false,
	}

	// etcd health endpoint must return {"health": "true"}
	resp, err := c.client.Get(fmt.Sprintf("http://%s:%d/health", node.IP.String(), 2379))
	if err != nil {
		status.Message = err.Error()
		return status
	}
	defer resp.Body.Close()

	type health struct {
		Health string `json:"health"`
	}
	etcd := new(health)
	err = json.NewDecoder(resp.Body).Decode(etcd)
	if err != nil {
		status.Message = err.Error()
		return status
	}

	if etcd.Health == "true" {
		status.Ready = true
	}
	return status
}

// TectonicHealth returns the ServiceStatus of a Tectonic Wizard viewed through
// the Node's kube-proxy.
func (c *HealthChecker) TectonicHealth(node Node) ServiceStatus {
	status := ServiceStatus{
		Instance: node.IP.String(),
		Ready:    false,
	}

	// Tectonic Wiz health endpoint must return {"status": "ok"}
	resp, err := c.client.Get(fmt.Sprintf("http://%s:%d/health", node.IP.String(), 32002))
	if err != nil {
		status.Message = err.Error()
		return status
	}
	defer resp.Body.Close()

	type health struct {
		Status string `json:"status"`
	}
	wiz := new(health)
	err = json.NewDecoder(resp.Body).Decode(wiz)
	if err != nil {
		status.Message = err.Error()
		return status
	}

	if wiz.Status == "ok" {
		status.Ready = true
	}
	return status
}
