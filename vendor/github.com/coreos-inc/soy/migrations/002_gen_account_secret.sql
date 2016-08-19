ALTER TABLE licenses
    ALTER COLUMN account_secret DROP NOT NULL;
ALTER TABLE bf_accounts
    ADD COLUMN account_secret TEXT NOT NULL DEFAULT gen_random_uuid();

---- create above / drop below ----

ALTER TABLE bf_accounts
    DROP COLUMN account_secret;

ALTER TABLE licenses
    ALTER COLUMN account_secret SET DEFAULT '';

UPDATE licenses
SET account_secret = '';

ALTER TABLE licenses
    ALTER COLUMN account_secret SET NOT NULL;

