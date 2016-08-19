package server

import (
	"net/http"

	"github.com/coreos/pkg/health"
	v1 "k8s.io/kubernetes/pkg/api/v1"
)

type WizHandler interface {
	http.Handler
	Path() string
	Health() []health.Checkable
}

type Payload map[string]PayloadValue

type PayloadValue struct {
	Key   string `json:"key"`
	Value string `json:"value"`
	// Secret or ConfigMap
	Kind string `json:"kind"`
	// Name of Secret/ConfigMap
	Name string `json:"name"`
	// Namespace of Secret/ConfigMap
	Namespace string `json:"namespace"`
	// Type of secret if a secret
	Type     string `json:"type"`
	Encoding string `json:"encoding"`
}

type GenerateSelfSignedCertificateRequest struct {
	CACert           string `json:"caCert"`
	CAKey            string `json:"caKey"`
	CommonName       string `json:"commonName"`
	OrganizationName string `json:"organizationName"`
}

type GenerateSelfSignedCertificateResponse struct {
	Cert string `json:"tls-cert"`
	Key  string `json:"tls-key"`
}

type StatusResponse struct {
	Status string `json:"status"`
}

type Writer interface {
	WriteNamespaces([]v1.Namespace) error
	WriteConfigMaps([]v1.ConfigMap) error
	WriteSecrets([]v1.Secret) error
}

type StatusChecker interface {
	Check() error
}
