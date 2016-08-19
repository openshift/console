package server

import (
	"testing"

	"github.com/Sirupsen/logrus"
	"google.golang.org/grpc"

	"github.com/coreos-inc/soy/db"
	"github.com/coreos-inc/soy/manager"
)

func withTestServer(t *testing.T, dbConn db.DB, fn func(conn *grpc.ClientConn)) {
	// TODO(derek) Add BF client initialization once we start
	// integrating over BF API calls.
	rpcEndpoint := "127.0.0.1:8787"
	logger := logrus.New().WithField("app", "testing")
	mgr := newManager()
	srvCfg := Config{
		RPCListen:  rpcEndpoint,
		HTTPListen: "127.0.0.1:0",
	}

	srv, err := New(logger, srvCfg, mgr, dbConn)
	if err != nil {
		t.Fatalf("Invalid listen flag(s): %v", err)
	}

	stop, err := srv.Run()
	if err != nil {
		t.Fatalf("error running server: %v", err)
	}
	defer func() {
		stop <- struct{}{}
	}()

	rpcConn, err := grpc.Dial(rpcEndpoint, grpc.WithInsecure())
	if err != nil {
		t.Fatalf("error connecting to RPC server, err: %v", err)
	}
	defer rpcConn.Close()

	fn(rpcConn)
}

func newManager() *manager.Manager {
	return manager.NewTestManager()
}
