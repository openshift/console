package repo

import (
	"testing"

	"github.com/coreos-inc/soy/db"
	"github.com/coreos-inc/soy/testutil"
)

func TestRevokeAllUserAccountAccess(t *testing.T) {
	var (
		admin              = User{DexID: "1", Email: "admin@bar.bike"}
		revokedUser        = User{DexID: "2", Email: "revokeMe@bar.bike"}
		revokedInvitedUser = User{DexID: "3", Email: "revokeMeImInvited@bar.bike"}
		acctID             = "acct-1"
	)
	testutil.WithTestConn(t, func(tx db.Queryer) {
		if err := CreateUser(tx, &admin); err != nil {
			t.Fatal(err)
		}
		if err := CreateUser(tx, &revokedUser); err != nil {
			t.Fatal(err)
		}
		if err := CreateBFAccount(tx, acctID); err != nil {
			t.Fatal(err)
		}
		email := revokedInvitedUser.Email
		if err := CreateInvitedUser(tx, email, acctID, admin.DexID, "READ_ONLY"); err != nil {
			t.Fatal(err)
		}
		if err := CreateUserAccount(tx, &UserAccount{
			BFAccountID: acctID,
			DexID:       revokedUser.DexID,
			Role:        "READ_ONLY",
		}); err != nil {
			t.Fatal(err)
		}
		if err := CreateUserAccount(tx, &UserAccount{
			BFAccountID: acctID,
			DexID:       admin.DexID,
			Role:        "ADMIN",
		}); err != nil {
			t.Fatal(err)
		}
		err := RevokeAllUserAccountAccess(tx, acctID)
		if err != nil {
			t.Fatal(err)
		}
		for _, id := range []string{admin.DexID, revokedUser.DexID} {
			u, err := GetUserByDexID(tx, id)
			if err != nil {
				t.Fatal(err)
			}
			if len(u.Accounts) != 0 {
				t.Fatalf("Expected revoked user to have no accounts, had %d", len(u.Accounts))
			}
		}
		// Check invited users.
		_, err = GetInvitedUserByEmailAndAccount(tx, revokedInvitedUser.Email, acctID)
		if err == nil {
			t.Fatal("Expected GetInvitedUserByEmailAndAccount to fail, but it did not")
		}
	})
}
