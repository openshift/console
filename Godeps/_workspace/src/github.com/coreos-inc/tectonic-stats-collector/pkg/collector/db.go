package collector

import (
	"database/sql"
	"errors"
	"strings"
	"time"

	"github.com/coopernurse/gorp"
	"github.com/coreos/pkg/timeutil"
	_ "github.com/lib/pq"
)

var (
	tables []table
)

type table struct {
	name    string
	model   interface{}
	autoinc bool
	pkey    []string
}

func register(t table) {
	tables = append(tables, t)
}

type gorpLogger struct{}

func (l gorpLogger) Printf(format string, v ...interface{}) {
	log.Debugf(format, v...)
}

type DBConfig struct {
	// Connection string in the format: <driver>://<username>:<password>@<host>:<port>/<database>
	DSN string
	// The maximum number of open connections to the database. The default is 0 (unlimited).
	// For more details see: http://golang.org/pkg/database/sql/#DB.SetMaxOpenConns
	MaxOpenConnections int
	// The maximum number of connections in the idle connection pool. The default is 0 (unlimited).
	// For more details see: http://golang.org/pkg/database/sql/#DB.SetMaxIdleConns
	MaxIdleConnections int
	// Print every query made to
	LogQueries bool
}

func NewDBConnection(cfg DBConfig) (*gorp.DbMap, error) {
	if !strings.HasPrefix(cfg.DSN, "postgres://") {
		return nil, errors.New("unrecognized database driver")
	}

	db, err := sql.Open("postgres", cfg.DSN)
	if err != nil {
		return nil, err
	}

	db.SetMaxIdleConns(cfg.MaxIdleConnections)
	db.SetMaxOpenConns(cfg.MaxOpenConnections)

	dbm := gorp.DbMap{
		Db:      db,
		Dialect: gorp.PostgresDialect{},
	}

	if cfg.LogQueries {
		dbm.TraceOn("gorp", gorpLogger{})
	}

	for _, t := range tables {
		dbm.AddTableWithName(t.model, t.name).SetKeys(t.autoinc, t.pkey...)
	}

	var sleep time.Duration
	for {
		if err = dbm.CreateTablesIfNotExists(); err == nil {
			break
		}
		sleep = timeutil.ExpBackoff(sleep, time.Minute)
		log.Errorf("unable to initialize database, retrying in %v: %v", sleep, err)
		time.Sleep(sleep)
	}

	return &dbm, nil
}
