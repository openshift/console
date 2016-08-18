package worker

import (
	"github.com/Sirupsen/logrus"
	"golang.org/x/net/context"
	"google.golang.org/grpc"

	"github.com/coreos-inc/soy/common/pubsub"
	"github.com/coreos-inc/soy/db"
	"github.com/coreos-inc/soy/job"
	"github.com/coreos-inc/soy/manager"
	pb "github.com/coreos-inc/soy/proto"
)

func NewLicenseWorker(logger *logrus.Entry, dbConn db.DB, rpcEndpoint string) (pubsub.Channel, *job.LicenseJobHandler, error) {
	rpcConn, err := grpc.Dial(rpcEndpoint, grpc.WithInsecure())
	if err != nil {
		return "", nil, err
	}

	ctx := context.Background()
	runtime := &job.LicenseJobRuntime{
		Context:       ctx,
		RPCTimeout:    rpcTimeout,
		AccountClient: pb.NewAccountServiceClient(rpcConn),
		Logger:        logger,
		DB:            dbConn,
	}

	return manager.SyncLicenseChannel, &job.LicenseJobHandler{
		Runtime: runtime,
	}, nil
}
