package manager

import (
	"testing"

	"github.com/coreos-inc/soy/db"
	pb "github.com/coreos-inc/soy/proto"
	"github.com/coreos-inc/soy/repo"
	"github.com/coreos-inc/soy/testutil"
)

func TestGetUser(t *testing.T) {
	var dexuser = repo.User{DexID: "123", Email: "foo@bar.bike"}

	testutil.WithTestConn(t, func(tx db.Queryer) {
		if err := repo.CreateUser(tx, &dexuser); err != nil {
			t.Fatal(err)
		}
		if err := repo.CreateBFAccount(tx, "456"); err != nil {
			t.Fatal(err)
		}
		if err := repo.CreateBFAccount(tx, "678"); err != nil {
			t.Fatal(err)
		}
		if err := repo.CreateUserAccount(tx, &repo.UserAccount{
			BFAccountID: "456", DexID: dexuser.DexID, Role: "READ_ONLY",
		}); err != nil {
			t.Fatal(err)
		}
		if err := repo.CreateUserAccount(tx, &repo.UserAccount{
			BFAccountID: "678", DexID: dexuser.DexID, Role: "ADMIN",
		}); err != nil {
			t.Fatal(err)
		}
		u := newTestUser()
		pbUser, err := u.Get(tx, dexuser.DexID)
		if err != nil {
			t.Fatal(err)
		}
		if pbUser.DexID != dexuser.DexID {
			t.Fatalf("Incorrect Dex ID, expected %q got %q", dexuser.DexID, pbUser.DexID)
		}
		if pbUser.Email != dexuser.Email {
			t.Fatalf("Incorrect email, expected %q got %q", dexuser.Email, pbUser.Email)
		}
		for _, ar := range pbUser.AccountRoles {
			switch ar.AccountID {
			case "456":
				if ar.Role.Value != pb.Role_READ_ONLY {
					t.Fatalf("Incorrect role for account \"456\", expected %q got %q", "READ_ONLY", pb.Role_name[int32(ar.Role.Value)])
				}
			case "678":
				if ar.Role.Value != pb.Role_ADMIN {
					t.Fatalf("Incorrect role for account \"678\", expected %q got %q", "ADMIN", pb.Role_name[int32(ar.Role.Value)])
				}
			}
		}
	})
}

func TestInviteUser(t *testing.T) {
	var (
		dexuser          = repo.User{DexID: "1", Email: "foo@bar.bike"}
		invitedUserEmail = "invite.me@please.biz"
		acctID           = "acct-1"
	)

	testutil.WithTestConn(t, func(tx db.Queryer) {
		if err := repo.CreateUser(tx, &dexuser); err != nil {
			t.Fatal(err)
		}
		if err := repo.CreateBFAccount(tx, acctID); err != nil {
			t.Fatal(err)
		}
		if err := repo.CreateUserAccount(tx, &repo.UserAccount{
			BFAccountID: acctID, DexID: dexuser.DexID, Role: "ADMIN",
		}); err != nil {
			t.Fatal(err)
		}
		u := newTestUser()
		err := u.Invite(tx, invitedUserEmail, acctID, dexuser.DexID, pb.Role_READ_ONLY.String())
		if err != nil {
			t.Fatalf("Failed to invite user: %v", err)
		}
		invitedUser, err := repo.GetInvitedUserByEmailAndAccount(tx, invitedUserEmail, acctID)
		if err != nil {
			t.Fatalf("Could not get invited user from DB: %v", err)
		}
		if invitedUser.BFAccountID != acctID {
			t.Fatalf("Invited user has incorrect BF Account ID, expected %q got %q", acctID, invitedUser.BFAccountID)
		}
		if invitedUser.InvitedBy != dexuser.DexID {
			t.Fatalf("Invited user has incorrect InvitedBy value, expected %q got %q", dexuser.DexID, invitedUser.InvitedBy)
		}
	})
}

func TestAcceptUserInvitation(t *testing.T) {
	var (
		dexuser      = repo.User{DexID: "1", Email: "foo@bar.bike"}
		invitedAdmin = repo.User{DexID: "2", Email: "admin@domain.bike"}
		invitedRO    = repo.User{DexID: "3", Email: "ro@domain.bike"}
		acctID       = "acct-1"
	)

	testutil.WithTestConn(t, func(tx db.Queryer) {
		if err := repo.CreateUser(tx, &dexuser); err != nil {
			t.Fatal(err)
		}
		if err := repo.CreateUser(tx, &invitedAdmin); err != nil {
			t.Fatal(err)
		}
		if err := repo.CreateUser(tx, &invitedRO); err != nil {
			t.Fatal(err)
		}
		if err := repo.CreateBFAccount(tx, acctID); err != nil {
			t.Fatal(err)
		}
		if err := repo.CreateUserAccount(tx, &repo.UserAccount{
			BFAccountID: acctID,
			DexID:       dexuser.DexID,
			Role:        "ADMIN",
		}); err != nil {
			t.Fatal(err)
		}
		mgruser := newTestUser()
		roles := []string{"ADMIN", "READ_ONLY"}
		for i, u := range []repo.User{invitedAdmin, invitedRO} {
			err := repo.CreateInvitedUser(tx, u.Email, acctID, dexuser.DexID, roles[i])
			if err != nil {
				t.Fatal(err)
			}
			err = mgruser.AcceptInvitation(tx, u.Email, acctID, u.DexID)
			if err != nil {
				t.Fatal(err)
			}
			iu, err := repo.GetInvitedUserByEmailAndAccount(tx, u.Email, acctID)
			if err != nil {
				t.Fatal(err)
			}
			if iu.AcceptedAt == nil {
				t.Fatal("Invitation was not marked as accepted")
			}
			if iu.Role != roles[i] {
				t.Fatalf("Incorrect role, expected %q got %q", roles[i], iu.Role)
			}
			usr, err := repo.GetUserByDexID(tx, u.DexID)
			if err != nil {
				t.Fatal(err)
			}
			if len(usr.Accounts) != 1 {
				t.Fatal("Expected invited user to have been associated with an account")
			}
			usrAcctID := usr.Accounts[0].BFAccountID
			if usrAcctID != acctID {
				t.Fatalf("User associated with incorrect account, expected %q, got %q", acctID, usrAcctID)
			}
			usrAcctRole := usr.Accounts[0].Role
			if usrAcctRole != roles[i] {
				t.Fatalf("New user got incorrect role, expected %q got %q", roles[i], usrAcctRole)
			}
		}
	})
}

func TestCreateUser(t *testing.T) {
	var (
		dexID = "1"
		email = "test@test.bike"
	)

	testutil.WithTestConn(t, func(tx db.Queryer) {
		mgruser := newTestUser()
		err := mgruser.Create(tx, dexID, email)
		if err != nil {
			t.Fatal(err)
		}
		usr, err := repo.GetUserByDexID(tx, dexID)
		if err != nil {
			t.Fatalf("could not get UserByDexID: %v, err: %v", dexID, err)
		}
		if usr.Email != email {
			t.Fatalf("Incorrect email: expected %q got %q", email, usr.Email)
		}
	})
}
