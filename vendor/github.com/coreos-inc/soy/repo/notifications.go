package repo

import (
	"github.com/coreos-inc/soy/db"
)

type Notification struct {
	ID           string `db:"id"`
	Notification []byte `db:"notification"`
}

func CreateNotification(sdb db.Queryer, id string, payload []byte) error {
	query := `INSERT INTO notifications (id, payload) VALUES ($1, $2)`
	_, err := sdb.Exec(query, id, payload)
	return err
}
