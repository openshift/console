package main

import (
	"log"
	"net/http"

	"github.com/coreos-inc/bridge/config"
	"github.com/coreos-inc/bridge/server"
)

var (
	listenAddress string
)

func main() {
	if err := config.Init(); err != nil {
		log.Fatal(err)
	}

	server.Handle()

	log.Printf("listening on: %s", *config.Address)
	if err := http.ListenAndServe(*config.Address, nil); err != nil {
		log.Fatal(err)
	}
}
