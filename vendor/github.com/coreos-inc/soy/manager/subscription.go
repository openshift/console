package manager

import (
	"errors"
	"fmt"
	"time"

	"github.com/authclub/billforward/client"
	"github.com/authclub/billforward/client/product_rate_plans"
	"github.com/authclub/billforward/client/products"
	"github.com/authclub/billforward/client/subscriptions"
	"github.com/authclub/billforward/models"
	"github.com/go-openapi/swag"

	"github.com/coreos-inc/soy/common/billforward"
	"github.com/coreos-inc/soy/common/serrors"
	pb "github.com/coreos-inc/soy/proto"
)

// Subscription represents a subscription service, providing access to subscriptions.
type Subscription interface {
	Create(*pb.CreateSubscriptionReq) (*pb.Subscription, error)
	Cancel(string, string) error
	Uncancel(string) error
	ListByAccountID(string, bool) (*pb.Subscription, []*pb.Subscription, error)
	AnyActiveForAccount(string) (bool, bool, error)
}

type subscription struct {
	bfClient *client.BillForward
}

const (
	SubscriptionType    = "Subscription"
	TrialType           = "Trial"
	DurationPeriodYears = "years"

	FailedPaymentBehaviourNone               = "None"
	FailedPaymentBehaviourCancelSubscription = "CancelSubscription"
)

// Create will create a new subscription for the given account and product / rate plan.
// The function handles some logic upfront to determine whether or not the new subscription
// should enter into a trial period or immedaitely await payment. This is determined by:
// a) Determining whether this account has purchased the given product before.
// b) Verifying that the rate plan includes a free trial.
func (s subscription) Create(r *pb.CreateSubscriptionReq) (*pb.Subscription, error) {
	// Default to regular subscription type, non-trial.
	subscriptionType := SubscriptionType
	alignWithAgg := true

	// Get rate plan information.
	hasTrial, isAnnual, err := s.ratePlanTrialAndDurationInfo(r.ProductRatePlanID)
	if err != nil {
		return nil, err
	}
	if hasTrial {
		subscriptionType = TrialType
	}
	if isAnnual {
		alignWithAgg = false
	}

	// Check if this account has purchased the product previously.
	alreadyPurchased, err := s.accountPreviouslyPurchasedProduct(r.AccountID, r.ProductID)
	if err != nil {
		return nil, err
	}
	// If this product has been purchased before, do not give another free trial.
	if alreadyPurchased {
		subscriptionType = SubscriptionType
	}

	state := r.State.String()
	if state == "" {
		state = pb.SubscriptionState_Provisioned.String()
	}

	bypassPaymentVerification, err := s.ratePlanBypassesPaymentVerification(r.ProductRatePlanID)
	if err != nil {
		return nil, err
	}

	paymentType := pb.CreateSubscriptionReq_PaymentType_name[int32(r.PaymentType)]

	createSubReq := &models.CreateSubscriptionRequest{
		AccountID:       swag.String(r.AccountID),
		Product:         swag.String(r.ProductID),
		ProductRatePlan: swag.String(r.ProductRatePlanID),
		State:           state,
		PricingComponentQuantities: convertPricingComponentQuantitiesToModel(r.PricingComponentQuantities),
		Type: subscriptionType,
		AlignPeriodWithAggregatingSubscription: swag.Bool(alignWithAgg),
		Metadata: models.DynamicMetadata{
			"agreedTOS":                 r.AgreedTOS,
			"bypassPaymentVerification": bypassPaymentVerification,
			"paymentType":               paymentType,
			"changelogEmails":           r.ChangelogEmails,
		},
	}

	if r.PaymentType == pb.CreateSubscriptionReq_PurchaseOrder {
		createSubReq.FailedPaymentBehaviour = FailedPaymentBehaviourNone
	}

	// Override ccard sub payment terms so the invoice due date is immediately for credit card purchases.
	if r.PaymentType == pb.CreateSubscriptionReq_CreditCard {
		createSubReq.PaymentTerms = 0
	}

	ok, err := s.bfClient.Subscriptions.CreateSubscriptionV2(&subscriptions.CreateSubscriptionV2Params{
		Request: createSubReq,
	})
	if err != nil {
		if createFailed, ok := err.(*subscriptions.CreateSubscriptionV2Default); ok {
			err = billforward.FormatError(createFailed.Payload)
		}
		return nil, serrors.Errorf(serrors.Internal, err, "Error creating subscription.")
	}
	if ok.Payload != nil && len(ok.Payload.Results) != 1 {
		err = errors.New("subscription not returned from BillForward API")
		return nil, serrors.Errorf(serrors.Internal, err, "Error creating subscription.")
	}

	sub, err := convertSubscriptionToProto(ok.Payload.Results[0], nil, nil)
	if err != nil {
		return nil, serrors.Errorf(serrors.Internal, err, "Error creating subscription.")
	}

	return sub, nil
}

func (s subscription) Cancel(subscriptionID, reason string) error {
	params := &subscriptions.CancelSubscriptionParams{
		// TODO (sym3tri): ask BF to remove unneccessary 2nd subscription ID from body.
		SubscriptionID: subscriptionID,
		SubscriptionCancellation: &models.CancelSubscriptionRequest{
			SubscriptionID: swag.String(subscriptionID),
			Source:         swag.String(reason),
		},
	}
	_, err := s.bfClient.Subscriptions.CancelSubscription(params)
	if err != nil {
		if cancelFailed, ok := err.(*subscriptions.CancelSubscriptionDefault); ok {
			err = billforward.FormatError(cancelFailed.Payload)
		}
		return serrors.Errorf(serrors.NotFound, err, "Error deactivating product.")
	}
	return nil
}

func (s subscription) Uncancel(subscriptionID string) error {
	params := &subscriptions.ReviveSubscriptionParams{
		// TODO (sym3tri): ask BF to remove unneccessary 2nd subscription ID from body.
		SubscriptionID: subscriptionID,
		Request: &models.ReviveSubscriptionRequest{
			SubscriptionID: swag.String(subscriptionID),
		},
	}
	_, err := s.bfClient.Subscriptions.ReviveSubscription(params)
	if err != nil {
		if reviveFailed, ok := err.(*subscriptions.ReviveSubscriptionDefault); ok {
			err = billforward.FormatError(reviveFailed.Payload)
		}
		return serrors.Errorf(serrors.NotFound, err, "Error reactivating product.")
	}
	return nil
}

func (s subscription) ListByAccountID(accountID string, includeRetired bool) (*pb.Subscription, []*pb.Subscription, error) {
	return listSubscriptionsByAccountID(s.bfClient, accountID, includeRetired)
}

func listSubscriptionsByAccountID(bfClient *client.BillForward, accountID string, includeRetired bool) (*pb.Subscription, []*pb.Subscription, error) {
	params := &subscriptions.GetSubscriptionByAccountIDParams{
		AccountID:       accountID,
		IncludeRetired:  swag.Bool(includeRetired),
		ExcludeChildren: swag.Bool(false),
	}
	subsResp, err := bfClient.Subscriptions.GetSubscriptionByAccountID(params)
	if err != nil {
		return nil, nil, serrors.Errorf(serrors.Internal, err, "Unable to retreive subscriptions.")
	}
	var parentSub *pb.Subscription
	var childSubs []*pb.Subscription
	for _, r := range subsResp.Payload.Results {
		// Get product associated with this subscription.
		prodResp, err := bfClient.Products.GetProductByID(&products.GetProductByIDParams{
			ProductID:      swag.StringValue(r.ProductID),
			IncludeRetired: swag.Bool(true),
		})
		if err != nil {
			if getFailed, ok := err.(*products.GetProductByIDDefault); ok {
				err = billforward.FormatError(getFailed.Payload)
			}
			return nil, nil, serrors.Errorf(serrors.Internal, err, "Unable to get subscription product.")
		}
		if len(prodResp.Payload.Results) == 0 {
			err = fmt.Errorf("invalid product id %s", r.ProductID)
			return nil, nil, serrors.Errorf(serrors.Internal, err, "Unable to get subscription product.")
		}

		// Get rate plan associated with this subscription.
		rpResp, err := bfClient.ProductRatePlans.GetProductRatePlanByID(&product_rate_plans.GetProductRatePlanByIDParams{
			ProductRatePlanID: swag.StringValue(r.ProductRatePlanID),
			IncludeRetired:    swag.Bool(true),
		})
		if err != nil {
			if getFailed, ok := err.(*product_rate_plans.GetProductRatePlanByIDDefault); ok {
				err = billforward.FormatError(getFailed.Payload)
			}
			return nil, nil, serrors.Errorf(serrors.Internal, err, "Error getting rate plans.")
		}
		if len(rpResp.Payload.Results) == 0 {
			err = fmt.Errorf("invalid product rate plan id %s", r.ProductRatePlanID)
			return nil, nil, serrors.Errorf(serrors.Internal, err, "Unable to get subscription product rate plan.")
		}

		sp, err := convertSubscriptionToProto(r,
			prodResp.Payload.Results[0],
			rpResp.Payload.Results[0])
		if err != nil {
			return nil, nil, serrors.Errorf(serrors.Internal, err, "Error listing subscriptions.")
		}

		if sp.Aggregating {
			if isTimestampEmpty(sp.SubscriptionEnd) {
				parentSub = sp
			}
		} else {
			childSubs = append(childSubs, sp)
		}
	}
	return parentSub, childSubs, nil
}

// AnyActiveForAccount returns whether there are any active subscriptions
// for the given account. Returns 2 booleans; the first represents whether there are
// active subscriptions, the second returns whether there are cancelled subscriptions
// that have not fully run their course.
func (s subscription) AnyActiveForAccount(bfAccountID string) (bool, bool, error) {
	_, subs, err := s.ListByAccountID(bfAccountID, false)
	if err != nil {
		return false, false, serrors.Errorf(serrors.Internal, err, "Unable to determine number of active subscriptions, please try again later.")
	}
	var hasActive, hasActiveCancelled bool
	for _, sub := range subs {
		switch sub.State {
		case pb.SubscriptionState_Cancelled:
			hasActiveCancelled, err = subscriptionIsPendingCancellation(sub)
			if err != nil {
				return false, hasActiveCancelled, err
			}
		case pb.SubscriptionState_Expired, pb.SubscriptionState_Failed:
			// Do nothing.
		default:
			hasActive = true
		}
	}
	return hasActive, hasActiveCancelled, nil
}

// Checks whether a cancelled subscription is pending cancellation (i.e. has not
// run its entire course yet, and is in the middle of the final billing period).
// Assumed that `sub` is a cancelled subscription.
func subscriptionIsPendingCancellation(sub *pb.Subscription) (bool, error) {
	if sub.SubscriptionEnd == nil {
		// If SubscriptionEnd is nil on a cancelled subscription, return `true`. Since we
		// cannot prove that it is not, its safer to assume it is.
		err := fmt.Errorf("nil SubscriptionEnd for cancelled subscription %s", sub.ID)
		return true, serrors.Errorf(serrors.Internal, err, "Unable to determine subscription status, please try again later.")
	}
	subEndTime := convertTimestampToDateTime(sub.SubscriptionEnd)
	return subEndTime.After(time.Now()), nil
}

func (s subscription) ratePlanTrialAndDurationInfo(ratePlanID string) (bool, bool, error) {
	var trial, annual bool
	params := &product_rate_plans.GetProductRatePlanByIDParams{
		ProductRatePlanID: ratePlanID,
		IncludeRetired:    swag.Bool(false),
	}
	resp, err := s.bfClient.ProductRatePlans.GetProductRatePlanByID(params)
	if err != nil {
		return false, false, serrors.Errorf(serrors.Internal, err, "Unable to create subscription, could not find product rate plan.")
	}
	if len(resp.Payload.Results) == 0 {
		err = fmt.Errorf("invalid product rate plan id %s", ratePlanID)
		return false, false, serrors.Errorf(serrors.Internal, err, "Unable to create subscription, could not find product rate plan.")
	}
	rp := resp.Payload.Results[0]
	if rp.Trial > 0 {
		trial = true
	}
	if swag.StringValue(rp.DurationPeriod) == DurationPeriodYears {
		annual = true
	}
	return trial, annual, nil
}

func (s subscription) ratePlanBypassesPaymentVerification(ratePlanID string) (bool, error) {
	params := &product_rate_plans.GetProductRatePlanByIDParams{
		ProductRatePlanID: ratePlanID,
		IncludeRetired:    swag.Bool(false),
	}
	resp, err := s.bfClient.ProductRatePlans.GetProductRatePlanByID(params)
	if err != nil {
		if getFailed, ok := err.(*product_rate_plans.GetProductRatePlanByIDDefault); ok {
			err = billforward.FormatError(getFailed.Payload)
		}
		return false, serrors.Errorf(serrors.Internal, err, "Unable to find product plan.")
	}
	if len(resp.Payload.Results) == 0 {
		err = fmt.Errorf("invalid product rate plan id %s", ratePlanID)
		return false, serrors.Errorf(serrors.Internal, err, "Unable to find product plan.")
	}
	md := resp.Payload.Results[0].Metadata
	val, _ := md["bypassPaymentVerification"].(bool)
	return val, nil
}

func (s subscription) accountPreviouslyPurchasedProduct(accountID, productID string) (bool, error) {
	_, subs, err := s.ListByAccountID(accountID, true)
	if err != nil {
		return false, err
	}
	for _, sub := range subs {
		if sub.ProductID == productID {
			return true, nil
		}
	}
	return false, nil
}

func IsActiveSubscription(sub *pb.Subscription) bool {
	if sub.State == pb.SubscriptionState_Cancelled {
		pending, err := subscriptionIsPendingCancellation(sub)
		if err != nil {
			return true
		}
		// If it's pending cancellation, it is still active, if its cancelled
		// but not pending, the subscription has ended.
		return pending
	}
	return sub.State == pb.SubscriptionState_Paid || sub.State == pb.SubscriptionState_AwaitingPayment
}
