package actions

import (
	"github.com/coreos/pkg/capnslog"
	"net/http"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/cli"
	"k8s.io/cli-runtime/pkg/genericclioptions"
	"k8s.io/client-go/rest"
	"k8s.io/klog"
)

var settings = initSettings()
var plog = capnslog.NewPackageLogger("github.com/openshift/console", "helm/actions")

type configFlagsWithTransport struct {
	*genericclioptions.ConfigFlags
	Transport *http.RoundTripper
}

func initSettings() *cli.EnvSettings {
	conf := cli.New()
	conf.RepositoryCache = "/tmp"
	return conf
}

func (c configFlagsWithTransport) ToRESTConfig() (*rest.Config, error) {
	return &rest.Config{
		Host:        *c.APIServer,
		BearerToken: *c.BearerToken,
		Transport:   *c.Transport,
	}, nil
}

func GetActionConfigurations(host, ns, token string, transport *http.RoundTripper) *action.Configuration {

	confFlags := &configFlagsWithTransport{
		ConfigFlags: &genericclioptions.ConfigFlags{
			APIServer:   &host,
			BearerToken: &token,
			Namespace:   &ns,
		},
		Transport: transport,
	}
	inClusterCfg, err := rest.InClusterConfig()

	if err != nil {
		plog.Debug("Running outside cluster, CAFile is unset")
	} else {
		confFlags.CAFile = &inClusterCfg.CAFile
	}
	conf := new(action.Configuration)
	conf.Init(confFlags, ns, "secrets", klog.Infof)

	return conf
}
