package actions

import (
	"net/http"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/cli"
	"k8s.io/cli-runtime/pkg/genericclioptions"
	"k8s.io/client-go/rest"
	"k8s.io/klog"
)

func getSettings() *cli.EnvSettings {
	settings := cli.New()
	settings.RepositoryCache = "/tmp"
	return settings
}

var settings = cli.New()

type configFlagsWithTransport struct {
	*genericclioptions.ConfigFlags
	Transport *http.RoundTripper
}

func (c configFlagsWithTransport) ToRESTConfig() (*rest.Config, error) {
	return &rest.Config{
		Host:        *c.APIServer,
		BearerToken: *c.BearerToken,
		Transport:   *c.Transport,
	}, nil
}

func GetActionConfigurations(host, ns, token string, transport *http.RoundTripper) *action.Configuration {

	truePtr := true
	confFlags := &configFlagsWithTransport{
		ConfigFlags: &genericclioptions.ConfigFlags{
			APIServer:   &host,
			BearerToken: &token,
			Namespace:   &ns,
			Insecure:    &truePtr,
		},
		Transport: transport,
	}
	conf := new(action.Configuration)
	conf.Init(confFlags, ns, "secrets", klog.Infof)
	return conf
}
