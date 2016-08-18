package server

import (
	"golang.org/x/net/context"

	"github.com/Sirupsen/logrus"
	"github.com/coreos-inc/soy/common/serrors"
	"github.com/coreos-inc/soy/db"
	"github.com/coreos-inc/soy/manager"
	pb "github.com/coreos-inc/soy/proto/eventpb"
)

type eventService struct {
	manager *manager.Manager
	db      db.DB
	logger  *logrus.Entry
}

// NewEventService returns an initialized eventService struct, which handles
// RPC calls for external events, i.e. BillForward hooks.
func NewEventService(logger *logrus.Entry, m *manager.Manager, sdb db.DB) *eventService {
	return &eventService{
		manager: m,
		db:      sdb,
		logger:  logger,
	}
}

// AccountCreated saves account information relating to an externally created
// BillForward account.
func (s *eventService) AccountCreated(ctx context.Context, req *pb.AccountCreatedReq) (*pb.AccountCreatedResp, error) {
	if err := db.WithTransaction(s.db, func(tx db.Queryer) error {
		err := s.manager.Account.HandleAccountCreated(tx, req.Notification)
		if err != nil {
			return err
		}
		return s.manager.Account.SaveNotification(tx, req.Notification)
	}); err != nil {
		loggerFromNotification(s.logger, req.Notification).WithError(err).Error("RPC AccountCreated failed")
		return nil, serrors.RPC(err)
	}
	loggerFromNotification(s.logger, req.Notification).Infof("successfully handled AccountCreated notification")
	return &pb.AccountCreatedResp{}, nil
}

func (s *eventService) SubscriptionProvisioned(ctx context.Context, req *pb.SubscriptionProvisionedReq) (*pb.SubscriptionProvisionedResp, error) {
	resp := new(pb.SubscriptionProvisionedResp)
	if err := db.WithTransaction(s.db, func(tx db.Queryer) error {
		activated, err := s.manager.Account.HandleSubscriptionProvisioned(req.Notification)
		if err != nil {
			return err
		}
		resp.Activated = activated

		return s.manager.Account.SaveNotification(tx, req.Notification)
	}); err != nil {
		loggerFromNotification(s.logger, req.Notification).WithError(err).Error("RPC SubscriptionProvisioned failed")
		return nil, serrors.RPC(err)
	}
	loggerFromNotification(s.logger, req.Notification).Infof("successfully handled SubscriptionProvisioned notification")
	return resp, nil
}

func (s *eventService) SubscriptionAwaitingPayment(ctx context.Context, req *pb.SubscriptionAwaitingPaymentReq) (*pb.SubscriptionAwaitingPaymentResp, error) {
	resp := new(pb.SubscriptionAwaitingPaymentResp)
	if err := db.WithTransaction(s.db, func(tx db.Queryer) error {
		err := s.manager.Account.HandleSubscriptionAwaitingPayment(req.Notification)
		if err != nil {
			return err
		}

		return s.manager.Account.SaveNotification(tx, req.Notification)
	}); err != nil {
		loggerFromNotification(s.logger, req.Notification).WithError(err).Error("RPC SubscriptionAwaitingPayment failed")
		return nil, serrors.RPC(err)
	}
	loggerFromNotification(s.logger, req.Notification).Infof("successfully handled SubscriptionAwaitingPayment notification")
	return resp, nil
}

func (s *eventService) SubscriptionPaid(ctx context.Context, req *pb.SubscriptionPaidReq) (*pb.SubscriptionPaidResp, error) {
	resp := new(pb.SubscriptionPaidResp)
	if err := db.WithTransaction(s.db, func(tx db.Queryer) error {
		err := s.manager.Account.HandleSubscriptionPaid(req.Notification)
		if err != nil {
			return err
		}

		return s.manager.Account.SaveNotification(tx, req.Notification)
	}); err != nil {
		loggerFromNotification(s.logger, req.Notification).WithError(err).Error("RPC SubscriptionPaid failed")
		return nil, serrors.RPC(err)
	}
	loggerFromNotification(s.logger, req.Notification).Infof("successfully handled SubscriptionPaid notification")
	return resp, nil
}

func (s *eventService) ServiceEndSucceeded(ctx context.Context, req *pb.ServiceEndSucceededReq) (*pb.ServiceEndSucceededResp, error) {
	resp := new(pb.ServiceEndSucceededResp)
	if err := db.WithTransaction(s.db, func(tx db.Queryer) error {
		err := s.manager.Account.HandleServiceEndSucceeded(req.Notification)
		if err != nil {
			return err
		}

		return s.manager.Account.SaveNotification(tx, req.Notification)
	}); err != nil {
		loggerFromNotification(s.logger, req.Notification).WithError(err).Error("RPC ServiceEndSucceeded failed")
		return nil, serrors.RPC(err)
	}
	loggerFromNotification(s.logger, req.Notification).Infof("successfully handled ServiceEndSucceeded notification")
	return resp, nil
}

// PaymentMethodCreated makes any necessary updates to accounts/subscriptions if a new payment method is added to an account.
// Notably any previously purchased PO subscriptions must be check to see if their failedPayment behavior should be updated.
func (s *eventService) PaymentMethodCreated(ctx context.Context, req *pb.PaymentMethodCreatedReq) (*pb.PaymentMethodCreatedResp, error) {
	if err := db.WithTransaction(s.db, func(tx db.Queryer) error {
		err := s.manager.Account.HandlePaymentMethodCreated(tx, req.Notification)
		if err != nil {
			return err
		}
		return s.manager.Account.SaveNotification(tx, req.Notification)
	}); err != nil {
		loggerFromNotification(s.logger, req.Notification).WithError(err).Error("RPC PaymentMethodCreated failed")
		return nil, serrors.RPC(err)
	}
	loggerFromNotification(s.logger, req.Notification).Infof("successfully handled PaymentMethodCreated notification")
	return &pb.PaymentMethodCreatedResp{}, nil
}

func loggerFromNotification(logger *logrus.Entry, notification *pb.Notification) *logrus.Entry {
	return logger.WithFields(logrus.Fields{
		"domain":   notification.Domain,
		"action":   notification.Action,
		"entityID": notification.EntityID,
	})
}
