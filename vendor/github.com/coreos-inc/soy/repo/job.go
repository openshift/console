package repo

import (
	"database/sql"
	"fmt"
	"time"

	sq "github.com/Masterminds/squirrel"

	"github.com/coreos-inc/soy/common/serrors"
	"github.com/coreos-inc/soy/db"
)

type Job struct {
	ID          string     `json:"id" db:"id"`
	PublishID   string     `json:"publish_id" db:"publish_id"`
	JobType     string     `json:"job_type" db:"job_type"`
	CreatedAt   *time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   *time.Time `json:"updated_at" db:"updated_at"`
	StartedAt   *time.Time `json:"started_at" db:"started_at"`
	CompletedAt *time.Time `json:"completed_at" db:"completed_at"`
	Attempts    int64      `json:"attempts" db:"attempts"`
	Message     []byte     `json:"message" db:"message"`
}

func CreateJob(q db.Queryer, publishID, jobType string, message []byte) (string, error) {
	sql, args, err := psql.
		Insert("jobs").
		Columns("publish_id", "job_type", "message").
		Values(publishID, jobType, message).
		Suffix("RETURNING id").
		ToSql()
	if err != nil {
		return "", err
	}
	var id string
	err = q.QueryRowx(sql, args...).Scan(&id)
	if err != nil {
		return "", err
	}
	return id, nil
}

func GetAvailableJobs(q db.Queryer, jobType string, maxJobs, maxAttempts, visibilityTimeoutSec int64) ([]*Job, error) {
	var jobs []*Job
	err := preparedStatements["getAvailableJobs"].Select(&jobs, jobType, maxJobs, maxAttempts, fmt.Sprintf("'%d seconds'", visibilityTimeoutSec))
	if err != nil {
		if err == sql.ErrNoRows {
			err = serrors.New(serrors.NotFound, nil)
		}
		return nil, err
	}
	if len(jobs) < 1 {
		return nil, serrors.New(serrors.NotFound, nil)
	}
	return jobs, nil
}

func CompleteJob(q db.Queryer, jobID, jobType string) error {
	query, args, err := psql.
		Update("jobs").
		Set("completed_at", "now()").
		Where(sq.Eq{
		"id":           jobID,
		"job_type":     jobType,
		"completed_at": nil,
	}).ToSql()
	if err != nil {
		return err
	}
	res, err := q.Exec(query, args...)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return serrors.New(serrors.NotFound, nil)
	}
	return nil
}
