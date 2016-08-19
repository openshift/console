package main

import (
	"flag"
	"fmt"
	"net"
	"net/http"
	"os"

	log "github.com/Sirupsen/logrus"
	"github.com/toqueteos/webbrowser"

	bootstrap "github.com/coreos-inc/tectonic/bootstrap/server"
	"github.com/coreos-inc/tectonic/bootstrap/server/version"
)

func init() {
	log.SetLevel(log.WarnLevel)
}

// This file should track ../devstrap/main.go pretty closely
func main() {
	flags := struct {
		address       string
		help, version bool
	}{}
	flag.StringVar(&flags.address, "address", "127.0.0.1:4444", "HTTP listen address (e.g. 127.0.0.1:4444)")
	flag.BoolVar(&flags.version, "version", false, "print version and exit")
	flag.BoolVar(&flags.help, "help", false, "print usage and exit")
	flag.Parse()

	if flags.help {
		fmt.Printf("%s: serve the Tectonic Bootstrap tool\n", os.Args[0])
		flag.PrintDefaults()
		return
	}

	if flags.version {
		fmt.Println(version.Version)
		return
	}

	server := bootstrap.NewServer(&bootstrap.Config{
		AssetDir:     "",
		NoConfigMode: false,
		Store:        bootstrap.NewStore(),
	})

	fmt.Printf("Starting Tectonic Bootstrap server on %s\n", flags.address)
	ln, err := net.Listen("tcp", flags.address)
	if err != nil {
		log.Fatalf("failed to start listening: %v", err)
	}

	go func() {
		browseURL := "http://" + flags.address
		if err := webbrowser.Open(browseURL); err != nil {
			log.Fatalf("can't launch a web browser to view %s", browseURL)
		}
	}()

	if err = http.Serve(ln, server); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
