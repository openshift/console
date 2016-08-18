package manager

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/Sirupsen/logrus"
	"github.com/authclub/billforward/client"
	"github.com/authclub/billforward/client/accounts"
	"github.com/authclub/billforward/client/addresses"
	"github.com/authclub/billforward/client/invoices"
	"github.com/authclub/billforward/client/payment_methods"
	"github.com/authclub/billforward/client/profiles"
	"github.com/authclub/billforward/client/subscriptions"
	"github.com/authclub/billforward/client/tokenization"
	"github.com/authclub/billforward/models"
	"github.com/coreos-inc/soy/common/billforward"
	"github.com/coreos/go-oidc/jose"
	"github.com/go-openapi/swag"
	"github.com/jonboulle/clockwork"

	"github.com/coreos-inc/soy/common/license"
	"github.com/coreos-inc/soy/common/pubsub"
	"github.com/coreos-inc/soy/common/serrors"
	"github.com/coreos-inc/soy/db"
	"github.com/coreos-inc/soy/event"
	pb "github.com/coreos-inc/soy/proto"
	eventpb "github.com/coreos-inc/soy/proto/eventpb"
	"github.com/coreos-inc/soy/repo"
)

// Account represents a BillForward / internal account service and provides
// access to accounts.
type Account interface {
	Get(db.Queryer, string) (*pb.Account, error)
	GetAllForUser(db.Queryer, string) ([]*pb.Account, error)
	RoleForUser(db.Queryer, string, string) (string, bool)
	Create(db.Queryer, *pb.Account, string) (*pb.Account, error)
	Update(db.Queryer, *pb.Account) (*pb.Account, error)
	Retire(db.Queryer, string, bool) error
	GetStatus(string) (*pb.GetAccountStatusResp, error)
	UpsertMetadata(*pb.Account) error
	UpdateProfile(*pb.Profile) (*pb.Profile, error)
	CreateAddress(*pb.Address) (*pb.Address, error)
	UpdateAddress(*pb.Address) (*pb.Address, error)
	RevokeUserAccountAccess(sdb db.Queryer, dexID, email, bfAccountID string) error
	ChangeUserRole(db.Queryer, string, string, pb.Role) error
	SetQuayCredentials(sdb db.Queryer, bfAccountID, quayID, quayToken string) error
	GetQuayCredentials(sdb db.Queryer, bfAccountID string) (string, string, error)
	Terminate(sdb db.Queryer, bfAccountID string) error
	CreateLicense(sdb db.Queryer, bfAccountID string) error
	AdvanceAccountSubscriptions(string, int32) error

	// ConvertExternallyCreatedAccounts converts all externally created accounts
	// with a given email into user accounts and returns the account IDs
	ConvertExternallyCreatedAccounts(sdb db.Queryer, dexID, email string) ([]string, error)

	CreateCreditCard(string, string) (*pb.CreditCard, error)
	GetCreditCard(string) (*pb.CreditCard, error)

	// GetAssets returns all account assets in all the various formats
	// the asset may be needed.
	GetAssets(db.Queryer, string) (map[string]*pb.Asset, error)

	// HandleAccountCreated handles saving an account when an account created
	// event comes in from a billforward webhook.
	HandleAccountCreated(db.Queryer, *eventpb.Notification) error

	HandlePaymentMethodCreated(db.Queryer, *eventpb.Notification) error

	// HandleSubscriptionProvisioned handles activating a subscription with
	// State="Provisioned". If the subscription has no valid payment methods
	// available than false is returned. If any errors are encountered, false
	// and the error are returned. If the subscription is successfully activated
	// true is returned.
	HandleSubscriptionProvisioned(*eventpb.Notification) (bool, error)

	// HandleSubscriptionAwaitingPayment handles when a subscription is
	// transitioned from Provisioned to AwaitingPayment, and checks
	// if the subscription is a Purchase Order, publishing jobs/events as if
	// if was successfully paid
	HandleSubscriptionAwaitingPayment(*eventpb.Notification) error

	// HandleSubscriptionPaid handles when a subscription is successfully paid
	// for. This triggers any jobs that may need to run when subscriptions
	// change.
	HandleSubscriptionPaid(*eventpb.Notification) error

	// HandleServiceEndAmendmentSucceeded handles when a subscription ends.
	// This triggers any jobs that may need to run when a subscription ends.
	HandleServiceEndSucceeded(*eventpb.Notification) error

	// SaveNotification stores notifications that are succesfully handled in the
	// database
	SaveNotification(db.Queryer, *eventpb.Notification) error
}

type account struct {
	bfClient          *client.BillForward
	licenseSigner     jose.Signer
	publisher         pubsub.Publisher
	clock             clockwork.Clock
	user              User
	subscription      Subscription
	aggregatingPlanID string
	logger            *logrus.Entry
}

const (
	// StateUnpaid is the state of an unpaid invoice.
	StateUnpaid = "unpaid"

	// StateFailed is the state of a failed invoice.
	StateFailed = "failed"
)

func (a account) Get(sdb db.Queryer, accountID string) (*pb.Account, error) {
	params := &accounts.GetAccountByIDParams{
		AccountID: accountID,
	}
	bfa, err := a.bfClient.Accounts.GetAccountByID(params)
	if err != nil {
		if getFail, ok := err.(*accounts.GetAccountByIDDefault); ok {
			err = billforward.FormatError(getFail.Payload)
		}
		return nil, serrors.Errorf(serrors.Internal, err, "Error retrieving account.")
	}

	if bfa.Payload != nil && len(bfa.Payload.Results) == 0 {
		err = fmt.Errorf("Get Account: No account matches the given account ID: %s", accountID)
		return nil, serrors.Errorf(serrors.NotFound, err, "Error retrieving account.")
	}

	result := convertBFAccount(bfa.Payload.Results[0])
	return result, nil
}

func (a account) GetAllForUser(sdb db.Queryer, dexID string) ([]*pb.Account, error) {
	u, err := repo.GetUserByDexID(sdb, dexID)
	if err != nil {
		if serrors.TypeOf(err) == serrors.NotFound {
			err = fmt.Errorf("No user with Dex ID %s", dexID)
			return nil, serrors.Errorf(serrors.NotFound, err, "Error finding user.")
		}
		err = fmt.Errorf("Error getting all accounts for user %s", dexID)
		return nil, serrors.Errorf(serrors.Internal, err, "Error finding user.")
	}

	var params accounts.GetAllAccountsParams
	var accts []*pb.Account
	if len(u.Accounts) == 0 {
		return accts, nil
	}
	for _, acct := range u.Accounts {
		params.ID = append(params.ID, acct.BFAccountID)
	}
	resp, err := a.bfClient.Accounts.GetAllAccounts(&params)
	if err != nil {
		if getFail, ok := err.(*accounts.GetAllAccountsDefault); ok {
			err = billforward.FormatError(getFail.Payload)
		}
		return nil, serrors.Errorf(serrors.Internal, err, "Unable to list accounts.")
	}

	for _, acct := range resp.Payload.Results {
		accts = append(accts, convertBFAccount(acct))
	}
	return accts, nil
}

func (a account) RoleForUser(sdb db.Queryer, dexID, bfAccountID string) (string, bool) {
	u, err := repo.GetUserByDexID(sdb, dexID)
	if err != nil {
		a.logger.WithError(err).Infof("could not find user with ID: %v", dexID)
		return "", false
	}
	for _, acct := range u.Accounts {
		if acct.BFAccountID == bfAccountID {
			return acct.Role, true
		}
	}
	return "", false
}

func (a account) Create(sdb db.Queryer, acct *pb.Account, dexID string) (*pb.Account, error) {
	params := &accounts.CreateAccountParams{
		Request: &models.CreateAccountRequest{
			AggregatingProductRatePlanID: a.aggregatingPlanID,
			Profile:  convertProfileToReq(acct.GetProfile()),
			Metadata: extractAccountMetadata(acct),
		},
	}
	bfaResp, err := a.bfClient.Accounts.CreateAccount(params)
	if err != nil {
		if createErr, ok := err.(*accounts.CreateAccountDefault); ok {
			err = billforward.FormatError(createErr.Payload)
		}
		return nil, serrors.Errorf(serrors.Internal, err, "Error creating account.")
	}
	if len(bfaResp.Payload.Results) == 0 {
		err = errors.New("Create Account: no account returned from BF API.")
		return nil, serrors.Errorf(serrors.Internal, err, "Error creating account.")
	}
	newAcct := convertBFAccount(bfaResp.Payload.Results[0])

	if err := a.CreateBFAccount(sdb, newAcct.ID, true); err != nil {
		return nil, serrors.Errorf(serrors.Internal, err, "Error creating account.")
	}

	err = CreateUserAccount(sdb, newAcct.ID, dexID, pb.Role_ADMIN, true)
	if err != nil {
		return nil, err
	}

	return newAcct, nil
}

func (a account) Update(sdb db.Queryer, acct *pb.Account) (*pb.Account, error) {
	// Always ensure when updating an account that the current quayID is
	// set in the metadata
	quayID, _, err := a.GetQuayCredentials(sdb, acct.ID)
	if err != nil {
		return nil, err
	}
	acct.QuayID = quayID
	_, err = a.UpdateProfile(acct.GetProfile())
	if err != nil {
		return nil, err
	}
	err = a.UpsertMetadata(acct)
	if err != nil {
		return nil, err
	}
	return a.Get(sdb, acct.ID)
}

func (a account) UpsertMetadata(acct *pb.Account) error {
	params := &accounts.UpsertMetadataForAccountParams{
		AccountID: acct.ID,
		Metadata:  extractAccountMetadata(acct),
	}
	_, err := a.bfClient.Accounts.UpsertMetadataForAccount(params)
	if err != nil {
		return serrors.Errorf(serrors.Internal, err, "Error updating account.")
	}
	return nil
}

func (a account) ConvertExternallyCreatedAccounts(sdb db.Queryer, dexID, email string) ([]string, error) {
	accts, err := repo.GetExternallyCreatedAccounts(sdb, email)
	if err != nil {
		if serrors.TypeOf(err) == serrors.NotFound {
			a.logger.Infof("ConvertExternallyCreatedAccounts: No external accounts for email: %s", email)
			return nil, nil
		}
		return nil, serrors.New(serrors.Internal, err)
	}

	var acctIDs []string
	for _, acct := range accts {
		err := CreateUserAccount(sdb, acct.BFAccountID, dexID, pb.Role_ADMIN, true)
		if err != nil {
			return nil, serrors.New(serrors.Internal, err)
		}
		acctIDs = append(acctIDs, acct.BFAccountID)
	}
	a.logger.Infof("Converted external account IDs: %q", acctIDs)
	return acctIDs, nil
}

func (a account) CreateBFAccount(sdb db.Queryer, bfAccountID string, ignoreExists bool) error {
	var created bool
	if ignoreExists {
		var err error
		created, err = repo.UpsertBFAccount(sdb, bfAccountID)
		a.logger.Infof("UpsertBFAccount: BFAccountID: %s, created: %t", bfAccountID, created)
		if err != nil {
			return serrors.Errorf(serrors.Internal, err, "Unable to create account.")
		}
	} else {
		err := repo.CreateBFAccount(sdb, bfAccountID)
		if err != nil {
			if serrors.TypeOf(err) == serrors.AlreadyExists {
				err = fmt.Errorf("Could not create account, account %s already exists", bfAccountID)
				return serrors.Errorf(serrors.AlreadyExists, err, "Account already exists")
			}
			return err
		}
		created = true
	}

	if created {
		msgB, err := json.Marshal(event.AccountEvent{
			BFAccountID: bfAccountID,
		})
		if err != nil {
			return err
		}
		a.logger.Infof("Publishing BFAccountCreated: bfAccountID: %s", bfAccountID)
		_, err = a.publisher.Publish(BFAccountCreatedTopic, string(msgB))
		if err != nil {
			return serrors.Errorf(serrors.Internal, err, "Unable to create account")
		}
		return nil
	}
	return nil
}

// Retire retires a Bill Forward account.
func (a account) Retire(sdb db.Queryer, acctID string, deleteGatewayData bool) error {
	params := &accounts.DeleteAccountParams{AccountID: acctID, DeleteGatewayData: deleteGatewayData}
	_, err := a.bfClient.Accounts.DeleteAccount(params)
	if err != nil {
		err = fmt.Errorf("Delete Account: Error retiring BillForward account, account ID: %s", acctID)
		return serrors.Errorf(serrors.Internal, err, "Error deleting account.")
	}
	return repo.RetireBFAccount(sdb, acctID)
}

// Terminate will retire a Bill Forward account and remove all
// associated memberships.
func (a account) Terminate(sdb db.Queryer, acctID string) error {
	// TODO(derekparker) Try to determine if this call failed due to account
	// already having been retired, and if so continue on with the rest of the
	// termination process.
	if err := a.Retire(sdb, acctID, true); err != nil {
		return err
	}
	if err := repo.RevokeAllUserAccountAccess(sdb, acctID); err != nil {
		return serrors.Errorf(serrors.Internal, err, "Error revoking user access to account.")
	}
	return nil
}

// GetStatus returns the status of a given Bill Forward account, including the balance,
// status (whether in good standing or not) and the next invoice date.
// An account is in "good" status if there are no outstanding invoices which are in dunning,
// and all invoice statuses are paid or have been voided. An account is "awaiting payment" if there
// are unpaid invoices, and finally an account is delinquent if there are invoices that have failed
// execution attempts.
func (a account) GetStatus(acctID string) (*pb.GetAccountStatusResp, error) {
	numRecords := int32(35)
	invoicesResp, err := a.bfClient.Invoices.GetInvoicesByAccountID(&invoices.GetInvoicesByAccountIDParams{
		AccountID: acctID,
		Records:   &numRecords,
	})
	if err != nil {
		return nil, serrors.Errorf(serrors.Internal, err, "Unable to get account status.")
	}
	resp := &pb.GetAccountStatusResp{}
	invoices := invoicesResp.Payload.Results
	if len(invoices) == 0 {
		resp.Status = pb.GetAccountStatusResp_GOOD
	} else {
		// Next Invoice date is period end + 1 day
		nd := convertDateTimeToTime(&invoices[0].PeriodEnd).AddDate(0, 0, 1)
		resp.Balance = accountBalance(invoices)
		resp.NextInvoiceDate = convertTimeToCommonTimestamp(nd)
		resp.Status = accountStatus(invoices)
	}
	resp.StatusDescription = statusDescription(resp.Status)
	purchasedProductIDs, err := a.purchasedProductIDs(acctID)
	if err != nil {
		return nil, serrors.Errorf(serrors.Internal, err, "Unable to get account status.")
	}
	resp.PurchasedProductIDs = purchasedProductIDs
	return resp, nil
}

func (a account) purchasedProductIDs(acctID string) ([]string, error) {
	ppids := make(map[string]struct{})
	params := &subscriptions.GetSubscriptionByAccountIDParams{
		AccountID:       acctID,
		IncludeRetired:  swag.Bool(true),
		ExcludeChildren: swag.Bool(false),
	}
	subsResp, err := a.bfClient.Subscriptions.GetSubscriptionByAccountID(params)
	if err != nil {
		return nil, err
	}
	var prodIDs []string
	for _, sub := range subsResp.Payload.Results {
		// Ensure we don't return duplicate product IDs.
		if _, ok := ppids[*sub.ProductID]; !ok {
			ppids[*sub.ProductID] = struct{}{}
			prodIDs = append(prodIDs, *sub.ProductID)
		}
	}
	return prodIDs, nil
}

func statusDescription(status pb.GetAccountStatusResp_AccountStatus) string {
	switch status {
	case pb.GetAccountStatusResp_GOOD:
		return "Good Standing"
	case pb.GetAccountStatusResp_AWAITING_PAYMENT:
		return "Awaiting Payment"
	case pb.GetAccountStatusResp_DELINQUENT:
		return "Past Due"
	}

	return ""
}

func accountBalance(invoices []*models.Invoice) float64 {
	var balance float64
	for _, invoice := range invoices {
		state := strings.ToLower(*invoice.State)
		if state == StateUnpaid {
			pbInv, err := convertInvoiceToProto(invoice)
			if err != nil {
				return 0
			}
			balance += remainingBalanceForInvoice(pbInv)
		}
	}
	return balance
}

func accountStatus(invoices []*models.Invoice) pb.GetAccountStatusResp_AccountStatus {
	for _, inv := range invoices {
		state := strings.ToLower(*inv.State)
		switch state {
		case StateFailed:
			return pb.GetAccountStatusResp_DELINQUENT
		case StateUnpaid:
			// Invoice.Due date defaults to period start date,
			// or will be [payment start date + payment term days] if non-zero payment terms exist on the subscription.
			due := convertDateTimeToTime(&inv.Due)
			periodStart := convertDateTimeToTime(&inv.PeriodStart)

			if due.Equal(*periodStart) {
				// This means its a credit card order with no payment terms,
				// so any number of execution attemps means it's delinquent.
				if inv.TotalExecutionAttempts > 0 {
					return pb.GetAccountStatusResp_DELINQUENT
				}
			} else {
				// This means its a PO order with payment terms (usually 30 days),
				// so we ignore execution attempt acount and base the decision purely on if due date.
				if due.Before(time.Now()) {
					return pb.GetAccountStatusResp_DELINQUENT
				}
			}

			return pb.GetAccountStatusResp_AWAITING_PAYMENT
		}
	}
	return pb.GetAccountStatusResp_GOOD
}

// Set the QuayID on an account
func (a account) SetQuayCredentials(sdb db.Queryer, bfAccountID, quayID, quayToken string) error {
	err := repo.SetQuayCredentials(sdb, bfAccountID, quayID, quayToken)
	if err != nil {
		switch serrors.TypeOf(err) {
		case serrors.AlreadyExists:
			err = fmt.Errorf("Set Quay Credentials: Quay ID already exists, QuayID: %s, account ID: %s", quayID, bfAccountID)
			return serrors.Errorf(serrors.AlreadyExists, err, "Quay credentials already set.")
		default:
			err = fmt.Errorf("Set Quay Credentials: Error setting Quay credentials, QuayID: %s, account ID: %s, err: %v", quayID, bfAccountID, err)
			return serrors.Errorf(serrors.Internal, err, "Error setting Quay credentials.")
		}
	}
	return nil
}

func (a account) GetQuayCredentials(sdb db.Queryer, bfAccountID string) (string, string, error) {
	return repo.GetQuayCredentials(sdb, bfAccountID)
}

func (a account) AdvanceAccountSubscriptions(bfAccountID string, periods int32) error {
	params := &subscriptions.GetSubscriptionByAccountIDParams{
		AccountID:       bfAccountID,
		IncludeRetired:  swag.Bool(false),
		ExcludeChildren: swag.Bool(false),
	}
	subsResp, err := a.bfClient.Subscriptions.GetSubscriptionByAccountID(params)
	if err != nil {
		return serrors.Errorf(serrors.Internal, err, "Unable to retreive subscriptions.")
	}
	var parent *models.Subscription
	for _, r := range subsResp.Payload.Results {
		agg := swag.BoolValue(r.AggregateAllSubscriptionsOnAccount)
		if agg {
			// We must advance all children first, then advance parent.
			parent = r
			continue
		}
		err = a.advanceSubscription(*r.ID, periods)
		if err != nil {
			return err
		}
	}
	// Finally, advance parent subscription.
	if parent != nil {
		return a.advanceSubscription(*parent.ID, periods)
	}
	return nil
}

func (a account) advanceSubscription(subID string, periods int32) error {
	params := subscriptions.AdvanceSubscriptionParams{
		SubscriptionID: subID,
		Request: &models.TimeRequest{
			Periods: &periods,
		},
	}
	_, err := a.bfClient.Subscriptions.AdvanceSubscription(&params)
	if err != nil {
		// TODO(derekparker) We should return errors here, however due to (swagger|bf schema) bugs
		// we get false errors on unmarshaling. Since this is a non-production endpoint, simply
		// log errors and return nil.
		a.logger.WithError(err).WithField("subscription", subID).Warn("Error while advancing subscription")
	}
	return nil
}

func (a account) CreateLicense(sdb db.Queryer, accountID string) error {
	_, subs, err := a.subscription.ListByAccountID(accountID, false)
	if err != nil {
		return err
	}

	now := a.clock.Now()
	oneYearFromNow := now.AddDate(1, 0, 0)
	// Default to having a license which expires at least one year from
	// when it was created
	latestServiceEnd := oneYearFromNow

	subscriptions := make(map[string]license.SubscriptionDef)
	for _, sub := range subs {
		// Only active subscriptions go into the license
		if !IsActiveSubscription(sub) {
			continue
		}
		entitlements := make(map[string]int64)
		for _, pcv := range sub.PricingComponentValues {
			entitlements[pcv.PricingComponentName] = pcv.Value
		}
		serviceEnd := convertTimestampToDateTime(sub.CurrentPeriodEnd)
		subscriptions[sub.ID] = license.SubscriptionDef{
			PlanName:       sub.RatePlan.Name,
			PlanID:         sub.RatePlan.ID,
			ProductName:    sub.Product.Name,
			ProductID:      sub.Product.ID,
			ServiceStart:   convertTimestampToDateTime(sub.CurrentPeriodStart),
			ServiceEnd:     serviceEnd,
			Duration:       sub.Product.Duration,
			DurationPeriod: sub.Product.DurationPeriod,
			Entitlements:   entitlements,
		}

		// Keep track of the latest service end, so we can set the licenses
		// global expiration
		if serviceEnd.After(latestServiceEnd) {
			latestServiceEnd = serviceEnd
		}
	}
	expirationDate := latestServiceEnd
	creationDate := now

	a.logger.WithField("accountID", accountID).Debug("creating new license")

	return repo.CreateNewLicense(sdb, accountID, creationDate, expirationDate, subscriptions)
}

func (a account) GetAssets(sdb db.Queryer, accountID string) (map[string]*pb.Asset, error) {
	licenseAssets, err := GetLicenseAssets(sdb, a.licenseSigner, accountID)
	if err != nil {
		return nil, err
	}

	quayAssets, err := GetQuayAssets(sdb, accountID)
	if err != nil {
		return nil, err
	}

	return map[string]*pb.Asset{
		"license":         licenseAssets,
		"quayCredentials": quayAssets,
	}, nil
}

func GetLicenseAssets(sdb db.Queryer, signer jose.Signer, accountID string) (*pb.Asset, error) {
	l, err := repo.GetNewestLicense(sdb, accountID)
	if err != nil {
		return nil, err
	}

	rawLicenseJSON, err := json.Marshal(l)
	if err != nil {
		return nil, err
	}

	license, err := license.NewSignedLicense(signer, l.SchemaVersion, l.CreationDate, l.ExpirationDate, rawLicenseJSON)
	if err != nil {
		return nil, err
	}

	var kubernetesSecret bytes.Buffer
	err = secretTemplate.Execute(&kubernetesSecret, secretTemplateParams{
		MetadataName: "tectonic-license",
		SecretName:   "license",
		SecretData:   base64.StdEncoding.EncodeToString([]byte(license)),
		Type:         "Opaque",
	})
	if err != nil {
		return nil, err
	}

	formats := map[string]*pb.OutputFormat{
		"raw": &pb.OutputFormat{
			Label:    "Raw Format",
			Value:    license,
			Type:     "text",
			Filename: "tectonic-license.txt",
		},
		"kubernetes": &pb.OutputFormat{
			Label:    "Kubernetes Secret",
			Value:    kubernetesSecret.String(),
			Type:     "yaml",
			Filename: "tectonic-license.yml",
		},
	}

	return &pb.Asset{
		Label:   "Universal Software License",
		Formats: formats,
	}, nil
}

// Mostly copied from https://github.com/docker/docker/blob/c66d9f56279237bc0ff9d8fb84896de4193247f8/cliconfig/config.go#L251
// encodeDockerAuth creates a base64 encoded string to containing authorization information
func encodeDockerAuth(username, password string) string {
	authStr := username + ":" + password
	msg := []byte(authStr)
	encoded := make([]byte, base64.StdEncoding.EncodedLen(len(msg)))
	base64.StdEncoding.Encode(encoded, msg)
	return string(encoded)
}

func GetQuayAssets(sdb db.Queryer, accountID string) (*pb.Asset, error) {
	quayID, quayToken, err := repo.GetQuayCredentials(sdb, accountID)
	if err != nil {
		return nil, err
	}

	auth := encodeDockerAuth(quayID, quayToken)

	dockercfg := map[string]interface{}{
		"quay.io": struct {
			Auth  string `json:"auth"`
			Email string `json:"email"`
		}{
			Auth: auth,
		},
	}

	dockercfgJSON, err := json.Marshal(&dockercfg)
	if err != nil {
		return nil, err
	}
	dockercfgPrettyJSON, err := json.MarshalIndent(&dockercfg, "", "  ")
	if err != nil {
		return nil, err
	}

	var kubernetesSecret bytes.Buffer
	err = secretTemplate.Execute(&kubernetesSecret, secretTemplateParams{
		MetadataName: "coreos-pull-secret",
		SecretName:   ".dockercfg",
		SecretData:   base64.StdEncoding.EncodeToString(dockercfgJSON),
		Type:         "kubernetes.io/dockercfg",
	})
	if err != nil {
		return nil, err
	}

	formats := map[string]*pb.OutputFormat{
		"raw": &pb.OutputFormat{
			Label:    "Docker login",
			Value:    fmt.Sprintf("Username: %s\nPassword: %s\n", quayID, quayToken),
			Type:     "text",
			Filename: "coreos-pull-secret.txt",
		},
		"dockercfg": &pb.OutputFormat{
			Label:    "dockercfg",
			Value:    string(dockercfgPrettyJSON),
			Type:     "json",
			Filename: ".dockercfg",
		},
		"kubernetes": &pb.OutputFormat{
			Label:    "Kubernetes Secret",
			Value:    kubernetesSecret.String(),
			Type:     "yaml",
			Filename: "coreos-pull-secret.yml",
		},
	}

	asset := &pb.Asset{
		Label:   "Pull Secret",
		Formats: formats,
	}
	return asset, nil
}

// RevokeUserAccountAccess removes access to an account. If DexID is provided then an existing
// member will be removed. If email is provided, an invited user will be removed.
func (a account) RevokeUserAccountAccess(sdb db.Queryer, dexID, email, bfAccountID string) error {
	if dexID != "" && email != "" {
		err := fmt.Errorf("Both DexID (%s) and Email (%s) provided, input cannot contain both.", dexID, email)
		return serrors.New(serrors.InternalValidation, err)
	}
	switch {
	case dexID != "":
		return repo.RevokeUserAccountAccess(sdb, dexID, bfAccountID)
	case email != "":
		return repo.RevokeInvitedUserAccountAccess(sdb, email, bfAccountID)
	}
	return nil
}

// ChangeUserRole changes the role of a user for the given account.
// `Role` must be a valid account role, which can be found in the protobuf
// definition for the `Role` type.
func (a account) ChangeUserRole(sdb db.Queryer, dexID, bfAccountID string, role pb.Role) error {
	rv := role.String()
	return repo.ChangeUserRole(sdb, dexID, bfAccountID, rv)
}

// UpdateProfile updates the profile associated with this account.
func (a account) UpdateProfile(prof *pb.Profile) (*pb.Profile, error) {
	// NOTE(sym3tri): this request is basically the same as the normal object, but varies slightly.
	// This does a map conversion to avoid code duplication but explicitness may be desirable.
	var profReq models.UpdateProfileRequest
	Map(convertProfile(prof), &profReq)
	for _, addr := range prof.Addresses {
		profReq.Addresses = append(profReq.Addresses, convertAddress(addr))
	}
	profOK, err := a.bfClient.Profiles.UpdateProfile(&profiles.UpdateProfileParams{
		Request: &profReq,
	})
	if err != nil {
		if updateFailed, ok := err.(*profiles.UpdateProfileDefault); ok {
			err = billforward.FormatError(updateFailed.Payload)
		}
		return nil, serrors.Errorf(serrors.Internal, err, "Error updating account details.")
	}
	if len(profOK.Payload.Results) == 0 {
		err = fmt.Errorf("Update Profile: no profiles returned from BF API, profile ID: %s", prof.ID)
		return nil, serrors.Errorf(serrors.Internal, err, "Error updating account details.")
	}
	updatedProf := convertBFProfile(profOK.Payload.Results[0])
	return updatedProf, nil
}

func (a account) CreateAddress(addr *pb.Address) (*pb.Address, error) {
	// NOTE(sym3tri): this request is basically the same as the normal object, but varies slightly.
	// This does a map conversion to avoid code duplication but explicitness may be desirable.
	var addrReq models.CreateAddressRequest
	err := Map(convertAddress(addr), &addrReq)
	if err != nil {
		return nil, serrors.Errorf(serrors.Internal, err, "Error creating address.")
	}

	addrOK, err := a.bfClient.Addresses.CreateAddress(&addresses.CreateAddressParams{
		Request: &addrReq,
	})
	if err != nil {
		if createFailed, ok := err.(*addresses.CreateAddressDefault); ok {
			err = billforward.FormatError(createFailed.Payload)
		}
		return nil, serrors.Errorf(serrors.Internal, err, "Error creating address.")
	}
	if len(addrOK.Payload.Results) == 0 {
		err = errors.New("Create Address: No addresses returned from BF API")
		return nil, serrors.Errorf(serrors.Internal, err, "Error creating address.")
	}
	pbAddress := convertBFAddress(addrOK.Payload.Results[0])
	return pbAddress, nil
}

func (a account) UpdateAddress(addr *pb.Address) (*pb.Address, error) {
	// NOTE(sym3tri): this request is basically the same as the normal object, but varies slightly.
	// This does a map conversion to avoid code duplication but explicitness may be desirable.
	var addrReq models.UpdateAddressRequest
	err := Map(convertAddress(addr), &addrReq)
	if err != nil {
		return nil, serrors.Errorf(serrors.Internal, err, "Error updating address.")
	}

	addrOK, err := a.bfClient.Addresses.UpdateAddress(&addresses.UpdateAddressParams{
		Request: &addrReq,
	})
	if err != nil {
		if updateFailed, ok := err.(*addresses.UpdateAddressDefault); ok {
			err = billforward.FormatError(updateFailed.Payload)
		}
		return nil, serrors.Errorf(serrors.Internal, err, "Error updating address.")
	}
	if len(addrOK.Payload.Results) == 0 {
		err = fmt.Errorf("Update Address: No addresses returned from BF API, address ID:  %s", addr.ID)
		return nil, serrors.Errorf(serrors.Internal, err, "Error updating address.")
	}
	pbAddress := convertBFAddress(addrOK.Payload.Results[0])
	return pbAddress, nil
}

func (a account) CreateCreditCard(accountID, token string) (*pb.CreditCard, error) {
	captureReq := &models.StripeAuthCaptureRequest{
		StripeToken: swag.String(token),
	}
	captureReq.SetAccountID(accountID)
	captureReq.SetGateway("Stripe")
	captureReq.SetDefaultPaymentMethod(swag.Bool(true))

	cardOK, err := a.bfClient.Tokenization.AuthCapture(&tokenization.AuthCaptureParams{AuthCaptureRequest: captureReq})
	if err != nil {
		if captureFailed, ok := err.(*tokenization.AuthCaptureDefault); ok {
			err = billforward.FormatError(captureFailed.Payload)
		}
		return nil, serrors.Errorf(serrors.Internal, err, "Error creating credit card.")
	}
	if len(cardOK.Payload.Results) == 0 {
		err = errors.New("Create Card: No payment method returned from BF API")
		return nil, serrors.Errorf(serrors.Internal, err, "Error creating credit card.")
	}
	pm := cardOK.Payload.Results[0]
	return convertBFCreditCard(pm), nil
}

func (a account) GetCreditCard(accountID string) (*pb.CreditCard, error) {
	cardOK, err := a.bfClient.PaymentMethods.GetPaymentMethodByAccountID(&payment_methods.GetPaymentMethodByAccountIDParams{
		AccountID:      accountID,
		DefaultOnly:    swag.Bool(true),
		IncludeRetired: swag.Bool(false),
	})
	if err != nil {
		if getFailed, ok := err.(*payment_methods.GetPaymentMethodByAccountIDDefault); ok {
			err = billforward.FormatError(getFailed.Payload)
		}
		return nil, serrors.Errorf(serrors.Internal, err, "Error getting credit card info.")
	}
	if len(cardOK.Payload.Results) == 0 {
		err = errors.New("Get Card: No payment method returned from BF API")
		return nil, serrors.Errorf(serrors.NotFound, err, "No credit card for this account.")
	}
	pm := cardOK.Payload.Results[0]
	return convertBFCreditCard(pm), nil
}
