package job

import (
	"encoding/json"
	"time"

	"github.com/Sirupsen/logrus"
	"golang.org/x/net/context"

	"github.com/coreos-inc/soy/common/pubsub"
	"github.com/coreos-inc/soy/db"
	"github.com/coreos-inc/soy/event"
	pb "github.com/coreos-inc/soy/proto"
)

type LicenseJobRuntime struct {
	AccountClient pb.AccountServiceClient
	Context       context.Context
	RPCTimeout    time.Duration
	DB            db.DB
	Logger        *logrus.Entry
}

type LicenseJobHandler struct {
	Runtime *LicenseJobRuntime
}

func (handler *LicenseJobHandler) HandleJob(msg *pubsub.Message) error {
	var ev event.AccountEvent
	err := json.Unmarshal(msg.Data, &ev)
	if err != nil {
		return err
	}

	accountID := ev.BFAccountID
	logger := handler.Runtime.Logger.WithFields(logrus.Fields{
		"job":       "LicenseJob",
		"accountID": accountID,
	})

	logger.Debug("creating license")
	ctx, _ := context.WithTimeout(handler.Runtime.Context, handler.Runtime.RPCTimeout)
	_, err = handler.Runtime.AccountClient.CreateLicense(ctx, &pb.CreateLicenseReq{
		AccountID: accountID,
	})
	if err != nil {
		return err
	}
	logger.Info("created license")
	return nil
}
