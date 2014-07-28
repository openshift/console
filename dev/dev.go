package main

import (
	"github.com/coreos-inc/bridge/Godeps/_workspace/src/github.com/coreos/devweb/slave"

	"github.com/coreos-inc/bridge/server"
)

func main() {
	server.Handle()
	slave.Main()
}
