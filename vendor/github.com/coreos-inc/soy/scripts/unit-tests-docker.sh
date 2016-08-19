#!/bin/bash -ex

# Unit tests require Postgres
docker rm -f soy_test_pg || true
docker pull quay.io/coreosinc/soy-pg-test:latest
docker run \
    --name soy_test_pg -d \
    -e "POSTGRES_DB=soy_test" \
    quay.io/coreosinc/soy-pg-test

sleep 5

function cleanup {
    docker stop -t 10 soy_test_pg
    docker rm -f soy_test_pg || true
}
trap cleanup EXIT

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Run unit tests
DOCKER_ENV=JUNIT_REPORT_FILE DOCKER_RUN_ARGS="--link soy_test_pg:postgres" $SCRIPT_DIR/builder-run.sh ./test -v
