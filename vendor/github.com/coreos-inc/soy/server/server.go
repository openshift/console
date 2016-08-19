package server

import (
	"net"
	"net/http"

	"github.com/Sirupsen/logrus"
	"github.com/coreos/pkg/health"
	"google.golang.org/grpc"
	"google.golang.org/grpc/grpclog"

	"github.com/coreos-inc/soy/db"
	"github.com/coreos-inc/soy/manager"
	pb "github.com/coreos-inc/soy/proto"
	"github.com/coreos-inc/soy/proto/eventpb"
)

const (
	// HTTPPathHealth is the path for the health check endpoint.
	HTTPPathHealth = "/health"
)

type Config struct {
	RPCListen  string
	HTTPListen string
}

// Server handles all RPC / HTTP requests and contains the database connections,
// manager for handling business logic, and all other pertinent information.
type Server struct {
	db           db.DB
	manager      *manager.Manager
	HealthChecks []health.Checkable
	httpHost     string
	rpcHost      string
	logger       *logrus.Entry
}

// New returns a new initialized server.
func New(logger *logrus.Entry, cfg Config, mgr *manager.Manager, dbConn db.DB) (*Server, error) {
	return &Server{
		httpHost: cfg.HTTPListen,
		rpcHost:  cfg.RPCListen,
		db:       dbConn,
		manager:  mgr,
		logger:   logger,
	}, nil
}

// Run starts the server and begins accepting connections for RPC endpoints and
// HTTP healthchecks. Upon success a channel is returned which the caller
// can use to signal to the server that it should gracefully shutdown.
func (s *Server) Run() (chan struct{}, error) {
	var opts []grpc.ServerOption
	grpclog.SetLogger(s.logger.WithField("service", "grpc"))
	grpcServer := grpc.NewServer(opts...)

	acctSvc := NewAccountService(s.logger, s.manager, s.db)
	pb.RegisterAccountServiceServer(grpcServer, acctSvc)

	eventSvc := NewEventService(s.logger, s.manager, s.db)
	eventpb.RegisterEventServiceServer(grpcServer, eventSvc)

	mux := http.NewServeMux()
	mux.Handle(HTTPPathHealth, health.Checker{Checks: s.HealthChecks})
	httpsrv := &http.Server{
		Addr:    s.httpHost,
		Handler: http.Handler(mux),
	}

	lis, err := net.Listen("tcp", s.rpcHost)
	if err != nil {
		return nil, err
	}

	go func() {
		s.logger.Infof("HTTP server binding to %s...", s.httpHost)
		s.logger.Infof("HTTP server died: %v", httpsrv.ListenAndServe())
	}()

	go func() {
		s.logger.Infof("RPC server binding to %s...", lis.Addr())
		s.logger.Infof("GRPC server has died: %v", grpcServer.Serve(lis))
	}()

	stop := make(chan struct{})
	go func() {
		<-stop
		s.logger.Infof("stopping server")
		grpcServer.Stop()
	}()

	return stop, nil
}
