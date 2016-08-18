#!/bin/bash
set -x

for table in "$@"
do
    echo "COPY $table to STDOUT WITH DELIMITER '|' CSV HEADER QUOTE '\"' FORCE QUOTE *" |\
    kubectl --namespace=default exec -i psql-bwnlc \
        -- psql "postgres://${TECTONIC_PG_TECTONIC_USER}:${TECTONIC_PG_TECTONIC_PASS}@${TECTONIC_PG_TECTONIC_HOST}:${TECTONIC_PG_TECTONIC_PORT}/${TECTONIC_PG_TECTONIC_DATABASE}?sslmode=disable"
done
