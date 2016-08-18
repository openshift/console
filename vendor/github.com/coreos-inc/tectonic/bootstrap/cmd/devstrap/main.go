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

// This file should track ../bootstrap/main.go pretty closely
func main() {
	flags := struct {
		address     string
		assetDir    string
		logLevel    string
		noConfigure bool
		version     bool
		help        bool
	}{}
	flag.StringVar(&flags.address, "address", "127.0.0.1:4444", "HTTP listen address (e.g. 127.0.0.1:4444)")
	flag.StringVar(&flags.assetDir, "asset-dir", "", "serve web assets from this directory rather than from internal storage")
	flag.StringVar(&flags.logLevel, "log-level", "warn", "log level (e.g. \"debug\")")
	flag.BoolVar(&flags.noConfigure, "no-configure", false, "process requests but do not actually attempt to configure a bootcfg server")
	flag.BoolVar(&flags.version, "version", false, "print version and exit")
	flag.BoolVar(&flags.help, "help", false, "print usage and exit")
	flag.Parse()

	lvl, err := log.ParseLevel(flags.logLevel)
	if err != nil {
		log.Fatalf("invalid log-level: %v - use \"debug\" instead", err)
	}
	log.SetLevel(lvl)

	if flags.help {
		fmt.Printf("%s: serve the Tectonic Bootstrap tool (dev version)\n", os.Args[0])
		flag.PrintDefaults()
		return
	}

	if flags.version {
		fmt.Println(version.Version)
		return
	}

	server := bootstrap.NewServer(&bootstrap.Config{
		AssetDir:     flags.assetDir,
		NoConfigMode: flags.noConfigure,
		Store:        bootstrap.NewStore(),
	})

	log.Infof("starting Tectonic Bootstrap server on %s", flags.address)
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
