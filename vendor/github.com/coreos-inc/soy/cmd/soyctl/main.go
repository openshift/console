package main

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/Sirupsen/logrus"
	"github.com/spf13/cobra"
	"golang.org/x/net/context"
	"google.golang.org/grpc"
	"google.golang.org/grpc/grpclog"
	"google.golang.org/grpc/metadata"

	pb "github.com/coreos-inc/soy/proto"
	"github.com/coreos-inc/soy/server"
)

var (
	plog    = logrus.WithFields(logrus.Fields{"app": "soyctl"})
	rootCmd = &cobra.Command{
		Use:   "soyctl [command]",
		Short: "Manage accounts and things",
	}
	dexID       string
	logLevel    string
	rpcEndpoint string
	debugFlags  bool

	asvc pb.AccountServiceClient
	ctx  context.Context
)

func init() {
	rootCmd.PersistentFlags().StringVar(&dexID, "dex-id", "", "Dex ID")
	rootCmd.PersistentFlags().StringVar(&rpcEndpoint, "rpc-endpoint", "127.0.0.1:8181", "IP/Port of the SOY API server")
	rootCmd.PersistentFlags().StringVar(&logLevel, "log-level", "", "level of logging information by package (pkg=level)")
	rootCmd.PersistentFlags().BoolVar(&debugFlags, "debug-flags", false, "print out details about cobra flags")
	rootCmd.PersistentFlags().MarkHidden("debug-flags")
}

func main() {
	rootCmd.ParseFlags(os.Args[1:])
	initializeConfig()
	rootCmd.Execute()
}

func initializeConfig() {
	if logLevel != "" {
		llc, err := logrus.ParseLevel(logLevel)
		if err != nil {
			plog.Fatal(err)
		}
		logrus.SetLevel(llc)
		plog.Printf("setting log level to %s", logLevel)
	}

	if debugFlags {
		rootCmd.DebugFlags()
	}

	initializeRPC()
}

func initializeRPC() {
	grpclog.SetLogger(plog.WithField("service", "grpc"))
	rpcConn, err := grpc.Dial(rpcEndpoint, grpc.WithInsecure())
	if err != nil {
		plog.Fatalf("error connecting to RPC server, err: %v", err)
	}

	asvc = pb.NewAccountServiceClient(rpcConn)
	md := metadata.Pairs(server.AuthDexKey, dexID)
	ctx = metadata.NewContext(context.TODO(), md)
}

func mustPPJSON(data interface{}, err error) {
	if err != nil {
		plog.Fatal(err)
	}
	ppJSON(data)
}

func ppJSON(data interface{}) {
	b, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		plog.Fatal(err)
	}
	fmt.Println(string(b))
}

func parseParamsFromJSONFile(f string, obj interface{}) {
	fd, err := os.Open(f)
	if err != nil {
		plog.Fatalf("could not open params file: %v", err)
	}
	err = json.NewDecoder(fd).Decode(obj)
	if err != nil {
		plog.Fatalf("error decoding json: %v", err)
	}
}
