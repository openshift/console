package repo

import (
	"testing"

	"github.com/coreos-inc/soy/db"
	"github.com/coreos-inc/soy/testutil"
)

func TestGetUserByDexID(t *testing.T) {
	testutil.WithTestConn(t, func(tx db.Queryer) {
		user := User{
			DexID: "123",
			Email: "foo@bar.bike",
		}

		if err := CreateUser(tx, &user); err != nil {
			t.Fatal(err)
		}
		if err := CreateBFAccount(tx, "456"); err != nil {
			t.Fatal(err)
		}
		if err := CreateBFAccount(tx, "678"); err != nil {
			t.Fatal(err)
		}
		if err := CreateUserAccount(tx, &UserAccount{
			BFAccountID: "456", DexID: user.DexID, Role: "READ_ONLY",
		}); err != nil {
			t.Fatal(err)
		}
		if err := CreateUserAccount(tx, &UserAccount{
			BFAccountID: "678", DexID: user.DexID, Role: "ADMIN",
		}); err != nil {
			t.Fatal(err)
		}

		u1, err := GetUserByDexID(tx, "123")
		if err != nil {
			t.Fatal(err)
		}
		u2, err := GetUserByEmail(tx, "foo@bar.bike")
		if err != nil {
			t.Fatal(err)
		}

		for _, u := range []*User{u1, u2} {
			if u.DexID != user.DexID {
				t.Fatal("incorrect dex id")
			}
			if u.Email != user.Email {
				t.Fatal("incorrect email")
			}
			if len(u.Accounts) != 2 {
				t.Fatal("user should have 2 accounts")
			}

			accountTests := []struct {
				dexID, role, bfAccountID string
			}{
				{u.DexID, "READ_ONLY", "456"},
				{u.DexID, "ADMIN", "678"},
			}
			for i := range accountTests {
				if u.Accounts[i].DexID != accountTests[i].dexID {
					t.Fatal("incorrect DexID for account")
				}
				if u.Accounts[i].Role != accountTests[i].role {
					t.Fatal("incorrect role for account")
				}
				if u.Accounts[i].BFAccountID != accountTests[i].bfAccountID {
					t.Fatal("incorrect account ID for account")
				}
			}
		}
	})
}

func TestGetUserByDexIDNoAccounts(t *testing.T) {
	testutil.WithTestConn(t, func(tx db.Queryer) {
		user := User{
			DexID: "123",
			Email: "foo@bar.bike",
		}
		if err := CreateUser(tx, &user); err != nil {
			t.Fatal(err)
		}
		u, err := GetUserByDexID(tx, "123")
		if err != nil {
			t.Fatal(err)
		}
		if len(u.Accounts) != 0 {
			t.Fatal("Expected empty account list")
		}
	})
}

func TestGetUserByDexIDRetiredAccount(t *testing.T) {
	testutil.WithTestConn(t, func(tx db.Queryer) {
		user := User{DexID: "123", Email: "foo@bar.bike"}
		retiredAcct := &UserAccount{BFAccountID: "456", DexID: user.DexID, Role: "READ_ONLY"}
		if err := CreateUser(tx, &user); err != nil {
			t.Fatal(err)
		}
		if err := CreateBFAccount(tx, "456"); err != nil {
			t.Fatal(err)
		}
		if err := CreateBFAccount(tx, "678"); err != nil {
			t.Fatal(err)
		}
		if err := CreateUserAccount(tx, retiredAcct); err != nil {
			t.Fatal(err)
		}
		if err := CreateUserAccount(tx, &UserAccount{
			BFAccountID: "678", DexID: user.DexID, Role: "ADMIN",
		}); err != nil {
			t.Fatal(err)
		}
		if err := RetireBFAccount(tx, retiredAcct.BFAccountID); err != nil {
			t.Fatal(err)
		}
		u, err := GetUserByDexID(tx, "123")
		if err != nil {
			t.Fatal(err)
		}
		if len(u.Accounts) != 1 {
			t.Fatal("Expected only non-retired account")
		}
		if u.Accounts[0].BFAccountID == retiredAcct.BFAccountID {
			t.Fatal("Retired account should not have been returned")
		}
	})
}
