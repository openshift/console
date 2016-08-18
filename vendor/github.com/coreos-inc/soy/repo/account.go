package repo

import (
	"database/sql"
	"fmt"

	"github.com/coreos-inc/soy/common/serrors"
	"github.com/coreos-inc/soy/db"
)

func CreateBFAccount(sdb db.Queryer, bfAccountID string) error {
	query := "INSERT INTO bf_accounts (id) VALUES ($1)"
	_, err := sdb.Exec(query, bfAccountID)
	if db.IsPgErrName(err, db.PgErrUniqueViolation) {
		return serrors.New(serrors.AlreadyExists, err)
	}
	return err
}

func UpsertBFAccount(sdb db.Queryer, bfAccountID string) (bool, error) {
	var created bool
	query := "SELECT insert_ignore_bf_account($1)"
	err := sdb.QueryRowx(query, bfAccountID).Scan(&created)
	return created, err
}

// SetQuayCredentials sets the quay credentials for the given account.
func SetQuayCredentials(sdb db.Queryer, bfAccountID, quayID, quayToken string) error {
	query := `
	INSERT INTO quay_credentials (
		bf_account_id, quay_id, quay_token
	) VALUES ($1, $2, $3)`
	_, err := sdb.Exec(query, bfAccountID, quayID, quayToken)
	if db.IsPgErrName(err, db.PgErrUniqueViolation) {
		return serrors.New(serrors.AlreadyExists, err)
	}
	return err
}

// SetQuayCredentials sets the quay credentials for the given account.
func GetQuayCredentials(sdb db.Queryer, bfAccountID string) (string, string, error) {
	var quayID, quayToken string
	query := `SELECT quay_id, quay_token FROM quay_credentials WHERE bf_account_id=$1`
	err := sdb.QueryRowx(query, bfAccountID).Scan(&quayID, &quayToken)
	if err != nil {
		if err == sql.ErrNoRows {
			err = serrors.New(serrors.NotFound, nil)
		}
		return "", "", err
	}
	return quayID, quayToken, nil
}

// RevokeUserAccountAccess removes account access for the given user from the
// given account.
func RevokeUserAccountAccess(sdb db.Queryer, dexID, bfAccountID string) error {
	query := `
	DELETE FROM user_accounts
	WHERE dex_user_id=$1
	  AND bf_account_id=$2`
	res, err := sdb.Exec(query, dexID, bfAccountID)
	if err != nil {
		return serrors.New(serrors.Internal, err)
	}
	ra, err := res.RowsAffected()
	if err == nil && ra == 0 {
		return serrors.New(serrors.NotFound, fmt.Errorf("No user found for DexID: %q, BF Account ID: %q", dexID, bfAccountID))
	}
	return nil
}

// Revokes account access from an invited user, essentially un-inviting them.
func RevokeInvitedUserAccountAccess(sdb db.Queryer, email, bfAccountID string) error {
	query := `
	DELETE FROM invited_users
	WHERE email=$1
	  AND bf_account_id=$2`
	res, err := sdb.Exec(query, email, bfAccountID)
	if err != nil {
		return serrors.New(serrors.Internal, err)
	}
	ra, err := res.RowsAffected()
	if err == nil && ra == 0 {
		return serrors.New(serrors.NotFound, fmt.Errorf("No invited user found for Email: %q, BF Account ID: %q", email, bfAccountID))
	}
	return nil
}

// RevokeAllUserAccountAccess removes account access for all users for the
// given account, including invited users.
func RevokeAllUserAccountAccess(sdb db.Queryer, bfAccountID string) error {
	query := `
	DELETE FROM user_accounts
	WHERE bf_account_id=$1`
	_, err := sdb.Exec(query, bfAccountID)
	if err != nil {
		return serrors.New(serrors.Internal, err)
	}
	query = `
	DELETE FROM invited_users
	WHERE bf_account_id=$1`
	_, err = sdb.Exec(query, bfAccountID)
	if err != nil {
		return serrors.New(serrors.Internal, err)
	}
	return nil
}

// ChangeUserRole modifies the role of the user specified by dexID for the
// given account.
func ChangeUserRole(sdb db.Queryer, dexID, bfAccountID, role string) error {
	query := `
	UPDATE user_accounts
	  SET role=$3
	WHERE dex_user_id=$1
	  AND bf_account_id=$2`
	res, err := sdb.Exec(query, dexID, bfAccountID, role)
	if err != nil {
		return serrors.New(serrors.Internal, err)
	}
	ra, err := res.RowsAffected()
	if err == nil && ra == 0 {
		return serrors.New(serrors.NotFound, fmt.Errorf("No user found for DexID: %q, BF Account ID: %q", dexID, bfAccountID))
	}
	return nil
}
