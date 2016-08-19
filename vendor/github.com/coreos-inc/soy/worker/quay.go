package worker

import (
	"github.com/Sirupsen/logrus"
	"github.com/coreos/go-quay/quay"
	"github.com/go-openapi/runtime"
	httpclient "github.com/go-openapi/runtime/client"
	"golang.org/x/net/context"
	"google.golang.org/grpc"

	"github.com/coreos-inc/soy/common/pubsub"
	"github.com/coreos-inc/soy/db"
	"github.com/coreos-inc/soy/job"
	"github.com/coreos-inc/soy/manager"
	pb "github.com/coreos-inc/soy/proto"
)

func NewQuayAccountWorker(logger *logrus.Entry, dbConn db.DB, rpcEndpoint string, quayConfig job.QuayConfig) (pubsub.Channel, *job.QuayAccountJobHandler, error) {
	transport := httpclient.New("quay.io", "/", []string{"https"})
	// These two extra consumers are a work around to handle quay returning the
	// wrong content-type on error. https://github.com/coreos-inc/quay/issues/893
	transport.Consumers["text/html; charset=utf-8"] = runtime.JSONConsumer()
	transport.Consumers["text/html"] = runtime.JSONConsumer()
	transport.Consumers["application/problem+json"] = runtime.JSONConsumer()

	rpcConn, err := grpc.Dial(rpcEndpoint, grpc.WithInsecure())
	if err != nil {
		return "", nil, err
	}

	ctx := context.Background()
	runtime := &job.QuayRuntime{
		Context:       ctx,
		RPCTimeout:    rpcTimeout,
		AccountClient: pb.NewAccountServiceClient(rpcConn),
		QuayClient:    quay.New(transport, nil),
		QuayAuth:      httpclient.BearerToken(quayConfig.APIKey),
		Logger:        logger,
		DB:            dbConn,
	}

	return manager.SyncQuayAccountChannel, &job.QuayAccountJobHandler{
		Config:  quayConfig,
		Runtime: runtime,
	}, nil
}
