package main

import (
	"log"
	"net/http"
	"os"

	"github.com/coreos-inc/bridge/server"
)

var (
	listenAddress string
)

func main() {
	server.Handle()

	listenAddress = os.Getenv("ADDRESS")
	if listenAddress == "" {
		listenAddress = "0.0.0.0:9000"
	}

	log.Printf("listening on: %s", listenAddress)
	if err := http.ListenAndServe(listenAddress, nil); err != nil {
		log.Fatal("error on ListenAndServe: %s", err)
	}
}
