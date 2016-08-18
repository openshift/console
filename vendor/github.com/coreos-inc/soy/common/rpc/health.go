package rpc

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/coreos/pkg/health"
	"google.golang.org/grpc"
)

var ErrRPCConnNotReady = errors.New("rpc connection not ready")

// RpcHealthChecker checks for the health of the RPC server connection.
type RPCHealthChecker struct {
	endpoint *url.URL
	client   *http.Client
}

func NewRPCHealthChecker(endpoint *url.URL) health.Checkable {
	client := &http.Client{
		Timeout: time.Second,
	}

	return &RPCHealthChecker{
		endpoint: endpoint,
		client:   client,
	}
}

func (c *RPCHealthChecker) Healthy() error {
	resp, err := c.client.Get(c.endpoint.String() + "/health")
	if err != nil {
		return fmt.Errorf("RPC health: %v", err)
	}

	if resp.StatusCode == http.StatusOK {
		return nil
	}

	return errors.New("RPC Health: unable to connect to RPC server")
}

type RPCConnCheck struct {
	conn *grpc.ClientConn
}

func (c *RPCConnCheck) Healthy() error {
	if c.conn.State() != grpc.Ready {
		return ErrRPCConnNotReady
	}
	return nil
}

func NewRPCConnCheck(conn *grpc.ClientConn) health.Checkable {
	return &RPCConnCheck{conn}
}
