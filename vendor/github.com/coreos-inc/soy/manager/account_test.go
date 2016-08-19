package manager

import (
	"testing"
	"time"

	"github.com/Sirupsen/logrus"
	"github.com/authclub/billforward/models"
	"github.com/go-openapi/strfmt"
	"github.com/go-openapi/swag"

	"github.com/coreos-inc/soy/db"
	pb "github.com/coreos-inc/soy/proto"
	"github.com/coreos-inc/soy/repo"
	"github.com/coreos-inc/soy/testutil"
)

func TestAccountBalance(t *testing.T) {
	invPaid := 20.00
	tests := []struct {
		invoices        []*models.Invoice
		expectedBalance float64
	}{
		{
			invoices:        []*models.Invoice{{InvoiceCost: swag.Float64(20.33), State: swag.String("Unpaid")}, {InvoiceCost: swag.Float64(44.33), State: swag.String("Unpaid")}},
			expectedBalance: 64.66,
		},
		{ // Partially paid
			invoices:        []*models.Invoice{{InvoiceCost: swag.Float64(20.33), State: swag.String("Unpaid")}, {InvoiceCost: swag.Float64(44.33), InvoicePaid: invPaid, State: swag.String("Unpaid")}},
			expectedBalance: 44.66,
		},
		{ // With already paid invoice
			invoices:        []*models.Invoice{{InvoiceCost: swag.Float64(20.33), State: swag.String("Unpaid")}, {InvoiceCost: swag.Float64(44.33), State: swag.String("Paid")}},
			expectedBalance: 20.33,
		},
	}
	for i, tc := range tests {
		balance := accountBalance(tc.invoices)
		if balance != tc.expectedBalance {
			t.Fatalf("Unpexpected account balance for test case %d: expected %v got %v",
				i, tc.expectedBalance, balance)
		}
	}
}

func TestAccountStatus(t *testing.T) {
	periodStart := strfmt.DateTime(time.Now().AddDate(0, 0, 1))
	pastDue := strfmt.DateTime(time.Now().AddDate(0, 0, -2))
	futureDue := strfmt.DateTime(time.Now().AddDate(0, 0, 5))
	tests := []struct {
		invoices       []*models.Invoice
		expectedStatus pb.GetAccountStatusResp_AccountStatus
	}{
		{ // Good status, already paid
			invoices:       []*models.Invoice{{State: swag.String("Paid")}},
			expectedStatus: pb.GetAccountStatusResp_GOOD,
		},
		{ // AwaitingPayment status, not paid, no execution attempts
			invoices:       []*models.Invoice{{State: swag.String("Unpaid"), TotalExecutionAttempts: 0, Due: periodStart, PeriodStart: periodStart}},
			expectedStatus: pb.GetAccountStatusResp_AWAITING_PAYMENT,
		},
		{ // Delinquent status, cc with failed execution attempt
			invoices:       []*models.Invoice{{State: swag.String("Unpaid"), TotalExecutionAttempts: 1, Due: periodStart, PeriodStart: periodStart}},
			expectedStatus: pb.GetAccountStatusResp_DELINQUENT,
		},
		{ // AwaitingPayment status, PO with many execution attempts, but ok b/c not past due
			invoices:       []*models.Invoice{{State: swag.String("Unpaid"), TotalExecutionAttempts: 5, Due: futureDue, PeriodStart: periodStart}},
			expectedStatus: pb.GetAccountStatusResp_AWAITING_PAYMENT,
		},
		{ // Delinquent status, Due (2 days ago) < now
			invoices:       []*models.Invoice{{State: swag.String("Unpaid"), Due: pastDue, PeriodStart: periodStart}},
			expectedStatus: pb.GetAccountStatusResp_DELINQUENT,
		},
	}
	for i, tc := range tests {
		status := accountStatus(tc.invoices)
		if status != tc.expectedStatus {
			t.Fatalf("Unpexpected account status for test case %d: expected %v got %v", i, tc.expectedStatus, status)
		}
	}
}

func TestRevokeUserAccount(t *testing.T) {
	var (
		admin              = repo.User{DexID: "1", Email: "admin@bar.bike"}
		revokedUser        = repo.User{DexID: "2", Email: "revokeMe@bar.bike"}
		revokedInvitedUser = repo.User{DexID: "3", Email: "revokeMeImInvited@bar.bike"}
		acctID             = "acct-1"
	)
	testutil.WithTestConn(t, func(tx db.Queryer) {
		if err := repo.CreateUser(tx, &admin); err != nil {
			t.Fatal(err)
		}
		if err := repo.CreateUser(tx, &revokedUser); err != nil {
			t.Fatal(err)
		}
		if err := repo.CreateBFAccount(tx, acctID); err != nil {
			t.Fatal(err)
		}
		email := revokedInvitedUser.Email
		if err := repo.CreateInvitedUser(tx, email, acctID, admin.DexID, "READ_ONLY"); err != nil {
			t.Fatal(err)
		}
		if err := repo.CreateUserAccount(tx, &repo.UserAccount{
			BFAccountID: acctID,
			DexID:       revokedUser.DexID,
			Role:        "READ_ONLY",
		}); err != nil {
			t.Fatal(err)
		}
		if err := repo.CreateUserAccount(tx, &repo.UserAccount{
			BFAccountID: acctID,
			DexID:       admin.DexID,
			Role:        "ADMIN",
		}); err != nil {
			t.Fatal(err)
		}
		mgracct := new(account)
		// Delete regular backend_user.
		err := mgracct.RevokeUserAccountAccess(tx, revokedUser.DexID, "", acctID)
		if err != nil {
			t.Fatal(err)
		}
		u, err := repo.GetUserByDexID(tx, revokedUser.DexID)
		if err != nil {
			t.Fatal(err)
		}
		if len(u.Accounts) != 0 {
			t.Fatalf("Expected revoked user to have no accounts, had %d", len(u.Accounts))
		}
		// Delete invited_user.
		err = mgracct.RevokeUserAccountAccess(tx, "", revokedInvitedUser.Email, acctID)
		if err != nil {
			t.Fatal(err)
		}
		_, err = repo.GetInvitedUserByEmailAndAccount(tx, revokedInvitedUser.Email, acctID)
		if err == nil {
			t.Fatal("Expected GetInvitedUserByEmailAndAccount to fail, but it did not")
		}
	})
}

func TestChangeUserRole(t *testing.T) {
	var (
		admin           = repo.User{DexID: "1", Email: "admin@bar.bike"}
		roleChangedUser = repo.User{DexID: "2", Email: "revokeMe@bar.bike"}
		acctID          = "acct-1"
	)
	testutil.WithTestConn(t, func(tx db.Queryer) {
		if err := repo.CreateUser(tx, &admin); err != nil {
			t.Fatal(err)
		}
		if err := repo.CreateUser(tx, &roleChangedUser); err != nil {
			t.Fatal(err)
		}
		if err := repo.CreateBFAccount(tx, acctID); err != nil {
			t.Fatal(err)
		}
		if err := repo.CreateUserAccount(tx, &repo.UserAccount{
			BFAccountID: acctID,
			DexID:       roleChangedUser.DexID,
			Role:        "READ_ONLY",
		}); err != nil {
			t.Fatal(err)
		}
		if err := repo.CreateUserAccount(tx, &repo.UserAccount{
			BFAccountID: acctID,
			DexID:       admin.DexID,
			Role:        "ADMIN",
		}); err != nil {
			t.Fatal(err)
		}
		mgracct := new(account)
		err := mgracct.ChangeUserRole(tx, roleChangedUser.DexID, acctID, pb.Role_ADMIN)
		if err != nil {
			t.Fatal(err)
		}
		u, err := repo.GetUserByDexID(tx, roleChangedUser.DexID)
		if err != nil {
			t.Fatal(err)
		}
		if len(u.Accounts) != 1 {
			t.Fatalf("Expected one account")
		}
		acct := u.Accounts[0]
		if acct.Role != "ADMIN" {
			t.Fatalf("Expected role of \"ADMIN\" got %q", acct.Role)
		}
	})
}

func TestCaseInsensitiveEmailsForExternalAccounts(t *testing.T) {
	var (
		upperEmail = "SCREAMY_CAPS_EMAIL@TEST.NET"
		lowerEmail = "screamy_caps_email@test.net"
		acctID     = "acct-1"
	)
	testutil.WithTestConn(t, func(tx db.Queryer) {
		err := repo.CreateBFAccount(tx, acctID)
		if err != nil {
			t.Fatal(err)
		}
		// Create with screamy caps upper case.
		err = repo.CreateExternallyCreatedAccount(tx, upperEmail, acctID)
		if err != nil {
			t.Fatal(err)
		}
		// Lookup with lower.
		exts, err := repo.GetExternallyCreatedAccounts(tx, lowerEmail)
		if err != nil {
			t.Fatal(err)
		}
		if len(exts) != 1 {
			t.Fatal("Expected externally created account lookup to find user, did not.")
		}
		acct := &account{logger: logrus.WithField("app", "test")}
		err = repo.CreateUser(tx, &repo.User{DexID: "1", Email: upperEmail})
		if err != nil {
			t.Fatal(err)
		}
		_, err = acct.ConvertExternallyCreatedAccounts(tx, "1", lowerEmail)
		if err != nil {
			t.Fatal(err)
		}
		u, err := repo.GetUserByDexID(tx, "1")
		if err != nil {
			t.Fatal(err)
		}
		if u.Email != lowerEmail {
			t.Fatal("Expected user email to be normalized to lowercase")
		}
	})
}
