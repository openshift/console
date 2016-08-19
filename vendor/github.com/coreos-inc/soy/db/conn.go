package db

import (
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type Config struct {
	// Connection string in the format: <driver>://<username>:<password>@<host>:<port>/<database>
	DSN string
	// The maximum number of open connections to the database. The default is 0 (unlimited).
	// For more details see: http://golang.org/pkg/database/sql/#DB.SetMaxOpenConns
	MaxOpenConnections int
	// The maximum number of connections in the idle connection pool. The default is 0 (unlimited).
	// For more details see: http://golang.org/pkg/database/sql/#DB.SetMaxIdleConns
	MaxIdleConnections int

	// Use the provided logger to log SQL statements to
	EnableSQLLogging bool
}

func NewConnection(logger Logger, cfg Config) (DB, error) {
	if !strings.HasPrefix(cfg.DSN, "postgres://") {
		return nil, fmt.Errorf("unrecognized database driver: %s", cfg.DSN)
	}

	sdb, err := sqlx.Connect("postgres", cfg.DSN)
	if err != nil {
		return nil, err
	}

	sdb.SetMaxIdleConns(cfg.MaxIdleConnections)
	sdb.SetMaxOpenConns(cfg.MaxOpenConnections)

	db := &db{
		DB: sdb,
	}
	if cfg.EnableSQLLogging {
		logger.Printf("SQL Logging Enabled")
		db.Logger = logger
	}
	return db, nil
}

const (
	PgErrUniqueViolation = "unique_violation"
)

// IsPgErrType checks if an error is a Postgres error and also matches the code name provided.
// For all possible codes see: http://www.postgresql.org/docs/current/static/errcodes-appendix.html#ERRCODES-TABLE
func IsPgErrName(err error, name string) bool {
	if err == nil {
		return false
	}
	pgErr, ok := err.(*pq.Error)
	return ok && pgErr.Code.Name() == name
}
