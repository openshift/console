package config

import (
	"log"
	"os"

	"github.com/coreos-inc/bridge/Godeps/_workspace/src/github.com/rakyll/globalconf"
)

const (
	cfgLocation = "./config.ini"
)

func Init() error {
	opts := globalconf.Options{
		EnvPrefix: "BRIDGE_",
	}

	_, err := os.Stat(cfgLocation)
	if err == nil {
		log.Printf("Using config file at %s", cfgLocation)
		opts.Filename = cfgLocation
	} else {
		log.Printf("Not using config file: %v", err)
	}

	conf, err := globalconf.NewWithOptions(&opts)
	if err != nil {
		return err
	}

	conf.ParseAll()
	return nil
}
