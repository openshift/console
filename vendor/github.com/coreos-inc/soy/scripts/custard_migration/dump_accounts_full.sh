#!/bin/bash
set -x
SQLFILE="$(dirname $0)/accounts_all.sql"
echo "COPY ($(cat $SQLFILE)) to STDOUT WITH DELIMITER '|' CSV HEADER QUOTE '\"' FORCE QUOTE *" |\
    kubectl --namespace=default exec -i psql-bwnlc \
    -- psql "postgres://${TECTONIC_PG_TECTONIC_USER}:${TECTONIC_PG_TECTONIC_PASS}@${TECTONIC_PG_TECTONIC_HOST}:${TECTONIC_PG_TECTONIC_PORT}/${TECTONIC_PG_TECTONIC_DATABASE}?sslmode=disable"

