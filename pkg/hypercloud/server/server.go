package server

import (
	"context"
	"io/ioutil"

	"github.com/coreos/pkg/capnslog"
	"github.com/openshift/console/pkg/backend"
	"github.com/openshift/console/pkg/hypercloud/middlewares/stripprefix"
	"github.com/openshift/console/pkg/hypercloud/router"
	"gopkg.in/yaml.v2"

	pConfig "github.com/openshift/console/pkg/hypercloud/config"
)

var (
	log = capnslog.NewPackageLogger("github.com/tmax-cloud/hypercloud-console", "server")
)

type Server struct {
	ProxyInfo []ProxyInfo `yaml:"proxyInfo,omitempty"`
}

type ProxyInfo struct {
	Name   string `yaml:"name"`
	Server string `yaml:"server"`
	Rule   string `yaml:"rule"`
	Path   string `yaml:"path"`
}

func (s *Server) ProxyRouter() *router.Router {

	router, err := router.NewRouter()
	if err != nil {
		log.Error("Failed to create router", err)
	}

	for _, proxy := range s.ProxyInfo {
		proxy := proxy
		log.Info(proxy)
		proxyBackend, err := backend.NewBackend(proxy.Name, proxy.Server)
		if err != nil {
			log.Error("Failed to parse url", err)
		}
		proxyBackend.Rule = proxy.Rule
		proxyBackend.ServerURL = proxy.Server

		if proxy.Path != "" {
			handlerConfig := &pConfig.StripPrefix{
				Prefixes: []string{proxy.Path},
			}
			prefixHandler, err := stripprefix.New(context.TODO(), proxyBackend.Handler, *handlerConfig, "stripPrefix")
			if err != nil {
				log.Error("Failed to create stripprefix handler", err)
			}
			router.AddRoute(proxyBackend.Rule, 0, prefixHandler)
		}
		router.AddRoute(proxyBackend.Rule, 0, proxyBackend.Handler)
	}

	return router
}

func (s *Server) SetFlagsFromConfig(filename string) (err error) {
	content, err := ioutil.ReadFile(filename)
	if err != nil {
		return err
	}

	server := Server{}
	err = yaml.Unmarshal(content, &server)
	if err != nil {
		return err
	}

	s.ProxyInfo = server.ProxyInfo

	return nil
}
