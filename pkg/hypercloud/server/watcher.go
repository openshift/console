package server

import (
	"context"
	"encoding/json"
	"reflect"

	"github.com/eapache/channels"
	"github.com/openshift/console/pkg/config/dynamic"
	"github.com/openshift/console/pkg/provider"
	"github.com/sirupsen/logrus"
	log "github.com/sirupsen/logrus"
	"github.com/traefik/traefik/v2/pkg/safe"
)

type ConfigWatcher struct {
	provider provider.Provider

	currentConfigurations safe.Safe

	configChan              chan dynamic.Message
	configValidatedChan     chan dynamic.Message
	providerConfigUpdateMap map[string]chan dynamic.Message

	configurationListeners []func(dynamic.Configuration)

	routinesPool *safe.Pool
}

func NewWatcher(pvd provider.Provider, routinesPool *safe.Pool) *ConfigWatcher {
	watcher := &ConfigWatcher{
		provider:                pvd,
		configChan:              make(chan dynamic.Message, 100),
		configValidatedChan:     make(chan dynamic.Message, 100),
		providerConfigUpdateMap: make(map[string]chan dynamic.Message),
		routinesPool:            routinesPool,
	}

	currentConfigurations := make(dynamic.Configurations)
	watcher.currentConfigurations.Set(currentConfigurations)

	return watcher
}

// Start the configuration watcher.
func (c *ConfigWatcher) Start() {
	c.routinesPool.GoCtx(c.listenProviders)
	c.routinesPool.GoCtx(c.listenConfigurations)
	c.startProvider()
}

// Stop the configuration watcher.
func (c *ConfigWatcher) Stop() {
	close(c.configChan)
	close(c.configValidatedChan)
}

// AddListener adds a new listener function used when new configuration is provided.
// e.g) switch http handler function when new configuration is provided.
// See traefik.go , line 278
func (c *ConfigWatcher) AddListener(listener func(dynamic.Configuration)) {
	log.StandardLogger().Infof("*************************** Called AddListener in order to put func(dynamic.Configuration *****************************")
	if c.configurationListeners == nil {
		c.configurationListeners = make([]func(dynamic.Configuration), 0)
	}
	c.configurationListeners = append(c.configurationListeners, listener)
}

func (c *ConfigWatcher) startProvider() {
	logger := log.StandardLogger()

	jsonConf, err := json.Marshal(c.provider)
	if err != nil {
		logger.Debugf("Unable to marshal provider configuration %T: %v", c.provider, err)
	}

	logger.Infof("Starting provider %T %s", c.provider, jsonConf)
	currentProvider := c.provider

	safe.Go(func() {
		err := currentProvider.Provide(c.configChan)
		if err != nil {
			logger.Errorf("Error starting provider %T: %s", currentProvider, err)
		}
	})
}

// listenProviers receives config change from the Providers.
// The Configuration message gets passed along a series of check
// finally end up that sends it to Listenconfigurations (through c.configurationValidatedChan)
func (c *ConfigWatcher) listenProviders(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case configMsg, ok := <-c.configChan:
			if !ok {
				return
			}

			if configMsg.Configuration == nil {
				log.StandardLogger().WithField("providerName", configMsg.ProviderName).
					Debug("Received nil configuration from provider, skipping.")
				return
			}

			log.StandardLogger().WithField("providerName", configMsg.ProviderName).Infof("Received from Provider \"%v\" :  %v \n", configMsg.ProviderName, configMsg.Configuration.Routers)
			c.preLoadConfiguration(configMsg)
		}
	}
}

func (c *ConfigWatcher) listenConfigurations(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case configMsg, ok := <-c.configValidatedChan:
			if !ok || configMsg.Configuration == nil {
				return
			}
			log.StandardLogger().Infof("!!!!!!!!!!!!11configMsg from c.configValidatedChan %v, %v", configMsg.ProviderName, configMsg.Configuration.Routers)
			c.loadMessage(configMsg)
		}
	}
}

func (c *ConfigWatcher) loadMessage(configMsg dynamic.Message) {
	log.StandardLogger().Infof("@@@@@@@@@@@@@@@@@@@ configMsg : %T, %v \n", configMsg.ProviderName, configMsg.Configuration.Routers)
	currentconfigurations := c.currentConfigurations.Get().(dynamic.Configurations)
	for name, value := range currentconfigurations {
		log.StandardLogger().Infof("show currentconfigurations %v , %v \n", name, value)
	}
	//Copy configurations to new map so we don't change current if Loadconfig fails
	newConfigurations := currentconfigurations.DeepCopy()
	newConfigurations[configMsg.ProviderName] = configMsg.Configuration
	c.currentConfigurations.Set(newConfigurations)
	for name, value := range newConfigurations {
		log.StandardLogger().Infof("show New configurations %v , %v \n", name, value)
	}
	log.StandardLogger().Info("[Before] Call listener func !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
	conf := mergeConfiguration(newConfigurations)
	log.StandardLogger().Infof("Check test value : %v \n", conf.Routers)
	for name, value := range conf.Routers {
		log.Infof("check conf out listener func : %v, %v", name, value)
	}

	for _, listener := range c.configurationListeners {
		log.StandardLogger().Info("[ING] Call listener func !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
		listener(conf)
	}
}

func (c *ConfigWatcher) preLoadConfiguration(configMsg dynamic.Message) {
	logger := log.StandardLogger().WithField("providerName", configMsg.ProviderName)
	if log.GetLevel() == logrus.DebugLevel {
		copyConf := configMsg.Configuration.DeepCopy()

		jsonConf, err := json.Marshal(copyConf)
		if err != nil {
			logger.Errorf("Could not marshal dynamic configuration: %v", err)
			logger.Debugf("Configuration received from provider %s: [struct] %#v", configMsg.ProviderName, copyConf)
		} else {
			logger.Debugf("Configuration received from provider %s: %s", configMsg.ProviderName, string(jsonConf))
		}
	}

	if configMsg.Configuration == nil {
		logger.Infof("Skipping empty Configuration for provider %s", configMsg.ProviderName)
		return
	}

	providerConfigUpdateCh, ok := c.providerConfigUpdateMap[configMsg.ProviderName]
	logger.Infof("Check providerConfigUpdateCh, ok : %v, %v", providerConfigUpdateCh, ok)
	if !ok {
		providerConfigUpdateCh = make(chan dynamic.Message)
		c.providerConfigUpdateMap[configMsg.ProviderName] = providerConfigUpdateCh
		c.routinesPool.GoCtx(func(ctxPool context.Context) {
			logger.Info("Call providerConfiReload")
			c.providerConfigReload(ctxPool, c.configValidatedChan, providerConfigUpdateCh)
		})
	}

	logger.Infof("copyConf from deepcopy func %v , %v \n", configMsg.ProviderName, configMsg.Configuration.Routers)
	providerConfigUpdateCh <- configMsg
}

func (c *ConfigWatcher) providerConfigReload(ctx context.Context, publish chan<- dynamic.Message, in <-chan dynamic.Message) {
	ring := channels.NewRingChannel(1)
	defer ring.Close()

	c.routinesPool.GoCtx(func(ctxPool context.Context) {
		for {
			select {
			case <-ctxPool.Done():
				return
			case nextConfig := <-ring.Out():
				if config, ok := nextConfig.(dynamic.Message); ok {
					publish <- config
					//default 30min
					// This is a updating time for calling listenner
					// time.Sleep(time.Minute * 30)
				}
			}
		}
	})

	var previousConfig dynamic.Message
	for {
		select {
		case <-ctx.Done():
			return
		case nextConfig := <-in:
			log.StandardLogger().WithField("providerName", nextConfig.ProviderName).Infof("Check nextConfig form <-in  : %v , %v", nextConfig.ProviderName, nextConfig.Configuration.Routers)
			if reflect.DeepEqual(previousConfig, nextConfig) {
				logger := log.StandardLogger().WithField("providerName", nextConfig.ProviderName)
				logger.Info("Skipping same configuration")
				continue
			}
			log.StandardLogger().Infof("check temp config !!!!!!!! %v, %v", nextConfig.ProviderName, nextConfig.Configuration.Routers)
			previousConfig = *nextConfig.DeepCopy()
			ring.In() <- *nextConfig.DeepCopy()
		}
	}
}

func mergeConfiguration(configurations dynamic.Configurations) dynamic.Configuration {
	conf := dynamic.Configuration{
		make(map[string]*dynamic.Router),
	}
	for pvd, configuration := range configurations {
		if configuration.Routers != nil {
			for routerName, router := range configuration.Routers {
				conf.Routers[makeQualifiedName(pvd, routerName)] = router
			}
		}
	}
	return conf
}

// MakeQualifiedName Creates a qualified name for an element.
func makeQualifiedName(providerName, elementName string) string {
	return elementName + "@" + providerName
}

// func applyMode(cfg dynamic.Configuration) dynamic.Configuration {
// 	rts := make(map[string]*dynamic.Router)

// 	for name, rt := range cfg.Routers {
// 		router := rt.DeepCopy()

// 	}
// }
