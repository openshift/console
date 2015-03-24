package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/coreos/pkg/health"
)

type k8sAPICheckConfig struct {
	// This version's presence is checked for.
	version string

	// K8s API endpoint.
	endpoint *url.URL
}

// k8sAPICheck checks for the health of the Kuberntes API connection.
// This check is performed by making an HTTP request to the endpoint and
// ensuring that the specfied version is enumerated.
type k8sAPICheck struct {
	config k8sAPICheckConfig
	client *http.Client
}

func newK8sAPICheck(config k8sAPICheckConfig) health.Checkable {
	client := &http.Client{
		Timeout: time.Second,
	}

	return &k8sAPICheck{
		config: config,
		client: client,
	}
}

func (k *k8sAPICheck) Healthy() error {
	resp, err := k.client.Get(k.config.endpoint.String() + "/api")
	if err != nil {
		return fmt.Errorf("Kubernetes API: %v", err)
	}

	var dec struct {
		Versions []string `json:"versions"`
	}

	decoder := json.NewDecoder(resp.Body)
	err = decoder.Decode(&dec)
	if err != nil {
		return fmt.Errorf("Kubernetes API: could not parse response: %v", err)
	}

	for _, version := range dec.Versions {
		if k.config.version == version {
			return nil
		}
	}

	return fmt.Errorf("Kubernetes API: could not find API version %q in %v", k.config.version, dec.Versions)
}
