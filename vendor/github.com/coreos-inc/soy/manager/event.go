package manager

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/Sirupsen/logrus"
	"github.com/authclub/billforward/client/accounts"
	"github.com/authclub/billforward/client/product_rate_plans"
	"github.com/authclub/billforward/client/subscriptions"
	"github.com/authclub/billforward/models"
	"github.com/go-openapi/swag"

	"github.com/coreos-inc/soy/common/billforward"
	"github.com/coreos-inc/soy/common/serrors"
	"github.com/coreos-inc/soy/db"
	"github.com/coreos-inc/soy/event"
	pb "github.com/coreos-inc/soy/proto"
	eventpb "github.com/coreos-inc/soy/proto/eventpb"
	"github.com/coreos-inc/soy/repo"
)

func (a account) HandleAccountCreated(sdb db.Queryer, notification *eventpb.Notification) error {
	resp, err := a.bfClient.Accounts.GetAccountByID(&accounts.GetAccountByIDParams{
		AccountID: notification.EntityID,
	})
	if err != nil {
		if getFailed, ok := err.(*accounts.GetAccountByIDDefault); ok {
			err = billforward.FormatError(getFailed.Payload)
		}
		return serrors.Errorf(serrors.Internal, err, "unable to get billforward account by ID")
	}

	numAccts := len(resp.Payload.Results)
	if numAccts != 1 {
		return serrors.New(serrors.Internal, fmt.Errorf("expected 1 account got %d accounts", numAccts))
	}
	acct := resp.Payload.Results[0]
	email := acct.Profile.Email

	err = a.saveBFAccount(sdb, *email, notification.EntityID)
	if err != nil {
		return err
	}
	a.notificationLogger(notification).Info("succesfully saved BF account")
	return nil
}

// HandlePaymentMethodCreated ensures that whenever a credit card is added to an account any previously added subscriptions get thier
// failedPaymentBehavior updated to match the default of the original product rate plan.
func (a account) HandlePaymentMethodCreated(sdb db.Queryer, notification *eventpb.Notification) error {
	var thingWithAccountID struct {
		AccountID string `json:"accountID"`
	}
	err := json.Unmarshal([]byte(notification.Entity), &thingWithAccountID)
	if err != nil {
		return err
	}

	acctID := thingWithAccountID.AccountID
	if acctID == "" {
		return serrors.New(serrors.Internal, errors.New("missing account ID in PayemntMethodCreated notification"))
	}

	_, subs, err := listSubscriptionsByAccountID(a.bfClient, acctID, false)
	if err != nil {
		return err
	}

	updateReqs := []*models.UpdateSubscriptionRequest{}
	for _, s := range subs {
		if s.FailedPaymentBehaviour == FailedPaymentBehaviourNone &&
			s.RatePlan.FailedPaymentBehaviour == FailedPaymentBehaviourCancelSubscription {
			sReq := &models.UpdateSubscriptionRequest{
				ID: swag.String(s.ID),
				FailedPaymentBehaviour: FailedPaymentBehaviourCancelSubscription,
			}
			updateReqs = append(updateReqs, sReq)
		}
	}

	var hadError bool
	for _, sReq := range updateReqs {
		_, err := a.bfClient.Subscriptions.UpdateSubscriptionV2(&subscriptions.UpdateSubscriptionV2Params{
			Request: sReq,
		})
		if err != nil {
			if updateFailed, ok := err.(*subscriptions.UpdateSubscriptionV2Default); ok {
				err = billforward.FormatError(updateFailed.Payload)
			}
			hadError = true
			a.notificationLogger(notification).WithError(err).Error("HandlePaymentMethodCreated: Failure during subscription update")
			// NOTE(sym3tri): intentionally continuing here on error to attempt to handle all others.
			continue
		}
	}

	if hadError {
		return errors.New("Had at least one error while updating subscriptions")
	}

	a.notificationLogger(notification).Info("succesfully handled PaymentMethodCreated notification")
	return nil
}

func (a account) HandleSubscriptionProvisioned(notification *eventpb.Notification) (bool, error) {
	logger := a.notificationLogger(notification).WithField("handler", "SubscriptionProvisioned")

	subscriptionID := notification.EntityID
	subResp, err := a.bfClient.Subscriptions.GetSubscriptionByID(&subscriptions.GetSubscriptionByIDParams{
		SubscriptionID: subscriptionID,
	})
	if err != nil {
		if getFailed, ok := err.(*subscriptions.GetSubscriptionByIDDefault); ok {
			err = billforward.FormatError(getFailed.Payload)
		}
		return false, err
	}
	if len(subResp.Payload.Results) != 1 {
		return false, fmt.Errorf("expected 1 subscription got %d", len(subResp.Payload.Results))
	}

	bypassPaymentVerification := false
	sub, err := convertSubscriptionToProto(subResp.Payload.Results[0], nil, nil)
	if err != nil {
		logger.WithError(err).Warn("error converting subscription")
		return false, err
	}

	logger = logger.WithFields(logrus.Fields{
		"accountID":      sub.AccountID,
		"subscriptionID": sub.ID,
	})

	if sub.Aggregating {
		logger.Debugf("subscription is an aggregating subscription, not activating")
		return false, nil
	}
	// If the PaymentType is a purchase order or unknown (salesforce initiated)
	// than assume we have nothing to do here, as activation is done out of
	// band in salesforce
	if sub.PaymentType == pb.Subscription_PurchaseOrder || sub.PaymentType == pb.Subscription_Unknown {
		logger.Debugf("subscription paymentType is %s, doing nothing", sub.PaymentType.String())
		return false, nil
	}
	bypassPaymentVerification = sub.BypassPaymentVerification
	logger.Debugf("subscription bypassPaymentVerification: %t", bypassPaymentVerification)

	// If the subscription doesn't specify bypassing payment verification, also
	// check the rate plan for this subscription to see if it specifies
	if !bypassPaymentVerification {
		rpResp, err := a.bfClient.ProductRatePlans.GetProductRatePlanByID(&product_rate_plans.GetProductRatePlanByIDParams{
			ProductRatePlanID: sub.ProductRatePlanID,
		})
		if err != nil {
			if getFailed, ok := err.(*product_rate_plans.GetProductRatePlanByIDDefault); ok {
				err = billforward.FormatError(getFailed.Payload)
			}
			return false, err
		}
		if len(rpResp.Payload.Results) != 1 {
			return false, fmt.Errorf("expected 1 subscription got %d", len(rpResp.Payload.Results))
		}
		rp, err := convertRatePlan(rpResp.Payload.Results[0])
		if err != nil {
			logger.WithError(err).Warn("error converting rate plan")
			return false, err
		}
		bypassPaymentVerification = rp.BypassPaymentVerification
		logger.Debugf("ratePlan bypassPaymentVerification: %t", bypassPaymentVerification)
	}

	// Actually verify their payment methods if we need to
	if !bypassPaymentVerification && sub.PaymentType == pb.Subscription_CreditCard {
		paymentMethodResp, err := a.bfClient.Subscriptions.AvailablePaymentMethodsForSubscription(&subscriptions.AvailablePaymentMethodsForSubscriptionParams{
			SubscriptionID: subscriptionID,
		})
		if err != nil {
			if getFailed, ok := err.(*subscriptions.AvailablePaymentMethodsForSubscriptionDefault); ok {
				err = billforward.FormatError(getFailed.Payload)
			}
			return false, serrors.Errorf(serrors.Internal, err, "unable to get payment method for subscription")
		}

		// Bad standing
		if len(paymentMethodResp.Payload.Results) == 0 {
			logger.Infof("no payment methods for subscription %s, not activating subscription", notification.EntityID)
			return false, nil
		}
	}

	logger.Debug("activating subscription (AwaitingPayment)")

	_, err = a.bfClient.Subscriptions.UpdateSubscriptionV2(&subscriptions.UpdateSubscriptionV2Params{
		Request: &models.UpdateSubscriptionRequest{
			ID:    swag.String(subscriptionID),
			State: "AwaitingPayment",
		},
	})
	if err != nil {
		if updateFailed, ok := err.(*subscriptions.UpdateSubscriptionV2Default); ok {
			err = billforward.FormatError(updateFailed.Payload)
		}
		return false, err
	}
	logger.Info("successfully activated subscription")
	return true, nil
}

func (a account) HandleSubscriptionAwaitingPayment(notification *eventpb.Notification) error {
	logger := a.notificationLogger(notification).WithField("handler", "SubscriptionAwaitingPayment")

	subscriptionID := notification.EntityID
	subResp, err := a.bfClient.Subscriptions.GetSubscriptionByID(&subscriptions.GetSubscriptionByIDParams{
		SubscriptionID: subscriptionID,
	})
	if err != nil {
		if getFailed, ok := err.(*subscriptions.GetSubscriptionByIDDefault); ok {
			err = billforward.FormatError(getFailed.Payload)
		}
		return err
	}
	if len(subResp.Payload.Results) != 1 {
		return fmt.Errorf("expected 1 subscription got %d", len(subResp.Payload.Results))
	}

	sub, err := convertSubscriptionToProto(subResp.Payload.Results[0], nil, nil)
	if err != nil {
		logger.WithError(err).Warn("error converting subscription")
		return err
	}

	logger = logger.WithFields(logrus.Fields{
		"accountID":      sub.AccountID,
		"subscriptionID": sub.ID,
	})

	// If the PaymentType is a purchase order or unknown (salesforce initiated)
	// and it's in awaiting payment, that means it's been paid, because
	// these subs get activated in Salesforce, and stay in AwaitingPayment
	// forever
	if sub.PaymentType != pb.Subscription_PurchaseOrder && sub.PaymentType != pb.Subscription_Unknown {
		logger.Infof("subscription is not purchase order or unknown, skipping")
		return nil
	}

	msgB, err := json.Marshal(event.SubscriptionEvent{
		BFAccountID:    sub.AccountID,
		SubscriptionID: sub.ID,
	})
	if err != nil {
		return err
	}

	logger.Infof("Publishing SubscriptionPaid for purchase order subscription")
	_, err = a.publisher.Publish(SubscriptionPaidTopic, string(msgB))
	return err
}

func (a account) HandleSubscriptionPaid(notification *eventpb.Notification) error {
	var sub struct {
		AccountID      string `json:"accountID"`
		SubscriptionID string `json:"id"`
		Aggregating    bool   `json:"aggregateAllSubscriptionsOnAccount"`
	}
	err := json.Unmarshal([]byte(notification.Entity), &sub)
	if err != nil {
		return err
	}

	logger := a.notificationLogger(notification).WithFields(logrus.Fields{
		"accountID":      sub.AccountID,
		"subscriptionID": sub.SubscriptionID,
		"handler":        "SubscriptionPaid",
	})

	if sub.Aggregating {
		logger.Infof("Subscription %s is aggregating, not publishing subscription event", sub.SubscriptionID)
		return nil
	}

	msgB, err := json.Marshal(event.SubscriptionEvent{
		BFAccountID:    sub.AccountID,
		SubscriptionID: sub.SubscriptionID,
	})
	if err != nil {
		return err
	}

	logger.Info("Publishing SubscriptionPaid")
	_, err = a.publisher.Publish(SubscriptionPaidTopic, string(msgB))
	return err
}

func (a account) HandleServiceEndSucceeded(notification *eventpb.Notification) error {
	logger := a.notificationLogger(notification)
	var amendment struct {
		SubscriptionID string `json:"subscriptionID"`
	}
	err := json.Unmarshal([]byte(notification.Entity), &amendment)
	if err != nil {
		return err
	}
	subResp, err := a.bfClient.Subscriptions.GetSubscriptionByID(&subscriptions.GetSubscriptionByIDParams{
		SubscriptionID: amendment.SubscriptionID,
	})
	if err != nil {
		if getFailed, ok := err.(*subscriptions.GetSubscriptionByIDDefault); ok {
			err = billforward.FormatError(getFailed.Payload)
		}
		return err
	}
	sub := subResp.Payload.Results[0]
	msgB, err := json.Marshal(event.SubscriptionEvent{
		BFAccountID:    *sub.AccountID,
		SubscriptionID: *sub.ID,
	})
	if err != nil {
		return err
	}
	logger.Infof("Publishing SubscriptionEnded: AccountID: %s, SubscriptionID: %s", *sub.AccountID, amendment.SubscriptionID)
	_, err = a.publisher.Publish(SubscriptionEndedTopic, string(msgB))
	return err
}

func (a account) saveBFAccount(sdb db.Queryer, email, bfAccountID string) error {
	externallyCreated := false
	u, err := repo.GetUserByEmail(sdb, email)
	if err != nil {
		if serrors.TypeOf(err) == serrors.NotFound { // created via salesforce
			externallyCreated = true
		} else {
			return err
		}
	}

	err = a.CreateBFAccount(sdb, bfAccountID, true)
	if err != nil {
		if serrors.TypeOf(err) == serrors.AlreadyExists {
			err = fmt.Errorf("Could not create BF account, account already exists with ID %s", bfAccountID)
			return serrors.Errorf(serrors.AlreadyExists, err, "BF Account already exists.")
		}
		err = fmt.Errorf("Unknown error, could not create account with ID %s, err: %s", bfAccountID, err)
		return serrors.Errorf(serrors.Internal, err, "Unable to create BF account.")
	}

	if externallyCreated {
		if email == "" {
			err = fmt.Errorf("error creating externally created account for BF Account ID %s, no email provided", bfAccountID)
			return serrors.Errorf(serrors.Internal, err, "Unable to create externally created account, no email provided.")
		}
		a.logger.Debugf("Creating ExternallyCreatedAccount, BFAccountID: %s, Email: %s", bfAccountID, email)
		err = repo.CreateExternallyCreatedAccount(sdb, email, bfAccountID)
		if err != nil {
			return serrors.Errorf(serrors.Internal, err, "Unable to create externally created account")
		}
	} else {
		a.logger.Debugf("Creating UserAccount, BFAccountID: %s, DexID: %s", bfAccountID, u.DexID)
		// created via web UI
		err = CreateUserAccount(sdb, bfAccountID, u.DexID, pb.Role_ADMIN, true)
		if err != nil {
			return serrors.Errorf(serrors.Internal, err, "Unable to create user account")
		}
	}
	return nil
}

func (a account) SaveNotification(sdb db.Queryer, notification *eventpb.Notification) error {
	return repo.CreateNotification(sdb, notification.ID, notification.RawPayload)
}

func (a account) notificationLogger(notification *eventpb.Notification) *logrus.Entry {
	return a.logger.WithFields(logrus.Fields{
		"domain":   notification.Domain,
		"action":   notification.Action,
		"entityID": notification.EntityID,
	})
}
