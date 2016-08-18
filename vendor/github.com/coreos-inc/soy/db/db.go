package db

import (
	"errors"
	"hash/crc32"

	"github.com/Sirupsen/logrus"
)

var (
	logger    = logrus.WithFields(logrus.Fields{"app": "soy-server", "package": "db"})
	ErrNoLock = errors.New("unable to acquire advisory lock")
)

// WithTransaction creates a new database transaction and
// passes that into the function provided. If the provided function
// returns an error, the transaction is rolled back and the error
// is returned. Otherwise the transaction is commited and any potential
// error during committing the transaction is returned.
func WithTransaction(sdb DB, fn func(Queryer) error) error {
	tx, err := sdb.Begin()
	if err != nil {
		return err
	}

	if err = fn(tx); err != nil {
		if terr := tx.Rollback(); terr != nil {
			logger.Error("unable to rollback transaction:", terr)
		}
		return err
	}

	return tx.Commit()
}

func TryAdvisoryLock(q Queryer, id string) (bool, error) {
	var isLocked bool
	lockID := crc32.ChecksumIEEE([]byte(id))
	err := q.QueryRowx("SELECT pg_try_advisory_lock($1)", lockID).Scan(&isLocked)
	if err != nil {
		return false, err
	}
	return isLocked, nil
}

func UnlockAdvisoryLock(q Queryer, id string) error {
	lockID := crc32.ChecksumIEEE([]byte(id))
	_, err := q.Exec("SELECT pg_advisory_unlock($1)", lockID)
	return err
}

func WithAdvisoryLock(lockID string, tx Queryer, f func(Queryer) error) error {
	locked, err := TryAdvisoryLock(tx, lockID)
	if err != nil {
		return err
	}
	if !locked {
		return ErrNoLock
	}
	defer UnlockAdvisoryLock(tx, lockID)
	return f(tx)
}
