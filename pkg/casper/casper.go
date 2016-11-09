package casper

type Config struct {
	KubectlClientID     string                   `json:"kubectl-client-id"`
	KubectlClientSecret string                   `json:"kubectl-client-secret"`
	OIDCClientID        string                   `json:"oidc-client-id"`
	OIDCClientSecret    string                   `json:"oidc-client-secret"`
	URL                 string                   `json:"url"`
	Console             string                   `json:"console"`
	Clusters            map[string]ClusterConfig `json:"clusters"`
}

type ClusterConfig struct {
	Endpoint string `json:"endpoint"`
	Name     string `json:"name"`
	CA       string `json:"ca"`
}
