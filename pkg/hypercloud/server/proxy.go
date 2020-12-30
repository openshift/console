package server

import (
	"context"
	"io/ioutil"

	"github.com/coreos/pkg/capnslog"
	"github.com/openshift/console/pkg/backend"
	"github.com/openshift/console/pkg/hypercloud/middlewares/stripprefix"
	"github.com/openshift/console/pkg/hypercloud/router"
	log "github.com/sirupsen/logrus"
	"gopkg.in/yaml.v2"

	pConfig "github.com/openshift/console/pkg/hypercloud/config"
)

var (
	olog = capnslog.NewPackageLogger("github.com/tmax-cloud/hypercloud-console", "server")
)

type Proxy struct {
	ProxyInfo []ProxyInfo `yaml:"proxyInfo,omitempty"`
}

type ProxyInfo struct {
	Name   string `yaml:"name"`
	Server string `yaml:"server"`
	Rule   string `yaml:"rule"`
	Path   string `yaml:"path"`
}

func (p *Proxy) ProxyRouter() *router.Router {

	router, err := router.NewRouter()
	if err != nil {
		olog.Error("Failed to create router", err)
	}

	for _, proxy := range p.ProxyInfo {
		proxy := proxy
		olog.Info(proxy)
		proxyBackend, err := backend.NewBackend(proxy.Name, proxy.Server)
		if err != nil {
			olog.Error("Failed to parse url", err)
		}
		proxyBackend.Rule = proxy.Rule
		proxyBackend.ServerURL = proxy.Server

		if proxy.Path != "" {
			handlerConfig := &pConfig.StripPrefix{
				Prefixes: []string{proxy.Path},
			}
			prefixHandler, err := stripprefix.New(context.TODO(), proxyBackend.Handler, *handlerConfig, "stripPrefix")
			if err != nil {
				olog.Error("Failed to create stripprefix handler", err)
			}
			err = router.AddRoute(proxyBackend.Rule, 0, prefixHandler)
			if err != nil {
				log.Info("failed to put proxy handler into Router ", err)
			}
		}
		err = router.AddRoute(proxyBackend.Rule, 0, proxyBackend.Handler)
		if err != nil {
			log.Info("failed to put proxy handler into Router ", err)
		}
	}

	return router
}

func (p *Proxy) SetFlagsFromConfig(filename string) (err error) {
	content, err := ioutil.ReadFile(filename)
	if err != nil {
		return err
	}

	proxy := Proxy{}
	err = yaml.Unmarshal(content, &proxy)
	if err != nil {
		return err
	}

	p.ProxyInfo = proxy.ProxyInfo

	return nil
}
