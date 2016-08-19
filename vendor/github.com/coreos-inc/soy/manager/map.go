package manager

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/Sirupsen/logrus"
	"github.com/authclub/billforward/models"
	"github.com/go-openapi/strfmt"
	"github.com/go-openapi/swag"

	pb "github.com/coreos-inc/soy/proto"
	pbc "github.com/coreos-inc/soy/proto/common"
)

// Map attempts to map from one struct to another via
// JSON marshaling/unmarshaling.
// TOOD (sym3tri): this is crap. Make something better.
func Map(src, dest interface{}) error {
	b, err := json.Marshal(src)
	if err != nil {
		return fmt.Errorf("Map: unable to marshal src: %s", err)
	}
	buf := bytes.NewBuffer(b)
	dec := json.NewDecoder(buf)
	dec.UseNumber()

	err = dec.Decode(&dest)
	if err != nil {
		return fmt.Errorf("Map: unable to unmarshal src: %s", err)
	}

	return nil
}

func isTimestampEmpty(ts *pbc.Timestamp) bool {
	if ts == nil {
		return true
	}
	if ts.Seconds == 0 && ts.Nanos == 0 {
		return true
	}
	return false
}

func convertModelDateTimeToTimestamp(dt *strfmt.DateTime) *pbc.Timestamp {
	t := convertDateTimeToTime(dt)
	if t.IsZero() {
		return new(pbc.Timestamp)
	}
	return &pbc.Timestamp{
		Seconds: t.Unix(),
		Nanos:   int32(t.Nanosecond()),
	}
}

func convertDateTimeToTime(dt *strfmt.DateTime) *time.Time {
	if dt == nil {
		return &time.Time{}
	}
	return swag.Time(time.Time(*dt))
}

func convertTimestampToDateTime(ts *pbc.Timestamp) time.Time {
	if ts == nil {
		return time.Time{}
	}
	return time.Unix(ts.Seconds, int64(ts.Nanos))
}

func convertTimestampToModelDateTime(ts *pbc.Timestamp) strfmt.DateTime {
	if ts == nil {
		return strfmt.NewDateTime()
	}
	return strfmt.DateTime(time.Unix(ts.Seconds, int64(ts.Nanos)))
}

func convertTimeToCommonTimestamp(t time.Time) *pbc.Timestamp {
	return &pbc.Timestamp{Seconds: t.Unix(), Nanos: int32(t.Nanosecond())}
}

func convertPricingComponentQuantities(pcqs []*models.PricingComponentQuantityRequest) []*pb.PricingComponentQuantity {
	ret := make([]*pb.PricingComponentQuantity, len(pcqs))
	for i := range pcqs {
		pcq := pcqs[i]
		ret[i] = &pb.PricingComponentQuantity{
			PricingComponent: *pcq.PricingComponent,
			Quantity:         *pcq.Quantity,
		}
	}
	return ret
}

func convertPricingComponentQuantitiesToModel(pcqs []*pb.PricingComponentQuantity) []*models.PricingComponentQuantityRequest {
	ret := make([]*models.PricingComponentQuantityRequest, len(pcqs))
	for i := range pcqs {
		pcq := pcqs[i]
		ret[i] = &models.PricingComponentQuantityRequest{
			PricingComponent: swag.String(pcq.PricingComponent),
			Quantity:         swag.Int64(pcq.Quantity),
		}
	}
	return ret
}

func convertPricingComponentValues(pcvs []*models.PricingComponentValue) []*pb.PricingComponentValue {
	ret := make([]*pb.PricingComponentValue, len(pcvs))
	for i := range pcvs {
		pcv := pcvs[i]
		ret[i] = &pb.PricingComponentValue{
			PricingComponentID:   swag.StringValue(pcv.PricingComponentID),
			PricingComponentName: pcv.PricingComponentName,
			Value:                int64(swag.Int32Value(pcv.Value)),
		}
	}
	return ret
}

func subscriptionStateDescription(sub *pb.Subscription) (pb.StateSeverity, string) {
	dateLayout := "Jan 2, 2006 15:04:05 PM"
	svOK := pb.StateSeverity_GOOD

	switch sub.Type {
	case pb.Subscription_FixedTerm:
		periodStart := convertTimestampToDateTime(sub.CurrentPeriodStart)
		periodEnd := convertTimestampToDateTime(sub.CurrentPeriodEnd)
		return svOK, fmt.Sprintf("Fixed Term (%s - %s)", periodStart.Format(dateLayout), periodEnd.Format(dateLayout))

	case pb.Subscription_Trial:
		switch sub.State {
		case pb.SubscriptionState_Provisioned:
			return svOK, "Trial (Pending)"
		case pb.SubscriptionState_AwaitingPayment:
			return svOK, "Trial"
		case pb.SubscriptionState_Paid:
			trialEnd := convertTimestampToDateTime(sub.TrialEnd)
			if !trialEnd.IsZero() {
				// Workaround for issue #297 (https://github.com/coreos-inc/soy/issues/297).
				if trialEnd.Before(time.Now()) {
					logrus.WithField("app", "soy").
						Warnf("Invalid trial end date %v for subscription %s", trialEnd, sub.ID)
					return svOK, "Trial"
				}
				trialDaysRemaining := int32(trialEnd.Sub(time.Now()).Hours() / 24)
				return svOK, fmt.Sprintf("Trial (ends in %d days)", trialDaysRemaining)
			}
		case pb.SubscriptionState_Cancelled:
			pendingCancel, err := subscriptionIsPendingCancellation(sub)
			if err != nil || pendingCancel {
				return svOK, "Trial (Pending Deactivation)"
			}
			return pb.StateSeverity_NORMAL, "Trial Deactivated"
		case pb.SubscriptionState_Expired:
			return pb.StateSeverity_NORMAL, "Trial Deactivated"
		case pb.SubscriptionState_Failed:
			return pb.StateSeverity_CRITICAL, "Trial Billing Issue"
		}

	case pb.Subscription_Subscription:
		switch sub.State {
		case pb.SubscriptionState_Provisioned:
			return svOK, "Pending Activation"
		case pb.SubscriptionState_AwaitingPayment:
			return svOK, "Active"
		case pb.SubscriptionState_Paid:
			return svOK, "Active"
		case pb.SubscriptionState_Cancelled:
			pendingCancel, err := subscriptionIsPendingCancellation(sub)
			if err != nil || pendingCancel {
				return svOK, "Active (Pending Deactivation)"
			}
			return pb.StateSeverity_NORMAL, "Deactivated"
		case pb.SubscriptionState_Expired:
			return pb.StateSeverity_NORMAL, "Deactivated"
		case pb.SubscriptionState_Failed:
			return pb.StateSeverity_CRITICAL, "Delinquent (Billing Issue)"
		default:
			return svOK, fmt.Sprintf("Active (%s)", pb.SubscriptionState_name[int32(sub.State)])
		}
	}

	typ := pb.Subscription_SubscriptionType_name[int32(sub.State)]
	state := pb.SubscriptionState_name[int32(sub.State)]
	return pb.StateSeverity_UNKNOWN, fmt.Sprintf("%s (%s)", typ, state)
}

func convertSubscriptionToProto(m *models.Subscription, prod *models.Product, plan *models.ProductRatePlan) (*pb.Subscription, error) {

	sub := &pb.Subscription{
		ID:                     *m.ID,
		AccountID:              *m.AccountID,
		ProductID:              *m.ProductID,
		ProductRatePlanID:      *m.ProductRatePlanID,
		Name:                   *m.Name,
		State:                  pb.SubscriptionState(pb.SubscriptionState_value[*m.State]),
		Type:                   pb.Subscription_SubscriptionType(pb.Subscription_SubscriptionType_value[m.Type]),
		CurrentPeriodStart:     convertModelDateTimeToTimestamp(&m.CurrentPeriodStart),
		CurrentPeriodEnd:       convertModelDateTimeToTimestamp(&m.CurrentPeriodEnd),
		InitialPeriodStart:     convertModelDateTimeToTimestamp(m.InitialPeriodStart),
		ContractStart:          convertModelDateTimeToTimestamp(&m.ContractStart),
		TrialEnd:               convertModelDateTimeToTimestamp(m.TrialEnd),
		SubscriptionEnd:        convertModelDateTimeToTimestamp(&m.SubscriptionEnd),
		SuccessfulPeriods:      m.SuccessfulPeriods,
		TotalPeriods:           m.TotalPeriods,
		CreditEnabled:          swag.BoolValue(m.CreditEnabled),
		Aggregating:            swag.BoolValue(m.AggregateAllSubscriptionsOnAccount),
		PricingComponentValues: convertPricingComponentValues(m.PricingComponentValues),
		FailedPaymentBehaviour: m.FailedPaymentBehaviour,
	}
	sub.StateSeverity, sub.StateDescription = subscriptionStateDescription(sub)

	if tos, ok := m.Metadata["agreedTOS"].(bool); ok {
		sub.AgreedTOS = tos
	}
	if bpv, ok := m.Metadata["bypassPaymentVerification"].(bool); ok {
		sub.BypassPaymentVerification = bpv
	}
	if cle, ok := m.Metadata["changelogEmails"].(bool); ok {
		sub.ChangelogEmails = cle
	}
	if paymentTypeStr, ok := m.Metadata["paymentType"].(string); ok {
		if pt, ok := pb.Subscription_PaymentType_value[paymentTypeStr]; ok {
			sub.PaymentType = pb.Subscription_PaymentType(pt)
		}
	}

	var err error
	if prod != nil {
		sub.Product, err = convertProduct(prod)
		if err != nil {
			return nil, err
		}
	}

	if plan != nil {
		sub.RatePlan, err = convertRatePlan(plan)
		if err != nil {
			return nil, err
		}
	}

	if !sub.Aggregating && sub.RatePlan != nil {
		pcMap := makePricingComponentMapFromPlan(sub.RatePlan)
		for _, pcv := range sub.PricingComponentValues {
			appendPricingComponentValueWithPlanInfo(pcv, pcMap)
		}
	}

	return sub, nil
}

func makePricingComponentMapFromPlan(plan *pb.RatePlan) map[string]*pb.PricingComponent {
	pcMap := map[string]*pb.PricingComponent{}
	for _, pc := range plan.PricingComponents {
		pcMap[pc.ID] = pc
	}
	return pcMap
}

// appendPricingComponentValueWithPlanInfo Looks up the related PricingComponent definition in pcMap
// for a particular PricingComponentValue. It annotates it with other useful information to make the values easier
// for clients to consume and display.
func appendPricingComponentValueWithPlanInfo(pcv *pb.PricingComponentValue, pcMap map[string]*pb.PricingComponent) {
	if pcv == nil {
		return
	}
	component, ok := pcMap[pcv.PricingComponentID]
	if !ok {
		return
	}

	pcv.PricingComponentInfo = &pb.PricingComponentValue_PricingComponentInfo{
		PublicName:    component.PublicName,
		Description:   component.Description,
		UnitOfMeasure: component.UnitOfMeasure,
	}
}

func convertProduct(bfp *models.Product) (*pb.Product, error) {
	var prod pb.Product
	if err := Map(bfp, &prod); err != nil {
		return nil, err
	}
	convertProductMetadata(bfp.Metadata, &prod)
	return &prod, nil
}

func convertProductMetadata(md models.DynamicMetadata, prod *pb.Product) {
	prod.Public = isPublic(md)
	prod.ExternalLink, _ = md["externalLink"].(string)
	prod.QuickstartLink, _ = md["quickstartLink"].(string)
	prod.TOSLink, _ = md["tosLink"].(string)
	ordNum, ok := md["order"].(json.Number)
	if ok {
		order, err := ordNum.Int64()
		if err != nil {
			logrus.WithError(err).Errorf("unable to convert plan order into int")
		} else {
			prod.Order = int32(order)
		}
	}
}

func convertRatePlan(bfp *models.ProductRatePlan) (*pb.RatePlan, error) {
	var ratePlan pb.RatePlan
	if err := Map(bfp, &ratePlan); err != nil {
		return nil, err
	}
	convertRatePlanMetadata(bfp.Metadata, &ratePlan)
	return &ratePlan, nil
}

func convertRatePlanMetadata(md models.DynamicMetadata, plan *pb.RatePlan) {
	plan.Public = isPublic(md)
	plan.Purchasable, _ = md["purchasable"].(bool)
	plan.BypassPaymentVerification, _ = md["bypassPaymentVerification"].(bool)
	teamsStr, ok := md["quay_teams"].(string)
	if ok && teamsStr != "" {
		plan.QuayTeams = strings.Split(teamsStr, ",")
	}

	ordNum, ok := md["order"].(json.Number)
	if ok {
		order, err := ordNum.Int64()
		if err != nil {
			logrus.WithError(err).Errorf("unable to convert plan order into int")
		} else {
			plan.Order = int32(order)
		}
	}
}

func convertAddress(addr *pb.Address) *models.Address {
	bfa := &models.Address{
		ID:             addr.ID,
		ProfileID:      addr.ProfileID,
		AddressLine1:   swag.String(addr.AddressLine1),
		AddressLine2:   addr.AddressLine2,
		AddressLine3:   addr.AddressLine3,
		City:           swag.String(addr.City),
		Province:       swag.String(addr.Province),
		Country:        swag.String(addr.Country),
		Postcode:       swag.String(addr.Postcode),
		Landline:       addr.Landline,
		PrimaryAddress: swag.Bool(addr.PrimaryAddress),
	}

	return bfa
}

func convertBFAddress(bfa *models.Address) *pb.Address {
	return &pb.Address{
		ID:             bfa.ID,
		ProfileID:      bfa.ProfileID,
		AddressLine1:   swag.StringValue(bfa.AddressLine1),
		AddressLine2:   bfa.AddressLine2,
		AddressLine3:   bfa.AddressLine3,
		City:           swag.StringValue(bfa.City),
		Province:       swag.StringValue(bfa.Province),
		Country:        swag.StringValue(bfa.Country),
		Postcode:       swag.StringValue(bfa.Postcode),
		Landline:       bfa.Landline,
		PrimaryAddress: swag.BoolValue(bfa.PrimaryAddress),
	}
}

func convertBFProfile(bfp *models.Profile) *pb.Profile {
	prof := &pb.Profile{
		AccountID:   swag.StringValue(bfp.AccountID),
		Email:       swag.StringValue(bfp.Email),
		FirstName:   swag.StringValue(bfp.FirstName),
		LastName:    swag.StringValue(bfp.LastName),
		ID:          swag.StringValue(bfp.ID),
		CompanyName: bfp.CompanyName,
		Landline:    bfp.Landline,
		Mobile:      bfp.Mobile,
	}
	for _, addr := range bfp.Addresses {
		if !swag.BoolValue(addr.Deleted) {
			prof.Addresses = append(prof.Addresses, convertBFAddress(addr))
		}
	}
	return prof
}

func convertProfile(prof *pb.Profile) *models.Profile {
	bfp := &models.Profile{
		AccountID:   swag.String(prof.AccountID),
		Email:       swag.String(prof.Email),
		FirstName:   swag.String(prof.FirstName),
		ID:          swag.String(prof.ID),
		LastName:    swag.String(prof.LastName),
		CompanyName: prof.CompanyName,
		Landline:    prof.Landline,
		Mobile:      prof.Mobile,
	}
	for _, addr := range prof.Addresses {
		bfp.Addresses = append(bfp.Addresses, convertAddress(addr))
	}
	return bfp
}

func convertAddressToReq(addr *pb.Address) *models.CreateProfileAddressRequest {
	req := &models.CreateProfileAddressRequest{
		AddressLine1:   swag.String(addr.AddressLine1),
		AddressLine2:   addr.AddressLine2,
		AddressLine3:   addr.AddressLine3,
		City:           swag.String(addr.City),
		Province:       swag.String(addr.Province),
		Country:        swag.String(addr.Country),
		Postcode:       swag.String(addr.Postcode),
		PrimaryAddress: swag.Bool(addr.PrimaryAddress),
		Landline:       addr.Landline,
	}
	return req
}

func convertProfileToReq(prof *pb.Profile) *models.CreateAccountProfileRequest {
	req := &models.CreateAccountProfileRequest{
		CompanyName: prof.CompanyName,
		Email:       prof.Email,
		FirstName:   prof.FirstName,
		Landline:    prof.Landline,
		LastName:    prof.LastName,
		Mobile:      prof.Mobile,
	}
	for _, addr := range prof.Addresses {
		req.Addresses = append(req.Addresses, convertAddressToReq(addr))
	}
	return req
}

func convertBFCreditCard(card *models.PaymentMethod) *pb.CreditCard {
	state := pb.CreditCard_CreditCardState(pb.CreditCard_CreditCardState_value[*card.State])

	return &pb.CreditCard{
		ID:               card.ID,
		AccountID:        swag.StringValue(card.AccountID),
		LastFour:         card.LastFour,
		ExpiryMonth:      card.ExpiryMonth,
		ExpiryYear:       card.ExpiryYear,
		Type:             card.CardType,
		State:            state,
		StateDescription: state.String(),
	}
}

func extractAccountMetadata(acct *pb.Account) models.DynamicMetadata {
	dmd := models.DynamicMetadata{}
	dmd["newsletterEmail"] = acct.NewsletterEmail
	if acct.QuayID != "" {
		dmd["quayID"] = acct.QuayID
	}
	return dmd
}

func convertBFAccount(bfa *models.Account) *pb.Account {
	acct := &pb.Account{
		ID:        swag.StringValue(bfa.ID),
		Profile:   convertBFProfile(bfa.Profile),
		Deleted:   swag.BoolValue(bfa.Deleted),
		CreatedAt: convertModelDateTimeToTimestamp(&bfa.Created),
	}

	md := bfa.Metadata
	acct.QuayID, _ = md["quayID"].(string)
	acct.NewsletterEmail, _ = md["newsletterEmail"].(bool)
	return acct
}

func isPublic(md models.DynamicMetadata) bool {
	pbiface, ok := md["public"]
	if !ok {
		// Skip over anything not explicitly marked as public.
		return false
	}
	publicBool, ok := pbiface.(bool)
	if ok && publicBool {
		return true
	}
	// NOTE(sym3tri): accomodate inconsistent types in the BF API.
	publicString, ok := pbiface.(string)
	if ok && publicString == "true" {
		return true
	}
	return false
}

func convertInvoiceToProto(inv *models.Invoice) (*pb.Invoice, error) {
	var pbInv pb.Invoice
	err := Map(inv, &pbInv)
	if err != nil {
		return nil, err
	}
	return &pbInv, nil
}
