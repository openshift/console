package server

import (
	"errors"
	"fmt"
	"io/ioutil"

	"golang.org/x/net/context"

	"github.com/Sirupsen/logrus"
	"github.com/coreos-inc/soy/common/serrors"
	"github.com/coreos-inc/soy/db"
	"github.com/coreos-inc/soy/manager"
	pb "github.com/coreos-inc/soy/proto"
)

var (
	permissionDeniedErr = serrors.RPC(serrors.New(serrors.PermissionDenied, nil))
)

type accountService struct {
	manager *manager.Manager
	db      db.DB
	logger  *logrus.Entry
}

// NewAccountService returns an initialized accountService struct, which handles
// account related RPC calls.
func NewAccountService(logger *logrus.Entry, m *manager.Manager, sdb db.DB) *accountService {
	return &accountService{
		manager: m,
		db:      sdb,
		logger:  logger,
	}
}

func (s *accountService) canAccessAccount(ctx context.Context, accountID string, at accessType) (string, bool) {
	if needsCheck, err := needsAuthCheck(ctx); !needsCheck {
		errStr := "none"
		if err != nil {
			errStr = err.Error()
		}
		s.logger.Debugf("request does not need auth check, errors occured: %s", errStr)
		return "", true
	}

	dexID, err := authMetaFromContext(ctx)
	if err != nil {
		s.logger.WithError(err).Info("error getting auth metadata from context")
		return "", false
	}

	if dexID == "" {
		s.logger.Info("request sent to auth protected endpoint without a Dex ID in metadata")
		return "", false
	}

	logger := s.logger.WithFields(logrus.Fields{
		"dexID":     dexID,
		"accountID": accountID,
	})

	role, ok := s.manager.Account.RoleForUser(s.db, dexID, accountID)
	if ok {
		// Read only users cannot modify.
		if at == Modify {
			pbRole := pb.Role(pb.Role_value[role])
			logger.Debugf("canAccessAccount: user role is: %v", pbRole)
			return dexID, (pbRole == pb.Role_ADMIN || pbRole == pb.Role_SUPER_USER)
		}
		return dexID, true
	}

	logger.Infof("User not authorized with access type %q", at)
	return dexID, false
}

// CreateUser creates a backend user, which can be associated with one or many BillForward accounts.
func (s *accountService) CreateUser(ctx context.Context, r *pb.CreateUserReq) (*pb.CreateUserResp, error) {
	dexID, err := authMetaFromContext(ctx)
	if err != nil {
		return nil, serrors.RPC(err)
	}
	if dexID != r.DexID {
		s.logger.Infof("Dex IDs did not match when making create user request: %q (meta) != %q (request)", dexID, r.DexID)
		return nil, permissionDeniedErr
	}

	logger := s.logger.WithField("dexID", dexID)

	resp := &pb.CreateUserResp{}
	if err := db.WithTransaction(s.db, func(tx db.Queryer) error {
		return s.manager.User.Create(tx, r.DexID, r.Email)
	}); err != nil {
		logErrorIfNeeded(logger, err, "RPC CreateUser failed")
		return nil, serrors.RPC(err)
	}
	resp.User, err = s.manager.User.Get(s.db, dexID)
	if err != nil {
		logErrorIfNeeded(logger, err, "RPC CreateUser failed")
		return nil, serrors.RPC(err)
	}
	return resp, nil
}

// AdvanceAccount will advance all subscriptions for the given account by the specified number of
// billing periods.
// NOTE: This endpoint is for testing only and is not meant to be called from any user-facing endpoint.
func (s *accountService) AdvanceAccount(ctx context.Context, r *pb.AdvanceAccountReq) (*pb.AdvanceAccountResp, error) {
	err := s.manager.Account.AdvanceAccountSubscriptions(r.AccountID, r.Periods)
	if err != nil {
		logErrorIfNeeded(s.logger.WithField("accountID", r.AccountID), err, "RPC AdvanceAccount failed")
		return nil, serrors.RPC(err)
	}
	return new(pb.AdvanceAccountResp), nil
}

func (s *accountService) GetUser(ctx context.Context, r *pb.GetUserReq) (*pb.GetUserResp, error) {
	dexID, err := authMetaFromContext(ctx)
	if err != nil {
		return nil, serrors.RPC(err)
	}
	if dexID != r.DexID {
		s.logger.Infof("Dex IDs did not match when making get user request: %q (meta) != %q (request)", dexID, r.DexID)
		return nil, permissionDeniedErr
	}

	usr, err := s.manager.User.Get(s.db, dexID)
	if err != nil {
		logErrorIfNeeded(s.logger.WithField("dexID", dexID), err, "RPC GetUser failed")
		return nil, serrors.RPC(err)
	}
	return &pb.GetUserResp{User: usr}, nil
}

func (s *accountService) ListAccountUsers(ctx context.Context, r *pb.ListAccountUsersReq) (*pb.ListAccountUsersResp, error) {
	dexID, hasAccess := s.canAccessAccount(ctx, r.AccountID, ReadOnly)
	if !hasAccess {
		return nil, permissionDeniedErr
	}

	users, err := s.manager.User.ListForAccount(s.db, r.AccountID)
	if err != nil {
		logErrorIfNeeded(s.logger.WithFields(logrus.Fields{
			"dexID":     dexID,
			"accountID": r.AccountID,
		}), err, "RPC ListAccountUsers failed")
		return nil, serrors.RPC(err)
	}
	return &pb.ListAccountUsersResp{Items: users}, nil
}

func (s *accountService) GetAccount(ctx context.Context, r *pb.GetAccountReq) (*pb.GetAccountResp, error) {
	dexID, hasAccess := s.canAccessAccount(ctx, r.AccountID, ReadOnly)
	if !hasAccess {
		return nil, permissionDeniedErr
	}
	var resp *pb.GetAccountResp
	if err := db.WithTransaction(s.db, func(tx db.Queryer) error {
		a, err := s.manager.Account.Get(tx, r.AccountID)
		if err != nil {
			return err
		}
		resp = &pb.GetAccountResp{Account: a}
		return nil
	}); err != nil {
		logErrorIfNeeded(s.logger.WithFields(logrus.Fields{
			"dexID":     dexID,
			"accountID": r.AccountID,
		}), err, "RPC GetAccount failed")
		return nil, serrors.RPC(err)
	}

	return resp, nil
}

func (s *accountService) GetAccountStatus(ctx context.Context, r *pb.GetAccountStatusReq) (*pb.GetAccountStatusResp, error) {
	dexID, hasAccess := s.canAccessAccount(ctx, r.AccountID, ReadOnly)
	if !hasAccess {
		return nil, permissionDeniedErr
	}
	status, err := s.manager.Account.GetStatus(r.AccountID)
	if err != nil {
		logErrorIfNeeded(s.logger.WithFields(logrus.Fields{
			"dexID":     dexID,
			"accountID": r.AccountID,
		}), err, "RPC GetAccountStatus failed")
		return nil, serrors.RPC(err)
	}
	return status, nil
}

func (s *accountService) InviteUser(ctx context.Context, r *pb.InviteUserReq) (*pb.InviteUserResp, error) {
	dexID, hasAccess := s.canAccessAccount(ctx, r.AccountID, Modify)
	if !hasAccess {
		return nil, permissionDeniedErr
	}
	role := pb.Role_name[int32(r.Role)]
	err := s.manager.User.Invite(s.db, r.Email, r.AccountID, dexID, role)
	if err != nil {
		logErrorIfNeeded(s.logger.WithFields(logrus.Fields{
			"dexID":     dexID,
			"accountID": r.AccountID,
			"role:":     r.Role.String(),
		}), err, "RPC InviteUser failed")
		return nil, serrors.RPC(err)
	}
	return new(pb.InviteUserResp), nil
}

func (s *accountService) AcceptUserInvitation(ctx context.Context, r *pb.AcceptUserInvitationReq) (*pb.AcceptUserInvitationResp, error) {
	dexID, err := authMetaFromContext(ctx)
	if err != nil {
		return nil, serrors.RPC(err)
	}
	if err = db.WithTransaction(s.db, func(tx db.Queryer) error {
		u, err := s.manager.User.Get(tx, dexID)
		if err != nil {
			return err
		}
		return s.manager.User.AcceptInvitation(tx, u.Email, r.AccountID, u.DexID)
	}); err != nil {
		logErrorIfNeeded(s.logger.WithFields(logrus.Fields{
			"dexID":     dexID,
			"accountID": r.AccountID,
		}), err, "RPC AcceptUserInvitation failed")
		return nil, serrors.RPC(err)
	}
	return new(pb.AcceptUserInvitationResp), nil
}

func (s *accountService) AcceptAllUserInvitations(ctx context.Context, r *pb.AcceptAllUserInvitationsReq) (*pb.AcceptAllUserInvitationsResp, error) {
	dexID, err := authMetaFromContext(ctx)
	if err != nil {
		return nil, serrors.RPC(err)
	}
	if r.DexID != dexID {
		return nil, permissionDeniedErr
	}

	if err = db.WithTransaction(s.db, func(tx db.Queryer) error {
		return s.manager.User.AcceptAllInvitation(tx, dexID)
	}); err != nil {
		logErrorIfNeeded(s.logger.WithField("dexID", dexID), err, "RPC AcceptAllInvitation failed")
		return nil, serrors.RPC(err)
	}
	return new(pb.AcceptAllUserInvitationsResp), nil
}

func (s *accountService) ListAccounts(ctx context.Context, r *pb.ListAccountsReq) (*pb.ListAccountsResp, error) {
	dexID, err := authMetaFromContext(ctx)
	if err != nil {
		return nil, serrors.RPC(err)
	}
	var resp pb.ListAccountsResp
	if err := db.WithTransaction(s.db, func(tx db.Queryer) error {
		accts, err := s.manager.Account.GetAllForUser(tx, dexID)
		if err != nil {
			return err
		}
		resp.Items = accts
		return nil
	}); err != nil {
		logErrorIfNeeded(s.logger.WithField("dexID", dexID), err, "RPC ListAccounts failed")
		return nil, serrors.RPC(err)
	}
	return &resp, nil
}

// CreateAccount creates a new BillForward account.
func (s *accountService) CreateAccount(ctx context.Context, r *pb.CreateAccountReq) (*pb.CreateAccountResp, error) {
	dexID, err := authMetaFromContext(ctx)
	if err != nil {
		return nil, serrors.RPC(err)
	}
	var acct *pb.Account
	if err = db.WithTransaction(s.db, func(tx db.Queryer) error {
		acct, err = s.manager.Account.Create(tx, r.Account, dexID)
		return err
	}); err != nil {
		logErrorIfNeeded(s.logger.WithField("dexID", dexID), err, "RPC CreateAccountFailed")
		return nil, serrors.RPC(err)
	}
	return &pb.CreateAccountResp{Account: acct}, nil
}

func (s *accountService) UpsertAccount(ctx context.Context, r *pb.UpsertAccountReq) (*pb.UpsertAccountResp, error) {
	var (
		err  error
		acct *pb.Account
	)

	dexID, err := authMetaFromContext(ctx)
	if err != nil {
		return nil, serrors.RPC(err)
	}
	logger := s.logger.WithField("dexID", dexID)

	if err = db.WithTransaction(s.db, func(tx db.Queryer) error {
		// Check if this is an update or new account creation.
		if r.Account.ID == "" {
			// Create a new account.
			acct, err = s.manager.Account.Create(tx, r.Account, dexID)
			return err
		}
		logger = logger.WithField("accountID", r.Account.ID)
		// We're updating, verify permissions first.
		if _, hasAccess := s.canAccessAccount(ctx, r.Account.ID, Modify); !hasAccess {
			return permissionDeniedErr
		}
		acct, err = s.manager.Account.Update(tx, r.Account)
		return err
	}); err != nil {
		logErrorIfNeeded(logger, err, "RPC UpsertAccount failed")
		return nil, serrors.RPC(err)
	}
	return &pb.UpsertAccountResp{Account: acct}, nil
}

func (s *accountService) ConvertExternallyCreatedAccounts(ctx context.Context, r *pb.ConvertExternallyCreatedAccountsReq) (*pb.ConvertExternallyCreatedAccountsResp, error) {
	var (
		acctIDs []string
		err     error
	)
	if err := db.WithTransaction(s.db, func(tx db.Queryer) error {
		acctIDs, err = s.manager.Account.ConvertExternallyCreatedAccounts(tx, r.DexID, r.Email)
		return err
	}); err != nil {
		logErrorIfNeeded(s.logger.WithField("dexID", r.DexID), err, "RPC ConvertExternallyCreatedAccounts failed")
		return nil, serrors.RPC(err)
	}
	return &pb.ConvertExternallyCreatedAccountsResp{ConvertedAccountIDs: acctIDs}, nil
}

func (s *accountService) RetireAccount(ctx context.Context, r *pb.RetireAccountReq) (*pb.RetireAccountResp, error) {
	dexID, hasAccess := s.canAccessAccount(ctx, r.AccountID, Modify)
	if !hasAccess {
		return nil, permissionDeniedErr
	}
	if err := db.WithTransaction(s.db, func(sdb db.Queryer) error {
		return s.manager.Account.Retire(sdb, r.AccountID, false)
	}); err != nil {
		logErrorIfNeeded(s.logger.WithFields(logrus.Fields{
			"dexID":     dexID,
			"accountID": r.AccountID,
		}), err, "RPC RetireAccount failed")
		return nil, serrors.RPC(err)
	}
	return &pb.RetireAccountResp{Retired: true}, nil
}

// TerminateAccount will retire a BF account and delete all associated information
// including payment methods & stripe tokens, and all information associated with the
// account in our database, effectively revoking all access to the deleted account.
func (s *accountService) TerminateAccount(ctx context.Context, r *pb.TerminateAccountReq) (*pb.TerminateAccountResp, error) {
	dexID, hasAccess := s.canAccessAccount(ctx, r.AccountID, Modify)
	if !hasAccess {
		return nil, permissionDeniedErr
	}
	if err := db.WithTransaction(s.db, func(sdb db.Queryer) error {
		// Do not allow a user to terminate their account while they have active subscriptions.
		activeSubs, activeCancelledSubs, err := s.manager.Subscription.AnyActiveForAccount(r.AccountID)
		if err != nil {
			return err
		}
		switch {
		case activeSubs:
			err = fmt.Errorf("active subscriptions still exist for account %s", r.AccountID)
			return serrors.Errorf(serrors.Validation, err, "Active products still exist for this account, please cancel them and try again.")
		case activeCancelledSubs:
			err = fmt.Errorf("billing period has not expired for a subscription on account %s", r.AccountID)
			return serrors.Errorf(serrors.Validation, err, "All products are canceled but the billing period has not yet expired. You must wait until the end of the billing period before you can terminate your account.")
		}
		unpaid, err := s.manager.Invoice.AnyUnpaidForAccount(r.AccountID)
		if err != nil {
			return err
		}
		if unpaid {
			err = fmt.Errorf("unpaid invoices still exist for account %s", r.AccountID)
			return serrors.Errorf(serrors.Validation, err, "Unpaid invoices still exist for this account, please try again once your invoices have been paid.")
		}
		return s.manager.Account.Terminate(sdb, r.AccountID)
	}); err != nil {
		logErrorIfNeeded(s.logger.WithFields(logrus.Fields{
			"dexID":     dexID,
			"accountID": r.AccountID,
		}), err, "RPC TerminateAccount failed")
		return nil, serrors.RPC(err)
	}
	return new(pb.TerminateAccountResp), nil
}

func (s *accountService) UpdateProfile(ctx context.Context, r *pb.UpdateProfileReq) (*pb.UpdateProfileResp, error) {
	dexID, hasAccess := s.canAccessAccount(ctx, r.Profile.AccountID, Modify)
	if !hasAccess {
		return nil, permissionDeniedErr
	}
	prof, err := s.manager.Account.UpdateProfile(r.Profile)
	if err != nil {
		logErrorIfNeeded(s.logger.WithFields(logrus.Fields{
			"dexID":     dexID,
			"accountID": r.Profile.AccountID,
		}), err, "RPC UpdateProfile failed")
		return nil, serrors.RPC(err)
	}
	return &pb.UpdateProfileResp{Profile: prof}, nil
}

func (s *accountService) CreateAddress(ctx context.Context, r *pb.CreateAddressReq) (*pb.CreateAddressResp, error) {
	p, err := s.manager.Profile.Get(r.Address.ProfileID)
	if err != nil {
		s.logger.WithError(err).Infof("error while getting profile %q", r.Address.ProfileID)
		return nil, err
	}

	dexID, hasAccess := s.canAccessAccount(ctx, p.AccountID, Modify)
	if !hasAccess {
		return nil, permissionDeniedErr
	}

	addr, err := s.manager.Account.CreateAddress(r.Address)
	if err != nil {
		logErrorIfNeeded(s.logger.WithFields(logrus.Fields{
			"dexID":     dexID,
			"accountID": p.AccountID,
		}), err, "RPC CreateAddress failed")
		return nil, serrors.RPC(err)
	}
	return &pb.CreateAddressResp{Address: addr}, nil
}

func (s *accountService) UpdateAddress(ctx context.Context, r *pb.UpdateAddressReq) (*pb.UpdateAddressResp, error) {
	if r.Address.ID == "" {
		return nil, serrors.New(serrors.InternalValidation, errors.New("Address ID not present in request."))
	}
	if r.Address.ProfileID == "" {
		return nil, serrors.New(serrors.InternalValidation, errors.New("Profile ID not present in request."))
	}
	p, err := s.manager.Profile.Get(r.Address.ProfileID)
	if err != nil {
		logErrorIfNeeded(s.logger, err, "RPC UpdateAddress failed")
		return nil, serrors.RPC(err)
	}

	dexID, hasAccess := s.canAccessAccount(ctx, p.AccountID, Modify)
	if !hasAccess {
		return nil, permissionDeniedErr
	}

	logger := s.logger.WithFields(logrus.Fields{
		"dexID":     dexID,
		"accountID": p.AccountID,
	})

	addr, err := s.manager.Account.UpdateAddress(r.Address)
	if err != nil {
		logErrorIfNeeded(logger, err, "RPC UpdateAddress failed")
		return nil, serrors.RPC(err)
	}
	return &pb.UpdateAddressResp{Address: addr}, nil
}

func (s *accountService) UpsertAddress(ctx context.Context, r *pb.UpsertAddressReq) (*pb.UpsertAddressResp, error) {
	s.logger.Debugf("Upsert Address: enter")
	var (
		err  error
		addr *pb.Address
	)

	p, err := s.manager.Profile.Get(r.Address.ProfileID)
	if err != nil {
		logErrorIfNeeded(s.logger, err, "RPC UpsertAddress failed")
		return nil, serrors.RPC(err)
	}

	dexID, hasAccess := s.canAccessAccount(ctx, p.AccountID, Modify)
	if !hasAccess {
		s.logger.Debugf("Upsert Address: access denied to account ID: %s", p.AccountID)
		return nil, permissionDeniedErr
	}

	logger := s.logger.WithFields(logrus.Fields{
		"dexID":     dexID,
		"accountID": p.AccountID,
	})

	//TODO(chance): Move the logic below into a manager function
	if r.Address.ID == "" {
		// Create a new address.
		addr, err = s.manager.Account.CreateAddress(r.Address)
		if err != nil {
			logErrorIfNeeded(logger, err, "RPC UpsertAddress failed")
			return nil, serrors.RPC(err)
		}
	} else {
		addr, err = s.manager.Account.UpdateAddress(r.Address)
		if err != nil {
			logErrorIfNeeded(logger, err, "RPC UpsertAddress failed")
			return nil, serrors.RPC(err)
		}
	}
	return &pb.UpsertAddressResp{Address: addr}, nil
}

func (s *accountService) ListProducts(ctx context.Context, r *pb.ListProductsReq) (*pb.ListProductsResp, error) {
	var resp *pb.ListProductsResp
	prods, err := s.manager.Product.List(nil, r.IncludeDeleted, r.IncludePrivate)
	if err != nil {
		logErrorIfNeeded(s.logger.WithFields(logrus.Fields{
			"includeDeleted": r.IncludeDeleted,
			"includePrivate": r.IncludePrivate,
		}), err, "RPC ListProducts failed")
		return nil, serrors.RPC(err)
	}

	resp = &pb.ListProductsResp{
		Items: prods,
	}
	return resp, nil
}

func (s *accountService) RevokeUserAccountAccess(ctx context.Context, r *pb.RevokeUserAccountAccessReq) (*pb.RevokeUserAccountAccessResp, error) {
	dexID, hasAccess := s.canAccessAccount(ctx, r.AccountID, Modify)
	if !hasAccess {
		return nil, permissionDeniedErr
	}

	if err := db.WithTransaction(s.db, func(tx db.Queryer) error {
		return s.manager.Account.RevokeUserAccountAccess(tx, r.ExistingMemberDexID, r.InvitedUserEmail, r.AccountID)
	}); err != nil {
		logErrorIfNeeded(s.logger.WithFields(logrus.Fields{
			"accountID":   r.AccountID,
			"dexID":       dexID,
			"targetDexID": r.ExistingMemberDexID,
		}), err, "RPC RevokeUserAccountAccess failed")
		return nil, serrors.RPC(err)
	}
	return new(pb.RevokeUserAccountAccessResp), nil
}

func (s *accountService) ChangeUserRole(ctx context.Context, r *pb.ChangeUserRoleReq) (*pb.ChangeUserRoleResp, error) {
	dexID, hasAccess := s.canAccessAccount(ctx, r.AccountID, Modify)
	if !hasAccess {
		return nil, permissionDeniedErr
	}
	if err := db.WithTransaction(s.db, func(tx db.Queryer) error {
		return s.manager.Account.ChangeUserRole(tx, r.DexID, r.AccountID, r.Role)
	}); err != nil {
		logErrorIfNeeded(s.logger.WithFields(logrus.Fields{
			"accountID":   r.AccountID,
			"dexID":       dexID,
			"targetDexID": r.DexID,
			"role":        r.Role.String(),
		}), err, "RPC ChangeUserRole failed")
		return nil, serrors.RPC(err)
	}
	return new(pb.ChangeUserRoleResp), nil
}

func (s *accountService) CreateSubscription(ctx context.Context, r *pb.CreateSubscriptionReq) (*pb.CreateSubscriptionResp, error) {
	dexID, hasAccess := s.canAccessAccount(ctx, r.AccountID, Modify)
	if !hasAccess {
		return nil, permissionDeniedErr
	}
	sub, err := s.manager.Subscription.Create(r)
	if err != nil {
		logErrorIfNeeded(s.logger.WithFields(logrus.Fields{
			"accountID": r.AccountID,
			"dexID":     dexID,
		}), err, "RPC CreateSubscription failed")
		return nil, serrors.RPC(err)
	}
	return &pb.CreateSubscriptionResp{Subscription: sub}, nil
}

func (s *accountService) CancelSubscription(ctx context.Context, r *pb.CancelSubscriptionReq) (*pb.CancelSubscriptionResp, error) {
	dexID, hasAccess := s.canAccessAccount(ctx, r.AccountID, Modify)
	if !hasAccess {
		return nil, permissionDeniedErr
	}
	err := s.manager.Subscription.Cancel(r.SubscriptionID, r.Reason)
	if err != nil {
		logErrorIfNeeded(s.logger.WithFields(logrus.Fields{
			"dexID":          dexID,
			"accountID":      r.AccountID,
			"subscriptionID": r.SubscriptionID,
		}), err, "RPC CancelSubscription failed")
		return nil, serrors.RPC(err)
	}
	return new(pb.CancelSubscriptionResp), nil
}

func (s *accountService) UncancelSubscription(ctx context.Context, r *pb.UncancelSubscriptionReq) (*pb.UncancelSubscriptionResp, error) {
	dexID, hasAccess := s.canAccessAccount(ctx, r.AccountID, Modify)
	if !hasAccess {
		return nil, permissionDeniedErr
	}
	err := s.manager.Subscription.Uncancel(r.SubscriptionID)
	if err != nil {
		logErrorIfNeeded(s.logger.WithFields(logrus.Fields{
			"dexID":          dexID,
			"accountID":      r.AccountID,
			"subscriptionID": r.SubscriptionID,
		}), err, "RPC UncancelSubscription failed")
		return nil, serrors.RPC(err)
	}
	return new(pb.UncancelSubscriptionResp), nil
}

func (s *accountService) GetInvoice(ctx context.Context, r *pb.GetInvoiceReq) (*pb.GetInvoiceResp, error) {
	invoice, err := s.manager.Invoice.Get(r.InvoiceID)
	if err != nil {
		logErrorIfNeeded(s.logger.WithField("invoiceID", r.InvoiceID), err, "RPC GetInvoice Failed")
		return nil, serrors.RPC(err)
	}

	_, hasAccess := s.canAccessAccount(ctx, invoice.AccountID, ReadOnly)
	if !hasAccess {
		return nil, permissionDeniedErr
	}

	return &pb.GetInvoiceResp{
		Invoice: invoice,
	}, nil
}

func (s *accountService) GetInvoiceAsPDF(ctx context.Context, r *pb.GetInvoiceAsPDFReq) (*pb.GetInvoiceAsPDFResp, error) {
	invoice, err := s.manager.Invoice.Get(r.InvoiceID)
	if err != nil {
		logErrorIfNeeded(s.logger.WithField("invoiceID", r.InvoiceID), err, "RPC GetInvoiceAsPDF failed")
		return nil, serrors.RPC(err)
	}

	dexID, hasAccess := s.canAccessAccount(ctx, invoice.AccountID, ReadOnly)
	if !hasAccess {
		return nil, permissionDeniedErr
	}

	logger := s.logger.WithFields(logrus.Fields{
		"dexID":     dexID,
		"accountID": invoice.AccountID,
		"invoiceID": r.InvoiceID,
	})

	f, err := s.manager.Invoice.GetAsPDF(r.InvoiceID)
	if err != nil {
		logErrorIfNeeded(logger, err, "RPC GetInvoiceAsPDF failed")
		return nil, serrors.RPC(err)
	}

	rawBytes, err := ioutil.ReadAll(f.Data)
	if err != nil {
		logErrorIfNeeded(logger, err, "RPC GetInvoiceAsPDF failed")
		return nil, serrors.RPC(err)
	}
	return &pb.GetInvoiceAsPDFResp{
		InvoiceData: rawBytes,
	}, nil
}

func (s *accountService) ListInvoices(ctx context.Context, r *pb.ListInvoicesReq) (*pb.ListInvoicesResp, error) {
	dexID, hasAccess := s.canAccessAccount(ctx, r.AccountID, ReadOnly)
	if !hasAccess {
		return nil, permissionDeniedErr
	}

	invoices, err := s.manager.Invoice.ListByAccountID(r.AccountID)
	if err != nil {
		logErrorIfNeeded(s.logger.WithFields(logrus.Fields{
			"accountID": r.AccountID,
			"dexID":     dexID,
		}), err, "RPC ListInvoices failed")
		return nil, serrors.RPC(err)
	}

	return &pb.ListInvoicesResp{
		Invoices: invoices,
	}, nil
}

func (s *accountService) ListSubscriptions(ctx context.Context, r *pb.ListSubscriptionsReq) (*pb.ListSubscriptionsResp, error) {
	dexID, hasAccess := s.canAccessAccount(ctx, r.AccountID, ReadOnly)
	if !hasAccess {
		return nil, permissionDeniedErr
	}
	parent, children, err := s.manager.Subscription.ListByAccountID(r.AccountID, r.IncludeRetired)
	if err != nil {
		logErrorIfNeeded(s.logger.WithFields(logrus.Fields{
			"accountID": r.AccountID,
			"dexID":     dexID,
		}), err, "RPC ListSubscriptions failed")
		return nil, serrors.RPC(err)
	}
	resp := &pb.ListSubscriptionsResp{
		Parent:   parent,
		Children: children,
	}
	return resp, nil
}

func (s *accountService) CreateCreditCard(ctx context.Context, r *pb.CreateCreditCardReq) (*pb.CreateCreditCardResp, error) {
	dexID, hasAccess := s.canAccessAccount(ctx, r.AccountID, Modify)
	if !hasAccess {
		return nil, permissionDeniedErr
	}

	cc, err := s.manager.Account.CreateCreditCard(r.AccountID, r.Token)
	if err != nil {
		logErrorIfNeeded(s.logger.WithFields(logrus.Fields{
			"accountID": r.AccountID,
			"dexID":     dexID,
		}), err, "RPC CreateCreditCard failed")
		return nil, serrors.RPC(err)
	}
	return &pb.CreateCreditCardResp{Card: cc}, nil
}

func (s *accountService) GetCreditCard(ctx context.Context, r *pb.GetCreditCardReq) (*pb.GetCreditCardResp, error) {
	dexID, hasAccess := s.canAccessAccount(ctx, r.AccountID, ReadOnly)
	if !hasAccess {
		return nil, permissionDeniedErr
	}

	cc, err := s.manager.Account.GetCreditCard(r.AccountID)
	if err != nil {
		logErrorIfNeeded(s.logger.WithFields(logrus.Fields{
			"accountID": r.AccountID,
			"dexID":     dexID,
		}), err, "RPC GetCreditCard failed")
		return nil, serrors.RPC(err)
	}
	return &pb.GetCreditCardResp{Card: cc}, nil
}

// SetQuayCredentials sets the Quay account credentials for the specified account.
func (s *accountService) SetQuayCredentials(ctx context.Context, r *pb.SetQuayCredentialsReq) (*pb.SetQuayCredentialsResp, error) {
	if err := db.WithTransaction(s.db, func(sdb db.Queryer) error {
		quayID, _, err := s.manager.Account.GetQuayCredentials(sdb, r.AccountID)
		if err != nil {
			if serrors.TypeOf(err) == serrors.NotFound {
				err = s.manager.Account.SetQuayCredentials(sdb, r.AccountID, r.QuayID, r.QuayToken)
				if err != nil {
					return err
				}
			}
			return err
		}

		acct := &pb.Account{ID: r.AccountID, QuayID: quayID}
		err = s.manager.Account.UpsertMetadata(acct)
		if err != nil {
			return err
		}

		return nil
	}); err != nil {
		logErrorIfNeeded(s.logger.WithField("accountID", r.AccountID), err, "RPC SetQuayCredentials failed")
		return nil, serrors.RPC(err)
	}
	return &pb.SetQuayCredentialsResp{}, nil
}

// GetQuayCredentials gets the Quay account credentials for the specified account.
func (s *accountService) GetQuayCredentials(ctx context.Context, r *pb.GetQuayCredentialsReq) (*pb.GetQuayCredentialsResp, error) {
	var resp *pb.GetQuayCredentialsResp
	if err := db.WithTransaction(s.db, func(sdb db.Queryer) error {
		id, token, err := s.manager.Account.GetQuayCredentials(sdb, r.AccountID)
		if err != nil {
			return err
		}
		resp = &pb.GetQuayCredentialsResp{
			QuayID:    id,
			QuayToken: token,
		}
		return nil
	}); err != nil {
		logErrorIfNeeded(s.logger.WithField("accountID", r.AccountID), err, "RPC GetQuayCredentials failed")
		return nil, serrors.RPC(err)
	}
	return resp, nil
}

// CreateLicense generates a new version of a license for a given account,
// based on the account's current subscriptions.
func (s *accountService) CreateLicense(ctx context.Context, r *pb.CreateLicenseReq) (*pb.CreateLicenseResp, error) {
	if err := db.WithTransaction(s.db, func(sdb db.Queryer) error {
		return s.manager.Account.CreateLicense(sdb, r.AccountID)
	}); err != nil {
		logErrorIfNeeded(s.logger.WithField("accountID", r.AccountID), err, "RPC CreateLicense failed")
		return nil, serrors.RPC(err)
	}
	return &pb.CreateLicenseResp{}, nil
}

// GetAssets returns an accounts license in multiple formats for use.
func (s *accountService) GetAssets(ctx context.Context, r *pb.GetAssetsReq) (*pb.GetAssetsResp, error) {
	var (
		assets map[string]*pb.Asset
		err    error
	)
	if err := db.WithTransaction(s.db, func(sdb db.Queryer) error {
		assets, err = s.manager.Account.GetAssets(sdb, r.AccountID)
		if err != nil {
			return err
		}
		return nil
	}); err != nil {
		logErrorIfNeeded(s.logger.WithField("accountID", r.AccountID), err, "RPC GetAssets failed")
		return nil, serrors.RPC(err)
	}
	return &pb.GetAssetsResp{Assets: assets}, nil
}

func logErrorIfNeeded(logger *logrus.Entry, err error, message string) {
	if errType := serrors.TypeOf(err); errType == serrors.Internal || errType == serrors.Unknown {
		logger.WithError(err).Error(message)
	}
}
