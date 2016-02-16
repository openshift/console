package main

import (
	"flag"
	"fmt"
	"os"

	"github.com/coreos/pkg/capnslog"
	"github.com/coreos/pkg/flagutil"

	"github.com/coreos-inc/tectonic-stats-collector/pkg/generator"
)

var (
	VERSION = "UNKNOWN"
)

var log = capnslog.NewPackageLogger("github.com/coreos-inc/tectonic-stats-collector/cmd", "tectonic-stats-generator")

func main() {
	fs := flag.NewFlagSet("tectonic-stats-generator", flag.ExitOnError)

	ver := fs.Bool("version", false, "Print version information and exit")
	logDebug := fs.Bool("log-debug", false, "Log debug-level information")

	var cfg generator.Config
	fs.DurationVar(&cfg.Interval, "generation-interval", generator.DefaultGenerationInterval, "Period of stats generation attempts")
	fs.StringVar(&cfg.AccountID, "account-id", "", "Tectonic account identifier")
	fs.StringVar(&cfg.AccountSecret, "account-secret", "", "Tectonic account secret")
	fs.StringVar(&cfg.ClusterID, "cluster-id", "", "Tectonic cluster identifier")
	fs.StringVar(&cfg.CollectorScheme, "collector-scheme", "https", "Send stats payloads to collector host using this URL scheme (http or https)")
	fs.StringVar(&cfg.CollectorHost, "collector-host", "usage.tectonic.com", "Send generated stats to this Tectonic stats collector host")

	if err := fs.Parse(os.Args[1:]); err != nil {
		log.Fatalf("flag parsing failed: %v", err)
	}

	if err := flagutil.SetFlagsFromEnv(fs, "TECTONIC"); err != nil {
		log.Fatalf("failed parsing flags from environment: %v", err)
	}

	if *ver {
		fmt.Printf("tectonic-stats-generator version %s\n", VERSION)
		os.Exit(0)
	}

	capnslog.SetFormatter(capnslog.NewStringFormatter(os.Stderr))
	if *logDebug {
		capnslog.SetGlobalLogLevel(capnslog.DEBUG)
	}

	gen, err := generator.New(cfg)
	if err != nil {
		log.Fatalf("failed building generator: %v", err)
	}

	gen.Run()
}
