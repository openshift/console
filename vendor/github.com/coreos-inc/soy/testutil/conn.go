package testutil

import (
	"os"
	"testing"

	"github.com/Sirupsen/logrus"

	"github.com/coreos-inc/soy/db"
)

// WithTestConn is a helper function to wrap tests that
// need a connection to manage init/cleanup.
func WithTestConn(t *testing.T, fn func(db.Queryer)) {
	conn := NewTestConn(t)
	defer conn.Close()
	ClearDB(conn)
	tx, err := conn.Begin()
	if err != nil {
		t.Fatal(err)
	}
	defer tx.Rollback()
	fn(tx)
}

// NewTestConn returns a new database connection
// suitable for use during tests.
func NewTestConn(t *testing.T) db.DB {
	dsn := os.Getenv("SOY_TEST_DSN")
	if dsn == "" {
		dsn = "postgres://:@localhost:5432/soy_test?sslmode=disable"
	}
	dbc := db.Config{
		DSN: dsn,
	}
	dbc.EnableSQLLogging = os.Getenv("SQL_LOGGING") == "1"
	logger := logrus.New().WithField("package", "db")
	conn, err := db.NewConnection(logger, dbc)
	if err != nil {
		t.Fatal(err)
	}
	return conn
}

// ClearDB will truncate all tables in the database
// to ensure clean test runs.
func ClearDB(sdb db.DB) {
	query := `
	DELETE FROM user_accounts;
	DELETE FROM invited_users;
	DELETE FROM bf_accounts;
	DELETE FROM backend_users;
	DELETE FROM externally_created_accounts;
	DELETE FROM quay_credentials;
	DELETE FROM jobs;
	DELETE FROM notifications;
	DELETE FROM licenses;
		`
	if _, err := sdb.Exec(query); err != nil {
		panic(err)
	}
}
