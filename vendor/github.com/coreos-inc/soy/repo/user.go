package repo

import (
	"database/sql"
	"encoding/json"
	"errors"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"

	"github.com/coreos-inc/soy/common/serrors"
	"github.com/coreos-inc/soy/db"
)

var (
	psql = sq.StatementBuilder.PlaceholderFormat(sq.Dollar)
)

// User represents a backend_user in the databse.
type User struct {
	DexID    string `db:"dex_user_id"`
	Email    string `db:"email"`
	Accounts []*UserAccount
	Role     string `json:"role" db:"role"`
}

// UserAccount represents a row from the user_account table.
// Associates user with an BillForward account.
type UserAccount struct {
	BFAccountID string `json:"bf_account_id" db:"bf_account_id"`
	DexID       string `json:"dex_user_id" db:"dex_user_id"`
	Role        string `json:"role" db:"role"`
}

// InvitedUser represents a user who has been invited to join an account
// by another user who is already a member of that account.
type InvitedUser struct {
	InvitedBy   string     `json:"invited_by" db:"invited_by"`
	Email       string     `json:"email" db:"email"`
	BFAccountID string     `json:"bf_account_id" db:"bf_account_id"`
	Role        string     `json:"role" db:"role"`
	AcceptedAt  *time.Time `json:"accepted_at" db:"accepted_at"`
}

// ExternallyCreatedAccount is an account created outside of the
// normal UI flow, i.e. salesforce.
type ExternallyCreatedAccount struct {
	BFAccountID string     `json:"bf_account_id" db:"bf_account_id"`
	Email       string     `json:"email" db:"email"`
	CreatedAt   *time.Time `json:"created_at" db:"created_at"`
}

// GetExternallyCreatedAccounts retrieves all externally created accounts for the given
// email address.
func GetExternallyCreatedAccounts(sdb db.Queryer, email string) ([]*ExternallyCreatedAccount, error) {
	query, args, err := psql.
		Select("*").
		From("externally_created_accounts").
		Where(sq.Eq{"email": email}).
		ToSql()
	if err != nil {
		return nil, err
	}

	var accts []*ExternallyCreatedAccount
	err = sqlx.Select(sdb, &accts, query, args...)
	if err != nil {
		if err == sql.ErrNoRows {
			err = serrors.New(serrors.NotFound, nil)
		}
		return nil, err
	}
	if len(accts) < 1 {
		return nil, serrors.New(serrors.NotFound, nil)
	}
	return accts, nil
}

func getUserBy(sdb db.Queryer, pred sq.Eq) (*User, error) {
	var (
		user         User
		userAccounts []byte
	)

	u := psql.
		Select("u.*", "json_agg(a) accounts").
		From("backend_users u").
		LeftJoin("user_accounts a ON a.dex_user_id=u.dex_user_id").
		LeftJoin("bf_accounts bfa ON bfa.id = a.bf_account_id").
		Where(pred).
		Where("bfa.retired_at IS NULL").
		GroupBy("u.dex_user_id")

	query, args, err := u.ToSql()
	if err != nil {
		return nil, err
	}

	row := sdb.QueryRowx(query, args...)
	if row == nil {
		return nil, serrors.New(serrors.NotFound, errors.New("unable to find user"))
	}
	err = row.Scan(&user.DexID, &user.Email, &userAccounts)
	if err != nil {
		if err == sql.ErrNoRows {
			err = serrors.New(serrors.NotFound, err)
		}
		return nil, err
	}
	err = json.Unmarshal(userAccounts, &user.Accounts)
	if err != nil {
		return nil, err
	}
	// Account for null json response
	if user.Accounts[0] == nil {
		user.Accounts = user.Accounts[:0]
	}
	return &user, nil
}

// GetUserByDexID returns the user for the given Dex ID.
func GetUserByDexID(sdb db.Queryer, dexID string) (*User, error) {
	return getUserBy(sdb, sq.Eq{"u.dex_user_id": dexID})
}

// GetUserByEmail returns the user for the given email.
func GetUserByEmail(sdb db.Queryer, email string) (*User, error) {
	return getUserBy(sdb, sq.Eq{"u.email": email})
}

// GetInvitedUserByEmailAndAccount returns an invited user for the given
// email and account.
func GetInvitedUserByEmailAndAccount(sdb db.Queryer, email, bfAccountID string) (*InvitedUser, error) {
	var iu InvitedUser
	sqlstr, args, err := psql.
		Select("bf_account_id", "invited_by", "email", "accepted_at", "role").
		From("invited_users").
		Where(sq.Eq{"email": email, "bf_account_id": bfAccountID}).
		ToSql()
	if err != nil {
		return nil, err
	}
	if err = sqlx.Get(sdb, &iu, sqlstr, args...); err != nil {
		if err == sql.ErrNoRows {
			return nil, serrors.New(serrors.NotFound, err)
		}
		return nil, err
	}
	return &iu, nil
}

// ListForAccount lists all users for an account and their invite status.
func ListForAccount(sdb db.Queryer, accountID string) ([]*User, error) {
	var userList []*User
	err := preparedStatements["listAccountUsers"].Select(&userList, accountID)
	if err != nil {
		if err == sql.ErrNoRows {
			err = serrors.New(serrors.NotFound, nil)
		}
		return nil, err
	}
	if len(userList) < 1 {
		return nil, serrors.New(serrors.NotFound, nil)
	}

	return userList, nil
}

// CreateInvitedUser creates a new invited user.
func CreateInvitedUser(sdb db.Queryer, email, bfAccountID, invitedByDexID, role string) error {
	sql, args, err := psql.
		Insert("invited_users").
		Columns("email", "bf_account_id", "invited_by", "role").
		Values(email, bfAccountID, invitedByDexID, role).
		ToSql()
	if err != nil {
		return err
	}
	_, err = sdb.Exec(sql, args...)
	if db.IsPgErrName(err, db.PgErrUniqueViolation) {
		return serrors.New(serrors.AlreadyExists, err)
	}
	return err
}

// AcceptInvitation accepts an invitation for the given email and account ID.
func AcceptInvitation(sdb db.Queryer, email, bfAccountID string) error {
	sqlstr, args, err := psql.
		Update("invited_users").
		Set("accepted_at", sq.Expr("now()")).
		Where(sq.Eq{"email": email, "bf_account_id": bfAccountID}).
		ToSql()
	if err != nil {
		return err
	}

	res, err := sdb.Exec(sqlstr, args...)
	if err != nil {
		return serrors.New(serrors.Internal, err)
	}
	rows, err := res.RowsAffected()
	if err == nil && rows == 0 {
		return serrors.New(serrors.NotFound, errors.New("could not accept user invitation"))
	}
	return nil
}

// CreateUserAccountsForPendingInvitations creates a user account for every pending invitation for a particular user.
func CreateUserAccountsForPendingInvitations(sdb db.Queryer, email, dexID string) error {
	query := `
		INSERT INTO user_accounts (
			bf_account_id,
			dex_user_id,
			role
		) (
			SELECT bf_account_id, $1, role
			FROM invited_users
			WHERE email=$2 AND accepted_at IS NULL
		)`
	res, err := sdb.Exec(query, dexID, email)
	if err != nil {
		return serrors.New(serrors.Internal, err)
	}
	rows, err := res.RowsAffected()
	if err == nil && rows == 0 {
		return serrors.New(serrors.NotFound, errors.New("no invitations to accept"))
	}

	return nil
}

// AcceptAllUserInvitations marks all pending invitation as accpeted for a particular user.
func AcceptAllUserInvitations(sdb db.Queryer, email string) error {
	sqlstr, args, err := psql.
		Update("invited_users").
		Set("accepted_at", sq.Expr("now()")).
		Where(sq.Eq{"email": email, "accepted_at": nil}).
		ToSql()
	if err != nil {
		return err
	}

	res, err := sdb.Exec(sqlstr, args...)
	if err != nil {
		return serrors.New(serrors.Internal, err)
	}
	rows, err := res.RowsAffected()
	if err == nil && rows == 0 {
		return serrors.New(serrors.NotFound, errors.New("cannot accept user invitations. none found."))
	}
	return nil
}

// CreateUser creates a new backend_user entry.
func CreateUser(sdb db.Queryer, user *User) error {
	query := `
		INSERT INTO backend_users (
			dex_user_id,
			email
		) VALUES (
			:dex_user_id,
			:email
		)
		`
	_, err := sqlx.NamedExec(sdb, query, user)
	if db.IsPgErrName(err, db.PgErrUniqueViolation) {
		return serrors.New(serrors.AlreadyExists, err)
	}
	return err
}

// CreateUserAccount associates a user with a BillForward account ID with a given
// role.
func CreateUserAccount(sdb db.Queryer, ao *UserAccount) error {
	query := `
		INSERT INTO user_accounts (
			bf_account_id,
			dex_user_id,
			role
		) VALUES (
			:bf_account_id,
			:dex_user_id,
			:role
		)`
	_, err := sqlx.NamedExec(sdb, query, ao)
	if db.IsPgErrName(err, db.PgErrUniqueViolation) {
		return serrors.New(serrors.AlreadyExists, err)
	}
	return err
}

func UpsertUserAccount(sdb db.Queryer, ao *UserAccount) error {
	query := "SELECT insert_ignore_user_account($1,$2,$3)"
	_, err := sdb.Exec(query, ao.BFAccountID, ao.DexID, ao.Role)
	return err
}

// CreateExternallyCreatedAccount creates an externally_created_account entry in the
// database.
func CreateExternallyCreatedAccount(sdb db.Queryer, email, bfAccountID string) error {
	query := `
		INSERT INTO externally_created_accounts (
			bf_account_id,
			email
		) VALUES (
			$1, $2
		)`
	_, err := sdb.Exec(query, bfAccountID, email)
	if db.IsPgErrName(err, db.PgErrUniqueViolation) {
		return serrors.New(serrors.AlreadyExists, err)
	}
	return err
}

// RetireBFAccount updates the BillForward account marking it as
// retired.
func RetireBFAccount(sdb db.Queryer, id string) error {
	query := `
	UPDATE bf_accounts
	SET retired_at=now()
	WHERE id=$1`
	res, err := sdb.Exec(query, id)
	if err != nil {
		return serrors.New(serrors.Internal, err)
	}
	rows, raerr := res.RowsAffected()
	if raerr == nil && rows == 0 {
		return serrors.New(serrors.NotFound, nil)
	}
	return nil
}
