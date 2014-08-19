package main

import (
	"log"

	"github.com/coreos-inc/bridge/Godeps/_workspace/src/github.com/coreos/devweb/slave"

	"github.com/coreos-inc/bridge/config"
	"github.com/coreos-inc/bridge/server"
)

func main() {
	if err := config.Init(); err != nil {
		log.Fatal(err)
	}
	server.Handle()
	slave.Main()
}
