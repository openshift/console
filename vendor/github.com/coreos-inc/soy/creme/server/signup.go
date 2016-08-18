package server

import (
	"encoding/json"
	"errors"
	"net/http"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	httprouter "gopkg.in/julienschmidt/httprouter.v1"

	pb "github.com/coreos-inc/soy/proto"
)

const (
	paymentMethodCard = "credit-card"
	paymentMethodPO   = "purchase-order"
	paymentMethodNone = "none"
)

type SignupReq struct {
	Account         *pb.Account                    `json:"account"`
	BillingAddress  *pb.Address                    `json:"billingAddress"`
	MailingAddress  *pb.Address                    `json:"mailingAddress"`
	Quantities      []*pb.PricingComponentQuantity `json:"quantities"`
	PaymentMethod   string                         `json:"paymentMethod"`
	CreditCardToken string                         `json:"creditCardToken"`
	ProductID       string                         `json:"productID"`
	PlanID          string                         `json:"planID"`
	ChangelogEmail  bool                           `json:"changelogEmail"`
	NewsletterEmail bool                           `json:"newsletterEmail"`
}

type SignupResp struct {
	Account      *pb.Account      `json:"account"`
	Subscription *pb.Subscription `json:"subscription"`
	CreditCard   *pb.CreditCard   `json:"creditCard"`
	Error        *PublicError     `json:"error,omitempty"`
}

func validateSignupReq(r SignupReq, existingCard *pb.CreditCard) error {
	if r.PaymentMethod != paymentMethodCard && r.PaymentMethod != paymentMethodPO && r.PaymentMethod != paymentMethodNone {
		return errors.New("Invalid payment type")
	}

	if r.PaymentMethod == paymentMethodCard && r.CreditCardToken == "" {
		if err := validateExistingCard(existingCard); err != nil {
			return errors.New("Missing valid credit card info for credit card purchase")
		}
	}

	if r.Account == nil {
		return errors.New("Missing required contact information")
	}

	if r.ProductID == "" || r.PlanID == "" {
		return errors.New("Missing required product selection")
	}

	// New accounts signing up for CC purchases must supply a CC.
	if r.Account.ID == "" && r.PaymentMethod == paymentMethodCard && r.CreditCardToken == "" {
		return errors.New("Missing required credit card information")
	}

	if err := validateAddr(r.BillingAddress); err != nil {
		return err
	}

	if err := validateAddr(r.MailingAddress); err != nil {
		return err
	}

	return nil
}

func validateExistingCard(c *pb.CreditCard) error {
	if c == nil {
		return errors.New("No card")
	}
	if c.State != pb.CreditCard_Active {
		return errors.New("Card is not active")
	}

	return nil
}

func validateAddr(addr *pb.Address) error {
	if addr.AddressLine1 == "" {
		return errors.New("Must provide non-empty address")
	}
	if addr.City == "" {
		return errors.New("Must provide non-empty city")
	}
	if addr.Province == "" {
		return errors.New("Must provide non-empty province")
	}
	if addr.Postcode == "" {
		return errors.New("Must provide non-empty post code")
	}
	if addr.Country == "" {
		return errors.New("Must provide non-empty country")
	}
	return nil
}

func (s *Server) signup(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	resp := SignupResp{}
	ls := s.loginState(r)

	writeSignupResp := func(w http.ResponseWriter, sresp SignupResp) {
		code := http.StatusOK
		if resp.Error != nil && sresp.Error.HTTPStatus != 0 {
			code = sresp.Error.HTTPStatus
		}
		writeResponseWithBody(w, code, sresp)
	}

	var sReq SignupReq
	dec := json.NewDecoder(r.Body)
	err := dec.Decode(&sReq)
	if err != nil {
		resp.Error = &PublicError{
			HTTPStatus: http.StatusBadRequest,
			Inner:      err,
			Desc:       "Something went wrong with your signup. Please check your data and try again.",
		}
		writeSignupResp(w, resp)
		return
	}

	ctx := s.rpcCtxFromReq(r)
	acct := sReq.Account

	var existingCard *pb.CreditCard
	// Load existing credit card on file
	if acct.ID != "" && sReq.PaymentMethod == paymentMethodCard {
		getCardResp, err := s.svcClient.GetCreditCard(ctx, &pb.GetCreditCardReq{
			AccountID: acct.ID,
		})
		if err != nil && grpc.Code(err) != codes.NotFound {
			resp.Error = &PublicError{
				HTTPStatus: http.StatusBadRequest,
				Inner:      err,
				Desc:       err.Error(),
			}
			writeSignupResp(w, resp)
			return
		}
		existingCard = getCardResp.GetCard()
	}

	if err := validateSignupReq(sReq, existingCard); err != nil {
		resp.Error = &PublicError{
			HTTPStatus: http.StatusBadRequest,
			Inner:      err,
			Desc:       err.Error(),
		}
		writeSignupResp(w, resp)
		return
	}

	sReq.BillingAddress.PrimaryAddress = true
	sReq.MailingAddress.PrimaryAddress = false
	acct.Profile.Addresses = []*pb.Address{sReq.MailingAddress, sReq.BillingAddress}
	acct.NewsletterEmail = sReq.NewsletterEmail
	// Never accept user input for email address.
	// Always use the email address verified in the login token.
	acct.Profile.Email = ls.Email

	acctResp, err := s.svcClient.UpsertAccount(ctx, &pb.UpsertAccountReq{
		Account: acct,
	})
	if err != nil {
		resp.Error = &PublicError{
			HTTPStatus: http.StatusInternalServerError,
			Inner:      err,
			Desc:       "Error creating account. Please try again.",
		}
		writeSignupResp(w, resp)
		return
	}
	acct = acctResp.GetAccount()
	resp.Account = acct

	paymentType := pb.CreateSubscriptionReq_CreditCard
	switch sReq.PaymentMethod {
	case paymentMethodCard:
		if sReq.CreditCardToken == "" {
			resp.CreditCard = existingCard
		} else {
			cardResp, err := s.svcClient.CreateCreditCard(ctx, &pb.CreateCreditCardReq{
				AccountID: acct.ID,
				Token:     sReq.CreditCardToken,
			})
			if err != nil {
				resp.Error = &PublicError{
					HTTPStatus: http.StatusInternalServerError,
					Inner:      err,
					Desc:       "Error creating credit card.",
				}
				writeSignupResp(w, resp)
				return
			}
			resp.CreditCard = cardResp.GetCard()
		}
	case paymentMethodPO:
		paymentType = pb.CreateSubscriptionReq_PurchaseOrder
	case paymentMethodNone:
		paymentType = pb.CreateSubscriptionReq_None
	}

	subResp, err := s.svcClient.CreateSubscription(ctx, &pb.CreateSubscriptionReq{
		AccountID:         acct.ID,
		ProductID:         sReq.ProductID,
		ProductRatePlanID: sReq.PlanID,
		AgreedTOS:         true,
		State:             pb.SubscriptionState_Provisioned,
		PricingComponentQuantities: sReq.Quantities,
		PaymentType:                paymentType,
		ChangelogEmails:            sReq.ChangelogEmail,
	})
	if err != nil {
		resp.Error = &PublicError{
			HTTPStatus: http.StatusInternalServerError,
			Inner:      err,
			Desc:       "Error creting subscription.",
		}
		writeSignupResp(w, resp)
		return
	}
	resp.Subscription = subResp.GetSubscription()

	writeSignupResp(w, resp)
}
