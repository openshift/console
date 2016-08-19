package repo

import (
	"database/sql"
	"encoding/json"
	"time"

	sq "github.com/Masterminds/squirrel"

	"github.com/coreos-inc/soy/common/license"
	"github.com/coreos-inc/soy/common/serrors"
	"github.com/coreos-inc/soy/db"
)

func CreateNewLicense(queryer db.Queryer, accountID string,
	creationDate, expirationDate time.Time,
	subscriptions map[string]license.SubscriptionDef) error {

	subscriptionsJSON, err := json.Marshal(subscriptions)
	if err != nil {
		return err
	}

	query := `INSERT INTO licenses (version, schema_version, account_id, expiration_date, creation_date, subscriptions)
VALUES (( SELECT COALESCE(MAX(version)+1, 1) FROM licenses WHERE account_id=$2), $1, $2, $3, $4, $5);`

	_, err = queryer.Exec(query, license.LicenseSchemaVersion, accountID, creationDate, expirationDate, subscriptionsJSON)
	if err != nil {
		if db.IsPgErrName(err, db.PgErrUniqueViolation) {
			return serrors.New(serrors.AlreadyExists, err)
		}
		return err
	}
	return nil
}

func GetNewestLicense(queryer db.Queryer, accountID string) (*license.License, error) {
	query, args, err := psql.
		Select("l.schema_version, l.version, l.account_id, a.account_secret, l.expiration_date, l.creation_date, l.subscriptions").
		From("licenses l").
		Join("bf_accounts a").
		JoinClause("ON l.account_id = a.id").
		Where(sq.Eq{"l.account_id": accountID}).
		Limit(1).
		OrderBy("l.version DESC").
		ToSql()
	if err != nil {
		return nil, err
	}

	var rawSubs []byte
	dst := new(license.License)
	err = queryer.QueryRowx(query, args...).Scan(&dst.SchemaVersion, &dst.Version, &dst.AccountID, &dst.AccountSecret, &dst.ExpirationDate, &dst.CreationDate, &rawSubs)
	if err != nil {
		if err == sql.ErrNoRows {
			err = serrors.New(serrors.NotFound, err)
		}
		return nil, err
	}
	err = json.Unmarshal(rawSubs, &dst.Subscriptions)
	if err != nil {
		return nil, err
	}
	return dst, nil
}
