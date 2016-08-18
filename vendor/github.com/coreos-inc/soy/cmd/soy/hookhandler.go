package main

import (
	"net/http"
	"net/url"

	"github.com/Sirupsen/logrus"
	"github.com/coreos/pkg/health"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"google.golang.org/grpc"
	"google.golang.org/grpc/grpclog"

	"github.com/coreos-inc/soy/common/rpc"
	"github.com/coreos-inc/soy/hookhandler"
	"github.com/coreos-inc/soy/proto/eventpb"
)

var (
	hookHandlerCfg        hookhandler.Config
	hookHandlerListenAddr string
	healthEndpoint        string
	hookHandlerCmdConfig  *viper.Viper
)

func init() {
	hookHandlerCmd := &cobra.Command{
		Use: "hookhandler",
		PreRun: func(cmd *cobra.Command, args []string) {
			hookHandlerCmdConfig = newViper("soy_hookhandler")
			hookHandlerCmdConfig.BindPFlags(cmd.Flags())
			hookhandlerFlagsToConfig()
		},
		Run: runHookHandler,
	}
	hookHandlerCmd.Flags().StringVar(&hookHandlerCfg.AuthUsername, "auth-username", "", "Username to restrict access to the webhook handler")
	hookHandlerCmd.Flags().StringVar(&hookHandlerCfg.AuthPassword, "auth-password", "", "Password to restrict access to the webhook handler")
	hookHandlerCmd.Flags().StringVar(&hookHandlerListenAddr, "listen", "0.0.0.0:8183", "HTTP Host and Port to listen on")
	hookHandlerCmd.Flags().StringVar(&rpcEndpoint, "rpc-endpoint", "127.0.0.1:8181", "IP/Port of the SOY API server")
	hookHandlerCmd.Flags().StringVar(&healthEndpoint, "health-endpoint", "http://127.0.0.1:8182", "URL of the RPC server's HTTP health endpoint")
	rootCmd.AddCommand(hookHandlerCmd)
}

func hookhandlerFlagsToConfig() {
	hookHandlerCfg.AuthUsername = hookHandlerCmdConfig.GetString("auth-username")
	hookHandlerCfg.AuthPassword = hookHandlerCmdConfig.GetString("auth-password")
	hookHandlerListenAddr = hookHandlerCmdConfig.GetString("listen")
	rpcEndpoint = hookHandlerCmdConfig.GetString("rpc-endpoint")
	healthEndpoint = hookHandlerCmdConfig.GetString("health-endpoint")
}

func runHookHandler(cmd *cobra.Command, args []string) {
	logger := newLogger(defaultLogConfigForApp("soy-hookhandler"))
	grpclog.SetLogger(logrus.WithField("service", "grpc"))

	if healthEndpoint == "" {
		logger.Fatal("--health-endpoint cannot be empty")
	}
	healthURL, err := url.Parse(healthEndpoint)
	if err != nil {
		logger.Fatalf("--health-endpoint must be a valid URL, err: %s", err)
	}

	rpcConn, err := grpc.Dial(rpcEndpoint, grpc.WithInsecure())
	if err != nil {
		logger.Fatalf("error connecting to RPC server, err: %v", err)
	}
	eventService := eventpb.NewEventServiceClient(rpcConn)

	http.Handle("/", hookhandler.New(logger, hookHandlerCfg, eventService))
	http.Handle("/health", health.Checker{
		Checks: []health.Checkable{
			rpc.NewRPCHealthChecker(healthURL),
			rpc.NewRPCConnCheck(rpcConn),
		},
	})
	logger.Infof("Listening on %s", hookHandlerListenAddr)
	http.ListenAndServe(hookHandlerListenAddr, nil)
}
