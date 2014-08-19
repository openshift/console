package config

import (
	"github.com/coreos-inc/bridge/Godeps/_workspace/src/github.com/rakyll/globalconf"
)

func Init() error {
	conf, err := globalconf.NewWithOptions(&globalconf.Options{
		Filename:  "./config.ini",
		EnvPrefix: "BRIDGE_",
	})
	if err != nil {
		return err
	}

	conf.ParseAll()
	return nil
}
