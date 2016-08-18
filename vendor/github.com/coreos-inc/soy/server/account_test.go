package server

import (
	"testing"

	"golang.org/x/net/context"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"

	"github.com/Sirupsen/logrus"
	"github.com/coreos-inc/soy/db"
	pb "github.com/coreos-inc/soy/proto"
	"github.com/coreos-inc/soy/repo"
	"github.com/coreos-inc/soy/testutil"
)

var testLogger = logrus.WithField("package", "server-test")

type rpcReq func(context.Context, db.DB, string, accessType) error

func createUsers(sdb db.Queryer, users ...*repo.User) error {
	for _, user := range users {
		if err := repo.CreateUser(sdb, user); err != nil {
			return err
		}
	}
	return nil
}

func testAccountPermissions(t *testing.T, testModify bool, request rpcReq) {
	conn := testutil.NewTestConn(t)
	defer conn.Close()
	testutil.ClearDB(conn)

	user1 := repo.User{DexID: "123", Email: "foo@bar.bike"}
	user2 := repo.User{DexID: "999", Email: "foo@baz.bike"}
	user3 := repo.User{DexID: "456", Email: "hank@foo.website"}
	ua1 := repo.UserAccount{BFAccountID: "456", DexID: user1.DexID, Role: "READ_ONLY"}
	ua2 := repo.UserAccount{BFAccountID: "456", DexID: user2.DexID, Role: "ADMIN"}
	ua3 := repo.UserAccount{BFAccountID: "678", DexID: user3.DexID, Role: "ADMIN"}
	if err := db.WithTransaction(conn, func(tx db.Queryer) error {
		if err := createUsers(tx, &user1, &user2, &user3); err != nil {
			return err
		}
		if err := repo.CreateBFAccount(tx, ua1.BFAccountID); err != nil {
			return err
		}
		if err := repo.CreateBFAccount(tx, ua3.BFAccountID); err != nil {
			return err
		}
		if err := repo.CreateUserAccount(tx, &ua1); err != nil {
			return err
		}
		if err := repo.CreateUserAccount(tx, &ua2); err != nil {
			return err
		}
		return repo.CreateUserAccount(tx, &ua3)
	}); err != nil {
		t.Fatalf("Unable to setup initial account and users for test: %v", err)
	}
	tcs := []struct {
		dexid     string
		accountid string
		allowed   bool
		access    accessType
	}{
		{user1.DexID, ua1.BFAccountID, true, ReadOnly},  // User belongs to account
		{user3.DexID, ua1.BFAccountID, false, ReadOnly}, // User does not belong to account
		{"", "", false, ReadOnly},                       // No dexid provided - should fail
		{user2.DexID, ua1.BFAccountID, true, Modify},    // Admin should be able to modify
		{user1.DexID, ua1.BFAccountID, false, Modify},   // Non admin cannot modify
	}
	for i, tc := range tcs {
		modificationTest := tc.access == Modify
		if testModify != modificationTest {
			continue
		}
		md := metadata.Pairs(AuthDexKey, tc.dexid)
		ctx := metadata.NewContext(context.TODO(), md)
		err := request(ctx, conn, tc.accountid, tc.access)
		code := grpc.Code(err)
		authorized := code != codes.PermissionDenied
		if tc.allowed != authorized {
			t.Fatalf("Unexpected result for test #%d: expected to be allowed: %v, error was: %v, rpc was: %s",
				i+1, tc.allowed, err, code)
		}
	}
}

func TestInviteUserPermissions(t *testing.T) {
	mgr := newManager()
	testAccountPermissions(t, true, func(ctx context.Context, sdb db.DB, bfAccountID string, at accessType) error {
		asvc := NewAccountService(testLogger, mgr, sdb)
		_, err := asvc.InviteUser(ctx, &pb.InviteUserReq{Email: "foo@test.com", AccountID: bfAccountID})
		return err
	})
}

func TestCanAccessAccount(t *testing.T) {
	mgr := newManager()
	testAccountPermissions(t, true, func(ctx context.Context, sdb db.DB, bfAccountID string, at accessType) error {
		asvc := NewAccountService(testLogger, mgr, sdb)
		if _, hasAccess := asvc.canAccessAccount(ctx, bfAccountID, at); !hasAccess {
			return permissionDeniedErr
		}
		return nil
	})
}

func TestGetAccountPermissions(t *testing.T) {
	mgr := newManager()
	testAccountPermissions(t, false, func(ctx context.Context, sdb db.DB, bfAccountID string, _ accessType) error {
		asvc := NewAccountService(testLogger, mgr, sdb)
		_, err := asvc.GetAccount(ctx, &pb.GetAccountReq{AccountID: bfAccountID})
		return err
	})
}

func TestRetireAccountPermissions(t *testing.T) {
	mgr := newManager()
	testAccountPermissions(t, true, func(ctx context.Context, sdb db.DB, bfAccountID string, _ accessType) error {
		asvc := NewAccountService(testLogger, mgr, sdb)
		_, err := asvc.RetireAccount(ctx, &pb.RetireAccountReq{AccountID: bfAccountID})
		return err
	})
}

func TestUpdateProfilePermissions(t *testing.T) {
	mgr := newManager()
	testAccountPermissions(t, true, func(ctx context.Context, sdb db.DB, bfAccountID string, _ accessType) error {
		asvc := NewAccountService(testLogger, mgr, sdb)
		_, err := asvc.UpdateProfile(ctx, &pb.UpdateProfileReq{Profile: &pb.Profile{AccountID: bfAccountID, FirstName: "hank"}})
		return err
	})
}

type mockProfile struct {
	accountID string
}

func (mp mockProfile) Get(id string) (*pb.Profile, error) {
	return &pb.Profile{AccountID: mp.accountID}, nil
}

func TestCreateAddressPermissions(t *testing.T) {
	mgr := newManager()
	testAccountPermissions(t, true, func(ctx context.Context, sdb db.DB, bfAccountID string, _ accessType) error {
		mgr.Profile = mockProfile{accountID: bfAccountID}
		asvc := NewAccountService(testLogger, mgr, sdb)
		addr := pb.Address{
			AddressLine1: "somewhere ct",
			City:         "Chicago",
			Province:     "Someplace",
			Postcode:     "60606",
			Landline:     "(999) 999-9999",
			ProfileID:    "123-456-789",
		}
		_, err := asvc.CreateAddress(ctx, &pb.CreateAddressReq{Address: &addr})
		return err
	})
}

func TestUpdateAddressPermissions(t *testing.T) {
	mgr := newManager()
	testAccountPermissions(t, true, func(ctx context.Context, sdb db.DB, bfAccountID string, _ accessType) error {
		mgr.Profile = mockProfile{accountID: bfAccountID}
		asvc := NewAccountService(testLogger, mgr, sdb)
		addr := pb.Address{ID: "123", ProfileID: "456", AddressLine1: "somewhere else ct"}
		_, err := asvc.UpdateAddress(ctx, &pb.UpdateAddressReq{Address: &addr})
		return err
	})
}

func TestRevokeUserAccountPermissions(t *testing.T) {
	mgr := newManager()
	testAccountPermissions(t, true, func(ctx context.Context, sdb db.DB, bfAccountID string, _ accessType) error {
		asvc := NewAccountService(testLogger, mgr, sdb)
		_, err := asvc.RevokeUserAccountAccess(ctx, &pb.RevokeUserAccountAccessReq{ExistingMemberDexID: "123", AccountID: bfAccountID})
		return err
	})
}

func TestChangeUserRolePermissions(t *testing.T) {
	mgr := newManager()
	testAccountPermissions(t, true, func(ctx context.Context, sdb db.DB, bfAccountID string, _ accessType) error {
		asvc := NewAccountService(testLogger, mgr, sdb)
		_, err := asvc.ChangeUserRole(ctx, &pb.ChangeUserRoleReq{DexID: "123", AccountID: bfAccountID, Role: pb.Role_READ_ONLY})
		return err
	})
}

func TestCreateSubscriptionPermissions(t *testing.T) {
	mgr := newManager()
	testAccountPermissions(t, true, func(ctx context.Context, sdb db.DB, bfAccountID string, _ accessType) error {
		asvc := NewAccountService(testLogger, mgr, sdb)
		_, err := asvc.CreateSubscription(ctx, &pb.CreateSubscriptionReq{AccountID: bfAccountID})
		return err
	})
}

func TestCancelSubscriptionPermissions(t *testing.T) {
	mgr := newManager()
	testAccountPermissions(t, true, func(ctx context.Context, sdb db.DB, bfAccountID string, _ accessType) error {
		asvc := NewAccountService(testLogger, mgr, sdb)
		_, err := asvc.CancelSubscription(ctx, &pb.CancelSubscriptionReq{SubscriptionID: "1", AccountID: bfAccountID})
		return err
	})
}

func TestListSubscriptionsPermissions(t *testing.T) {
	mgr := newManager()
	testAccountPermissions(t, false, func(ctx context.Context, sdb db.DB, bfAccountID string, _ accessType) error {
		asvc := NewAccountService(testLogger, mgr, sdb)
		_, err := asvc.ListSubscriptions(ctx, &pb.ListSubscriptionsReq{AccountID: bfAccountID, IncludeRetired: false})
		return err
	})
}

func TestTerminateAccountPermissions(t *testing.T) {
	mgr := newManager()
	testAccountPermissions(t, true, func(ctx context.Context, sdb db.DB, bfAccountID string, _ accessType) error {
		asvc := NewAccountService(testLogger, mgr, sdb)
		_, err := asvc.TerminateAccount(ctx, &pb.TerminateAccountReq{AccountID: bfAccountID})
		return err
	})
}
