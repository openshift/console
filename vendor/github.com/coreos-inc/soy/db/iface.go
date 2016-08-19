package db

import (
	"database/sql"
	"time"

	"github.com/jmoiron/sqlx"
)

type Queryer interface {
	sqlx.Ext
	sqlx.Preparer
}

type Beginner interface {
	Begin() (Commiter, error)
}

type Commiter interface {
	Rollback() error
	Commit() error
	Queryer
}

type DB interface {
	Beginner
	Queryer
	Close() error
}

type db struct {
	*sqlx.DB
	Logger Logger
}

func (db *db) Begin() (Commiter, error) {
	if db.Logger != nil {
		now := time.Now()
		defer trace(db.Logger, now, "begin;")
	}
	sqlxTx, err := db.DB.Beginx()
	if err != nil {
		return nil, err
	}
	return &tx{
		Tx:     sqlxTx,
		Logger: db.Logger,
	}, nil
}

func (db *db) Exec(queryStr string, args ...interface{}) (sql.Result, error) {
	return exec(db.Logger, db.DB, queryStr, args...)
}

func (db *db) Query(queryStr string, args ...interface{}) (*sql.Rows, error) {
	return query(db.Logger, db.DB, queryStr, args...)
}

func (db *db) Queryx(queryStr string, args ...interface{}) (*sqlx.Rows, error) {
	return queryx(db.Logger, db.DB, queryStr, args...)
}

func (db *db) QueryRowx(queryStr string, args ...interface{}) *sqlx.Row {
	return queryRowx(db.Logger, db.DB, queryStr, args...)
}

func (db *db) Prepare(queryStr string) (*sql.Stmt, error) {
	return prepare(db.Logger, db.DB, queryStr)
}

func (db *db) Preparex(queryStr string) (*sqlx.Stmt, error) {
	return preparex(db.Logger, db.DB, queryStr)
}

type tx struct {
	*sqlx.Tx
	Logger Logger
}

func (tx *tx) Rollback() error {
	if tx.Logger != nil {
		now := time.Now()
		defer trace(tx.Logger, now, "rollback;")
	}
	return tx.Tx.Rollback()
}

func (tx *tx) Commit() error {
	if tx.Logger != nil {
		now := time.Now()
		defer trace(tx.Logger, now, "commit;")
	}
	return tx.Tx.Commit()
}

func (t *tx) Exec(queryStr string, args ...interface{}) (sql.Result, error) {
	return exec(t.Logger, t.Tx, queryStr, args...)
}

func (t *tx) Query(queryStr string, args ...interface{}) (*sql.Rows, error) {
	return query(t.Logger, t.Tx, queryStr, args...)
}

func (t *tx) Queryx(queryStr string, args ...interface{}) (*sqlx.Rows, error) {
	return queryx(t.Logger, t.Tx, queryStr, args...)
}

func (t *tx) QueryRowx(queryStr string, args ...interface{}) *sqlx.Row {
	return queryRowx(t.Logger, t.Tx, queryStr, args...)
}

func (t *tx) Prepare(queryStr string) (*sql.Stmt, error) {
	return prepare(t.Logger, t.Tx, queryStr)
}

func (t *tx) Preparex(queryStr string) (*sqlx.Stmt, error) {
	return preparex(t.Logger, t.Tx, queryStr)
}

// Below are functions which wrap query execution for logging and tracing purposes

func exec(logger Logger, ext sqlx.Ext, queryStr string, args ...interface{}) (sql.Result, error) {
	if logger != nil {
		now := time.Now()
		defer trace(logger, now, queryStr, args...)
	}
	return ext.Exec(queryStr, args...)
}

func query(logger Logger, ext sqlx.Ext, queryStr string, args ...interface{}) (*sql.Rows, error) {
	if logger != nil {
		now := time.Now()
		defer trace(logger, now, queryStr, args...)
	}
	return ext.Query(queryStr, args...)
}

func queryx(logger Logger, ext sqlx.Ext, queryStr string, args ...interface{}) (*sqlx.Rows, error) {
	if logger != nil {
		now := time.Now()
		defer trace(logger, now, queryStr, args...)
	}
	return ext.Queryx(queryStr, args...)
}

func queryRowx(logger Logger, ext sqlx.Ext, queryStr string, args ...interface{}) *sqlx.Row {
	if logger != nil {
		now := time.Now()
		defer trace(logger, now, queryStr, args...)
	}
	return ext.QueryRowx(queryStr, args...)
}

func prepare(logger Logger, prep sqlx.Preparer, queryStr string) (*sql.Stmt, error) {
	if logger != nil {
		now := time.Now()
		defer trace(logger, now, "prepare: "+queryStr)
	}
	return prep.Prepare(queryStr)
}

func preparex(logger Logger, prep sqlx.Preparer, queryStr string) (*sqlx.Stmt, error) {
	if logger != nil {
		now := time.Now()
		defer trace(logger, now, "prepare: "+queryStr)
	}
	return sqlx.Preparex(prep, queryStr)
}

func trace(logger Logger, started time.Time, queryStr string, args ...interface{}) {
	if logger != nil {
		var margs = argsString(args...)
		logger.Printf("%s [%s] (%v)", queryStr, margs, (time.Now().Sub(started)))
	}
}
