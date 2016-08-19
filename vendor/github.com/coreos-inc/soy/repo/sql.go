package repo

import "github.com/jmoiron/sqlx"

const (
	availableJobsQuery = `
WITH available_jobs AS (
	SELECT id
	FROM jobs j
	WHERE j.job_type = $1
	AND j.completed_at IS NULL
	AND j.attempts < $3
	AND (
		-- The message has not been finished without it's visibility timeout
		-- and is now back in the queue
		(now() - j.started_at) > j.visibility_timeout
		-- Or the message has never been started (ever)
		OR j.started_at IS NULL
	)
	ORDER BY j.created_at
	LIMIT $2
	FOR UPDATE
), retrieved_jobs AS (
	UPDATE jobs
	SET started_at = now(),
		visibility_timeout = $4,
		attempts = attempts + 1
	FROM available_jobs
	WHERE available_jobs.id = jobs.id
	RETURNING jobs.*
)
SELECT id, publish_id, job_type, created_at, updated_at, started_at, completed_at, attempts, message
FROM retrieved_jobs;
`

	listAccountUsersQuery = `
(SELECT ua.dex_user_id, role, email
FROM user_accounts ua INNER JOIN backend_users bu ON bu.dex_user_id=ua.dex_user_id
WHERE bf_account_id=$1)
UNION
(SELECT '', role, email
FROM invited_users
WHERE bf_account_id=$1 AND accepted_at IS NULL);
`
)

var (
	sqlStatements = map[string]string{
		"getAvailableJobs": availableJobsQuery,
		"listAccountUsers": listAccountUsersQuery,
	}
	preparedStatements = map[string]*sqlx.Stmt{}
)

func PrepareStatements(preparer sqlx.Preparer) error {
	for name, sql := range sqlStatements {
		stmt, err := sqlx.Preparex(preparer, sql)
		if err != nil {
			return err
		}
		preparedStatements[name] = stmt
	}
	return nil
}
