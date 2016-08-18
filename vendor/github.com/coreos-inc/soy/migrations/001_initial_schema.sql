-- TYPES --
CREATE TYPE account_role AS ENUM ('READ_ONLY', 'ADMIN', 'SUPER_USER');
CREATE TYPE job_type as ENUM ('sync_quay_account', 'sync_license');

-- TABLES --
CREATE TABLE backend_users (
    dex_user_id TEXT PRIMARY KEY,
    email CITEXT NOT NULL UNIQUE
);

CREATE TABLE bf_accounts (
    id TEXT PRIMARY KEY,
    retired_at TIMESTAMPTZ
);

CREATE TABLE user_accounts (
    bf_account_id TEXT REFERENCES bf_accounts (id),
    dex_user_id TEXT REFERENCES backend_users (dex_user_id),
    role account_role NOT NULL,
    PRIMARY KEY(bf_account_id, dex_user_id)
);

CREATE TABLE invited_users (
    bf_account_id TEXT NOT NULL REFERENCES bf_accounts (id),
    email CITEXT NOT NULL,
    invited_by TEXT NOT NULL REFERENCES backend_users (dex_user_id),
    role account_role NOT NULL,
    accepted_at TIMESTAMPTZ,
    UNIQUE(email, bf_account_id)
);

CREATE TABLE externally_created_accounts (
    bf_account_id TEXT NOT NULL PRIMARY KEY REFERENCES bf_accounts (id),
    email CITEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE quay_credentials (
    bf_account_id TEXT NOT NULL PRIMARY KEY REFERENCES bf_accounts (id),
    quay_id TEXT NOT NULL,
    quay_token TEXT NOT NULL
);

CREATE TABLE licenses (
    schema_version TEXT NOT NULL,
    version INTEGER NOT NULL,
    account_id TEXT NOT NULL REFERENCES bf_accounts(id),
    account_secret TEXT NOT NULL,
    expiration_date TIMESTAMPTZ NOT NULL,
    creation_date  TIMESTAMPTZ NOT NULL,
    subscriptions JSONB,
    PRIMARY KEY(account_id, version)
);

CREATE TABLE notifications (
    id TEXT NOT NULL PRIMARY KEY,
    payload JSONB
);

CREATE TABLE jobs (
    id TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    publish_id TEXT NOT NULL DEFAULT gen_random_uuid(),
    job_type job_type NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    visibility_timeout INTERVAL,

    attempts INTEGER DEFAULT 0,
    message JSONB
);

-- FUNCTIONS --
CREATE FUNCTION lowercase_email()
RETURNS TRIGGER AS $$
BEGIN
	NEW.email = lower(NEW.email);
	RETURN NEW;
END;
$$ language 'plpgsql';

CREATE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END;
$$ language 'plpgsql';


CREATE FUNCTION insert_ignore_bf_account(id text) RETURNS BOOLEAN AS
$$
BEGIN
    INSERT INTO bf_accounts(id) VALUES (id);
    RETURN TRUE;
EXCEPTION WHEN unique_violation THEN
    -- Do nothing, but return that the caller of this did not create the entry
    RETURN FALSE;
END;
$$
LANGUAGE 'plpgsql';

CREATE FUNCTION insert_ignore_user_account(bf_account_id text, dex_user_id text, role account_role) RETURNS VOID AS
$$
BEGIN
    INSERT INTO user_accounts (bf_account_id, dex_user_id, role)
    VALUES (bf_account_id, dex_user_id, role);
    RETURN;
EXCEPTION WHEN unique_violation THEN
    -- Do nothing
END;
$$
LANGUAGE 'plpgsql';

CREATE FUNCTION notify_job_inserted()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(CAST(NEW.job_type AS text), CAST('' AS text));
    return NEW;
END;
$$ language 'plpgsql';

-- TRIGGERS & INDEXES --
CREATE TRIGGER lowercase_backend_users_email BEFORE INSERT ON backend_users
FOR EACH ROW EXECUTE PROCEDURE lowercase_email();

CREATE TRIGGER lowercase_invited_users_email BEFORE INSERT ON invited_users
FOR EACH ROW EXECUTE PROCEDURE lowercase_email();

CREATE TRIGGER lowercase_externally_created_accounts_email BEFORE INSERT ON externally_created_accounts
FOR EACH ROW EXECUTE PROCEDURE lowercase_email();

CREATE TRIGGER update_job_updated_at_timestamp BEFORE UPDATE ON jobs
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER notify_job_inserted AFTER INSERT ON jobs
FOR EACH ROW EXECUTE PROCEDURE notify_job_inserted();

CREATE INDEX bf_accounts_retired_at_idx ON bf_accounts(retired_at);
CREATE INDEX externally_created_account_email_idx ON externally_created_accounts(email);

-- jobs indices
CREATE INDEX jobs_job_type_index ON jobs (job_type);
-- A lot of queries end up looking like SELECT .. WHERE (now() - started_at) > $delta AND completed_at IS NULL, looking for unprocessed jobs
CREATE INDEX jobs_started_at_completed_at_index ON jobs (started_at, completed_at);
CREATE INDEX jobs_completed_at_index ON jobs (completed_at);
CREATE INDEX jobs_attempts_index ON jobs (attempts);


---- create above / drop below ----

DROP TABLE
    bf_accounts,
    backend_users,
    user_accounts,
    externally_created_accounts,
    quay_credentials,
    jobs,
    notifications,
    licenses,
    invited_users CASCADE;

DROP FUNCTION lowercase_email();
DROP FUNCTION update_timestamp();
DROP FUNCTION notify_job_inserted();
DROP FUNCTION insert_ignore_bf_account(text);
DROP FUNCTION insert_ignore_user_account(text, text, account_role);
DROP TYPE account_role;
DROP TYPE job_type;
