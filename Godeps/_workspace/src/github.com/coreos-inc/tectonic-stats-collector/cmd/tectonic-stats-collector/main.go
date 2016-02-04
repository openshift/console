package main

import (
	"flag"
	"fmt"
	"net"
	"os"

	"github.com/coreos/pkg/capnslog"
	"github.com/coreos/pkg/flagutil"

	"github.com/coreos-inc/tectonic-stats-collector/pkg/collector"
)

var (
	VERSION = "UNKNOWN"
)

var log = capnslog.NewPackageLogger("github.com/coreos-inc/tectonic-stats-collector/cmd", "tectonic-stats-collector")

func main() {
	fs := flag.NewFlagSet("tectonic-stats-collector", flag.ExitOnError)

	ver := fs.Bool("version", false, "Print version information and exit")
	logDebug := fs.Bool("log-debug", false, "Log debug-level information")
	logQueries := fs.Bool("log-queries", false, "Log all database queries")

	listen := fs.String("listen", "127.0.0.1:8080", "Host and port to bind collector API")

	var cfg collector.DBConfig
	fs.StringVar(&cfg.DSN, "db-url", "", "DSN-formatted database connection string")
	fs.IntVar(&cfg.MaxIdleConnections, "db-max-idle-conns", 0, "Maximum number of connections in the idle connection pool")
	fs.IntVar(&cfg.MaxOpenConnections, "db-max-open-conns", 0, "Maximum number of open connections to the database")

	if err := fs.Parse(os.Args[1:]); err != nil {
		log.Fatalf("flag parsing failed: %v", err)
	}

	if err := flagutil.SetFlagsFromEnv(fs, "TECTONIC"); err != nil {
		log.Fatalf("failed parsing flags from environment: %v", err)
	}

	if *ver {
		fmt.Printf("tectonic-stats-collector version %s\n", VERSION)
		os.Exit(0)
	}

	capnslog.SetFormatter(capnslog.NewStringFormatter(os.Stderr))
	if *logDebug {
		capnslog.SetGlobalLogLevel(capnslog.DEBUG)
	}
	if *logQueries {
		cfg.LogQueries = true
	}

	if _, _, err := net.SplitHostPort(*listen); err != nil {
		log.Fatalf("invalid value for --listen flag: %v", err)
	}

	conn, err := collector.NewDBConnection(cfg)
	if err != nil {
		log.Fatalf("failed building DB connection: %v", err)
	}

	srv := &collector.APIServer{
		Host:       *listen,
		RecordRepo: collector.NewDBRecordRepo(conn),
		Version:    VERSION,
	}
	if err := srv.Start(); err != nil {
		log.Fatalf("failed starting collector API: %v", err)
	}

	select {}
}
