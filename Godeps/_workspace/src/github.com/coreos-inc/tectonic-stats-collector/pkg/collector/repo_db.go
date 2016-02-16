package collector

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/coopernurse/gorp"

	"github.com/coreos-inc/tectonic-stats-collector/pkg/stats"
)

const (
	recordTableName = "record"
)

func init() {
	register(table{
		name:    recordTableName,
		model:   dbRecord{},
		autoinc: true,
		pkey:    []string{"id"},
	})
}

type dbRecord struct {
	ID            int    `db:"id"`
	AccountID     string `db:"account_id"`
	AccountSecret string `db:"account_secret"`
	Metadata      []byte `db:"metadata"`
	Payload       []byte `db:"payload"`
	CreatedAt     int64  `db:"created_at"`
}

func (d *dbRecord) fromRecord(r stats.Record) error {
	mb, err := json.Marshal(r.Metadata)
	if err != nil {
		return err
	}
	pb, err := json.Marshal(r.Payload)
	if err != nil {
		return err
	}

	d.AccountID = r.AccountID
	d.AccountSecret = r.AccountSecret
	d.Metadata = mb
	d.Payload = pb

	d.CreatedAt = time.Now().Unix()

	return nil
}

func NewDBRecordRepo(dbm *gorp.DbMap) stats.RecordRepo {
	return &dbRecordRepo{dbMap: dbm}
}

type dbRecordRepo struct {
	dbMap *gorp.DbMap
}

func (d *dbRecordRepo) Store(r stats.Record) error {
	dr := new(dbRecord)
	if err := dr.fromRecord(r); err != nil {
		return fmt.Errorf("stast: failed storing record: %v", err)
	}

	if err := d.dbMap.Insert(dr); err != nil {
		return fmt.Errorf("stats: failed storing record: %v", err)
	}

	return nil
}
